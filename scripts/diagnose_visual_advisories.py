#!/usr/bin/env python3
"""Classify Hancom visual advisory pages by image-derived deltas.

The audit report already decides whether a page is clean. This helper keeps
follow-up work grounded by separating likely ink-density differences from
layout/bounding-box differences without depending on any sample name.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from statistics import mean
from typing import Any

from PIL import Image


DARK_THRESHOLD = 245
ADVISORY_VERDICTS = {"review", "layout-review"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Diagnose non-clean visual audit pages.")
    parser.add_argument(
        "--report",
        default="output/hancom-oracle/extension-visual-current/hancom-page-audit-report.json",
        help="Path to hancom-page-audit-report.json.",
    )
    parser.add_argument(
        "--output",
        default="output/playwright/visual-advisory-diagnostics.json",
        help="Where to write the JSON diagnostics.",
    )
    parser.add_argument(
        "--dom-dir",
        default="output/playwright",
        help="Directory containing optional DOM diagnostic JSON files.",
    )
    return parser.parse_args()


def dark_bbox(image: Image.Image, threshold: int = DARK_THRESHOLD) -> tuple[int, int, int, int] | None:
    gray = image.convert("L")
    pixels = gray.load()
    width, height = gray.size
    left = width
    top = height
    right = -1
    bottom = -1
    for y in range(height):
        for x in range(width):
            if pixels[x, y] < threshold:
                if x < left:
                    left = x
                if y < top:
                    top = y
                if x > right:
                    right = x
                if y > bottom:
                    bottom = y
    if right < left or bottom < top:
        return None
    return (left, top, right + 1, bottom + 1)


def bbox_width(box: tuple[int, int, int, int] | None) -> int:
    return 0 if box is None else box[2] - box[0]


def bbox_height(box: tuple[int, int, int, int] | None) -> int:
    return 0 if box is None else box[3] - box[1]


def mean_dark_delta(hancom: Image.Image, chrome: Image.Image) -> float | None:
    hancom_gray = hancom.convert("L")
    chrome_gray = chrome.convert("L").resize(hancom_gray.size)
    hancom_pixels = hancom_gray.load()
    chrome_pixels = chrome_gray.load()
    width, height = hancom_gray.size
    hancom_values: list[int] = []
    chrome_values: list[int] = []
    for y in range(height):
        for x in range(width):
            hancom_value = hancom_pixels[x, y]
            chrome_value = chrome_pixels[x, y]
            if hancom_value < DARK_THRESHOLD or chrome_value < DARK_THRESHOLD:
                hancom_values.append(hancom_value)
                chrome_values.append(chrome_value)
    if not hancom_values:
        return None
    return mean(chrome_values) - mean(hancom_values)


def projection_hot_bands(hancom: Image.Image, chrome: Image.Image) -> dict[str, list[dict[str, float | int]]]:
    hancom_gray = hancom.convert("L")
    chrome_gray = chrome.convert("L").resize(hancom_gray.size)
    width, height = hancom_gray.size
    hancom_pixels = hancom_gray.load()
    chrome_pixels = chrome_gray.load()
    row_scores = []
    for y in range(height):
        delta = 0
        for x in range(width):
            delta += abs(int(hancom_pixels[x, y] < DARK_THRESHOLD) - int(chrome_pixels[x, y] < DARK_THRESHOLD))
        row_scores.append(delta / max(1, width))
    column_scores = []
    for x in range(width):
        delta = 0
        for y in range(height):
            delta += abs(int(hancom_pixels[x, y] < DARK_THRESHOLD) - int(chrome_pixels[x, y] < DARK_THRESHOLD))
        column_scores.append(delta / max(1, height))
    return {
        "rows": top_bands(row_scores),
        "columns": top_bands(column_scores),
    }


def top_bands(scores: list[float], limit: int = 5) -> list[dict[str, float | int]]:
    if not scores:
        return []
    threshold = max(0.08, mean(scores) * 2.5)
    runs: list[tuple[int, int, float]] = []
    start = -1
    total = 0.0
    for index, score in enumerate(scores):
        if score >= threshold:
            if start < 0:
                start = index
                total = 0.0
            total += score
        elif start >= 0:
            runs.append((start, index - 1, total / max(1, index - start)))
            start = -1
    if start >= 0:
        runs.append((start, len(scores) - 1, total / max(1, len(scores) - start)))
    runs.sort(key=lambda item: (item[2], item[1] - item[0]), reverse=True)
    return [
        {"start": start, "end": end, "score": round(score, 4)}
        for start, end, score in runs[:limit]
    ]


def page_metrics(page: dict[str, Any]) -> dict[str, Any]:
    hancom = Image.open(page["hancomCrop"]).convert("RGB")
    chrome = Image.open(page["chromePage"]).convert("RGB")
    chrome_for_box = chrome.resize(hancom.size)
    hancom_box = dark_bbox(hancom)
    chrome_box = dark_bbox(chrome_for_box)
    raw_metrics = page.get("visualMetrics") or {}
    projection = raw_metrics.get("projectionDiff") or {}
    return {
        "page": int(page.get("pageIndex", 0)) + 1,
        "verdict": page.get("verdict"),
        "rawDiff": raw_metrics.get("rawDiff", page.get("diff")),
        "blurDiff": raw_metrics.get("blurDiff"),
        "layoutDiff": projection.get("combined"),
        "inkMeanDelta": mean_dark_delta(hancom, chrome),
        "hotBands": projection_hot_bands(hancom, chrome),
        "bbox": {
            "hancom": hancom_box,
            "chrome": chrome_box,
            "leftDelta": None if not hancom_box or not chrome_box else chrome_box[0] - hancom_box[0],
            "topDelta": None if not hancom_box or not chrome_box else chrome_box[1] - hancom_box[1],
            "widthDelta": bbox_width(chrome_box) - bbox_width(hancom_box),
            "heightDelta": bbox_height(chrome_box) - bbox_height(hancom_box),
        },
    }


def dom_page_number(path: Path, payload: dict[str, Any]) -> int | None:
    page = payload.get("page") or {}
    if isinstance(page.get("index"), int):
        return int(page["index"])
    match = re.search(r"-p(\d+)(?:-|\.|_)", path.name)
    if match:
        return int(match.group(1))
    return None


def dom_file_key(path: Path, payload: dict[str, Any]) -> str | None:
    filename = payload.get("filename")
    if isinstance(filename, str) and filename:
        return filename
    stem = path.name
    for suffix in ("-dom-current.json", "-dom.json"):
        stem = stem.replace(suffix, "")
    stem = re.sub(r"-p\d+.*$", "", stem)
    return stem or None


def load_dom_index(dom_dir: Path) -> dict[tuple[str, int], dict[str, Any]]:
    index: dict[tuple[str, int], dict[str, Any]] = {}
    if not dom_dir.exists():
        return index
    for path in sorted(dom_dir.glob("*dom*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        filename = dom_file_key(path, payload)
        page_number = dom_page_number(path, payload)
        if not filename or page_number is None:
            continue
        index[(filename, page_number)] = {
            "path": str(path),
            "payload": payload,
        }
    return index


def rect_relative_to_page(rect: dict[str, Any], body_rect: dict[str, Any]) -> dict[str, float] | None:
    try:
        top = float(rect["top"])
        left = float(rect.get("left", 0))
        width = float(rect.get("width", 0))
        height = float(rect.get("height", 0))
        bottom = float(rect.get("bottom", top + height))
    except (TypeError, ValueError, KeyError):
        return None

    body_top = float(body_rect.get("top", 0) or 0)
    body_left = float(body_rect.get("left", 0) or 0)
    page_height = float(body_rect.get("height", 0) or 0)
    page_width = float(body_rect.get("width", 0) or 0)
    if page_height and top >= body_top and bottom > page_height:
        top -= body_top
        bottom -= body_top
    if page_width and left >= body_left and left > page_width:
        left -= body_left
    return {
        "top": top,
        "bottom": bottom,
        "left": left,
        "right": left + width,
        "width": width,
        "height": bottom - top,
    }


def text_snippet(value: Any, limit: int = 120) -> str:
    text = " ".join(str(value or "").split())
    return text if len(text) <= limit else text[:limit]


def map_hot_bands_to_dom(
    document_id: str,
    filename: str,
    metrics: dict[str, Any],
    page: dict[str, Any],
    dom_index: dict[tuple[str, int], dict[str, Any]],
) -> dict[str, Any] | None:
    page_number = int(metrics["page"])
    basename = re.sub(r"\.(hwp|hwpx)$", "", filename, flags=re.IGNORECASE)
    dom_entry = (
        dom_index.get((filename, page_number))
        or dom_index.get((document_id, page_number))
        or dom_index.get((basename, page_number))
    )
    if not dom_entry:
        return None

    payload = dom_entry["payload"]
    body_rect = payload.get("bodyRect") or {}
    page_height = float((payload.get("page") or {}).get("height") or body_rect.get("height") or 0)
    page_width = float((payload.get("page") or {}).get("width") or body_rect.get("width") or 0)
    if not page_height or not page_width:
        return None

    hancom = Image.open(page["hancomCrop"]).convert("RGB")
    chrome = Image.open(page["chromePage"]).convert("RGB")
    scale_y = chrome.height / max(1, hancom.height)
    scale_x = chrome.width / max(1, hancom.width)
    row_hits = []
    for band in (metrics.get("hotBands") or {}).get("rows", [])[:5]:
        y1 = float(band["start"]) * scale_y
        y2 = (float(band["end"]) + 1) * scale_y
        table_hits = []
        for table in payload.get("tables") or []:
            table_rect = rect_relative_to_page(table.get("rect") or table.get("tableRect") or {}, body_rect)
            if not table_rect or table_rect["bottom"] < y1 or table_rect["top"] > y2:
                continue
            rows = []
            for row in table.get("rows") or table.get("firstRows") or []:
                row_rect = rect_relative_to_page(row.get("rect") or {}, body_rect)
                if not row_rect or row_rect["bottom"] < y1 or row_rect["top"] > y2:
                    continue
                rows.append({
                    "rowIndex": row.get("rowIndex"),
                    "top": round(row_rect["top"], 2),
                    "bottom": round(row_rect["bottom"], 2),
                    "height": round(row_rect["height"], 2),
                    "cellCount": row.get("cellCount"),
                    "text": text_snippet(row.get("text")),
                })
            table_hits.append({
                "tableIndex": table.get("index", table.get("i")),
                "depth": table.get("depth"),
                "contentKind": (table.get("tableDataset") or table.get("wrapDataset") or {}).get("contentKind"),
                "top": round(table_rect["top"], 2),
                "bottom": round(table_rect["bottom"], 2),
                "rowCount": table.get("rowCount"),
                "rows": rows[:8],
            })
        paragraph_hits = []
        for paragraph in payload.get("paragraphs") or []:
            paragraph_rect = rect_relative_to_page(paragraph.get("rect") or {}, body_rect)
            if not paragraph_rect or paragraph_rect["bottom"] < y1 or paragraph_rect["top"] > y2:
                continue
            paragraph_hits.append({
                "paragraphIndex": paragraph.get("index"),
                "top": round(paragraph_rect["top"], 2),
                "bottom": round(paragraph_rect["bottom"], 2),
                "height": round(paragraph_rect["height"], 2),
                "layoutMode": (paragraph.get("dataset") or {}).get("layoutMode"),
                "layoutHeight": (paragraph.get("dataset") or {}).get("layoutHeight"),
                "text": text_snippet(paragraph.get("text")),
            })
        row_hits.append({
            "metricBand": band,
            "pageY": [round(y1, 2), round(y2, 2)],
            "tables": table_hits[:6],
            "paragraphs": paragraph_hits[:8],
        })

    return {
        "domPath": dom_entry["path"],
        "scale": {"x": scale_x, "y": scale_y},
        "rowBands": row_hits,
    }


def classify(page: dict[str, Any]) -> str:
    bbox = page["bbox"]
    width_delta = abs(bbox["widthDelta"])
    height_delta = abs(bbox["heightDelta"])
    left_delta = abs(bbox["leftDelta"] or 0)
    top_delta = abs(bbox["topDelta"] or 0)
    layout_diff = page.get("layoutDiff") or 0
    ink_delta = abs(page.get("inkMeanDelta") or 0)
    if width_delta >= 24 or height_delta >= 24 or left_delta >= 16 or top_delta >= 16 or layout_diff >= 30:
        return "layout-or-scale"
    if ink_delta >= 24:
        return "ink-density"
    return "mixed-or-minor"


def average(values: list[float | int | None]) -> float | None:
    finite = [float(value) for value in values if isinstance(value, (int, float))]
    return None if not finite else mean(finite)


def main() -> None:
    args = parse_args()
    report_path = Path(args.report)
    report = json.loads(report_path.read_text(encoding="utf-8"))
    dom_index = load_dom_index(Path(args.dom_dir))
    documents = []
    class_counts: defaultdict[str, int] = defaultdict(int)
    for document in report.get("results", []):
        pages = []
        for page in document.get("pages", []):
            if page.get("verdict") not in ADVISORY_VERDICTS:
                continue
            metrics = page_metrics(page)
            metrics["class"] = classify(metrics)
            source_map = map_hot_bands_to_dom(
                document.get("id", ""),
                document.get("filename", ""),
                metrics,
                page,
                dom_index,
            )
            if source_map:
                metrics["sourceMap"] = source_map
            class_counts[metrics["class"]] += 1
            pages.append(metrics)
        if pages:
            documents.append({
                "id": document.get("id"),
                "filename": document.get("filename"),
                "advisoryPageCount": len(pages),
                "averages": {
                    "rawDiff": average([page.get("rawDiff") for page in pages]),
                    "blurDiff": average([page.get("blurDiff") for page in pages]),
                    "layoutDiff": average([page.get("layoutDiff") for page in pages]),
                    "inkMeanDelta": average([page.get("inkMeanDelta") for page in pages]),
                    "bboxLeftDelta": average([page["bbox"].get("leftDelta") for page in pages]),
                    "bboxTopDelta": average([page["bbox"].get("topDelta") for page in pages]),
                    "bboxWidthDelta": average([page["bbox"].get("widthDelta") for page in pages]),
                    "bboxHeightDelta": average([page["bbox"].get("heightDelta") for page in pages]),
                },
                "pages": pages,
            })

    payload = {
        "sourceReport": str(report_path),
        "advisoryPageCount": sum(document["advisoryPageCount"] for document in documents),
        "classCounts": dict(sorted(class_counts.items())),
        "documents": documents,
    }
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(output_path),
        "advisoryPageCount": payload["advisoryPageCount"],
        "classCounts": payload["classCounts"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
