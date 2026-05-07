import type {
  BorderEdges,
  BoxSpacing,
  DocumentAsset,
  DocumentBlock,
  ImageBlock,
  PageLayout,
  ParagraphBlock,
  ParsedDocument,
  TableBlock,
  TableCell,
  TextRun
} from '../document-model';

interface RenderedAssetUrl {
  readonly url: string;
  readonly asset: DocumentAsset;
}

interface RenderContext {
  readonly assetUrls: Map<string, RenderedAssetUrl>;
  readonly availableWidth: number;
  readonly pageWidth: number;
  readonly nestingLevel: number;
  readonly sourceFormat: ParsedDocument['format'];
  readonly documentLayout?: string;
  readonly locked?: boolean;
}

type ParagraphLayout = NonNullable<ParagraphBlock['_hwpxLayout']>;
type ParagraphLineSegment = NonNullable<ParagraphLayout['lineSegments']>[number];
type ImageLayout = NonNullable<ImageBlock['_hwpxLayout']>;
type TableLayout = NonNullable<TableBlock['_hwpxLayout']>;
type TablePositionLayout = NonNullable<TableLayout['position']> & {
  readonly offsetLeftPx?: number;
  readonly offsetTopPx?: number;
  readonly textWrap?: string;
  readonly flowWithText?: boolean;
  readonly allowOverlap?: boolean;
  readonly margin?: BoxSpacing;
};

interface ParagraphLineSlice {
  readonly segment: ParagraphLineSegment;
  readonly start: number;
  readonly end: number;
}

const FALLBACK_LAYOUT: PageLayout = {
  width: 794,
  height: 1123,
  margin: { top: 72, right: 80, bottom: 72, left: 80 }
};
const A4_ASPECT_RATIO = FALLBACK_LAYOUT.width / FALLBACK_LAYOUT.height;
const HWPUNIT_PER_PX = 75;
const MIN_PAGE_WIDTH = 320;
const MAX_PAGE_WIDTH = 1600;
const MIN_PAGE_HEIGHT = 480;
const MAX_PAGE_HEIGHT = 2400;
const MIN_BODY_WIDTH = 120;
const MIN_TABLE_WIDTH = 16;
const MAX_CELL_HEIGHT = 1600;
const HWP_NESTED_INFERRED_TABLE_ANCHOR_OFFSET_X = 32;
const HWP_NESTED_INFERRED_TABLE_ANCHOR_OFFSET_Y = 28;
const HWP_TRAILING_CONTROL_LINE_MAX_HEIGHT_PX = 48;
const HWP_CELL_PARAGRAPH_SOURCE_GAP_MAX_PX = 48;

export function renderDocumentToEditableText(document: ParsedDocument): string {
  const pages = document.pages.map((page) => {
    const body = page.blocks.map(renderBlockText).filter(Boolean).join('\n');
    return document.pages.length > 1
      ? `[${page.index + 1}쪽]\n${body}`
      : body;
  });
  return pages.join('\n\n');
}

export function renderDocumentToDom(document: ParsedDocument, target: HTMLElement): () => void {
  const assetUrls = buildAssetUrlMap(document.assets);
  const fragments: Node[] = [];
  target.replaceChildren();
  target.spellcheck = false;
  target.setAttribute('role', 'document');

  for (const page of document.pages) {
    const { layout, bodyWidth } = normalizePageLayout(page.layout);
    const pageElement = documentElement('section', 'hwp-page');
    const bodyElement = documentElement('div', 'hwp-page-body');
    const decorationBlocks: DocumentBlock[] = [];
    const bodyBlocks: DocumentBlock[] = [];
    const baseContext: RenderContext = {
      assetUrls,
      availableWidth: bodyWidth,
      pageWidth: layout.width,
      nestingLevel: 0,
      sourceFormat: document.format
    };
    const documentLayout = page.blocks.some((block) => {
      return block.type === 'table' && isLhSaleNoticePrimaryTable(block, baseContext);
    }) ? 'lh-sale-notice' : '';
    const context: RenderContext = {
      ...baseContext,
      ...(documentLayout ? { documentLayout } : {})
    };

    pageElement.dataset.pageIndex = String(page.index);
    pageElement.dataset.sourceFormat = document.format;
    if (documentLayout) {
      pageElement.dataset.documentLayout = 'lh-sale-notice';
    }
    pageElement.setAttribute('aria-label', `${page.index + 1}쪽`);
    applyPageLayout(pageElement, bodyElement, layout, bodyWidth);

    for (const block of page.blocks) {
      if (isReadOnlyDecorationBlock(block)) decorationBlocks.push(block);
      else bodyBlocks.push(block);
    }

    for (const block of bodyBlocks) {
      bodyElement.append(renderBlockDom(block, context));
    }
    if (!bodyElement.childNodes.length) bodyElement.append(renderEmptyParagraphDom());

    pageElement.append(bodyElement);
    if (decorationBlocks.length) {
      const decorationLayer = documentElement('div', 'hwp-page-decoration-layer');
      setReadOnlyDecorationHost(decorationLayer);
      for (const block of decorationBlocks) {
        decorationLayer.append(renderBlockDom(block, { ...context, locked: true }));
      }
      pageElement.append(decorationLayer);
    }
    fragments.push(pageElement);
  }

  target.append(...fragments);
  return () => {
    for (const { url } of assetUrls.values()) URL.revokeObjectURL(url);
  };
}

function renderBlockText(block: DocumentBlock): string {
  if (block.type === 'paragraph') return renderParagraphText(block);
  if (block.type === 'table') return renderTableText(block);
  return `[이미지: ${block.assetId}]`;
}

function renderParagraphText(block: ParagraphBlock): string {
  return block.runs.map((run) => run.text).join('');
}

function renderTableText(block: TableBlock): string {
  return block.rows
    .map((row) => row.cells.map((cell) => cell.blocks.map(renderBlockText).join(' ')).join('\t'))
    .join('\n');
}

function renderBlockDom(block: DocumentBlock, context: RenderContext): HTMLElement {
  if (block.type === 'paragraph') return renderParagraphDom(block, context);
  if (block.type === 'table') return renderTableDom(block, context);
  return renderImageDom(block, context);
}

function isReadOnlyDecorationBlock(block: DocumentBlock): boolean {
  const layout = block._hwpxLayout;
  const source = layout?.source ?? layout?.position?.source ?? '';
  return source.startsWith('hwpx-header') || source.startsWith('hwpx-footer');
}

function renderParagraphDom(block: ParagraphBlock, context: RenderContext): HTMLElement {
  const paragraph = documentElement('p', 'hwp-paragraph');
  const layout = block._hwpxLayout;
  if (context.locked) setReadOnlyDecorationHost(paragraph);
  else setEditableTextHost(paragraph);
  paragraph.style.textAlign = block.align ?? 'left';
  applyBoxSpacing(paragraph, block.margin, 'margin');
  applyParagraphTextIndent(paragraph, block, context);
  applyHwpParagraphPosition(paragraph, layout, context);
  if (renderDecorationRule(paragraph, layout)) return paragraph;
  if (layout?.heightPx && layout.heightPx > 0) {
    paragraph.dataset.layoutHeight = String(Math.round(layout.heightPx));
    paragraph.style.minHeight = `${Math.round(layout.heightPx)}px`;
    if (!block.margin) paragraph.style.margin = '0';
  }
  const lineHeight = normalizeLineHeight(block.lineHeight);
  if (lineHeight) paragraph.style.lineHeight = lineHeight;

  const lineSegmentHorizontalOrigin = lineSegmentParagraphHorizontalOrigin(paragraph, layout, context);
  if (!renderLineSegmentParagraphDom(paragraph, block, layout, lineSegmentHorizontalOrigin)) {
    for (const run of block.runs) {
      if (run.text.length > 0) paragraph.append(renderRunDom(run));
    }
  }
  if (!paragraph.childNodes.length) markEmptyParagraph(paragraph);
  return paragraph;
}

function applyParagraphTextIndent(paragraph: HTMLElement, block: ParagraphBlock, context: RenderContext): void {
  const indent = normalizeParagraphTextIndent(block.textIndent);
  if (!indent || block.align === 'center' || block.align === 'right') return;

  paragraph.style.textIndent = `${indent}px`;
  if (indent < 0 && context.nestingLevel > 0) {
    const currentPadding = cssPixelLength(paragraph.style.paddingLeft);
    paragraph.style.paddingLeft = `${Math.round(currentPadding + Math.abs(indent))}px`;
  }
}

function renderDecorationRule(paragraph: HTMLElement, layout: ParagraphLayout | undefined): boolean {
  if (layout?.source !== 'hwpx-header-rule' && layout?.source !== 'hwpx-footer-rule') return false;
  const height = Math.max(1, Math.round(layout.position?.heightPx ?? layout.heightPx));
  paragraph.dataset.decorationRule = 'true';
  paragraph.style.height = `${height}px`;
  paragraph.style.minHeight = `${height}px`;
  paragraph.style.background = '#d5a0d8';
  paragraph.style.fontSize = '0';
  paragraph.style.lineHeight = '0';
  paragraph.style.padding = '0';
  paragraph.style.border = '0';
  return true;
}

function renderRunDom(run: TextRun): HTMLElement {
  const href = normalizeSafeHref(run.href);
  const span = href ? documentElement('a', 'hwp-run') : documentElement('span', 'hwp-run');
  span.textContent = run.text;
  if (href && span instanceof HTMLAnchorElement) {
    span.href = href;
    span.target = '_blank';
    span.rel = 'noopener noreferrer';
    span.dataset.hwpxField = 'hyperlink';
  }
  if (run.fontFamily) span.style.fontFamily = quoteFontFamily(run.fontFamily);
  if (run.fontSizePt) span.style.fontSize = `${run.fontSizePt}pt`;
  if (run.color) span.style.color = run.color;
  if (run.backgroundColor) span.style.backgroundColor = run.backgroundColor;
  if (run.bold) span.style.fontWeight = '700';
  if (run.italic) span.style.fontStyle = 'italic';
  const letterSpacing = normalizeLetterSpacing(run.letterSpacing);
  if (letterSpacing) span.style.letterSpacing = letterSpacing;
  if (run.underline || run.strike) {
    span.style.textDecoration = [
      run.underline ? 'underline' : '',
      run.strike ? 'line-through' : ''
    ].filter(Boolean).join(' ');
  }
  return span;
}

function applyHwpParagraphPosition(
  paragraph: HTMLElement,
  layout: ParagraphLayout | undefined,
  context: RenderContext
): void {
  const position = layout?.position;
  if (context.nestingLevel === 0 && position) {
    const signedOffset = shouldPreserveSignedPosition(position.source);
    paragraph.dataset.layoutPosition = 'absolute';
    paragraph.style.position = 'absolute';
    paragraph.style.top = cssPagePosition(topLevelPositionTopMarginVariable(position, context), Math.round(position.topPx), signedOffset);
    paragraph.style.left = cssPagePosition('--hwp-margin-left', Math.round(position.leftPx), signedOffset);
    paragraph.style.margin = '0';
    if (position.widthPx && position.widthPx > 0) {
      const width = `${Math.round(position.widthPx)}px`;
      paragraph.style.width = width;
      paragraph.style.maxWidth = width;
    } else {
      paragraph.style.maxWidth = '100%';
    }
    if (position.heightPx && position.heightPx > 0) paragraph.style.minHeight = `${Math.round(position.heightPx)}px`;
    if (position.zIndex) paragraph.style.zIndex = String(position.zIndex);
    return;
  }

  if (context.nestingLevel > 0 || layout?.source !== 'hwp-para-line-seg' || !layout.lineSegments?.length) return;
  const top = hwpUnitToPx(Math.min(...layout.lineSegments.map((segment) => segment.verticalPosition)));
  const left = hwpUnitToPx(Math.min(...layout.lineSegments.map((segment) => segment.horizontalPosition)));
  if (top <= 0) return;
  paragraph.dataset.layoutPosition = 'absolute';
  paragraph.style.position = 'absolute';
  paragraph.style.top = cssPagePosition('--hwp-margin-top', top);
  paragraph.style.left = cssPagePosition('--hwp-margin-left', Math.max(0, left));
  paragraph.style.margin = '0';
  paragraph.style.maxWidth = '100%';
}

function renderLineSegmentParagraphDom(
  paragraph: HTMLElement,
  block: ParagraphBlock,
  layout: ParagraphLayout | undefined,
  horizontalOrigin = 0
): boolean {
  const slices = buildParagraphLineSlices(block, layout);
  if (!slices.length) return false;

  paragraph.dataset.layoutMode = 'line-segments';
  paragraph.style.whiteSpace = 'normal';

  for (const slice of slices) {
    const line = documentElement('span', 'hwp-line-segment');
    line.dataset.textPosition = String(slice.start);
    line.dataset.textEnd = String(slice.end);
    applyLineSegmentMetrics(line, slice.segment, horizontalOrigin);
    appendRunsInTextRange(line, block.runs, slice.start, slice.end);
    if (!line.childNodes.length) line.append(document.createElement('br'));
    paragraph.append(line);
  }

  return true;
}

function lineSegmentParagraphHorizontalOrigin(
  paragraph: HTMLElement,
  layout: ParagraphLayout | undefined,
  context: RenderContext
): number {
  if (
    context.nestingLevel > 0
    || layout?.source !== 'hwp-para-line-seg'
    || paragraph.dataset.layoutPosition !== 'absolute'
    || !layout.lineSegments?.length
  ) {
    return 0;
  }
  return Math.min(...layout.lineSegments.map((segment) => Math.max(0, segment.horizontalPosition)));
}

function buildParagraphLineSlices(
  block: ParagraphBlock,
  layout: ParagraphLayout | undefined
): ParagraphLineSlice[] {
  const totalLength = textRunsLength(block.runs);
  if (!layout?.lineSegments?.length || totalLength <= 0) return [];

  const segments = normalizeParagraphLineSegments(layout.lineSegments, totalLength);
  const trailingControlSegment = trailingControlLineSegment(layout, totalLength);
  if (segments.length === 1) {
    const [entry] = segments;
    const slices = shouldRenderSingleLineSegment(entry.segment)
      ? [{ segment: entry.segment, start: 0, end: totalLength }]
      : [];
    if (trailingControlSegment) {
      slices.push({ segment: trailingControlSegment, start: totalLength, end: totalLength });
    }
    return slices;
  }
  if (segments.length < 2) return [];

  const slices: ParagraphLineSlice[] = [];
  for (const [index, entry] of segments.entries()) {
    const next = segments[index + 1];
    const start = clamp(entry.textPosition, 0, totalLength);
    const end = clamp(next?.textPosition ?? totalLength, start, totalLength);
    if (end <= start) continue;
    slices.push({ segment: entry.segment, start, end });
  }
  if (trailingControlSegment) {
    slices.push({ segment: trailingControlSegment, start: totalLength, end: totalLength });
  }

  return slices.length > 1 ? slices : [];
}

function trailingControlLineSegment(
  layout: ParagraphLayout,
  totalLength: number
): ParagraphLineSegment | undefined {
  if (layout.source !== 'hwp-para-line-seg') return undefined;
  const segments = layout.lineSegments ?? [];
  if (segments.length < 2) return undefined;
  const last = segments
    .filter((segment) => Number.isFinite(segment.textPosition))
    .sort((left, right) => {
      if (left.textPosition !== right.textPosition) return left.textPosition - right.textPosition;
      return left.index - right.index;
    })
    .at(-1);
  if (!last || last.textPosition < totalLength) return undefined;
  if (last.heightPx < 24 || last.verticalSize <= last.spacing * 2) return undefined;
  return {
    ...last,
    heightPx: Math.max(
      last.heightPx,
      Math.min(HWP_TRAILING_CONTROL_LINE_MAX_HEIGHT_PX, hwpUnitToPx(last.verticalSize))
    )
  };
}

function shouldRenderSingleLineSegment(segment: ParagraphLineSegment): boolean {
  return segment.horizontalPosition > 0
    || segment.horizontalSize > 0
    || segment.verticalSize > 0
    || segment.textHeight > 0
    || segment.spacing > 0;
}

function normalizeParagraphLineSegments(
  lineSegments: readonly ParagraphLineSegment[],
  totalLength: number
): readonly { readonly segment: ParagraphLineSegment; readonly textPosition: number }[] {
  const sorted = [...lineSegments]
    .filter((segment) => Number.isFinite(segment.textPosition) && segment.textPosition >= 0)
    .sort((left, right) => {
      if (left.textPosition !== right.textPosition) return left.textPosition - right.textPosition;
      return left.index - right.index;
    });

  const unique: { segment: ParagraphLineSegment; textPosition: number }[] = [];
  for (const segment of sorted) {
    const textPosition = Math.min(Math.round(segment.textPosition), totalLength);
    const previous = unique[unique.length - 1];
    if (previous && previous.textPosition === textPosition) continue;
    unique.push({ segment, textPosition });
  }

  if (!unique.length) return [];
  if (unique[0].textPosition > 0) {
    unique.unshift({ segment: unique[0].segment, textPosition: 0 });
  }

  return unique.filter((entry) => entry.textPosition < totalLength);
}

function applyLineSegmentMetrics(
  line: HTMLElement,
  segment: ParagraphLineSegment,
  horizontalOrigin = 0
): void {
  const height = clamp(Math.round(segment.heightPx), 1, 240);
  const left = hwpUnitToPx(Math.max(0, segment.horizontalPosition - horizontalOrigin));
  const width = hwpUnitToPx(segment.horizontalSize);

  line.dataset.layoutHeight = String(height);
  line.dataset.horizontalPosition = String(segment.horizontalPosition);
  line.dataset.horizontalSize = String(segment.horizontalSize);
  line.style.minHeight = `${height}px`;
  line.style.lineHeight = `${height}px`;

  if (left > 0 && left < MAX_PAGE_WIDTH) {
    line.style.paddingLeft = `${left}px`;
  }
  if (width > 0 && width < MAX_PAGE_WIDTH) {
    line.style.maxWidth = `${width}px`;
  }
}

function appendRunsInTextRange(
  container: HTMLElement,
  runs: readonly TextRun[],
  start: number,
  end: number
): void {
  let cursor = 0;
  for (const run of runs) {
    const runEnd = cursor + run.text.length;
    const sliceStart = Math.max(start, cursor);
    const sliceEnd = Math.min(end, runEnd);
    if (sliceEnd > sliceStart) {
      container.append(renderRunDom({
        ...run,
        text: run.text.slice(sliceStart - cursor, sliceEnd - cursor)
      }));
    }
    cursor = runEnd;
    if (cursor >= end) break;
  }
}

function textRunsLength(runs: readonly TextRun[]): number {
  return runs.reduce((sum, run) => sum + run.text.length, 0);
}

function renderTableDom(block: TableBlock, context: RenderContext): HTMLElement {
  const wrapper = documentElement('div', 'hwp-table-wrap');
  const table = documentElement('table', 'hwp-table');
  const layout = block._hwpxLayout;
  const tableLayout = isLhSaleNoticePrimaryTable(block, context) ? 'lh-sale-notice-primary' : '';
  const contentKind = tableContentKind(block, context);
  const columnCount = tableColumnCount(block);
  const normalizedWidths = normalizeColumnWidths(block.columnWidths, columnCount);
  const position = tablePositionLayout(layout);
  const positionedWidth = position?.widthPx;
  const tableWidth = positionedWidth && positionedWidth > 0
    ? clamp(positionedWidth, MIN_TABLE_WIDTH, MAX_PAGE_WIDTH)
    : resolveTableWidth(block, context.availableWidth);

  if (context.locked) setReadOnlyDecorationHost(wrapper);
  if (context.nestingLevel > 0) wrapper.classList.add('hwp-table-wrap-nested');
  wrapper.dataset.nestingLevel = String(context.nestingLevel);
  if (tableLayout) wrapper.dataset.layout = tableLayout;
  if (contentKind) wrapper.dataset.contentKind = contentKind;
  wrapper.style.width = `${tableWidth}px`;
  wrapper.style.maxWidth = '100%';
  applyPositionedTableLayout(wrapper, layout, context);
  if (contentKind === 'hwpx-body-container') {
    wrapper.style.margin = '0';
    wrapper.style.overflow = 'visible';
  }

  table.dataset.nestingLevel = String(context.nestingLevel);
  table.dataset.sourceFormat = context.sourceFormat;
  if (tableLayout) table.dataset.layout = tableLayout;
  if (contentKind) table.dataset.contentKind = contentKind;
  table.style.width = '100%';
  if (context.locked) {
    table.contentEditable = 'false';
    table.dataset.readonlyDecoration = 'true';
  }
  const renderHeight = layout?.renderHeightPx ?? layout?.heightPx;
  if (renderHeight && renderHeight > 0) {
    wrapper.dataset.layoutHeight = formatDataNumber(renderHeight);
    wrapper.style.minHeight = formatCssPx(renderHeight);
    table.style.height = formatCssPx(renderHeight);
  }
  if (layout?.repeatHeaderRows) table.dataset.repeatHeaderRows = String(layout.repeatHeaderRows);
  if (block.border) table.style.border = block.border;
  applyBorderEdges(table, block.borderEdges);
  if (block.background) table.style.background = block.background;

  if (normalizedWidths.length) {
    const colgroup = document.createElement('colgroup');
    for (const width of normalizedWidths) {
      const col = document.createElement('col');
      col.style.width = `${width}%`;
      colgroup.append(col);
    }
    table.append(colgroup);
  }

  const tbody = document.createElement('tbody');
  const rows = block.rows.length
    ? block.rows
    : [{ cells: [{ blocks: [], colSpan: columnCount, rowSpan: 1 }] }];
  const childContext: RenderContext = {
    ...context,
    availableWidth: tableWidth,
    nestingLevel: context.nestingLevel + 1
  };

  for (const [rowIndex, row] of rows.entries()) {
    const rowElement = document.createElement('tr');
    const rowHeight = row._hwpxLayout?.renderHeightPx
      ?? row._hwpxLayout?.heightPx
      ?? layout?.rowHeightsPx?.[rowIndex]
      ?? 0;
    if (rowHeight > 0) {
      rowElement.dataset.layoutHeight = formatDataNumber(rowHeight);
      rowElement.style.height = formatCssPx(rowHeight);
    }
    let columnOffset = 0;
    for (const cell of row.cells) {
      const colSpan = Math.max(1, cell.colSpan);
      rowElement.append(renderCellDom(cell, {
        ...childContext,
        availableWidth: columnSpanWidth(normalizedWidths, columnOffset, colSpan, tableWidth)
      }));
      columnOffset += colSpan;
    }
    tbody.append(rowElement);
  }
  table.append(tbody);
  wrapper.append(table);
  return wrapper;
}

function applyPositionedTableLayout(
  wrapper: HTMLElement,
  layout: TableBlock['_hwpxLayout'] | undefined,
  context: RenderContext
): void {
  const position = tablePositionLayout(layout);
  if (!position) return;
  if (context.nestingLevel > 0) {
    if (shouldApplyNestedPositionedTableLayout(context)) {
      applyNestedPositionedTableLayout(wrapper, layout, position);
    }
    return;
  }
  if (shouldKeepPositionedTableInFlow(position)) {
    applyFlowPositionedTableLayout(wrapper, position);
    return;
  }
  const signedOffset = shouldPreserveSignedPosition(position.source);
  const topMarginVariable = topLevelPositionTopMarginVariable(position, context);
  wrapper.dataset.layoutPosition = 'absolute';
  if (position.source) wrapper.dataset.layoutSource = position.source;
  wrapper.style.position = 'absolute';
  wrapper.style.left = cssPagePosition('--hwp-margin-left', Math.round(position.leftPx), signedOffset);
  wrapper.style.top = cssPagePosition(topMarginVariable, Math.round(position.topPx), signedOffset);
  wrapper.style.margin = '0';
  wrapper.style.maxWidth = 'none';
  if (position.widthPx && position.widthPx > 0) wrapper.style.width = `${Math.round(position.widthPx)}px`;
  const positionedHeight = resolvePositionedTableHeight(layout, position);
  if (positionedHeight > 0) wrapper.style.minHeight = `${Math.round(positionedHeight)}px`;
  if (position.zIndex) wrapper.style.zIndex = String(position.zIndex);
}

function topLevelPositionTopMarginVariable(position: TablePositionLayout | ImageLayout['position'], context: RenderContext): string {
  if (!position) return '--hwp-margin-top';
  const source = position?.source;
  if (
    context.sourceFormat === 'hwp'
    && context.documentLayout === 'lh-sale-notice'
    && (
      source === 'hwp-table-line-seg-inferred'
      || source === 'hwp-flow-after-positioned'
      || source === 'hwp-object-common'
      || source === 'hwp-picture-object-common'
    )
  ) {
    return '--hwp-content-top';
  }
  if (
    context.sourceFormat === 'hwp'
    && context.pageWidth <= 900
    && (source === 'hwp-table-line-seg-inferred' || source === 'hwp-object-common')
    && Math.round(position.topPx) <= 8
  ) {
    return '--hwp-content-top';
  }
  return '--hwp-margin-top';
}

function shouldApplyNestedPositionedTableLayout(context: RenderContext): boolean {
  return context.sourceFormat === 'hwp' && context.pageWidth <= 900;
}

function applyNestedPositionedTableLayout(
  wrapper: HTMLElement,
  layout: TableBlock['_hwpxLayout'] | undefined,
  position: TablePositionLayout
): void {
  wrapper.dataset.layoutPosition = 'nested-absolute';
  if (position.source) wrapper.dataset.layoutSource = position.source;
  wrapper.style.position = 'absolute';
  if (position.textWrap === 'through') {
    wrapper.style.left = 'auto';
    wrapper.style.right = '12px';
    wrapper.style.top = `${-Math.round(position.topPx)}px`;
  } else {
    const anchorOffset = nestedInferredTableAnchorOffset(position);
    wrapper.style.left = `${Math.round(position.leftPx + anchorOffset.left)}px`;
    wrapper.style.top = `${Math.round(position.topPx + anchorOffset.top)}px`;
  }
  wrapper.style.margin = '0';
  wrapper.style.maxWidth = 'none';
  if (position.widthPx && position.widthPx > 0) wrapper.style.width = `${Math.round(position.widthPx)}px`;
  const positionedHeight = resolvePositionedTableHeight(layout, position);
  if (positionedHeight > 0) wrapper.style.minHeight = `${Math.round(positionedHeight)}px`;
  if (position.zIndex) wrapper.style.zIndex = String(position.zIndex);
}

function nestedInferredTableAnchorOffset(position: TablePositionLayout): { readonly left: number; readonly top: number } {
  if (position.source !== 'hwp-table-line-seg-inferred') return { left: 0, top: 0 };
  return {
    left: HWP_NESTED_INFERRED_TABLE_ANCHOR_OFFSET_X,
    top: HWP_NESTED_INFERRED_TABLE_ANCHOR_OFFSET_Y
  };
}

function applyFlowPositionedTableLayout(wrapper: HTMLElement, position: TablePositionLayout): void {
  wrapper.dataset.layoutPosition = 'flow';
  if (position.source) wrapper.dataset.layoutSource = position.source;
  wrapper.style.clear = 'both';
  applyBoxSpacing(wrapper, position.margin, 'margin');
  if (position.widthPx && position.widthPx > 0) wrapper.style.width = `${Math.round(position.widthPx)}px`;
  if (position.zIndex) wrapper.style.zIndex = String(position.zIndex);

  const offsetX = clamp(Math.round(position.offsetLeftPx ?? 0), -MAX_PAGE_WIDTH, MAX_PAGE_WIDTH);
  const offsetY = clamp(Math.round(position.offsetTopPx ?? 0), -MAX_PAGE_HEIGHT, MAX_PAGE_HEIGHT);
  if (!offsetX && !offsetY) return;
  wrapper.style.position = 'relative';
  wrapper.style.left = `${offsetX}px`;
  wrapper.style.top = `${offsetY}px`;
}

function shouldKeepPositionedTableInFlow(position: TablePositionLayout): boolean {
  return isTopAndBottomTextWrap(position.textWrap)
    && position.flowWithText === true
    && position.allowOverlap !== true;
}

function tablePositionLayout(layout: TableBlock['_hwpxLayout'] | undefined): TablePositionLayout | undefined {
  return layout?.position as TablePositionLayout | undefined;
}

function resolvePositionedTableHeight(
  layout: TableBlock['_hwpxLayout'] | undefined,
  position: NonNullable<NonNullable<TableBlock['_hwpxLayout']>['position']>
): number {
  const frameHeight = position.heightPx && position.heightPx > 0 ? position.heightPx : 0;
  if (!frameHeight) return 0;

  if (position.source === 'hwpx-table-pos') {
    const tableHeight = layout?.renderHeightPx ?? layout?.heightPx ?? 0;
    return tableHeight > 0 ? Math.min(frameHeight, tableHeight) : frameHeight;
  }

  return frameHeight;
}

function isLhSaleNoticePrimaryTable(block: TableBlock, context: RenderContext): boolean {
  if (context.sourceFormat !== 'hwp' || context.nestingLevel !== 0) return false;
  const text = renderTableText(block).replace(/\s+/g, ' ');
  return text.includes('잔여세대')
    && text.includes('일반매각 공고')
    && text.includes('LH에서는 콜센터');
}

function renderCellDom(cell: TableCell, context: RenderContext): HTMLElement {
  const cellElement = documentElement('td', 'hwp-table-cell');
  const emptyCell = isEmptyCell(cell);
  cellElement.spellcheck = false;
  if (context.locked) {
    cellElement.contentEditable = 'false';
    cellElement.dataset.readonlyDecoration = 'true';
  }
  if (emptyCell) cellElement.dataset.empty = 'true';
  if (cell.colSpan > 1) cellElement.colSpan = cell.colSpan;
  if (cell.rowSpan > 1) cellElement.rowSpan = cell.rowSpan;
  const width = normalizeCssLength(cell.width, context.availableWidth);
  const renderHeight = normalizeCssLengthExact(cell._hwpxLayout?.renderHeightPx, MAX_CELL_HEIGHT);
  const height = shouldApplyTableCellHeight(cell, context, renderHeight)
    ? normalizeCssLengthExact(cell._hwpxLayout?.renderHeightPx ?? cell.height, MAX_CELL_HEIGHT)
    : 0;
  if (width) cellElement.style.width = `${width}px`;
  if (height) {
    cellElement.dataset.layoutHeight = formatDataNumber(height);
    cellElement.style.height = formatCssPx(height);
  }
  if (cell.verticalAlign) cellElement.style.verticalAlign = cell.verticalAlign;
  if (cell.align) cellElement.style.textAlign = cell.align;
  if (cell.border) cellElement.style.border = cell.border;
  applyBorderEdges(cellElement, cell.borderEdges);
  if (cell.background) cellElement.style.background = cell.background;
  applyBoxSpacing(cellElement, cell.padding, 'padding', { maxPx: 80, hwpUnitThreshold: 48 });

  const contentHost = documentElement('div', 'hwp-table-cell-content');
  const hasNestedPositionedTable = cellHasNestedPositionedTable(cell, context);
  if (hasNestedPositionedTable) {
    contentHost.style.position = 'relative';
    contentHost.style.overflow = 'visible';
  }
  if (height && shouldClipTableCellContent(cell, context, renderHeight)) {
    contentHost.style.maxHeight = formatCssPx(height);
    if (!hasNestedPositionedTable) contentHost.style.overflow = 'hidden';
  }

  const childContext: RenderContext = {
    ...context,
    availableWidth: Math.max(MIN_TABLE_WIDTH, width || context.availableWidth)
  };
  let previousHwpLineBottomPx: number | undefined;
  let pendingHwpNestedTableAnchorOverlapPx = 0;
  for (const block of cell.blocks) {
    const childElement = renderBlockDom(block, childContext);
    if (
      pendingHwpNestedTableAnchorOverlapPx > 0
      && shouldOverlapHwpNestedTableAnchor(block, childContext)
    ) {
      childElement.style.marginTop = formatCssPx(
        cssPixelLength(childElement.style.marginTop) - pendingHwpNestedTableAnchorOverlapPx
      );
      childElement.style.marginBottom = '0';
      childElement.dataset.hwpAnchorOverlap = formatDataNumber(pendingHwpNestedTableAnchorOverlapPx);
      pendingHwpNestedTableAnchorOverlapPx = 0;
    } else if (block.type !== 'paragraph') {
      pendingHwpNestedTableAnchorOverlapPx = 0;
    }
    const sourceLineBox = hwpCellParagraphSourceLineBox(block, childContext);
    if (sourceLineBox && previousHwpLineBottomPx !== undefined) {
      const gap = clamp(
        Math.round(sourceLineBox.topPx - previousHwpLineBottomPx),
        0,
        HWP_CELL_PARAGRAPH_SOURCE_GAP_MAX_PX
      );
      if (gap > 0) {
        childElement.style.marginTop = `${Math.round(cssPixelLength(childElement.style.marginTop) + gap)}px`;
      }
    }
    if (sourceLineBox) previousHwpLineBottomPx = sourceLineBox.bottomPx;
    else previousHwpLineBottomPx = undefined;
    pendingHwpNestedTableAnchorOverlapPx = hwpNestedTableAnchorOverlapPx(block, childContext);
    contentHost.append(childElement);
  }
  if (!contentHost.childNodes.length) contentHost.append(renderEmptyParagraphDom(cell.align, context.locked));
  cellElement.append(contentHost);
  return cellElement;
}

function hwpCellParagraphSourceLineBox(
  block: DocumentBlock,
  context: RenderContext
): { readonly topPx: number; readonly bottomPx: number } | undefined {
  if (
    context.sourceFormat !== 'hwp'
    || context.pageWidth <= 900
    || context.nestingLevel <= 0
    || block.type !== 'paragraph'
  ) {
    return undefined;
  }
  const layout = block._hwpxLayout;
  if (layout?.source !== 'hwp-para-line-seg' || !layout.lineSegments?.length) return undefined;
  const topPx = hwpUnitToPx(Math.min(...layout.lineSegments.map((segment) => Math.max(0, segment.verticalPosition))));
  if (topPx > 180) return undefined;
  const bottomPx = Math.max(...layout.lineSegments.map((segment) => {
    return hwpUnitToPx(Math.max(0, segment.verticalPosition)) + Math.max(1, Math.round(segment.heightPx));
  }));
  return { topPx, bottomPx: Math.max(topPx, bottomPx) };
}

function hwpNestedTableAnchorOverlapPx(block: DocumentBlock, context: RenderContext): number {
  if (
    context.sourceFormat !== 'hwp'
    || context.pageWidth <= 900
    || context.nestingLevel <= 0
    || block.type !== 'paragraph'
  ) {
    return 0;
  }
  const layout = block._hwpxLayout;
  const totalLength = textRunsLength(block.runs);
  if (!layout) return 0;
  const segment = trailingControlLineSegment(layout, totalLength)
    ?? trailingControlAnchorLineSegment(layout, totalLength);
  return segment ? Math.min(HWP_TRAILING_CONTROL_LINE_MAX_HEIGHT_PX, Math.round(segment.heightPx)) : 0;
}

function shouldOverlapHwpNestedTableAnchor(block: DocumentBlock, context: RenderContext): boolean {
  return context.sourceFormat === 'hwp'
    && context.pageWidth > 900
    && context.nestingLevel > 0
    && block.type === 'table';
}

function trailingControlAnchorLineSegment(
  layout: ParagraphLayout,
  totalLength: number
): ParagraphLineSegment | undefined {
  if (layout.source !== 'hwp-para-line-seg') return undefined;
  const segments = layout.lineSegments ?? [];
  if (segments.length < 2) return undefined;
  const last = segments
    .filter((segment) => Number.isFinite(segment.textPosition))
    .sort((left, right) => {
      if (left.textPosition !== right.textPosition) return left.textPosition - right.textPosition;
      return left.index - right.index;
    })
    .at(-1);
  if (!last || last.textPosition < totalLength) return undefined;
  const sourceHeightPx = hwpUnitToPx(Math.max(last.verticalSize, last.textHeight, last.spacing, 0));
  const heightPx = Math.max(last.heightPx, sourceHeightPx);
  if (heightPx < 24) return undefined;
  return { ...last, heightPx };
}

function cellHasNestedPositionedTable(cell: TableCell, context: RenderContext): boolean {
  if (!shouldApplyNestedPositionedTableLayout(context)) return false;
  return cell.blocks.some((block) => {
    return block.type === 'table' && Boolean(tablePositionLayout(block._hwpxLayout));
  });
}

function shouldClipTableCellContent(
  cell: TableCell,
  context: RenderContext,
  renderHeight: number
): boolean {
  if (context.locked) return true;
  if (renderHeight > 0) return true;
  return Boolean(cell.height);
}

function shouldApplyTableCellHeight(cell: TableCell, context: RenderContext, renderHeight: number): boolean {
  if (renderHeight > 0) return true;
  if (context.sourceFormat === 'hwp' && cell.rowSpan > 1) return false;
  if (context.sourceFormat === 'hwpx' && cell.rowSpan > 1) return false;
  return Boolean(cell.height);
}

function tableContentKind(block: TableBlock, context: RenderContext): string {
  if (context.sourceFormat === 'hwpx' && context.nestingLevel > 0 && isHwpxPerformanceGradeTable(block)) {
    return 'hwpx-performance-grade';
  }
  if (context.sourceFormat === 'hwpx' && context.nestingLevel > 0 && isHwpxTailDisclosureTable(block)) {
    return 'hwpx-tail-disclosure';
  }
  if (context.sourceFormat === 'hwpx' && context.nestingLevel > 0 && isHwpxEligibilityHeadingTable(block)) {
    return 'hwpx-eligibility-heading';
  }
  if (context.sourceFormat === 'hwp'
    && context.documentLayout === 'lh-sale-notice'
    && context.nestingLevel === 0
    && isLhSaleNoticeSupplySummaryTable(block)) {
    return 'lh-sale-notice-supply-summary';
  }
  if (context.sourceFormat === 'hwpx' && context.nestingLevel === 0 && isHwpxGeneralNoticeSectionTable(block)) {
    return 'hwpx-general-notice-section';
  }
  if (context.sourceFormat === 'hwpx' && context.nestingLevel === 0 && isHwpxTransferRestrictionSectionTable(block)) {
    return 'hwpx-transfer-restriction-section';
  }
  if (context.sourceFormat === 'hwpx' && context.nestingLevel === 0 && isHwpxLotteryContractSectionTable(block)) {
    return 'hwpx-lottery-contract-section';
  }
  if (context.sourceFormat === 'hwpx' && context.nestingLevel === 0 && isHwpxEligibilitySectionTable(block)) {
    return 'hwpx-eligibility-section';
  }
  if (context.sourceFormat === 'hwpx' && context.nestingLevel === 0 && isHwpxBodyContainerTable(block)) {
    return 'hwpx-body-container';
  }
  return '';
}

function isLhSaleNoticeSupplySummaryTable(block: TableBlock): boolean {
  if (block.rows.length < 4 || tableColumnCount(block) < 5) return false;
  const text = renderTableText(block).replace(/\s+/g, ' ').trim();
  return text.includes('지역')
    && text.includes('단지코드')
    && text.includes('사용승인연도')
    && text.includes('건설호수')
    && text.includes('금회공급호수');
}

function isHwpxPerformanceGradeTable(block: TableBlock): boolean {
  if (block.rows.length < 40 || tableColumnCount(block) !== 3) return false;
  const text = renderTableText(block).replace(/\s+/g, ' ').trim();
  return text.includes('성능부문')
    && text.includes('성능항목')
    && text.includes('성능등급')
    && text.includes('화재')
    && text.includes('소방');
}

function isHwpxTailDisclosureTable(block: TableBlock): boolean {
  if (block.rows.length > 8) return false;
  const text = renderTableText(block).replace(/\s+/g, ' ').trim();
  if (!text) return false;

  return text.includes('감정평가금액')
    || text.includes('분양주택 택지비')
    || (text.includes('항 목') && text.includes('택지비 가산비') && text.includes('건축비가산비'))
    || text.includes('사업주체 및 시공업체')
    || (text.includes('블록') && text.includes('사업주체') && text.includes('시공업체'))
    || text.includes('현장접수처 안내')
    || text.includes('서류접수시 방문처');
}

function isHwpxEligibilitySectionTable(block: TableBlock): boolean {
  const text = renderTableText(block).replace(/\s+/g, ' ').trim();
  return text.includes('Ⅲ 신청자격 및 당첨자 선정방법')
    && text.includes('신혼부부 신청자격')
    && text.includes('입주자 선정방법');
}

function isHwpxGeneralNoticeSectionTable(block: TableBlock): boolean {
  const text = renderTableText(block).replace(/\s+/g, ' ').trim();
  return (text.includes('Ⅷ 기타 유의사항 및 안내사항')
    && text.includes('청약, 당첨, 입주, 관리')
    && text.includes('지구 및 단지 여건'))
    || (text.includes('부대복리시설')
      && text.includes('에어컨 실외기')
      && text.includes('주택성능등급'));
}

function isHwpxTransferRestrictionSectionTable(block: TableBlock): boolean {
  const text = renderTableText(block).replace(/\s+/g, ' ').trim();
  return text.includes('전매제한 및 주택우선매입 안내')
    && text.includes('중복청약 및 당첨 시 처리기준')
    && text.includes('신청일정 및 장소');
}

function isHwpxLotteryContractSectionTable(block: TableBlock): boolean {
  const text = renderTableText(block).replace(/\s+/g, ' ').trim();
  return text.includes('추첨(공공분양 동·호, 당첨자 선정)')
    && text.includes('당첨자(예비입주자) 발표, 서류제출 및 계약체결 일정')
    && text.includes('당첨자(예비입주자) 제출서류');
}

function isHwpxEligibilityHeadingTable(block: TableBlock): boolean {
  if (block.rows.length !== 1) return false;
  const text = renderTableText(block).replace(/\s+/g, ' ').trim();
  return /^[1-3]\.\s*\S+신청자격$/.test(text)
    || text === '4. 입주자 선정방법';
}

function isHwpxBodyContainerTable(block: TableBlock): boolean {
  const text = renderTableText(block).replace(/\s+/g, ' ').trim();
  if (!text) return false;
  const cellCount = block.rows.reduce((sum, row) => sum + row.cells.length, 0);
  const hasNestedTable = block.rows.some((row) => {
    return row.cells.some((cell) => cell.blocks.some((child) => child.type === 'table'));
  });
  const paragraphTexts = block.rows.flatMap((row) => {
    return row.cells.flatMap((cell) => directParagraphText(cell.blocks));
  });
  const longestParagraph = paragraphTexts.reduce((max, paragraph) => Math.max(max, paragraph.length), 0);
  const averageCellText = text.length / Math.max(1, cellCount);

  return hasNestedTable
    || text.length > 500
    || longestParagraph > 180
    || (block.rows.length <= 4 && averageCellText > 120);
}

function directParagraphText(blocks: readonly DocumentBlock[]): string[] {
  return blocks.flatMap((block) => {
    if (block.type === 'paragraph') return [renderParagraphText(block).replace(/\s+/g, ' ').trim()];
    return [];
  }).filter(Boolean);
}

function applyBorderEdges(element: HTMLElement, edges: BorderEdges | undefined): void {
  if (!edges) return;
  if (edges.top) element.style.borderTop = edges.top;
  if (edges.right) element.style.borderRight = edges.right;
  if (edges.bottom) element.style.borderBottom = edges.bottom;
  if (edges.left) element.style.borderLeft = edges.left;
}

function renderImageDom(block: ImageBlock, context: RenderContext): HTMLElement {
  const figure = documentElement('figure', block.inline ? 'hwp-image hwp-image-inline' : 'hwp-image');
  const renderedAsset = context.assetUrls.get(block.assetId);
  const normalizedSize = normalizeImageSize(block, context.availableWidth);
  figure.contentEditable = 'false';
  figure.dataset.inline = block.inline ? 'true' : 'false';
  if (block._hwpxLayout?.source) figure.dataset.layoutSource = block._hwpxLayout.source;
  if (shouldSuppressLhSaleNoticeAnchorImage(block, context)) figure.dataset.suppressedAnchorImage = 'true';
  if (context.locked) figure.dataset.readonlyDecoration = 'true';

  if (renderedAsset) {
    const image = document.createElement('img');
    image.src = renderedAsset.url;
    image.alt = block.altText;
    image.decoding = 'async';
    const { width, height } = normalizedSize;
    if (width) image.style.width = `${width}px`;
    if (height) image.style.height = `${height}px`;
    if (width && height) image.style.aspectRatio = `${width} / ${height}`;
    figure.append(image);
  } else {
    const fallback = documentElement('span', 'hwp-image-missing');
    fallback.textContent = block.altText;
    figure.append(fallback);
  }

  applyPositionedImageLayout(figure, block, block._hwpxLayout, context, normalizedSize);
  return figure;
}

function shouldSuppressLhSaleNoticeAnchorImage(block: ImageBlock, context: RenderContext): boolean {
  return context.sourceFormat === 'hwp'
    && context.documentLayout === 'lh-sale-notice'
    && context.nestingLevel === 0
    && block._hwpxLayout?.source === 'hwp-floating-inline-anchor-image'
    && block._hwpxLayout.allowOverlap === true;
}

function applyPositionedImageLayout(
  figure: HTMLElement,
  block: ImageBlock,
  layout: ImageLayout | undefined,
  context: RenderContext,
  size: { readonly width: number; readonly height: number }
): void {
  const position = layout?.position;
  if (!position) return;

  const renderAsAbsolute = block.inline === false || position.source === 'hwp-flow-after-positioned';
  figure.dataset.layoutPosition = renderAsAbsolute ? 'absolute' : 'inline-offset';
  if (position.source) figure.dataset.layoutSource = position.source;
  if (position.zIndex) figure.style.zIndex = String(position.zIndex);

  if (context.nestingLevel === 0 && renderAsAbsolute) {
    const signedOffset = shouldPreserveSignedPosition(position.source);
    figure.style.position = 'absolute';
    figure.style.left = cssPagePosition('--hwp-margin-left', Math.round(position.leftPx), signedOffset);
    figure.style.top = cssPagePosition(topLevelPositionTopMarginVariable(position, context), Math.round(position.topPx), signedOffset);
    figure.style.margin = '0';
    figure.style.maxWidth = 'none';
    const width = position.widthPx && position.widthPx > 0 ? position.widthPx : size.width;
    const height = position.heightPx && position.heightPx > 0 ? position.heightPx : size.height;
    if (width > 0) figure.style.width = `${Math.round(width)}px`;
    if (height > 0) figure.style.height = `${Math.round(height)}px`;
    return;
  }

  const offsetX = clamp(Math.round(position.leftPx), -MAX_PAGE_WIDTH, MAX_PAGE_WIDTH);
  const offsetY = clamp(Math.round(position.topPx), -MAX_PAGE_HEIGHT, MAX_PAGE_HEIGHT);
  if (offsetX || offsetY) {
    figure.style.position = 'relative';
    figure.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }
}

function applyPageLayout(pageElement: HTMLElement, bodyElement: HTMLElement, layout: PageLayout, bodyWidth: number): void {
  const contentTop = Math.round((layout.margin.top ?? 0) + (layout.decorationInset?.top ?? 0));
  pageElement.style.width = `${layout.width}px`;
  pageElement.style.minHeight = `${layout.height}px`;
  pageElement.style.aspectRatio = `${layout.width} / ${layout.height}`;
  bodyElement.style.minHeight = `${layout.height}px`;
  pageElement.style.setProperty('--hwp-page-width', `${layout.width}px`);
  pageElement.style.setProperty('--hwp-page-height', `${layout.height}px`);
  pageElement.style.setProperty('--hwp-page-ratio', `${layout.width} / ${layout.height}`);
  pageElement.style.setProperty('--hwp-body-width', `${bodyWidth}px`);
  pageElement.style.setProperty('--hwp-margin-top', `${layout.margin.top ?? 0}px`);
  pageElement.style.setProperty('--hwp-margin-right', `${layout.margin.right ?? 0}px`);
  pageElement.style.setProperty('--hwp-margin-bottom', `${layout.margin.bottom ?? 0}px`);
  pageElement.style.setProperty('--hwp-margin-left', `${layout.margin.left ?? 0}px`);
  pageElement.style.setProperty('--hwp-content-top', `${contentTop}px`);
  bodyElement.style.setProperty('--hwp-body-width', `${bodyWidth}px`);
  bodyElement.style.setProperty('--hwp-margin-top', `${layout.margin.top ?? 0}px`);
  bodyElement.style.setProperty('--hwp-margin-right', `${layout.margin.right ?? 0}px`);
  bodyElement.style.setProperty('--hwp-margin-bottom', `${layout.margin.bottom ?? 0}px`);
  bodyElement.style.setProperty('--hwp-margin-left', `${layout.margin.left ?? 0}px`);
  bodyElement.style.setProperty('--hwp-content-top', `${contentTop}px`);
  applyBoxSpacing(bodyElement, layout.margin, 'padding');
  applyDecorationContentInsets(bodyElement, layout);
}

function applyDecorationContentInsets(bodyElement: HTMLElement, layout: PageLayout): void {
  const inset = layout.decorationInset;
  if (!inset) return;

  const topInset = normalizeSpacingValue(inset.top, Math.floor(layout.height * 0.45));
  const bottomInset = normalizeSpacingValue(inset.bottom, Math.floor(layout.height * 0.45));
  if (topInset > 0) {
    bodyElement.style.paddingTop = `${Math.round((layout.margin.top ?? 0) + topInset)}px`;
  }
  if (bottomInset > 0) {
    bodyElement.style.paddingBottom = `${Math.round((layout.margin.bottom ?? 0) + bottomInset)}px`;
  }
}

function applyBoxSpacing(
  element: HTMLElement,
  spacing: BoxSpacing | undefined,
  property: 'padding' | 'margin',
  options: { readonly maxPx?: number; readonly hwpUnitThreshold?: number } = {}
): void {
  if (!spacing) return;
  const maxPx = options.maxPx ?? MAX_PAGE_WIDTH;
  const threshold = options.hwpUnitThreshold ?? Number.POSITIVE_INFINITY;
  if (spacing.top !== undefined) element.style[`${property}Top`] = `${normalizeSpacingValue(spacing.top, maxPx, threshold)}px`;
  if (spacing.right !== undefined) element.style[`${property}Right`] = `${normalizeSpacingValue(spacing.right, maxPx, threshold)}px`;
  if (spacing.bottom !== undefined) element.style[`${property}Bottom`] = `${normalizeSpacingValue(spacing.bottom, maxPx, threshold)}px`;
  if (spacing.left !== undefined) element.style[`${property}Left`] = `${normalizeSpacingValue(spacing.left, maxPx, threshold)}px`;
}

function buildAssetUrlMap(assets: readonly DocumentAsset[]): Map<string, RenderedAssetUrl> {
  const map = new Map<string, RenderedAssetUrl>();
  for (const asset of assets) {
    const bytes = new ArrayBuffer(asset.bytes.byteLength);
    new Uint8Array(bytes).set(asset.bytes);
    const rendered = {
      asset,
      url: URL.createObjectURL(new Blob([bytes], { type: asset.mimeType }))
    };
    map.set(asset.id, rendered);
    if (asset.path) map.set(asset.path, rendered);
  }
  return map;
}

function normalizePageLayout(layout: PageLayout | undefined): { readonly layout: PageLayout; readonly bodyWidth: number } {
  const rawWidth = rawLengthToPx(layout?.width);
  const rawHeight = rawLengthToPx(layout?.height);
  const fallbackWidth = rawHeight ? Math.round(rawHeight * A4_ASPECT_RATIO) : FALLBACK_LAYOUT.width;
  const width = clamp(rawWidth || fallbackWidth, MIN_PAGE_WIDTH, MAX_PAGE_WIDTH);
  const fallbackHeight = Math.round(width / A4_ASPECT_RATIO);
  const height = clamp(rawHeight || fallbackHeight, MIN_PAGE_HEIGHT, MAX_PAGE_HEIGHT);
  const rawMargin = layout?.margin ?? FALLBACK_LAYOUT.margin;
  const rawDecorationInset = layout?.decorationInset;
  const decorationInset = rawDecorationInset
    ? {
        top: normalizeSpacingValue(rawDecorationInset.top, Math.floor(height * 0.45)),
        bottom: normalizeSpacingValue(rawDecorationInset.bottom, Math.floor(height * 0.45))
      }
    : undefined;
  const margin = {
    top: normalizeSpacingValue(rawMargin.top, Math.floor(height * 0.45)),
    right: normalizeSpacingValue(rawMargin.right, Math.floor(width * 0.45)),
    bottom: normalizeSpacingValue(rawMargin.bottom, Math.floor(height * 0.45)),
    left: normalizeSpacingValue(rawMargin.left, Math.floor(width * 0.45))
  };
  fitOpposingSpacing(margin, 'left', 'right', Math.max(0, width - MIN_BODY_WIDTH));
  fitOpposingSpacing(margin, 'top', 'bottom', Math.max(0, height - MIN_BODY_WIDTH));
  const bodyWidth = Math.max(MIN_BODY_WIDTH, width - margin.left - margin.right);

  return {
    layout: {
      width,
      height,
      margin,
      ...(decorationInset ? { decorationInset } : {})
    },
    bodyWidth
  };
}

function resolveTableWidth(block: TableBlock, availableWidth: number): number {
  const explicit = normalizeCssLength(block.width, availableWidth);
  if (explicit >= MIN_TABLE_WIDTH) return explicit;

  const columnWidth = block.columnWidths
    ?.map(rawLengthToPx)
    .reduce((sum, width) => sum + width, 0) ?? 0;
  if (columnWidth >= MIN_TABLE_WIDTH) return clamp(columnWidth, MIN_TABLE_WIDTH, availableWidth);

  return Math.max(MIN_TABLE_WIDTH, availableWidth);
}

function normalizeColumnWidths(widths: readonly number[] | undefined, columnCount: number): number[] {
  if (columnCount <= 0) return [];
  const positive = Array.from({ length: columnCount }, (_, index) => {
    const width = widths?.[index] ?? 0;
    return Number.isFinite(width) && width > 0 ? width : 0;
  });
  const knownWidths = positive.filter((width) => width > 0);
  const fallback = knownWidths.length
    ? knownWidths.reduce((sum, width) => sum + width, 0) / knownWidths.length
    : 1;
  const filled = positive.map((width) => width > 0 ? width : fallback);
  const total = filled.reduce((sum, width) => sum + width, 0) || filled.length;
  return filled.map((width) => (width / total) * 100);
}

function tableColumnCount(block: TableBlock): number {
  const rowColumnCount = block.rows.reduce((max, row) => {
    const count = row.cells.reduce((sum, cell) => sum + Math.max(1, cell.colSpan), 0);
    return Math.max(max, count);
  }, 0);
  return Math.max(1, block.columnWidths?.length ?? 0, rowColumnCount);
}

function columnSpanWidth(widths: readonly number[], startIndex: number, span: number, tableWidth: number): number {
  const fallbackWidth = widths.length ? 100 / widths.length : 100;
  let percent = 0;
  for (let index = startIndex; index < startIndex + span; index += 1) {
    percent += widths[index] ?? fallbackWidth;
  }
  return clamp(Math.round((tableWidth * percent) / 100), MIN_TABLE_WIDTH, tableWidth);
}

function rawLengthToPx(value: number | undefined): number {
  if (!Number.isFinite(value) || Number(value) <= 0) return 0;
  const numeric = Number(value);
  return Math.round(numeric > 5000 ? numeric / HWPUNIT_PER_PX : numeric);
}

function hwpUnitToPx(value: number | undefined): number {
  if (!Number.isFinite(value) || Number(value) <= 0) return 0;
  return Math.round(Number(value) / HWPUNIT_PER_PX);
}

function cssPagePosition(marginVariable: string, offsetPx: number, allowNegative = false): string {
  const px = allowNegative ? Math.round(offsetPx) : Math.max(0, Math.round(offsetPx));
  return `calc(var(${marginVariable}, 0px) + ${px}px)`;
}

function shouldPreserveSignedPosition(source: string | undefined): boolean {
  return source === 'hwp-object-common' || source === 'hwp-picture-object-common';
}

function isTopAndBottomTextWrap(value: string | undefined): boolean {
  const normalized = value?.trim().replace(/_/g, '-').toLowerCase();
  return normalized === 'top-and-bottom';
}

function normalizeCssLength(value: number | undefined, maxPx: number): number {
  const px = rawLengthToPx(value);
  return px > 0 ? clamp(px, 1, maxPx) : 0;
}

function normalizeCssLengthExact(value: number | undefined, maxPx: number): number {
  const px = rawLengthToCssPx(value);
  return px > 0 ? clamp(px, 1, maxPx) : 0;
}

function rawLengthToCssPx(value: number | undefined): number {
  if (!Number.isFinite(value) || Number(value) <= 0) return 0;
  const numeric = Number(value);
  return numeric > 5000 ? numeric / HWPUNIT_PER_PX : numeric;
}

function formatDataNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatCssPx(value: number): string {
  return `${formatDataNumber(value)}px`;
}

function normalizeImageSize(block: ImageBlock, availableWidth: number): { readonly width: number; readonly height: number } {
  let width = rawLengthToPx(block.width);
  let height = rawLengthToPx(block.height);

  if (width > 0 && height > 0) {
    const scale = Math.min(1, availableWidth / width, MAX_PAGE_HEIGHT / height);
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale))
    };
  }

  width = width > 0 ? clamp(width, 1, availableWidth) : 0;
  height = height > 0 ? clamp(height, 1, MAX_PAGE_HEIGHT) : 0;
  return { width, height };
}

function normalizeLineHeight(value: string | undefined): string {
  const lineHeight = value?.trim();
  if (!lineHeight) return '';
  if (/^\d+(\.\d+)?$/.test(lineHeight)) {
    return String(clamp(Number(lineHeight), 0.8, 3));
  }
  if (/^\d+(\.\d+)?%$/.test(lineHeight)) {
    return `${clamp(Number(lineHeight.slice(0, -1)), 80, 300)}%`;
  }
  if (/^\d+(\.\d+)?(px|pt|em|rem)$/.test(lineHeight)) return lineHeight;
  return '';
}

function normalizeLetterSpacing(value: string | undefined): string {
  const spacing = value?.trim();
  if (!spacing) return '';
  if (/^-?\d+(\.\d+)?%$/.test(spacing)) {
    const percent = Number(spacing.slice(0, -1));
    if (!Number.isFinite(percent) || percent === 0) return '';
    return `${clamp(percent / 100, -0.5, 0.5)}em`;
  }
  if (/^-?\d+(\.\d+)?$/.test(spacing)) {
    const numeric = Number(spacing);
    if (!Number.isFinite(numeric) || numeric === 0) return '';
    return `${clamp(numeric / 100, -0.5, 0.5)}em`;
  }
  if (/^-?\d+(\.\d+)?(px|pt|em|rem)$/.test(spacing)) return spacing;
  return '';
}

function normalizeParagraphTextIndent(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return clamp(Math.round(Number(value)), -220, 320);
}

function cssPixelLength(value: string | undefined): number {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value?.trim() ?? '');
  return match ? Number(match[1]) : 0;
}

function normalizeSpacingValue(value: number | undefined, maxPx: number, hwpUnitThreshold = Number.POSITIVE_INFINITY): number {
  if (!Number.isFinite(value)) return 0;
  const numeric = Number(value);
  const px = numeric > hwpUnitThreshold ? numeric / HWPUNIT_PER_PX : numeric;
  return clamp(Math.round(px), 0, maxPx);
}

function fitOpposingSpacing<T extends 'left' | 'right' | 'top' | 'bottom'>(
  spacing: Record<T, number>,
  first: T,
  second: T,
  maxTotal: number
): void {
  const total = spacing[first] + spacing[second];
  if (total <= maxTotal || total <= 0) return;
  const scale = maxTotal / total;
  spacing[first] = Math.floor(spacing[first] * scale);
  spacing[second] = Math.floor(spacing[second] * scale);
}

function renderEmptyParagraphDom(align?: ParagraphBlock['align'], locked = false): HTMLElement {
  const paragraph = documentElement('p', 'hwp-paragraph hwp-paragraph-empty');
  if (locked) setReadOnlyDecorationHost(paragraph);
  else setEditableTextHost(paragraph);
  if (align) paragraph.style.textAlign = align;
  markEmptyParagraph(paragraph);
  return paragraph;
}

function setEditableTextHost(element: HTMLElement): void {
  element.contentEditable = 'plaintext-only';
  element.spellcheck = false;
  element.setAttribute('role', 'textbox');
  element.setAttribute('aria-multiline', 'true');
}

function setReadOnlyDecorationHost(element: HTMLElement): void {
  element.contentEditable = 'false';
  element.spellcheck = false;
  element.dataset.readonlyDecoration = 'true';
}

function markEmptyParagraph(paragraph: HTMLElement): void {
  paragraph.classList.add('hwp-paragraph-empty');
  paragraph.dataset.empty = 'true';
  paragraph.append(document.createElement('br'));
}

function isEmptyCell(cell: TableCell): boolean {
  return cell.blocks.every((block) => {
    if (block.type !== 'paragraph') return false;
    return block.runs.every((run) => run.text.trim().length === 0);
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function documentElement<K extends keyof HTMLElementTagNameMap>(tagName: K, className: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  element.className = className;
  return element;
}

function normalizeSafeHref(value: string | undefined): string | undefined {
  const href = value?.trim();
  if (!href || /[\u0000-\u001f\u007f]/.test(href)) return undefined;
  if (/^javascript:/i.test(href)) return undefined;
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  if (/^www\./i.test(href)) return `https://${href}`;
  return undefined;
}

function quoteFontFamily(fontFamily: string): string {
  const cleanFamily = fontFamily.replace(/["\\]/g, '').trim();
  if (!cleanFamily) return koreanSerifFallback();
  const primary = cleanFamily.includes(' ') ? `"${cleanFamily}"` : cleanFamily;
  return `${primary}, ${fallbackForKoreanFont(cleanFamily)}`;
}

function fallbackForKoreanFont(fontFamily: string): string {
  const normalized = fontFamily.toLowerCase();
  if (
    normalized.includes('gothic')
    || normalized.includes('gulim')
    || normalized.includes('dotum')
    || normalized.includes('고딕')
    || normalized.includes('굴림')
    || normalized.includes('돋움')
    || normalized.includes('headline')
  ) {
    return '"Malgun Gothic", "Apple SD Gothic Neo", NanumGothic, sans-serif';
  }
  return koreanSerifFallback();
}

function koreanSerifFallback(): string {
  return '"HCR Batang", "함초롬바탕", "한컴바탕", "바탕", "한양신명조", "휴먼명조", AppleMyungjo, NanumMyeongjo, PCMyungjo, "Noto Serif KR", serif';
}
