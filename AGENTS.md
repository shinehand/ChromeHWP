# Project Instructions

## Core Product Rule

TotalDocs is a general-purpose `HWP` / `HWPX` / `OWPML` document viewer and editor.
It must never become an editor that only works for a small set of known sample files.

## No Sample-Specific Hardcoding

Do not add production logic that depends on a specific document, fixture, page, or known text snippet.

Prohibited examples:

- Branching on a document name, file name, sample id, page number, or fixture path.
- Detecting a known sentence, heading, table caption, or phrase only to tune one document.
- Adding CSS selectors, visual profiles, renderer branches, magic coordinates, row offsets, brightness filters, opacity values, or table fixes that exist only for one downloaded sample.
- Encoding assumptions such as "this page's second table" or "this known sale notice table" in parser, renderer, editor, or export code.

Allowed approach:

- Implement behavior from the document format data itself: `LineSeg`, paragraph metrics, `charPr`, `paraPr`, `tbl`, row and cell spans, row heights, padding, border/fill, object anchors, section/page definitions, caption metadata, and HWP/HWPX layout attributes.
- If a sample exposes a bug, use it as a regression test and then fix the underlying general rule.
- Sample names may appear in test fixtures, reports, diagnostics, and documentation, but not as production rendering behavior.

When a narrow compatibility workaround is unavoidable, make the predicate structural and format-derived, document the reason in code, and verify that it does not regress the other baseline documents.
