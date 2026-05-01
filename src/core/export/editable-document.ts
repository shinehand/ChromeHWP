export interface EditableExportDocument {
  readonly title: string;
  readonly pages: EditablePage[];
}

export interface EditablePage {
  readonly index: number;
  readonly blocks: EditableBlock[];
  readonly layout?: EditablePageLayout;
}

export interface EditablePageLayout {
  readonly width: number;
  readonly height: number;
  readonly margin?: EditableBoxSpacing;
}

export type EditableBlock = EditableParagraphBlock | EditableTableBlock | EditableImageBlock;

export interface EditableParagraphBlock {
  readonly type: 'paragraph';
  readonly runs: EditableTextRun[];
  readonly align?: EditableTextAlign;
  readonly lineHeight?: string;
}

export interface EditableTextRun {
  readonly text: string;
  readonly fontFamily?: string;
  readonly fontSizePt?: number;
  readonly color?: string;
  readonly backgroundColor?: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly strike?: boolean;
}

export interface EditableTableBlock {
  readonly type: 'table';
  readonly rows: EditableTableRow[];
  readonly width?: number;
  readonly columnWidths?: number[];
  readonly border?: string;
  readonly background?: string;
}

export interface EditableTableRow {
  readonly cells: EditableTableCell[];
}

export interface EditableTableCell {
  readonly blocks: EditableBlock[];
  readonly colSpan: number;
  readonly rowSpan: number;
  readonly width?: number;
  readonly height?: number;
  readonly padding?: EditableBoxSpacing;
  readonly align?: EditableTextAlign;
  readonly verticalAlign?: EditableVerticalAlign;
  readonly border?: string;
  readonly background?: string;
}

export interface EditableImageBlock {
  readonly type: 'image';
  readonly altText: string;
  readonly src?: string;
  readonly width?: number;
  readonly height?: number;
  readonly inline?: boolean;
}

export type EditableTextAlign = 'left' | 'center' | 'right' | 'justify';
export type EditableVerticalAlign = 'top' | 'middle' | 'bottom';

export interface EditableBoxSpacing {
  readonly top?: number;
  readonly right?: number;
  readonly bottom?: number;
  readonly left?: number;
}

type EditableInlineStyle = Omit<EditableTextRun, 'text'>;
type MutableEditableInlineStyle = {
  -readonly [Key in keyof EditableInlineStyle]: EditableInlineStyle[Key];
};

const READONLY_DECORATION_SELECTOR = '[data-readonly-decoration="true"]';

export function extractEditableDocumentFromDom(root: HTMLElement, title: string): EditableExportDocument {
  const pageBodies = Array.from(root.querySelectorAll<HTMLElement>('.hwp-page-body'));
  const pageContainers = pageBodies.length ? pageBodies : [root];
  const pages = pageContainers.map((container, index) => ({
    index,
    layout: extractPageLayout(container),
    blocks: extractBlockChildren(container)
  }));

  return {
    title,
    pages: pages.length ? pages : [{ index: 0, blocks: [] }]
  };
}

function extractPageLayout(container: HTMLElement): EditablePageLayout | undefined {
  const pageElement = container.closest<HTMLElement>('.hwp-page');
  if (!pageElement) return undefined;

  const width = readPixelLength(pageElement, 'width');
  const height = cssLengthToPx(pageElement.style.minHeight) || readPixelLength(pageElement, 'height');
  if (!width || !height) return undefined;

  return {
    width,
    height,
    margin: readPageMarginVariables(container) ?? readBoxSpacing(container, 'padding')
  };
}

function readPageMarginVariables(container: HTMLElement): EditableBoxSpacing | undefined {
  const spacing: EditableBoxSpacing = {
    top: cssLengthToPx(container.style.getPropertyValue('--hwp-margin-top')),
    right: cssLengthToPx(container.style.getPropertyValue('--hwp-margin-right')),
    bottom: cssLengthToPx(container.style.getPropertyValue('--hwp-margin-bottom')),
    left: cssLengthToPx(container.style.getPropertyValue('--hwp-margin-left'))
  };
  return spacing.top || spacing.right || spacing.bottom || spacing.left ? spacing : undefined;
}

function extractBlockChildren(container: HTMLElement): EditableBlock[] {
  if (isReadonlyDecorationElement(container)) return [];

  const blocks: EditableBlock[] = [];

  for (const node of Array.from(container.childNodes)) {
    const block = extractBlockNode(node);
    if (Array.isArray(block)) {
      blocks.push(...block);
    } else if (block) {
      blocks.push(block);
    }
  }

  if (!blocks.length) {
    const text = normalizePlainText(container.textContent || '');
    if (text) blocks.push({ type: 'paragraph', runs: [{ text }] });
  }

  return blocks;
}

function extractBlockNode(node: ChildNode): EditableBlock | EditableBlock[] | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = normalizePlainText(node.textContent || '');
    return text ? { type: 'paragraph', runs: [{ text }] } : null;
  }

  if (!(node instanceof HTMLElement)) return null;
  if (isReadonlyDecorationElement(node)) return null;
  if (node.matches('br')) return { type: 'paragraph', runs: [{ text: '' }] };
  if (node.matches('.hwp-table-wrap')) {
    const table = node.querySelector<HTMLTableElement>(':scope > table, table');
    return table ? extractTableBlock(table, node) : null;
  }
  if (node.matches('table, .hwp-table')) return extractTableBlock(node as HTMLTableElement);
  if (node.matches('figure, .hwp-image, img')) return extractImageBlock(node);
  if (node.matches('p, h1, h2, h3, h4, h5, h6, .hwp-paragraph')) return extractParagraphBlock(node);

  const nestedBlocks = extractDirectNestedBlocks(node);
  if (nestedBlocks.length) return nestedBlocks;

  const text = normalizePlainText(node.textContent || '');
  return text ? { type: 'paragraph', runs: [{ text }] } : null;
}

function extractDirectNestedBlocks(element: HTMLElement): EditableBlock[] {
  const blocks: EditableBlock[] = [];
  for (const child of Array.from(element.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (isReadonlyDecorationElement(child)) continue;
    if (!child.matches('table, .hwp-table, .hwp-table-wrap, figure, .hwp-image, img, p, h1, h2, h3, h4, h5, h6, .hwp-paragraph')) {
      continue;
    }

    const block = extractBlockNode(child);
    if (Array.isArray(block)) {
      blocks.push(...block);
    } else if (block) {
      blocks.push(block);
    }
  }
  return blocks;
}

function isReadonlyDecorationElement(element: HTMLElement): boolean {
  return element.matches(READONLY_DECORATION_SELECTOR)
    || Boolean(element.closest(READONLY_DECORATION_SELECTOR));
}

function extractParagraphBlock(element: HTMLElement): EditableParagraphBlock {
  const style = readElementStyle(element);
  const runs = mergeAdjacentRuns(extractTextRuns(element, style.text));
  return {
    type: 'paragraph',
    align: normalizeTextAlign(style.textAlign),
    lineHeight: style.lineHeight,
    runs: runs.length ? runs : [{ text: '' }]
  };
}

function extractTextRuns(node: Node, inheritedStyle: EditableInlineStyle): EditableTextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    return text ? [{ ...inheritedStyle, text }] : [];
  }

  if (!(node instanceof HTMLElement)) return [];
  if (node.matches('br')) return [{ ...inheritedStyle, text: '\n' }];
  if (node.matches('img')) {
    const altText = readImageAlt(node as HTMLImageElement);
    return altText ? [{ ...inheritedStyle, text: altText }] : [];
  }

  const style = { ...inheritedStyle, ...readElementStyle(node).text };
  return Array.from(node.childNodes).flatMap((child) => extractTextRuns(child, style));
}

function extractTableBlock(table: HTMLTableElement, wrapper?: HTMLElement): EditableTableBlock {
  const style = readElementStyle(table);
  const widthSource = wrapper ?? table;
  const width = readPixelLength(widthSource, 'width') || readPixelLength(table, 'width');
  const columnWidths = readColumnWidths(table, width);
  const rows = Array.from(table.rows).map((row) => ({
    cells: Array.from(row.cells).map(extractTableCell)
  })).filter((row) => row.cells.length > 0);

  return {
    type: 'table',
    width,
    columnWidths: columnWidths.length ? columnWidths : undefined,
    border: style.border,
    background: style.background,
    rows
  };
}

function extractTableCell(cell: HTMLTableCellElement): EditableTableCell {
  const style = readElementStyle(cell);
  const blocks = extractBlockChildren(cell);
  return {
    blocks: blocks.length ? blocks : [{ type: 'paragraph', runs: [{ text: '' }] }],
    colSpan: Math.max(1, cell.colSpan || 1),
    rowSpan: Math.max(1, cell.rowSpan || 1),
    width: readPixelLength(cell, 'width'),
    height: readPixelLength(cell, 'height'),
    padding: readBoxSpacing(cell, 'padding'),
    align: normalizeTextAlign(style.textAlign),
    verticalAlign: normalizeVerticalAlign(style.verticalAlign),
    border: style.border,
    background: style.background
  };
}

function extractImageBlock(element: HTMLElement): EditableImageBlock {
  const image = element.matches('img') ? element as HTMLImageElement : element.querySelector<HTMLImageElement>('img');
  if (!image) {
    return {
      type: 'image',
      altText: normalizePlainText(element.textContent || '이미지')
    };
  }

  return {
    type: 'image',
    altText: readImageAlt(image),
    src: image.currentSrc || image.src || image.getAttribute('src') || undefined,
    width: readPixelLength(image, 'width') || positiveNumber(image.width),
    height: readPixelLength(image, 'height') || positiveNumber(image.height),
    inline: element.classList.contains('hwp-image-inline')
  };
}

function readElementStyle(element: HTMLElement): {
  readonly text: EditableInlineStyle;
  readonly textAlign: string;
  readonly verticalAlign: string;
  readonly lineHeight?: string;
  readonly border?: string;
  readonly background?: string;
} {
  const computed = safeComputedStyle(element);
  return {
    text: readTextStyle(element, computed),
    textAlign: element.style.textAlign || computed?.textAlign || '',
    verticalAlign: element.style.verticalAlign || computed?.verticalAlign || '',
    lineHeight: normalizeLineHeight(element.style.lineHeight || computed?.lineHeight || ''),
    border: readBorderStyle(element, computed),
    background: readBackgroundColor(element, computed)
  };
}

function readTextStyle(element: HTMLElement, computed: CSSStyleDeclaration | undefined): EditableInlineStyle {
  const style: MutableEditableInlineStyle = {};
  const fontFamily = cleanFontFamily(element.style.fontFamily || computed?.fontFamily || '');
  const fontSizePt = cssLengthToPt(element.style.fontSize || computed?.fontSize || '');
  const color = element.style.color || computed?.color || '';
  const backgroundColor = readBackgroundColor(element, computed);
  const decoration = element.style.textDecorationLine
    || element.style.textDecoration
    || computed?.textDecorationLine
    || computed?.textDecoration
    || '';
  const fontWeight = element.style.fontWeight || computed?.fontWeight || '';
  const fontStyle = element.style.fontStyle || computed?.fontStyle || '';

  if (fontFamily) style.fontFamily = fontFamily;
  if (fontSizePt) style.fontSizePt = fontSizePt;
  if (color) style.color = color;
  if (backgroundColor) style.backgroundColor = backgroundColor;
  if (fontWeight === 'bold' || Number(fontWeight) >= 600) style.bold = true;
  if (fontStyle === 'italic') style.italic = true;
  if (decoration.includes('underline')) style.underline = true;
  if (decoration.includes('line-through')) style.strike = true;
  return style;
}

function mergeAdjacentRuns(runs: EditableTextRun[]): EditableTextRun[] {
  const merged: EditableTextRun[] = [];
  for (const run of runs) {
    if (!run.text) continue;
    const previous = merged[merged.length - 1];
    if (previous && sameRunStyle(previous, run)) {
      merged[merged.length - 1] = { ...previous, text: previous.text + run.text };
    } else {
      merged.push(run);
    }
  }
  return merged;
}

function sameRunStyle(left: EditableTextRun, right: EditableTextRun): boolean {
  return left.fontFamily === right.fontFamily
    && left.fontSizePt === right.fontSizePt
    && left.color === right.color
    && left.backgroundColor === right.backgroundColor
    && left.bold === right.bold
    && left.italic === right.italic
    && left.underline === right.underline
    && left.strike === right.strike;
}

function normalizePlainText(text: string): string {
  return text.replace(/\u00a0/g, ' ');
}

function normalizeTextAlign(value: string): EditableTextAlign | undefined {
  const normalized = value.toLowerCase();
  if (normalized === 'center') return 'center';
  if (normalized === 'right') return 'right';
  if (normalized === 'justify') return 'justify';
  if (normalized === 'left') return 'left';
  return undefined;
}

function normalizeVerticalAlign(value: string): EditableVerticalAlign | undefined {
  const normalized = value.toLowerCase();
  if (normalized === 'middle') return 'middle';
  if (normalized === 'bottom') return 'bottom';
  if (normalized === 'top') return 'top';
  return undefined;
}

function cleanFontFamily(value: string): string {
  return value.split(',')[0]?.trim().replace(/^["']|["']$/g, '') || '';
}

function normalizeLineHeight(value: string): string | undefined {
  if (!value || value === 'normal') return undefined;
  if (value.endsWith('px')) {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) && numeric > 0 ? `${Math.round(numeric)}px` : undefined;
  }
  return value;
}

function cssLengthToPt(value: string): number | undefined {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  if (value.endsWith('px')) return roundOneDecimal(numeric * 0.75);
  if (value.endsWith('pt')) return roundOneDecimal(numeric);
  return undefined;
}

function readPixelLength(element: HTMLElement, property: 'width' | 'height'): number | undefined {
  const styleValue = element.style[property];
  const stylePixels = cssLengthToPx(styleValue);
  if (stylePixels) return stylePixels;

  const attributePixels = cssLengthToPx(element.getAttribute(property) || '');
  if (attributePixels) return attributePixels;

  const rect = element.getBoundingClientRect();
  return positiveNumber(property === 'width' ? rect.width : rect.height);
}

function cssLengthToPx(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed || trimmed.endsWith('%') || trimmed === 'auto') return undefined;
  const numeric = Number.parseFloat(trimmed);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  if (trimmed.endsWith('pt')) return Math.round(numeric / 0.75);
  if (trimmed.endsWith('px') || /^[\d.]+$/.test(trimmed)) return Math.round(numeric);
  if (trimmed.endsWith('mm')) return Math.round(numeric * 3.78);
  return Math.round(numeric);
}

function readColumnWidths(table: HTMLTableElement, tableWidth: number | undefined): number[] {
  const colgroupWidths = Array.from(table.querySelectorAll<HTMLTableColElement>(':scope > colgroup > col'))
    .map((col) => readColumnWidth(col, tableWidth));
  if (colgroupWidths.some((width) => width > 0)) return colgroupWidths;

  const firstRow = table.rows[0];
  if (!firstRow) return [];
  const widths: number[] = [];
  for (const cell of Array.from(firstRow.cells)) {
    const cellWidth = readPixelLength(cell, 'width') || 0;
    const span = Math.max(1, cell.colSpan || 1);
    const perColumn = span > 1 ? Math.round(cellWidth / span) : cellWidth;
    for (let index = 0; index < span; index += 1) widths.push(perColumn);
  }
  return widths.filter((width) => width > 0);
}

function readColumnWidth(col: HTMLTableColElement, tableWidth: number | undefined): number {
  const rawWidth = col.style.width || col.getAttribute('width') || '';
  const px = cssLengthToPx(rawWidth);
  if (px) return px;

  const percent = parsePercent(rawWidth);
  if (percent && tableWidth) return Math.round((tableWidth * percent) / 100);
  return 0;
}

function parsePercent(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed.endsWith('%')) return undefined;
  const numeric = Number.parseFloat(trimmed);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function readBoxSpacing(element: HTMLElement, property: 'padding'): EditableBoxSpacing | undefined {
  const computed = safeComputedStyle(element);
  const spacing: EditableBoxSpacing = {
    top: cssLengthToPx(element.style[`${property}Top`] || computed?.[`${property}Top`] || ''),
    right: cssLengthToPx(element.style[`${property}Right`] || computed?.[`${property}Right`] || ''),
    bottom: cssLengthToPx(element.style[`${property}Bottom`] || computed?.[`${property}Bottom`] || ''),
    left: cssLengthToPx(element.style[`${property}Left`] || computed?.[`${property}Left`] || '')
  };
  return spacing.top || spacing.right || spacing.bottom || spacing.left ? spacing : undefined;
}

function readBorderStyle(element: HTMLElement, computed: CSSStyleDeclaration | undefined): string | undefined {
  const width = cssLengthToPx(element.style.borderTopWidth || computed?.borderTopWidth || '');
  const style = element.style.borderTopStyle || computed?.borderTopStyle || '';
  const color = element.style.borderTopColor || computed?.borderTopColor || '';
  if (!width || !style || style === 'none' || style === 'hidden' || isTransparentColor(color)) return undefined;
  return `${width}px ${style} ${color}`;
}

function readBackgroundColor(element: HTMLElement, _computed: CSSStyleDeclaration | undefined): string | undefined {
  const color = element.style.backgroundColor || element.style.background || '';
  return color && !isTransparentColor(color) ? color : undefined;
}

function isTransparentColor(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return !normalized
    || normalized === 'transparent'
    || normalized === 'rgba(0, 0, 0, 0)'
    || normalized === 'rgba(0,0,0,0)';
}

function safeComputedStyle(element: HTMLElement): CSSStyleDeclaration | undefined {
  return typeof window === 'undefined' ? undefined : window.getComputedStyle(element);
}

function positiveNumber(value: number): number | undefined {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function readImageAlt(image: HTMLImageElement): string {
  return normalizePlainText(image.alt || image.title || '이미지');
}
