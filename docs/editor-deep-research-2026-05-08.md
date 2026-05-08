# HWP/HWPX Editor Deep Research

Date: 2026-05-08
Scope: TotalDocs Chrome extension editor, parser/model/render/export path, and completion QA.

## Executive Summary

The editor must be treated as a general HWP/HWPX editor, not as a renderer tuned for the current sample set.
Any production behavior that depends on a document name, page number, sample text, or sample-specific visual profile is invalid.
Samples are regression inputs only; implementation decisions must come from format records, XML attributes, preserved raw data, and reusable layout rules.

The strongest current direction is:

1. Keep a lossless source document layer for HWP binary records and HWPX/OWPML package XML.
2. Build a canonical edit model that preserves raw + decoded data side by side.
3. Derive a layout tree from source fields, not from screenshots or text labels.
4. Let the DOM renderer consume that layout tree.
5. Export by patching/preserving source packages whenever possible, not by flattening everything into a newly synthesized minimal HWPX package.

## Research Sources

Official and primary sources consulted:

- Hancom HWP/OWPML download center: https://www.hancom.co.kr/support/downloadCenter/hwpOwpml
- Hancom HWP 5.0 file format PDF: https://cdn.hancom.com/link/docs/%ED%95%9C%EA%B8%80%EB%AC%B8%EC%84%9C%ED%8C%8C%EC%9D%BC%ED%98%95%EC%8B%9D_5.0_revision1.3.pdf
- Korean standard KS X 6101 page for HWPX: https://standard.go.kr/KSCI/standardIntro/getStandardSearchView.do?ksNo=KSX6101&menuId=503&tmprKsNo=KSX6101&topMenuId=502
- Hancom Office help for HWPX format: https://help.hancom.com/hoffice130/ko-KR/Hwp/format/format(hwpx).htm
- Hancom HWPX FAQ: https://help.hancom.com/hoffice130/ko-KR/Hwp/format/format(hwpx)_faq.htm
- Hancom OWPML model repository: https://github.com/hancom-io/hwpx-owpml-model

Local project sources used:

- `docs/hwp-spec-analysis/implementation-requirements.md`
- `docs/hwp-spec-analysis/hwp-5.0-revision1.3.md`
- `docs/hwp-spec-analysis/hwpml-3.0-revision1.2.md`
- `docs/rendering-status.md`
- `docs/editor-completion-audit-2026-05-06.md`
- `src/core/document-model.ts`
- `src/editor/editor.ts`
- `src/core/export/editable-document.ts`
- `src/core/export/hwpx-writer.ts`
- `src/core/render/text-renderer.ts`
- `scripts/verify_extension_editor.mjs`
- `scripts/verify_visual_fidelity.mjs`
- `scripts/check_editor_completion.mjs`

## Format Facts That Matter To The Editor

HWP is not just text plus tables. The editor must preserve record identity, record order, unknown records, DocInfo reference tables, BodyText section structure, controls, binary assets, and layout fields.
The local implementation requirements already identify `FileHeader + DocInfo + BodyText` lossless parsing as P0.

HWPX is a ZIP/XML package based on the OWPML family and standardized as KS X 6101.
That means a real editor must preserve package-level relationships and XML nodes even when TotalDocs cannot fully interpret them.
For source HWPX files, package entries such as `Contents/content.hpf`, `Contents/section*.xml`, `Contents/header.xml`, `BinData/*`, manifest entries, scripts, templates, and unknown XML fragments are edit-safe data, not disposable renderer input.

For both formats, the source-of-truth fields for layout are structural:

- Paragraph: `ParaShape`, `CharShape`, `TabDef`, `Numbering`, `Bullet`, line segment cache, text/range tags, hyperlinks, field controls.
- Page/section: `SectionDef`, `PageDef`, margins, columns, page border/fill, header/footer, footnote/endnote, page number controls.
- Table: row size, cell size, span, padding, border/fill, split policy, repeat header, zone info, caption, nested table structure.
- Object: anchor, position, size, text wrap, z-order, render matrix, crop, margins, caption, group nesting.
- Assets: BinData ids, paths, embedded streams, image mime types, OLE/chart/equation payloads.

## Current Architecture Findings

The TypeScript extension editor opens files through `parseHwpx` or `parseHwp`, renders with `renderDocumentToDom`, extracts the edited DOM through `extractEditableDocumentFromDom`, then writes HWPX through `writeHwpxPackage`.
This is a useful shell, but the current edit model is still much thinner than the parser output.

The canonical `ParsedDocument` model currently exposes pages, blocks, paragraph runs, tables, images, assets, and basic page layout.
It does not yet carry a complete source identity graph: original record ids, XML node ids, raw XML fragments, control ids, full section structure, object anchors, package relationship metadata, and unknown data ownership are not first-class model fields.

The DOM extraction layer is currently a rendered-DOM scraper.
It can collect paragraphs, tables, images, page layout, and repeated readonly image decorations.
It cannot yet guarantee full preservation of section boundaries, header/footer text, non-image decorations, field/bookmark/control identities, object z-order, equations, charts, or opaque unknown nodes.

The HWPX writer currently builds a managed package with `section0.xml`, regenerated header/content/manifest files, rebuilt style registries, and carried-over unmanaged entries.
This is enough for basic round-trip export tests, but it is not yet a lossless editor save path.
The save path needs to evolve toward source-aware patching: modify edited paragraph/table/object content while preserving untouched source XML, ids, relationships, assets, and unknown entries.

The legacy JS viewer/editor/exporter path and the TypeScript extension editor path still represent different levels of maturity.
The long-term editor direction should converge around one model contract, with the legacy viewer feeding the same canonical data or becoming a compatibility shell around it.

## Non-Hardcoding Rule

No production parser, renderer, editor, exporter, or QA decision may depend on:

- A sample filename or downloaded document path.
- A document title or specific body text.
- A specific page number in the current regression corpus.
- A visual profile named after one source document.
- A pixel transform selected only because it improves one known sample.

Allowed decisions must be derived from:

- HWP/HWPX records, XML attributes, package entries, or binary stream metadata.
- Source geometry: page definition, margins, line segments, row/cell sizes, object anchors, captions, border/fill, wrap mode.
- Cross-document reusable layout rules with regression evidence.
- Diagnostics that describe format structures, not sample identities.

If a diagnostic needs to mention a sample for reporting, that diagnostic must not alter runtime rendering behavior.

## Editor Completion Definition

The editor is not complete until all of the following are true:

1. Baseline HWP/HWPX documents open with expected format and page counts.
2. Every rendered page is structurally safe: no missing images, no overflowing blocks, no top-level overlaps.
3. HWPX edit/export/reopen preserves edit marker and layout assets.
4. HWPX export preserves image assets, paragraph styles, paragraph indents, hyperlinks, and `content.hpf` references.
5. Hancom visual fidelity is clean: no `review`, `layout-review`, `mismatch`, `capture-error`, or `capture-review` pages.
6. No production code contains sample-specific routing or visual tuning.

As of this research pass, the completion audit says structural and HWPX round-trip gates can pass, but clean Hancom visual fidelity still blocks completion.
Therefore the editor remains in progress.

## Required Model Direction

Add a two-layer model instead of expanding the current thin block tree indefinitely.

### SourceDocument Layer

Purpose: preserve everything needed to reopen or save without loss.

Required properties:

- Source format and package/container metadata.
- HWP record tree or HWPX XML package tree.
- Original order and identity for records, nodes, sections, paragraphs, runs, controls, tables, cells, objects, assets.
- Raw bytes or raw XML for unknown/unsupported data.
- Typed decode results for known structures.
- Reference tables for styles, BinData, border fills, char/para shapes, numbering/bullets, fields/bookmarks/hyperlinks.

### EditableDocument Layer

Purpose: expose editor operations safely.

Required properties:

- Stable ids that point back to source nodes/records.
- Paragraph/run operations with style inheritance.
- Table cell operations with row/col/span/source-height ownership.
- Image/object operations with anchor and z-order ownership.
- Header/footer/page number operations.
- Opaque nodes that survive move/save even when not editable.

### LayoutTree Layer

Purpose: make rendering and QA inspectable.

Required properties:

- Page boxes, body boxes, header/footer boxes.
- Paragraph line boxes and baseline data.
- Table grid boxes, split fragments, repeat header fragments.
- Object boxes with anchor/wrap/z-order.
- Source references for every rendered box.
- Diagnostics for overflow, clipping, overlap, and source-layout disagreement.

## Implementation Backlog

### P0: Make Editing Lossless Before Adding More UI

1. Introduce source identity fields in `ParsedDocument` and block models.
2. Preserve raw HWP records and raw HWPX XML/package entries as source-owned data.
3. Replace DOM-only export extraction with model-backed edit state.
4. Add a source-aware HWPX save path that patches edited content and preserves untouched sections, ids, relationships, and unknown nodes.
5. Add tests that fail when export drops unknown package entries, BinData refs, style ids, hyperlinks, or header/footer content.

Acceptance criteria:

- HWPX open -> no edit -> export produces a package with equivalent required entries and no broken references.
- HWPX open -> edit one paragraph -> export changes only the intended paragraph plus necessary metadata.
- Unsupported known structures remain opaque but are not deleted.

### P1: Stabilize Layout From Format Data

1. Promote page/section/table/object source fields into LayoutTree inputs.
2. Implement table pagination from row/cell source heights, repeat headers, pageBreak policy, rowSpan distribution, and nested table ownership.
3. Implement object anchoring from position/size/wrap/z-order fields.
4. Treat line segments as cache/diagnostic input, not as the only truth.
5. Add per-page layout diagnostics that name source fields, not sample names.

Acceptance criteria:

- Page count parity remains stable across baseline documents.
- Structural extension verification stays green.
- Visual advisory count decreases due to format-driven layout changes, not sample-specific CSS.

### P2: Expand Edit Surface

1. Editable tables: cell text, row/column insert/delete, span-safe operations.
2. Editable images/objects: move/resize while retaining anchor semantics.
3. Editable headers/footers/page numbers.
4. Editable hyperlinks/bookmarks/fields.
5. Equation/chart preservation first, editing later.

Acceptance criteria:

- Editing a table cell does not flatten the table or lose row/col/span metadata.
- Editing an image caption or paragraph near an object does not drop the object anchor.
- Hyperlinks and bookmarks survive edit/export/reopen.

### P3: Advanced Structures

1. Equation layout and baseline rendering.
2. Chart tree preservation and basic rendering.
3. Distributed document read/save policy separation.
4. Script/XML template/history preservation UI.

Acceptance criteria:

- Unknown advanced data round-trips as opaque data.
- Rendering support can improve incrementally without blocking safe saves.

## QA Strategy

Keep the verification ladder explicit:

```bash
npm run check
STRICT_PAGE_EXPECTATIONS=1 npm run verify:extension
STRICT_VISUAL_FIDELITY=1 npm run verify:visual
npm run verify:completion
```

For documentation-only work, `git diff --check` is sufficient.
For parser/render/export changes, run the full ladder above unless the change is intentionally narrow and a smaller gate is documented in the commit message.

QA should produce these classes of evidence:

- Structural: page counts, table counts, image counts, missing assets, overflow, top-level overlaps.
- Round-trip: HWPX export/reopen marker, package refs, content.hpf refs, BinData refs, style counts, hyperlinks.
- Visual: Hancom page comparison with strict failures and advisory pages.
- Source diagnostics: row heights, line segment groups, object anchors, header/footer boxes, source ids.

## Team Operating Model

Use parallel agents for bounded research or verification, but keep implementation ownership clear.

- Spec agent: HWP/HWPX/OWPML records, source fields, raw preservation.
- Architecture agent: model boundaries, parser/render/export contracts.
- QA agent: verification commands, current gate status, report interpretation.
- Implementation worker: one disjoint write scope at a time.
- Integrator: review, run gates, commit, push.

Workers must know they are not alone in the codebase and must not revert unrelated edits.
Production changes must be committed and pushed in meaningful increments after verification.

## Immediate Next Development Steps

1. Draft `SourceDocument` and `LayoutTree` TypeScript interfaces beside `src/core/document-model.ts`. Status: started.
2. Add source-id fields to paragraph/table/image blocks without changing rendering behavior. Status: started.
3. Teach HWPX parser to retain original package manifest/content/section node references in a source metadata object. Status: started with package/section/asset summaries.
4. Add export tests that compare package entry preservation for no-edit and one-paragraph-edit cases.
5. Replace DOM-scrape-only editor state with a model-backed edit session while keeping current DOM rendering UI.
6. Continue visual fidelity work only through source-derived table/object/paragraph layout diagnostics.

This sequence protects the editor contract first, then improves layout, then expands editing features.

## 2026-05-08 Implementation Start

The first implementation pass adds non-rendering model contracts:

- `SourceDocument`, `SourceEntry`, `SourceSection`, `SourceAssetReference`, and `SourceReference` in `src/core/document-model.ts`.
- `LayoutTree`, `LayoutPage`, `LayoutBox`, and layout diagnostics in `src/core/document-model.ts`.
- Optional `source`, `layoutTree`, and `sourceRef` hooks on parsed documents, pages, blocks, runs, rows, cells, and assets.
- `LayoutPage` carries full `PageLayout`, including decoration insets, and `LayoutBox` can identify flow mode plus split-fragment ownership.
- HWP parser source summaries for CFB entries, FileHeader flags, sections, and assets.
- HWPX parser source summaries for ZIP package entries, section XML paths, and assets.

This pass intentionally does not change rendering behavior.
Its purpose is to give parser, editor, exporter, and QA code a shared source-identity contract before deeper save-path work begins.
