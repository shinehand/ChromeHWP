import { strToU8, unzipSync, zipSync, type ZipOptions, type Zippable } from 'fflate';

import type {
  EditableBlock,
  EditableExportDocument,
  EditableBoxSpacing,
  EditableImageBlock,
  EditablePageLayout,
  EditableParagraphBlock,
  EditableTableBlock,
  EditableTableCell,
  EditableTextRun
} from './editable-document';
import { exportEditableDocumentToPlainText } from './plain-text';

export interface HwpxWriteOptions {
  readonly title: string;
  readonly sourceBytes?: Uint8Array;
  readonly now?: Date;
}

interface HwpxImageAsset {
  readonly id: string;
  readonly path: string;
  readonly mimeType: string;
  readonly bytes: Uint8Array;
}

interface FontRecord {
  readonly id: number;
  readonly name: string;
}

interface CharStyleRecord {
  readonly id: number;
  readonly fontId: number;
  readonly fontSizePt: number;
  readonly color: string;
  readonly backgroundColor?: string;
  readonly letterSpacingPercent?: number;
  readonly widthRatioPercent?: number;
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strike: boolean;
}

interface BorderFillRecord {
  readonly id: number;
  readonly border?: string;
  readonly background?: string;
}

interface ParaStyleRecord {
  readonly id: number;
  readonly align?: EditableParagraphBlock['align'];
  readonly textIndent?: number;
  readonly lineHeight?: string;
}

interface StyleRegistry {
  readonly fonts: FontRecord[];
  readonly charStyles: CharStyleRecord[];
  readonly charStyleIds: Map<string, number>;
  readonly paraStyles: ParaStyleRecord[];
  readonly paraStyleIds: Map<string, number>;
  readonly borderFills: BorderFillRecord[];
  readonly borderFillIds: Map<string, number>;
}

interface RenderContext {
  readonly imageAssets: Map<EditableImageBlock, HwpxImageAsset>;
  readonly styles: StyleRegistry;
  readonly headerDecorations: readonly EditableImageBlock[];
  nextParagraphId: number;
  nextTableId: number;
  nextPictureId: number;
  nextFieldId: number;
}

interface BlockRenderOptions {
  readonly pageBreakBefore?: boolean;
}

const HWPX_MIMETYPE = 'application/hwp+zip';
const DEFAULT_FONT = 'Malgun Gothic';
const DEFAULT_FONT_SIZE_PT = 10;
const DEFAULT_TEXT_COLOR = '#000000';
const HWPUNIT_PER_PX = 75;
const XML_LEVEL = 6;
const STORED_LEVEL = 0;

export async function writeHwpxPackage(document: EditableExportDocument, options: HwpxWriteOptions): Promise<Uint8Array> {
  const now = options.now ?? new Date();
  const imageAssets = await collectImageAssets(document);
  const styles = buildStyleRegistry(document);
  const context: RenderContext = {
    imageAssets,
    styles,
    headerDecorations: document.headerDecorations ?? [],
    nextParagraphId: 1,
    nextTableId: 1,
    nextPictureId: 1,
    nextFieldId: 1
  };
  const preservedEntries = buildBaseEntries(options.sourceBytes);
  removeManagedEntries(preservedEntries);
  const entries: Zippable = {};
  addTextEntry(entries, 'mimetype', HWPX_MIMETYPE, STORED_LEVEL, now);
  addTextEntry(entries, 'version.xml', buildVersionXml(), XML_LEVEL, now);
  addTextEntry(entries, 'META-INF/container.xml', buildContainerXml(), XML_LEVEL, now);
  addTextEntry(entries, 'META-INF/manifest.xml', buildManifestXml(imageAssets), XML_LEVEL, now);
  addTextEntry(entries, 'Contents/content.hpf', buildContentHpf(options.title, imageAssets, preservedEntries, now), XML_LEVEL, now);
  addTextEntry(entries, 'Contents/header.xml', buildHeaderXml(options.title, styles, imageAssets, now), XML_LEVEL, now);
  addTextEntry(entries, 'Contents/section0.xml', buildSectionXml(document, context), XML_LEVEL, now);
  addTextEntry(entries, 'Preview/PrvText.txt', exportEditableDocumentToPlainText(document), XML_LEVEL, now);

  for (const asset of imageAssets.values()) {
    entries[asset.path] = [asset.bytes, { level: STORED_LEVEL, mtime: now }];
  }
  for (const [path, entry] of Object.entries(preservedEntries)) {
    if (entries[path] === undefined) entries[path] = entry;
  }

  return zipSync(entries, { level: XML_LEVEL, mtime: now });
}

function buildBaseEntries(sourceBytes: Uint8Array | undefined): Zippable {
  if (!sourceBytes?.byteLength) return {};

  try {
    const unzipped = unzipSync(sourceBytes);
    const entries: Zippable = {};
    for (const [path, bytes] of Object.entries(unzipped)) {
      entries[normalizeZipPath(path)] = [bytes, { level: XML_LEVEL }];
    }
    return entries;
  } catch {
    return {};
  }
}

function removeManagedEntries(entries: Zippable): void {
  for (const path of Object.keys(entries)) {
    if (path === 'mimetype'
      || path === 'version.xml'
      || path === 'Contents/content.hpf'
      || path === 'Contents/header.xml'
      || path === 'META-INF/container.xml'
      || path === 'META-INF/manifest.xml'
      || path === 'Preview/PrvText.txt'
      || /^Contents\/section\d+\.xml$/i.test(path)
      || /^BinData\//i.test(path)) {
      delete entries[path];
    }
  }
}

function addTextEntry(entries: Zippable, path: string, text: string, level: ZipOptions['level'], mtime: Date): void {
  entries[path] = [strToU8(text), { level, mtime }];
}

function buildSectionXml(document: EditableExportDocument, context: RenderContext): string {
  const sectionProperties = renderSectionProperties(document.pages.find((page) => page.layout)?.layout, context, 1);
  const body = document.pages
    .flatMap((page, pageIndex) => {
      return page.blocks.map((block, blockIndex) => renderBlock(block, context, 1, {
        pageBreakBefore: pageIndex > 0 && blockIndex === 0
      }));
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<hp:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">',
    sectionProperties,
    body || renderParagraphBlock({ type: 'paragraph', runs: [{ text: '' }] }, context, 1),
    '</hp:sec>',
    ''
  ].join('\n');
}

function renderSectionProperties(layout: EditablePageLayout | undefined, context: RenderContext, depth: number): string {
  if (!layout) return '';

  const indent = '  '.repeat(depth);
  const runIndent = '  '.repeat(depth + 1);
  const sectionIndent = '  '.repeat(depth + 2);
  const pageIndent = '  '.repeat(depth + 3);
  const pageWidth = pxToHwpUnit(layout.width) || pxToHwpUnit(794);
  const pageHeight = pxToHwpUnit(layout.height) || pxToHwpUnit(1123);
  const margin = normalizePadding(layout.margin);
  const headerHeightPx = headerDecorationHeightPx(context.headerDecorations);
  const headerHeight = pxToHwpUnit(headerHeightPx);
  const orientation = layout.width > layout.height ? 'WIDELY' : 'NARROWLY';

  return [
    `${indent}<hp:p id="${context.nextParagraphId++}" paraPrIDRef="0" styleIDRef="0">`,
    `${runIndent}<hp:run charPrIDRef="0">`,
    `${sectionIndent}<hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" tabStop="8000" tabStopVal="4000" tabStopUnit="HWPUNIT">`,
    `${pageIndent}<hp:pagePr landscape="${orientation}" width="${pageWidth}" height="${pageHeight}" gutterType="LEFT_ONLY">`,
    `${pageIndent}  <hp:margin header="${headerHeight}" footer="0" gutter="0" left="${margin.left}" right="${margin.right}" top="${margin.top}" bottom="${margin.bottom}"/>`,
    `${pageIndent}</hp:pagePr>`,
    `${sectionIndent}</hp:secPr>`,
    renderHeaderDecorationControl(context, layout, depth + 2),
    `${runIndent}</hp:run>`,
    `${indent}</hp:p>`,
    ''
  ].join('\n');
}

function headerDecorationHeightPx(decorations: readonly EditableImageBlock[]): number {
  const heights = decorations
    .map((block) => Math.round(block.height ?? 0))
    .filter((height) => height > 0);
  if (!heights.length) return 0;
  return Math.max(...heights) + 50;
}

function renderHeaderDecorationControl(context: RenderContext, layout: EditablePageLayout, depth: number): string {
  const decorations = context.headerDecorations.filter((block) => context.imageAssets.has(block));
  if (!decorations.length) return '';

  const indent = '  '.repeat(depth);
  const subListIndent = '  '.repeat(depth + 1);
  const bodyWidth = pxToHwpUnit(Math.max(1, layout.width - (layout.margin?.left ?? 0) - (layout.margin?.right ?? 0)));
  const headerHeight = pxToHwpUnit(headerDecorationHeightPx(decorations));
  const blocks = decorations
    .map((block) => renderImageBlock(block, context, depth + 2))
    .join('');

  return [
    `${indent}<hp:ctrl>`,
    `${subListIndent}<hp:header id="0" applyPageType="BOTH">`,
    `${subListIndent}  <hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="TOP" textWidth="${bodyWidth}" textHeight="${headerHeight}">`,
    blocks.trimEnd(),
    `${subListIndent}  </hp:subList>`,
    `${subListIndent}</hp:header>`,
    `${indent}</hp:ctrl>`
  ].filter(Boolean).join('\n');
}

function renderBlock(
  block: EditableBlock,
  context: RenderContext,
  depth: number,
  options: BlockRenderOptions = {}
): string {
  if (block.type === 'paragraph') return renderParagraphBlock(block, context, depth, options);
  if (block.type === 'table') return renderTableBlock(block, context, depth, options);
  return renderImageBlock(block, context, depth, options);
}

function renderParagraphBlock(
  block: EditableParagraphBlock,
  context: RenderContext,
  depth: number,
  options: BlockRenderOptions = {}
): string {
  const indent = '  '.repeat(depth);
  const paraPrId = context.styles.paraStyleIds.get(paraStyleKey(block)) ?? 0;
  const align = block.align ? ` align="${alignToHwpx(block.align)}"` : '';
  const lineHeight = block.lineHeight ? ` lineHeight="${escapeXmlAttribute(block.lineHeight)}"` : '';
  const pageBreak = options.pageBreakBefore ? ' pageBreak="1"' : '';
  const runs = block.runs
    .map((run) => renderTextRun(run, context, depth + 1))
    .join('') || renderTextRun({ text: '' }, context, depth + 1);

  return `${indent}<hp:p id="${context.nextParagraphId++}" paraPrIDRef="${paraPrId}" styleIDRef="0"${pageBreak}${align}${lineHeight}>\n${runs}${indent}</hp:p>\n`;
}

function renderTextRun(run: EditableTextRun, context: RenderContext, depth: number): string {
  const indent = '  '.repeat(depth);
  const charPrId = context.styles.charStyleIds.get(charStyleKey(run)) ?? 0;
  const pieces = renderTextPieces(run.text, depth + 1);
  const fallbackPiece = `${indent}  <hp:t></hp:t>\n`;
  const href = normalizeHwpxHyperlinkHref(run.href);
  const body = href
    ? renderHyperlinkField(href, context, depth + 1, pieces || fallbackPiece)
    : pieces || fallbackPiece;
  return `${indent}<hp:run charPrIDRef="${charPrId}">\n${body}${indent}</hp:run>\n`;
}

function renderTextPieces(text: string, depth: number): string {
  const indent = '  '.repeat(depth);
  const normalized = text.replace(/\r\n?/g, '\n');
  return normalized.split(/(\n|\t)/).map((piece) => {
    if (piece === '\n') return `${indent}<hp:lineBreak/>\n`;
    if (piece === '\t') return `${indent}<hp:tab/>\n`;
    return piece ? `${indent}<hp:t>${escapeXmlText(piece)}</hp:t>\n` : '';
  }).join('');
}

function renderHyperlinkField(href: string, context: RenderContext, depth: number, body: string): string {
  const indent = '  '.repeat(depth);
  const paramIndent = '  '.repeat(depth + 1);
  const fieldId = 627600491;
  const beginId = 1900000000 + context.nextFieldId++;
  const escapedHref = escapeXmlText(href);
  return [
    `${indent}<hp:ctrl>`,
    `${paramIndent}<hp:fieldBegin id="${beginId}" type="HYPERLINK" name="" editable="0" dirty="1" zorder="-1" fieldid="${fieldId}" metaTag="">`,
    `${paramIndent}  <hp:parameters cnt="6" name="">`,
    `${paramIndent}    <hp:integerParam name="Prop">0</hp:integerParam>`,
    `${paramIndent}    <hp:stringParam name="Command">${escapedHref};1;0;0;</hp:stringParam>`,
    `${paramIndent}    <hp:stringParam name="Path">${escapedHref}</hp:stringParam>`,
    `${paramIndent}    <hp:stringParam name="Category">HWPHYPERLINK_TYPE_URL</hp:stringParam>`,
    `${paramIndent}    <hp:stringParam name="TargetType">HWPHYPERLINK_TARGET_BOOKMARK</hp:stringParam>`,
    `${paramIndent}    <hp:stringParam name="DocOpenType">HWPHYPERLINK_JUMP_CURRENTTAB</hp:stringParam>`,
    `${paramIndent}  </hp:parameters>`,
    `${paramIndent}</hp:fieldBegin>`,
    `${indent}</hp:ctrl>`,
    body,
    `${indent}<hp:ctrl>`,
    `${paramIndent}<hp:fieldEnd beginIDRef="${beginId}" fieldid="${fieldId}"/>`,
    `${indent}</hp:ctrl>`
  ].join('\n') + '\n';
}

function renderTableBlock(
  block: EditableTableBlock,
  context: RenderContext,
  depth: number,
  options: BlockRenderOptions = {}
): string {
  const indent = '  '.repeat(depth);
  const runIndent = '  '.repeat(depth + 1);
  const tableIndent = '  '.repeat(depth + 2);
  const pageBreak = options.pageBreakBefore ? ' pageBreak="1"' : '';
  const tableBorderFillId = borderFillIdFor(context.styles, block.border, block.background);
  const tableWidthPx = block.width || sumPositive(block.columnWidths) || 640;
  const tableWidth = pxToHwpUnit(tableWidthPx);
  const rows = block.rows.map((row, rowIndex) => {
    let colIndex = 0;
    const cells = row.cells.map((cell) => {
      const rendered = renderTableCell(cell, block, context, rowIndex, colIndex, tableWidth, depth + 3);
      colIndex += Math.max(1, cell.colSpan);
      return rendered;
    }).join('');
    return `${tableIndent}<hp:tr>\n${cells}${tableIndent}</hp:tr>\n`;
  }).join('');

  return [
    `${indent}<hp:p id="${context.nextParagraphId++}" paraPrIDRef="0" styleIDRef="0"${pageBreak}>`,
    `${runIndent}<hp:run charPrIDRef="0">`,
    `${tableIndent}<hp:tbl id="${context.nextTableId++}" borderFillIDRef="${tableBorderFillId}">`,
    `${tableIndent}  <hp:sz width="${tableWidth}" height="0"/>`,
    rows,
    `${tableIndent}</hp:tbl>`,
    `${runIndent}</hp:run>`,
    `${indent}</hp:p>`,
    ''
  ].join('\n');
}

function renderTableCell(
  cell: EditableTableCell,
  table: EditableTableBlock,
  context: RenderContext,
  rowIndex: number,
  colIndex: number,
  tableWidth: number,
  depth: number
): string {
  const indent = '  '.repeat(depth);
  const columnWidth = columnSpanWidth(table.columnWidths, colIndex, Math.max(1, cell.colSpan));
  const cellWidth = pxToHwpUnit(cell.width || columnWidth) || Math.max(1200, Math.round(tableWidth / 4));
  const cellHeight = pxToHwpUnit(cell.height) || 1200;
  const verticalAlign = cell.verticalAlign ? verticalAlignToHwpx(cell.verticalAlign) : 'TOP';
  const align = cell.align ? ` textAlign="${alignToHwpx(cell.align)}"` : '';
  const borderFillId = borderFillIdFor(
    context.styles,
    cell.border || table.border,
    cell.background || table.background
  );
  const padding = normalizePadding(cell.padding);
  const blocks = cell.blocks.length
    ? cell.blocks.map((block) => renderBlock(block, context, depth + 2)).join('')
    : renderParagraphBlock({ type: 'paragraph', runs: [{ text: '' }] }, context, depth + 2);

  return [
    `${indent}<hp:tc borderFillIDRef="${borderFillId}">`,
    `${indent}  <hp:cellAddr colAddr="${colIndex}" rowAddr="${rowIndex}"/>`,
    `${indent}  <hp:cellSpan colSpan="${Math.max(1, cell.colSpan)}" rowSpan="${Math.max(1, cell.rowSpan)}"/>`,
    `${indent}  <hp:cellSz width="${cellWidth}" height="${cellHeight}"/>`,
    `${indent}  <hp:cellMargin left="${padding.left}" right="${padding.right}" top="${padding.top}" bottom="${padding.bottom}"/>`,
    `${indent}  <hp:subList id="${context.nextParagraphId}" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="${verticalAlign}"${align}>`,
    blocks,
    `${indent}  </hp:subList>`,
    `${indent}</hp:tc>`,
    ''
  ].join('\n');
}

function renderImageBlock(
  block: EditableImageBlock,
  context: RenderContext,
  depth: number,
  options: BlockRenderOptions = {}
): string {
  const asset = context.imageAssets.get(block);
  if (!asset) {
    return renderParagraphBlock({ type: 'paragraph', runs: [{ text: block.altText }] }, context, depth, options);
  }

  const indent = '  '.repeat(depth);
  const runIndent = '  '.repeat(depth + 1);
  const pictureIndent = '  '.repeat(depth + 2);
  const pageBreak = options.pageBreakBefore ? ' pageBreak="1"' : '';
  const width = pxToHwpUnit(block.width) || 14400;
  const height = pxToHwpUnit(block.height) || 7200;
  const altText = escapeXmlText(block.altText || '이미지');
  const treatAsChar = block.inline === false ? '0' : '1';

  return [
    `${indent}<hp:p id="${context.nextParagraphId++}" paraPrIDRef="0" styleIDRef="0"${pageBreak}>`,
    `${runIndent}<hp:run charPrIDRef="0">`,
    `${pictureIndent}<hp:pic id="${context.nextPictureId++}" binaryItemIDRef="${escapeXmlAttribute(asset.id)}">`,
    `${pictureIndent}  <hp:pos treatAsChar="${treatAsChar}"/>`,
    `${pictureIndent}  <hp:sz width="${width}" height="${height}"/>`,
    `${pictureIndent}  <hp:img binaryItemIDRef="${escapeXmlAttribute(asset.id)}"/>`,
    `${pictureIndent}  <hp:shapeComment>${altText}</hp:shapeComment>`,
    `${pictureIndent}</hp:pic>`,
    `${runIndent}</hp:run>`,
    `${indent}</hp:p>`,
    ''
  ].join('\n');
}

async function collectImageAssets(document: EditableExportDocument): Promise<Map<EditableImageBlock, HwpxImageAsset>> {
  const map = new Map<EditableImageBlock, HwpxImageAsset>();
  let index = 1;

  for (const block of collectBlocks(document)) {
    if (block.type !== 'image' || !block.src) continue;
    const resolved = await resolveImageBytes(block.src);
    if (!resolved) continue;

    const serial = String(index).padStart(4, '0');
    const extension = mimeTypeToExtension(resolved.mimeType);
    map.set(block, {
      id: `Bin${serial}`,
      path: `BinData/chrome-hwp-export-${serial}.${extension}`,
      mimeType: resolved.mimeType,
      bytes: resolved.bytes
    });
    index += 1;
  }

  return map;
}

function collectBlocks(document: EditableExportDocument): EditableBlock[] {
  const blocks: EditableBlock[] = [];
  if (document.headerDecorations?.length) appendBlocks(document.headerDecorations, blocks);
  for (const page of document.pages) appendBlocks(page.blocks, blocks);
  return blocks;
}

function appendBlocks(source: readonly EditableBlock[], target: EditableBlock[]): void {
  for (const block of source) {
    target.push(block);
    if (block.type !== 'table') continue;
    for (const row of block.rows) {
      for (const cell of row.cells) appendBlocks(cell.blocks, target);
    }
  }
}

async function resolveImageBytes(source: string): Promise<{ readonly bytes: Uint8Array; readonly mimeType: string } | null> {
  if (source.startsWith('data:')) return parseDataUri(source);

  try {
    const response = await fetch(source);
    if (!response.ok) return null;
    const blob = await response.blob();
    return {
      bytes: new Uint8Array(await blob.arrayBuffer()),
      mimeType: blob.type || inferMimeTypeFromPath(source)
    };
  } catch {
    return null;
  }
}

function parseDataUri(source: string): { readonly bytes: Uint8Array; readonly mimeType: string } | null {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(source);
  if (!match) return null;

  const mimeType = match[1] || 'application/octet-stream';
  const payload = match[3] || '';
  if (match[2]) {
    return { mimeType, bytes: base64ToBytes(payload) };
  }
  return { mimeType, bytes: strToU8(decodeURIComponent(payload)) };
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function buildStyleRegistry(document: EditableExportDocument): StyleRegistry {
  const fonts: FontRecord[] = [{ id: 0, name: DEFAULT_FONT }];
  const fontIds = new Map<string, number>([[DEFAULT_FONT, 0]]);
  const charStyles: CharStyleRecord[] = [createCharStyle(0, 0, DEFAULT_FONT_SIZE_PT, DEFAULT_TEXT_COLOR, undefined, undefined, undefined, false, false, false, false)];
  const charStyleIds = new Map<string, number>([[defaultCharStyleKey(), 0]]);
  const paraStyles: ParaStyleRecord[] = [{ id: 0, align: 'left', lineHeight: '160%' }];
  const paraStyleIds = new Map<string, number>([[paraStyleKey(paraStyles[0]), 0]]);
  const borderFills: BorderFillRecord[] = [{ id: 0, border: '1px solid #000000' }];
  const borderFillIds = new Map<string, number>([[borderFillKey('1px solid #000000', undefined), 0]]);

  for (const block of collectBlocks(document)) {
    if (block.type === 'paragraph') {
      registerParaStyle(block, paraStyles, paraStyleIds);
      for (const run of block.runs) {
        const key = charStyleKey(run);
        if (charStyleIds.has(key)) continue;

        const fontName = normalizeFontFamily(run.fontFamily) || DEFAULT_FONT;
        let fontId = fontIds.get(fontName);
        if (fontId === undefined) {
          fontId = fonts.length;
          fonts.push({ id: fontId, name: fontName });
          fontIds.set(fontName, fontId);
        }

        const id = charStyles.length;
        charStyleIds.set(key, id);
        charStyles.push(createCharStyle(
          id,
          fontId,
          normalizeFontSize(run.fontSizePt),
          normalizeColor(run.color) || DEFAULT_TEXT_COLOR,
          normalizeColor(run.backgroundColor) || undefined,
          normalizeLetterSpacingPercent(run.letterSpacing),
          normalizeWidthRatioPercent(run.fontStretch),
          run.bold === true,
          run.italic === true,
          run.underline === true,
          run.strike === true
        ));
      }
    }

    if (block.type === 'table') {
      registerBorderFill(block.border, block.background, borderFills, borderFillIds);
      for (const row of block.rows) {
        for (const cell of row.cells) {
          registerBorderFill(cell.border || block.border, cell.background || block.background, borderFills, borderFillIds);
        }
      }
    }
  }

  return { fonts, charStyles, charStyleIds, paraStyles, paraStyleIds, borderFills, borderFillIds };
}

function createCharStyle(
  id: number,
  fontId: number,
  fontSizePt: number,
  color: string,
  backgroundColor: string | undefined,
  letterSpacingPercent: number | undefined,
  widthRatioPercent: number | undefined,
  bold: boolean,
  italic: boolean,
  underline: boolean,
  strike: boolean
): CharStyleRecord {
  return { id, fontId, fontSizePt, color, backgroundColor, letterSpacingPercent, widthRatioPercent, bold, italic, underline, strike };
}

function registerBorderFill(
  border: string | undefined,
  background: string | undefined,
  records: BorderFillRecord[],
  ids: Map<string, number>
): number {
  const normalizedBorder = normalizeBorder(border);
  const normalizedBackground = normalizeColor(background) || undefined;
  const key = borderFillKey(normalizedBorder, normalizedBackground);
  const existing = ids.get(key);
  if (existing !== undefined) return existing;

  const id = records.length;
  records.push({
    id,
    border: normalizedBorder,
    background: normalizedBackground
  });
  ids.set(key, id);
  return id;
}

function borderFillIdFor(styles: StyleRegistry, border: string | undefined, background: string | undefined): number {
  const normalizedBorder = normalizeBorder(border);
  const normalizedBackground = normalizeColor(background) || undefined;
  return styles.borderFillIds.get(borderFillKey(normalizedBorder, normalizedBackground)) ?? 0;
}

function borderFillKey(border: string | undefined, background: string | undefined): string {
  return `${normalizeBorder(border) || ''}|${normalizeColor(background) || ''}`;
}

function registerParaStyle(
  block: Pick<EditableParagraphBlock, 'align' | 'textIndent' | 'lineHeight'>,
  records: ParaStyleRecord[],
  ids: Map<string, number>
): number {
  const key = paraStyleKey(block);
  const existing = ids.get(key);
  if (existing !== undefined) return existing;

  const id = records.length;
  records.push({
    id,
    align: block.align,
    textIndent: normalizeTextIndent(block.textIndent),
    lineHeight: normalizeParaLineHeight(block.lineHeight)
  });
  ids.set(key, id);
  return id;
}

function paraStyleKey(block: Pick<EditableParagraphBlock, 'align' | 'textIndent' | 'lineHeight'>): string {
  return [
    block.align || 'left',
    normalizeTextIndent(block.textIndent),
    normalizeParaLineHeight(block.lineHeight)
  ].join('|');
}

function charStyleKey(run: EditableTextRun): string {
  return [
    normalizeFontFamily(run.fontFamily) || DEFAULT_FONT,
    normalizeFontSize(run.fontSizePt),
    normalizeColor(run.color) || DEFAULT_TEXT_COLOR,
    normalizeColor(run.backgroundColor) || '',
    normalizeLetterSpacingPercent(run.letterSpacing) ?? '',
    normalizeWidthRatioPercent(run.fontStretch) ?? '',
    run.bold === true ? 1 : 0,
    run.italic === true ? 1 : 0,
    run.underline === true ? 1 : 0,
    run.strike === true ? 1 : 0
  ].join('|');
}

function defaultCharStyleKey(): string {
  return [
    DEFAULT_FONT,
    DEFAULT_FONT_SIZE_PT,
    DEFAULT_TEXT_COLOR,
    '',
    '',
    '',
    0,
    0,
    0,
    0
  ].join('|');
}

function buildHeaderXml(
  title: string,
  styles: StyleRegistry,
  imageAssets: ReadonlyMap<EditableImageBlock, HwpxImageAsset>,
  now: Date
): string {
  const date = escapeXmlAttribute(now.toISOString());
  const fonts = styles.fonts.map((font) => (
    `        <hh:font id="${font.id}" face="${escapeXmlAttribute(font.name)}" type="TTF"/>`
  )).join('\n');
  const charProperties = styles.charStyles.map(renderCharStyle).join('\n');
  const paraProperties = styles.paraStyles.map(renderParaStyle).join('\n');
  const borderFills = styles.borderFills.map(renderBorderFill).join('\n');
  const binItems = Array.from(imageAssets.values()).map((asset) => (
    `        <hh:binItem id="${escapeXmlAttribute(asset.id)}" href="${escapeXmlAttribute(asset.path)}" media-type="${escapeXmlAttribute(asset.mimeType)}"/>`
  )).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hh:head xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core">
  <hh:meta>
    <hh:title>${escapeXmlText(title)}</hh:title>
    <hh:generator>ChromeHWP</hh:generator>
    <hh:createdDate>${date}</hh:createdDate>
    <hh:modifiedDate>${date}</hh:modifiedDate>
  </hh:meta>
  <hh:beginNum page="1" footnote="1" endnote="1" pic="1" tbl="1" equation="1"/>
  <hh:refList>
    <hh:fontfaces itemCnt="${styles.fonts.length}">
      <hh:fontface lang="HANGUL" fontCnt="${styles.fonts.length}">
${fonts}
      </hh:fontface>
    </hh:fontfaces>
    <hh:borderFills itemCnt="${styles.borderFills.length}">
${borderFills}
    </hh:borderFills>
    <hh:charProperties itemCnt="${styles.charStyles.length}">
${charProperties}
    </hh:charProperties>
    <hh:paraProperties itemCnt="${styles.paraStyles.length}">
${paraProperties}
    </hh:paraProperties>
    <hh:styles itemCnt="1">
      <hh:style id="0" type="PARA" name="바탕글" engName="Normal" paraPrIDRef="0" charPrIDRef="0" nextStyleIDRef="0" langID="1042" lockForm="0"/>
    </hh:styles>
    <hh:binData itemCnt="${imageAssets.size}">
${binItems}
    </hh:binData>
  </hh:refList>
</hh:head>
`;
}

function renderCharStyle(style: CharStyleRecord): string {
  const decorations = [
    style.bold ? '        <hh:bold/>' : '',
    style.italic ? '        <hh:italic/>' : '',
    style.underline ? '        <hh:underline type="BOTTOM" shape="SOLID"/>' : '',
    style.strike ? '        <hh:strikeout shape="SOLID"/>' : ''
  ].filter(Boolean).join('\n');
  const height = Math.max(100, Math.round(style.fontSizePt * 100));
  const ratio = style.widthRatioPercent && style.widthRatioPercent !== 100
    ? renderLanguageMetric('ratio', style.widthRatioPercent)
    : '';
  const spacing = style.letterSpacingPercent
    ? renderLanguageMetric('spacing', style.letterSpacingPercent)
    : '';

  return [
    `      <hh:charPr id="${style.id}" height="${height}" textColor="${escapeXmlAttribute(style.color)}"${style.backgroundColor ? ` shadeColor="${escapeXmlAttribute(style.backgroundColor)}"` : ''}>`,
    `        <hh:fontRef hangul="${style.fontId}" latin="${style.fontId}" hanja="${style.fontId}" japanese="${style.fontId}" other="${style.fontId}" symbol="${style.fontId}" user="${style.fontId}"/>`,
    ratio,
    spacing,
    decorations,
    '      </hh:charPr>'
  ].filter(Boolean).join('\n');
}

function renderLanguageMetric(name: 'ratio' | 'spacing', value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const formatted = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return `        <hh:${name} hangul="${formatted}" latin="${formatted}" hanja="${formatted}" japanese="${formatted}" other="${formatted}" symbol="${formatted}" user="${formatted}"/>`;
}

function renderParaStyle(style: ParaStyleRecord): string {
  const align = alignToHwpx(style.align || 'left');
  const lineSpacing = lineHeightToPercent(style.lineHeight);
  const textIndent = pxToSignedHwpUnit(style.textIndent);
  const margin = textIndent
    ? [
        '        <hh:margin>',
        `          <hc:intent value="${textIndent}" unit="HWPUNIT"/>`,
        '          <hc:left value="0" unit="HWPUNIT"/>',
        '          <hc:right value="0" unit="HWPUNIT"/>',
        '          <hc:prev value="0" unit="HWPUNIT"/>',
        '          <hc:next value="0" unit="HWPUNIT"/>',
        '        </hh:margin>'
      ].join('\n')
    : '';

  return [
    `      <hh:paraPr id="${style.id}">`,
    `        <hh:align horizontal="${align}" vertical="BASELINE"/>`,
    margin,
    `        <hh:lineSpacing type="PERCENT" value="${lineSpacing}" unit="HWPUNIT"/>`,
    '      </hh:paraPr>'
  ].filter(Boolean).join('\n');
}

function renderBorderFill(record: BorderFillRecord): string {
  const border = parseBorder(record.border);
  const borderType = cssBorderStyleToHwpx(border.style);
  const borderWidth = `${roundTwoDecimals(Math.max(0.12, border.widthPx * 0.264583))} mm`;
  const borderColor = normalizeColor(border.color) || DEFAULT_TEXT_COLOR;
  const background = normalizeColor(record.background);
  const fillBrush = background
    ? [
        '        <hh:fillBrush>',
        `          <hh:winBrush faceColor="${escapeXmlAttribute(background)}" hatchColor="#FFFFFF" alpha="0"/>`,
        '        </hh:fillBrush>'
      ].join('\n')
    : '';

  return [
    `      <hh:borderFill id="${record.id}" threeD="0" shadow="0" centerLine="NONE">`,
    `        <hh:leftBorder type="${borderType}" width="${borderWidth}" color="${escapeXmlAttribute(borderColor)}"/>`,
    `        <hh:rightBorder type="${borderType}" width="${borderWidth}" color="${escapeXmlAttribute(borderColor)}"/>`,
    `        <hh:topBorder type="${borderType}" width="${borderWidth}" color="${escapeXmlAttribute(borderColor)}"/>`,
    `        <hh:bottomBorder type="${borderType}" width="${borderWidth}" color="${escapeXmlAttribute(borderColor)}"/>`,
    fillBrush,
    '      </hh:borderFill>'
  ].filter(Boolean).join('\n');
}

function buildManifestXml(imageAssets: ReadonlyMap<EditableImageBlock, HwpxImageAsset>): string {
  const imageItems = Array.from(imageAssets.values()).map((asset) => (
    `  <item id="${escapeXmlAttribute(asset.id)}" href="${escapeXmlAttribute(asset.path)}" media-type="${escapeXmlAttribute(asset.mimeType)}"/>`
  )).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest>
  <item id="mimetype" href="mimetype" media-type="${HWPX_MIMETYPE}"/>
  <item id="version" href="version.xml" media-type="application/xml"/>
  <item id="container" href="META-INF/container.xml" media-type="application/xml"/>
  <item id="header" href="Contents/header.xml" media-type="application/xml"/>
  <item id="section0" href="Contents/section0.xml" media-type="application/xml"/>
  <item id="previewText" href="Preview/PrvText.txt" media-type="text/plain"/>
${imageItems}
</manifest>
`;
}

function buildContentHpf(
  title: string,
  imageAssets: ReadonlyMap<EditableImageBlock, HwpxImageAsset>,
  preservedEntries: Zippable,
  now: Date
): string {
  const modified = escapeXmlAttribute(now.toISOString());
  const imageItems = Array.from(imageAssets.values()).map((asset, index) => {
    const id = `image${index + 1}`;
    return `    <opf:item id="${id}" href="${escapeXmlAttribute(asset.path)}" media-type="${escapeXmlAttribute(asset.mimeType)}" isEmbeded="1"/>`;
  }).join('\n');
  const settingsItem = preservedEntries['settings.xml'] !== undefined
    ? '    <opf:item id="settings" href="settings.xml" media-type="application/xml"/>'
    : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<opf:package xmlns:opf="http://www.idpf.org/2007/opf/" xmlns:dc="http://purl.org/dc/elements/1.1/" version="1.0" unique-identifier="chrome-hwp" id="chrome-hwp">
  <opf:metadata>
    <opf:title>${escapeXmlText(title)}</opf:title>
    <opf:language>ko</opf:language>
    <opf:meta name="creator" content="text">ChromeHWP</opf:meta>
    <opf:meta name="ModifiedDate" content="text">${modified}</opf:meta>
  </opf:metadata>
  <opf:manifest>
    <opf:item id="header" href="Contents/header.xml" media-type="application/xml"/>
    <opf:item id="section0" href="Contents/section0.xml" media-type="application/xml"/>
    <opf:item id="previewText" href="Preview/PrvText.txt" media-type="text/plain"/>
${imageItems}${imageItems && settingsItem ? '\n' : ''}${settingsItem}
  </opf:manifest>
  <opf:spine>
    <opf:itemref idref="header" linear="yes"/>
    <opf:itemref idref="section0" linear="yes"/>
  </opf:spine>
</opf:package>
`;
}

function buildContainerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="Contents/header.xml" media-type="${HWPX_MIMETYPE}"/>
  </rootfiles>
</container>
`;
}

function buildVersionXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<hv:version xmlns:hv="http://www.hancom.co.kr/hwpml/2011/version" version="1.0"/>
`;
}

function normalizeZipPath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\\/g, '/');
}

function normalizeFontFamily(value: string | undefined): string {
  return value?.split(',')[0]?.trim().replace(/^["']|["']$/g, '') || '';
}

function normalizeFontSize(value: number | undefined): number {
  return Number.isFinite(value) && Number(value) > 0 ? Math.max(1, Math.round(Number(value) * 10) / 10) : DEFAULT_FONT_SIZE_PT;
}

function normalizeLetterSpacingPercent(value: string | undefined): number | undefined {
  const parsed = parseCssPercentMetric(value);
  if (parsed === undefined || parsed === 0) return undefined;
  return Math.max(-50, Math.min(50, parsed));
}

function normalizeWidthRatioPercent(value: string | undefined): number | undefined {
  const parsed = parseCssPercentMetric(value);
  if (parsed === undefined || parsed <= 0 || parsed === 100) return undefined;
  return Math.max(50, Math.min(200, parsed));
}

function parseCssPercentMetric(value: string | undefined): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === 'normal') return undefined;
  const percentMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (percentMatch) {
    const value = Number(percentMatch[1]);
    return Number.isFinite(value) ? value : undefined;
  }
  const emMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)em$/);
  if (emMatch) {
    const value = Number(emMatch[1]);
    return Number.isFinite(value) ? value * 100 : undefined;
  }
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeTextIndent(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-220, Math.min(320, Math.round(Number(value))));
}

function normalizeParaLineHeight(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return '160%';
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const numeric = Number(trimmed);
    return `${Math.max(80, Math.min(300, Math.round(numeric > 10 ? numeric : numeric * 100)))}%`;
  }
  if (/^\d+(\.\d+)?%$/.test(trimmed)) {
    return `${Math.max(80, Math.min(300, Math.round(Number.parseFloat(trimmed))))}%`;
  }
  return trimmed;
}

function normalizeHwpxHyperlinkHref(value: string | undefined): string {
  const href = value?.trim() || '';
  if (!href || /[\u0000-\u001f\u007f]/.test(href)) return '';
  if (/^javascript:/i.test(href)) return '';
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  if (/^www\./i.test(href)) return `https://${href}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(href)) return `https://${href}`;
  return '';
}

function lineHeightToPercent(value: string | undefined): number {
  const normalized = normalizeParaLineHeight(value);
  if (/^\d+%$/.test(normalized)) return Number(normalized.slice(0, -1));
  return 160;
}

function normalizeBorder(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = parseBorder(value);
  return parsed.style === 'none' ? undefined : `${parsed.widthPx}px ${parsed.style} ${normalizeColor(parsed.color) || DEFAULT_TEXT_COLOR}`;
}

function parseBorder(value: string | undefined): { readonly widthPx: number; readonly style: string; readonly color: string } {
  if (!value) return { widthPx: 0, style: 'none', color: DEFAULT_TEXT_COLOR };

  const width = /([\d.]+)px/i.exec(value)?.[1];
  const style = /\b(solid|dotted|dashed|double|none|hidden)\b/i.exec(value)?.[1]?.toLowerCase();
  const color = /#[0-9a-f]{6}|rgba?\([^)]+\)/i.exec(value)?.[0];
  if (style === 'none' || style === 'hidden') return { widthPx: 0, style: 'none', color: DEFAULT_TEXT_COLOR };

  return {
    widthPx: Math.max(1, Math.round(Number(width) || 1)),
    style: style || 'solid',
    color: normalizeColor(color) || DEFAULT_TEXT_COLOR
  };
}

function cssBorderStyleToHwpx(value: string): string {
  if (value === 'dotted') return 'DOT';
  if (value === 'dashed') return 'DASH';
  if (value === 'double') return 'DOUBLE';
  if (value === 'none') return 'NONE';
  return 'SOLID';
}

function normalizeColor(value: string | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const red = trimmed[1] ?? '0';
    const green = trimmed[2] ?? '0';
    const blue = trimmed[3] ?? '0';
    return `#${red}${red}${green}${green}${blue}${blue}`.toUpperCase();
  }

  const rgb = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(trimmed);
  if (!rgb) return '';
  return `#${toHex(Number(rgb[1]))}${toHex(Number(rgb[2]))}${toHex(Number(rgb[3]))}`;
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0').toUpperCase();
}

function inferMimeTypeFromPath(path: string): string {
  const lower = path.split('?')[0]?.toLowerCase() || '';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  return 'image/png';
}

function mimeTypeToExtension(mimeType: string): string {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/gif') return 'gif';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/bmp') return 'bmp';
  return 'png';
}

function pxToHwpUnit(value: number | undefined): number {
  return Number.isFinite(value) && Number(value) > 0 ? Math.round(Number(value) * HWPUNIT_PER_PX) : 0;
}

function pxToSignedHwpUnit(value: number | undefined): number {
  return Number.isFinite(value) && Number(value) !== 0 ? Math.round(Number(value) * HWPUNIT_PER_PX) : 0;
}

function sumPositive(values: readonly number[] | undefined): number {
  return values?.reduce((sum, value) => sum + (Number.isFinite(value) && value > 0 ? value : 0), 0) ?? 0;
}

function columnSpanWidth(widths: readonly number[] | undefined, startIndex: number, span: number): number {
  if (!widths?.length) return 0;
  let width = 0;
  for (let index = startIndex; index < startIndex + span; index += 1) {
    width += widths[index] ?? 0;
  }
  return Math.round(width);
}

function normalizePadding(padding: EditableBoxSpacing | undefined): Required<EditableBoxSpacing> {
  return {
    top: pxToHwpUnit(padding?.top) || 141,
    right: pxToHwpUnit(padding?.right) || 141,
    bottom: pxToHwpUnit(padding?.bottom) || 141,
    left: pxToHwpUnit(padding?.left) || 141
  };
}

function roundTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function alignToHwpx(value: string): string {
  if (value === 'center') return 'CENTER';
  if (value === 'right') return 'RIGHT';
  if (value === 'justify') return 'JUSTIFY';
  return 'LEFT';
}

function verticalAlignToHwpx(value: string): string {
  if (value === 'middle') return 'CENTER';
  if (value === 'bottom') return 'BOTTOM';
  return 'TOP';
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXmlAttribute(value: string): string {
  return escapeXmlText(value).replace(/"/g, '&quot;');
}
