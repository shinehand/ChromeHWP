#!/usr/bin/env python3
"""Classify Hancom visual advisory pages by image-derived deltas.

The audit report already decides whether a page is clean. This helper keeps
follow-up work grounded by separating likely ink-density differences from
layout/bounding-box differences without depending on any sample name.
"""

from __future__ import annotations

import argparse
import json
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
        "bbox": {
            "hancom": hancom_box,
            "chrome": chrome_box,
            "leftDelta": None if not hancom_box or not chrome_box else chrome_box[0] - hancom_box[0],
            "topDelta": None if not hancom_box or not chrome_box else chrome_box[1] - hancom_box[1],
            "widthDelta": bbox_width(chrome_box) - bbox_width(hancom_box),
            "heightDelta": bbox_height(chrome_box) - bbox_height(hancom_box),
        },
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
    documents = []
    class_counts: defaultdict[str, int] = defaultdict(int)
    for document in report.get("results", []):
        pages = []
        for page in document.get("pages", []):
            if page.get("verdict") not in ADVISORY_VERDICTS:
                continue
            metrics = page_metrics(page)
            metrics["class"] = classify(metrics)
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
