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
  readonly nestingLevel: number;
  readonly locked?: boolean;
}

type ParagraphLayout = NonNullable<ParagraphBlock['_hwpxLayout']>;
type ParagraphLineSegment = NonNullable<ParagraphLayout['lineSegments']>[number];
type ImageLayout = NonNullable<ImageBlock['_hwpxLayout']>;

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
    const context: RenderContext = {
      assetUrls,
      availableWidth: bodyWidth,
      nestingLevel: 0
    };

    pageElement.dataset.pageIndex = String(page.index);
    pageElement.dataset.sourceFormat = document.format;
    pageElement.setAttribute('aria-label', `${page.index + 1}쪽`);
    applyPageLayout(pageElement, bodyElement, layout, bodyWidth);

    for (const block of page.blocks) {
      bodyElement.append(renderBlockDom(block, withBlockRenderMode(block, context)));
    }
    if (!bodyElement.childNodes.length) bodyElement.append(renderEmptyParagraphDom());

    pageElement.append(bodyElement);
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

function withBlockRenderMode(block: DocumentBlock, context: RenderContext): RenderContext {
  return isReadOnlyDecorationBlock(block) && !context.locked
    ? { ...context, locked: true }
    : context;
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
  applyHwpParagraphPosition(paragraph, layout, context);
  if (renderDecorationRule(paragraph, layout)) return paragraph;
  if (layout?.heightPx && layout.heightPx > 0) {
    paragraph.dataset.layoutHeight = String(Math.round(layout.heightPx));
    paragraph.style.minHeight = `${Math.round(layout.heightPx)}px`;
    if (!block.margin) paragraph.style.margin = '0';
  }
  const lineHeight = normalizeLineHeight(block.lineHeight);
  if (lineHeight) paragraph.style.lineHeight = lineHeight;

  if (!renderLineSegmentParagraphDom(paragraph, block, layout)) {
    for (const run of block.runs) {
      if (run.text.length > 0) paragraph.append(renderRunDom(run));
    }
  }
  if (!paragraph.childNodes.length) markEmptyParagraph(paragraph);
  return paragraph;
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
  const span = documentElement('span', 'hwp-run');
  span.textContent = run.text;
  if (run.fontFamily) span.style.fontFamily = quoteFontFamily(run.fontFamily);
  if (run.fontSizePt) span.style.fontSize = `${run.fontSizePt}pt`;
  if (run.color) span.style.color = run.color;
  if (run.backgroundColor) span.style.backgroundColor = run.backgroundColor;
  if (run.bold) span.style.fontWeight = '700';
  if (run.italic) span.style.fontStyle = 'italic';
  if (run.letterSpacing) span.style.letterSpacing = run.letterSpacing;
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
    paragraph.style.top = cssPagePosition('--hwp-margin-top', Math.round(position.topPx), signedOffset);
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
  layout: ParagraphLayout | undefined
): boolean {
  const slices = buildParagraphLineSlices(block, layout);
  if (!slices.length) return false;

  paragraph.dataset.layoutMode = 'line-segments';
  paragraph.style.whiteSpace = 'normal';

  for (const slice of slices) {
    const line = documentElement('span', 'hwp-line-segment');
    line.dataset.textPosition = String(slice.start);
    line.dataset.textEnd = String(slice.end);
    applyLineSegmentMetrics(line, slice.segment);
    appendRunsInTextRange(line, block.runs, slice.start, slice.end);
    if (!line.childNodes.length) line.append(document.createElement('br'));
    paragraph.append(line);
  }

  return true;
}

function buildParagraphLineSlices(
  block: ParagraphBlock,
  layout: ParagraphLayout | undefined
): ParagraphLineSlice[] {
  const totalLength = textRunsLength(block.runs);
  if (!layout?.lineSegments?.length || totalLength <= 0) return [];

  const segments = normalizeParagraphLineSegments(layout.lineSegments, totalLength);
  if (segments.length === 1) {
    const [entry] = segments;
    return shouldRenderSingleLineSegment(entry.segment)
      ? [{ segment: entry.segment, start: 0, end: totalLength }]
      : [];
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

  return slices.length > 1 ? slices : [];
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

function applyLineSegmentMetrics(line: HTMLElement, segment: ParagraphLineSegment): void {
  const height = clamp(Math.round(segment.heightPx), 1, 240);
  const left = hwpUnitToPx(segment.horizontalPosition);
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
  const columnCount = tableColumnCount(block);
  const normalizedWidths = normalizeColumnWidths(block.columnWidths, columnCount);
  const positionedWidth = layout?.position?.widthPx;
  const tableWidth = positionedWidth && positionedWidth > 0
    ? clamp(positionedWidth, MIN_TABLE_WIDTH, MAX_PAGE_WIDTH)
    : resolveTableWidth(block, context.availableWidth);

  if (context.locked) setReadOnlyDecorationHost(wrapper);
  if (context.nestingLevel > 0) wrapper.classList.add('hwp-table-wrap-nested');
  wrapper.dataset.nestingLevel = String(context.nestingLevel);
  wrapper.style.width = `${tableWidth}px`;
  wrapper.style.maxWidth = '100%';
  applyPositionedTableLayout(wrapper, layout, context);

  table.dataset.nestingLevel = String(context.nestingLevel);
  table.style.width = '100%';
  if (context.locked) {
    table.contentEditable = 'false';
    table.dataset.readonlyDecoration = 'true';
  }
  const renderHeight = layout?.renderHeightPx ?? layout?.heightPx;
  if (renderHeight && renderHeight > 0) {
    wrapper.dataset.layoutHeight = String(Math.round(renderHeight));
    wrapper.style.minHeight = `${Math.round(renderHeight)}px`;
    table.style.height = `${Math.round(renderHeight)}px`;
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
      rowElement.dataset.layoutHeight = String(Math.round(rowHeight));
      rowElement.style.height = `${Math.round(rowHeight)}px`;
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
  const position = layout?.position;
  if (context.nestingLevel > 0 || !position) return;
  const signedOffset = shouldPreserveSignedPosition(position.source);
  wrapper.dataset.layoutPosition = 'absolute';
  wrapper.style.position = 'absolute';
  wrapper.style.left = cssPagePosition('--hwp-margin-left', Math.round(position.leftPx), signedOffset);
  wrapper.style.top = cssPagePosition('--hwp-margin-top', Math.round(position.topPx), signedOffset);
  wrapper.style.margin = '0';
  wrapper.style.maxWidth = 'none';
  if (position.widthPx && position.widthPx > 0) wrapper.style.width = `${Math.round(position.widthPx)}px`;
  if (position.heightPx && position.heightPx > 0) wrapper.style.minHeight = `${Math.round(position.heightPx)}px`;
  if (position.zIndex) wrapper.style.zIndex = String(position.zIndex);
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
  const height = normalizeCssLength(cell._hwpxLayout?.renderHeightPx ?? cell.height, MAX_CELL_HEIGHT);
  if (width) cellElement.style.width = `${width}px`;
  if (height) {
    cellElement.dataset.layoutHeight = String(Math.round(height));
    cellElement.style.height = `${height}px`;
  }
  if (cell.verticalAlign) cellElement.style.verticalAlign = cell.verticalAlign;
  if (cell.align) cellElement.style.textAlign = cell.align;
  if (cell.border) cellElement.style.border = cell.border;
  applyBorderEdges(cellElement, cell.borderEdges);
  if (cell.background) cellElement.style.background = cell.background;
  applyBoxSpacing(cellElement, cell.padding, 'padding', { maxPx: 80, hwpUnitThreshold: 48 });

  const contentHost = documentElement('div', 'hwp-table-cell-content');
  if (height) {
    contentHost.style.maxHeight = `${height}px`;
    contentHost.style.overflow = 'hidden';
  }

  const childContext: RenderContext = {
    ...context,
    availableWidth: Math.max(MIN_TABLE_WIDTH, width || context.availableWidth)
  };
  for (const block of cell.blocks) contentHost.append(renderBlockDom(block, childContext));
  if (!contentHost.childNodes.length) contentHost.append(renderEmptyParagraphDom(cell.align, context.locked));
  cellElement.append(contentHost);
  return cellElement;
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

function applyPositionedImageLayout(
  figure: HTMLElement,
  block: ImageBlock,
  layout: ImageLayout | undefined,
  context: RenderContext,
  size: { readonly width: number; readonly height: number }
): void {
  const position = layout?.position;
  if (!position) return;

  figure.dataset.layoutPosition = block.inline === false ? 'absolute' : 'inline-offset';
  if (position.zIndex) figure.style.zIndex = String(position.zIndex);

  if (context.nestingLevel === 0 && block.inline === false) {
    const signedOffset = shouldPreserveSignedPosition(position.source);
    figure.style.position = 'absolute';
    figure.style.left = cssPagePosition('--hwp-margin-left', Math.round(position.leftPx), signedOffset);
    figure.style.top = cssPagePosition('--hwp-margin-top', Math.round(position.topPx), signedOffset);
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
  pageElement.style.width = `${layout.width}px`;
  pageElement.style.minHeight = `${layout.height}px`;
  pageElement.style.aspectRatio = `${layout.width} / ${layout.height}`;
  bodyElement.style.minHeight = `${layout.height}px`;
  pageElement.style.setProperty('--hwp-page-width', `${layout.width}px`);
  pageElement.style.setProperty('--hwp-page-height', `${layout.height}px`);
  pageElement.style.setProperty('--hwp-page-ratio', `${layout.width} / ${layout.height}`);
  bodyElement.style.setProperty('--hwp-body-width', `${bodyWidth}px`);
  bodyElement.style.setProperty('--hwp-margin-top', `${layout.margin.top ?? 0}px`);
  bodyElement.style.setProperty('--hwp-margin-right', `${layout.margin.right ?? 0}px`);
  bodyElement.style.setProperty('--hwp-margin-bottom', `${layout.margin.bottom ?? 0}px`);
  bodyElement.style.setProperty('--hwp-margin-left', `${layout.margin.left ?? 0}px`);
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
      ...(rawDecorationInset
        ? {
            decorationInset: {
              top: normalizeSpacingValue(rawDecorationInset.top, Math.floor(height * 0.45)),
              bottom: normalizeSpacingValue(rawDecorationInset.bottom, Math.floor(height * 0.45))
            }
          }
        : {})
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

function normalizeCssLength(value: number | undefined, maxPx: number): number {
  const px = rawLengthToPx(value);
  return px > 0 ? clamp(px, 1, maxPx) : 0;
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
