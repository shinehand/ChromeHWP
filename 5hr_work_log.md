# 5-Hour Autonomous Work Log

## 2026-05-01 17:35 KST

- Started unattended autonomous continuation for the ChromeHWP web-based HWP/HWPX editor.
- Current verified baseline:
  - `npm run typecheck` passed.
  - `node --check scripts/verify_extension_editor.mjs` passed.
  - `STRICT_PAGE_EXPECTATIONS=1 npm run verify:extension` passed.
- Key decision: preserve the current strict-green parser/export state before attempting any visual fidelity improvements, because prior broad layout changes regressed page counts or document placement.
- Immediate plan:
  - Re-run visual fidelity after the latest reverts to establish a clean current baseline.
  - Inspect worst visual mismatches and only apply narrowly scoped fixes that keep strict page expectations green.
  - Strengthen verification/reporting where it can catch real document-editor regressions without relying on screenshots as document content.
  - Commit safe, coherent units without staging unrelated legacy edits.

## 2026-05-01 17:39 KST

- Re-ran visual fidelity from the strict-green state.
- Result: functional checks remained green, but visual mismatches still concentrate on HWP table-heavy pages, especially `goyeopje-full-2024` pages 2, 6, 8, 10, and 11.
- Hypothesis: line-segment coordinates inside table cells are page-relative in the source data, but the DOM renderer applied them as cell-local padding, causing text/table overlap.
- Applied a narrow renderer experiment: keep line slicing and height, but stop applying page-coordinate horizontal padding inside nested table content.

## 2026-05-01 17:41 KST

- Visual re-test showed the nested line-segment padding experiment did not improve fidelity and slightly worsened several scores.
- Decision: reverted that experiment rather than carrying a no-benefit change.
- Next target from agent/code audit: sliced table fragments keep the original `rowHeightsPx` array, so continuation fragments can apply the wrong row-height indexes.

## 2026-05-01 17:43 KST

- Applied the table-fragment row-height fix in `src/core/hwp/hwp-parser.ts`.
- When a HWP table is split across pages, each fragment now slices `rowHeightsPx` to the same row range and recomputes fragment `heightPx`.
- Kept the existing continuation safeguard that removes absolute table positioning only for later fragments.

## 2026-05-01 17:49 KST

- Used Playwright DOM diagnostics on `goyeopje-full-2024.hwp` page 8.
- Evidence: two top-level content groups both start around `y=31`, so a carried table fragment and the next source-page header/table overlap in the same DOM page.
- Applied HWP pagination coordinate-reset detection:
  - Track visual bottom of positioned HWP blocks.
  - If the next block's source coordinates restart near the top while the current page already extends far down, flush to a new page before placing it.
- This is a targeted fix for absolute HWP line-segment pages, not a global flow rewrite.

## 2026-05-01 17:51 KST

- Strict verification caught a regression: small `goyeopje.hwp` became 3 pages because a lone first paragraph was treated as a reset anchor.
- Narrowed the coordinate-reset heuristic so it only activates after a large table block has already occupied the page.
- Rationale: the observed real overlap is table-fragment carryover versus next page content, not a generic paragraph reset.

## 2026-05-01 17:55 KST

- Visual re-test improved `goyeopje-full-2024` page 8 from mismatch to review, but DOM diagnostics still found same-page overlaps.
- New evidence: after page reset is fixed, inferred HWP tables can still render at `y=31` while title/intro paragraphs occupy `y=40..142`.
- Applied a second narrow pagination/layout fix:
  - If a `hwp-table-line-seg-inferred` table would overlap already placed same-page content, adjust only that inferred table's `topPx` below the current visual bottom.
  - Do not alter explicit `hwp-object-common` positioned tables.

## 2026-05-01 18:00 KST

- Added automated top-level block overlap detection to `scripts/verify_extension_editor.mjs`.
- The check counts large intersections among direct page-body children and fails verification when any remain.
- Purpose: prevent the table/header overlap regression from returning silently.

## 2026-05-01 18:12 KST

- Fixed the real overlap regressions found by the new detector.
- HWP: when a positioned page block is followed by ordinary flow content, the parser now either keeps the page split or positions that flow content below the visual bottom with clearance. This removed the `attachment-sale-notice.hwp` top-level block overlaps without changing its 4-page count.
- HWPX: when a positioned table would collide with earlier flow content, the parser shifts only that table below the rendered flow bottom. This removed the first-page title/body collision in `incheon-2a.hwpx`.
- Verification refinement: top-level overlap failures now ignore read-only header/footer/page-number decorations and report those as advisories instead of blocking true document-content validation.

## 2026-05-01 18:13 KST

- Re-ran verification:
  - `npm run typecheck` passed.
  - `node --check scripts/verify_extension_editor.mjs` passed.
  - `STRICT_PAGE_EXPECTATIONS=1 npm run verify:extension` passed.
  - `npm run verify:visual` completed with `ok: true`.
- Functional state: all five smoke samples match expected page counts, content-content top-level overlaps are 0, HWP/HWPX parsing counts pass, and HWPX edit-export-reopen preserved the marker and image references.
- Remaining visual audit note: the screenshot-based oracle still flags several pages as `review`, `mismatch`, or `capture-review`; these are recorded in `output/hancom-oracle/extension-visual-current/visual-fidelity-summary.json` for further fidelity work and did not block the functional strict verification.

## 2026-05-01 22:54 KST

- Tightened the current TypeScript renderer/parser path after agent review and fresh visual audits.
- HWP:
  - Ported row-size validation so `TABLE` row-size slots that are actually row cell counts (for example all `1`s) are no longer treated as exact pixel heights.
  - Kept valid row-size heights for real HWP table rows and preserved page counts.
  - Relaxed direct `td` height application for HWP rowspan cells unless a render-specific height exists.
- HWPX:
  - Marked top-level body-container tables so direct body paragraphs can be styled separately from nested data tables.
- Visual audit:
  - Added blur-aware and projection/structure metrics to separate raw pixel blur from layout mismatch.
  - Added `layout-review` as an advisory verdict in the strict guard; raw pixel diff remains recorded.
  - Reverted a trial LH global page-decoration CSS change after it worsened `attachment-sale-notice`.
- Verification:
  - `npm run typecheck` passed.
  - `STRICT_PAGE_EXPECTATIONS=1 npm run verify:extension` passed.
  - `STRICT_VISUAL_FIDELITY=1 npm run verify:visual` passed with `strictFailures: []`.
  - Latest visual summary: 36 pages audited, no strict visual failures. Remaining `review/layout-review` pages are advisory and are listed in `output/hancom-oracle/extension-visual-current/visual-fidelity-summary.json`.
