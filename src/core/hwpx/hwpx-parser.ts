import type {
  BoxSpacing,
  BorderEdges,
  DocumentAsset,
  DocumentBlock,
  DocumentPage,
  ImageBlock,
  PageLayout,
  ParagraphBlock,
  ParsedDocument,
  TableBlock,
  TableCell,
  TableRow,
  TextRun
} from '../document-model';
import { openHwpxPackage } from './hwpx-package';

export interface HwpxParseInput {
  readonly filename: string;
  readonly bytes: Uint8Array;
}

type XmlObject = Record<string, unknown>;

interface HwpxStyleContext {
  readonly binDataMap: Map<string, string>;
  readonly charStyles: Map<string, Partial<TextRun>>;
  readonly paraStyles: Map<string, HwpxParagraphStyle>;
  readonly borderFills: Map<string, CellPaint>;
}

interface CellPaint {
  readonly border?: string;
  readonly borderEdges?: BorderEdges;
  readonly background?: string;
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};
type TextRunDraft = Mutable<Omit<TextRun, 'text'>>;
type ParagraphDraft = Mutable<Partial<Omit<ParagraphBlock, 'type' | 'runs'>>>;
type HwpxParagraphStyle = ParagraphDraft & {
  breakBefore?: boolean;
};
type HwpxDocumentBlock = HwpxParagraphBlock | HwpxTableBlock | HwpxImageBlock;
type HwpxParagraphBlock = ParagraphBlock & {
  readonly _hwpxLayout?: HwpxBlockLayout;
};
type HwpxImageBlock = ImageBlock & {
  readonly _hwpxLayout?: HwpxBlockLayout;
};
type HwpxTableBlock = Omit<TableBlock, 'rows'> & {
  readonly rows: HwpxTableRow[];
  readonly _hwpxLayout?: HwpxTableLayout;
};
type HwpxTableRow = Omit<TableRow, 'cells'> & {
  readonly cells: HwpxTableCell[];
  readonly _hwpxLayout?: HwpxRowLayout;
};
type HwpxTableCell = TableCell & {
  readonly _hwpxLayout?: HwpxCellLayout;
};

interface HwpxLineSegment {
  readonly index: number;
  readonly textPosition: number;
  readonly verticalPosition: number;
  readonly verticalSize: number;
  readonly textHeight: number;
  readonly baseline: number;
  readonly spacing: number;
  readonly horizontalPosition: number;
  readonly horizontalSize: number;
  readonly flags: number;
  readonly heightPx: number;
}

interface HwpxPositionLayout {
  readonly leftPx: number;
  readonly topPx: number;
  readonly offsetLeftPx?: number;
  readonly offsetTopPx?: number;
  readonly widthPx?: number;
  readonly heightPx?: number;
  readonly zIndex?: number;
  readonly source?: string;
  readonly horizontalRelTo?: string;
  readonly verticalRelTo?: string;
  readonly horizontalAlign?: string;
  readonly verticalAlign?: string;
  readonly textWrap?: string;
  readonly flowWithText?: boolean;
  readonly allowOverlap?: boolean;
  readonly margin?: BoxSpacing;
}

interface HwpxParagraphLineMetrics {
  readonly heightPx: number;
  readonly lineHeightPx: number;
  readonly pageSpanCount: number;
  readonly lineSegments: HwpxLineSegment[];
}

interface HwpxObjectSize {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly source: string;
}

interface HwpxBlockLayout {
  readonly heightPx: number;
  readonly renderHeightPx?: number;
  readonly breakBefore?: boolean;
  readonly breakAfter?: boolean;
  readonly lineSegments?: readonly HwpxLineSegment[];
  readonly pageBreak?: string;
  readonly source?: string;
  readonly position?: HwpxPositionLayout;
}

interface HwpxTableLayout extends HwpxBlockLayout {
  readonly colCount: number;
  readonly repeatHeaderRows: number;
  readonly rowHeightsPx: readonly number[];
}

interface HwpxRowLayout {
  readonly rowIndex: number;
  readonly heightPx: number;
  readonly renderHeightPx?: number;
}

interface HwpxCellLayout {
  readonly rowIndex: number;
  readonly colIndex: number;
  readonly colSpan: number;
  readonly rowSpan: number;
  readonly sourceHeightPx: number;
  readonly contentHeightPx: number;
  readonly renderHeightPx?: number;
  readonly isHeader?: boolean;
}

interface HwpxPageProfile {
  readonly layout: PageLayout;
  readonly contentHeightPx: number;
  readonly headerFooterHeightPx: number;
  readonly headerHeightPx: number;
  readonly footerHeightPx: number;
}

interface HwpxSectionDecorations {
  readonly header: HwpxDocumentBlock[];
  readonly footer: HwpxDocumentBlock[];
  readonly pageNumber: boolean;
}

interface HwpxSectionMetrics {
  readonly explicitPageBreakCount: number;
  readonly estimatedPageBreakCount: number;
  readonly lineSegmentParagraphCount: number;
  readonly rowHeightTableCount: number;
}

interface ParsedSection {
  readonly pages: DocumentPage[];
  readonly tableCount: number;
  readonly imageCount: number;
  readonly metrics: HwpxSectionMetrics;
}

const HWPUNIT_PER_PX = 75;
const HWPX_TABLE_PAGINATION_SCALE = 1.00;
const HWPX_LONG_ROW_PAGINATION_SCALE = 0.60;
const HWPX_PRICE_DISCLOSURE_CONTINUATION_HEADER_RESERVE_PX = 72;
const HWPX_PERFORMANCE_CONTINUATION_HEADER_RESERVE_PX = 36;
const HWPX_POSITIONED_TABLE_FLOW_CLEARANCE_PX = 72;
const DEFAULT_PAGE_LAYOUT: PageLayout = {
  width: 794,
  height: 1123,
  margin: { top: 72, right: 80, bottom: 72, left: 80 }
};

export async function parseHwpx(input: HwpxParseInput): Promise<ParsedDocument> {
  const pkg = openHwpxPackage(input.bytes);
  const warnings: string[] = [];
  const sectionPaths = findSectionPaths(pkg);
  if (!sectionPaths.length) {
    throw new Error('HWPX 문서에서 Contents/section*.xml 항목을 찾지 못했습니다.');
  }

  const headerXml = pkg.has('Contents/header.xml') ? pkg.readXml('Contents/header.xml') : null;
  const styles = buildStyleContext(headerXml);
  const assets = collectAssets(pkg, styles.binDataMap);
  let tableCount = 0;
  let imageCount = 0;
  let explicitPageBreakCount = 0;
  let estimatedPageBreakCount = 0;
  let lineSegmentParagraphCount = 0;
  let rowHeightTableCount = 0;

  const pages: DocumentPage[] = [];
  sectionPaths.forEach((sectionPath, sectionIndex) => {
    const section = parseSection(pkg.readXml(sectionPath), sectionIndex, styles, warnings);
    tableCount += section.tableCount;
    imageCount += section.imageCount;
    explicitPageBreakCount += section.metrics.explicitPageBreakCount;
    estimatedPageBreakCount += section.metrics.estimatedPageBreakCount;
    lineSegmentParagraphCount += section.metrics.lineSegmentParagraphCount;
    rowHeightTableCount += section.metrics.rowHeightTableCount;
    for (const page of section.pages) {
      pages.push({ ...page, index: pages.length });
    }
  });

  return {
    format: 'hwpx',
    title: input.filename,
    metadata: {
      sectionCount: sectionPaths.length,
      assetCount: assets.length,
      parser: 'hwpx-zip-xml',
      warnings,
      details: {
        tableCount,
        imageCount,
        pageCount: pages.length,
        explicitPageBreakCount,
        estimatedPageBreakCount,
        lineSegmentParagraphCount,
        rowHeightTableCount,
        charStyleCount: styles.charStyles.size,
        paraStyleCount: styles.paraStyles.size
      }
    },
    pages,
    assets
  };
}

function buildStyleContext(headerXml: unknown): HwpxStyleContext {
  const fonts = buildFontMap(headerXml);
  const charStyles = buildCharStyleMap(headerXml, fonts);
  const paraStyles = buildParaStyleMap(headerXml);
  const borderFills = buildBorderFillMap(headerXml);
  return {
    binDataMap: buildBinDataMap(headerXml),
    charStyles,
    paraStyles,
    borderFills
  };
}

function buildBinDataMap(headerXml: unknown): Map<string, string> {
  const map = new Map<string, string>();
  visitXml(headerXml, (name, node) => {
    if (name !== 'binItem' || !isObject(node)) return;
    const id = readAttribute(node, 'id') || readAttribute(node, 'binaryItemIDRef') || readAttribute(node, 'idRef');
    const href = readAttribute(node, 'href') || readAttribute(node, 'path') || readAttribute(node, 'subPath');
    if (id && href) map.set(id, normalizeAssetPath(href));
  });
  return map;
}

function buildFontMap(headerXml: unknown): Map<string, string> {
  const fonts = new Map<string, string>();
  const fontfaces = findNamedChildren(headerXml, 'fontface');
  for (const fontface of fontfaces) {
    const language = readAttributeObject(fontface, 'lang');
    if (language && language !== 'HANGUL') continue;
    for (const font of directChildren(fontface, 'font')) {
      const id = readAttributeObject(font, 'id');
      const face = readAttributeObject(font, 'face');
      if (id && face) fonts.set(id, face);
    }
    if (fonts.size) break;
  }
  return fonts;
}

function buildCharStyleMap(headerXml: unknown, fonts: Map<string, string>): Map<string, Partial<TextRun>> {
  const styles = new Map<string, Partial<TextRun>>();
  for (const node of findNamedChildren(headerXml, 'charPr')) {
    const id = readAttributeObject(node, 'id');
    if (!id) continue;

    const height = readNumberAttribute(node, 'height');
    const color = normalizeColor(readAttributeObject(node, 'textColor'));
    const backgroundColor = normalizeColor(readAttributeObject(node, 'shadeColor'));
    const fontFamily = readFontFamily(node, fonts);
    const letterSpacing = readAttributeObject(node, 'spacing');
    const style: TextRunDraft = { styleId: id };

    if (fontFamily) style.fontFamily = fontFamily;
    if (height > 0) style.fontSizePt = Math.max(1, height / 100);
    if (color) style.color = color;
    if (backgroundColor) style.backgroundColor = backgroundColor;
    if (letterSpacing) style.letterSpacing = `${Number(letterSpacing) / 100}%`;
    if (hasDirectChild(node, 'bold')) style.bold = true;
    if (hasDirectChild(node, 'italic')) style.italic = true;
    if (isUnderlineEnabled(node)) style.underline = true;
    if (isStrikeoutEnabled(node)) style.strike = true;
    styles.set(id, style);
  }
  return styles;
}

function buildParaStyleMap(headerXml: unknown): Map<string, HwpxParagraphStyle> {
  const styles = new Map<string, HwpxParagraphStyle>();
  for (const node of findNamedChildren(headerXml, 'paraPr')) {
    const id = readAttributeObject(node, 'id');
    if (!id) continue;

    const style: HwpxParagraphStyle = { styleId: id };
    const align = normalizeAlign(readAttributeObject(firstDirectChild(node, 'align'), 'horizontal'));
    const marginNode = firstDescendant(node, 'margin');
    const spacingNode = firstDescendant(node, 'lineSpacing');
    const breakSettingNode = firstDirectChild(node, 'breakSetting');
    const lineSpacingType = readAttributeObject(spacingNode, 'type');
    const lineSpacingValue = readNumberAttribute(spacingNode, 'value');

    if (align) style.align = align;
    if (marginNode) {
      const textIndent = signedHwpUnitAttributeToPx(firstDirectChild(marginNode, 'intent'), 'value');
      style.margin = {
        left: hwpUnitAttributeToPx(firstDirectChild(marginNode, 'left'), 'value'),
        right: hwpUnitAttributeToPx(firstDirectChild(marginNode, 'right'), 'value'),
        top: hwpUnitAttributeToPx(firstDirectChild(marginNode, 'prev'), 'value'),
        bottom: hwpUnitAttributeToPx(firstDirectChild(marginNode, 'next'), 'value')
      };
      if (textIndent) style.textIndent = textIndent;
    }
    if (lineSpacingType === 'PERCENT' && lineSpacingValue > 0) {
      style.lineHeight = `${lineSpacingValue}%`;
    }
    if (readBooleanAttribute(breakSettingNode, 'pageBreakBefore')) {
      style.breakBefore = true;
    }
    styles.set(id, style);
  }
  return styles;
}

function buildBorderFillMap(headerXml: unknown): Map<string, CellPaint> {
  const styles = new Map<string, CellPaint>();
  for (const node of findNamedChildren(headerXml, 'borderFill')) {
    const id = readAttributeObject(node, 'id');
    if (!id) continue;

    const borderEdges = borderEdgesFromBorderFillNode(node);
    const border = firstVisibleBorderEdge(borderEdges);
    const background = normalizeColor(readAttributeObject(firstDescendant(node, 'winBrush'), 'faceColor'));
    styles.set(id, {
      border,
      borderEdges,
      background: background || undefined
    });
  }
  return styles;
}

function collectAssets(pkg: ReturnType<typeof openHwpxPackage>, binDataMap: Map<string, string>): DocumentAsset[] {
  const assets: DocumentAsset[] = [];
  const added = new Set<string>();

  for (const [id, assetPath] of binDataMap) {
    if (!pkg.has(assetPath) || added.has(assetPath)) continue;
    added.add(assetPath);
    assets.push({
      id,
      path: assetPath,
      mimeType: inferMimeType(assetPath),
      bytes: pkg.readBytes(assetPath)
    });
  }

  for (const assetPath of pkg.findPaths(/^BinData\//i)) {
    if (added.has(assetPath)) continue;
    added.add(assetPath);
    assets.push({
      id: assetIdFromPath(assetPath),
      path: assetPath,
      mimeType: inferMimeType(assetPath),
      bytes: pkg.readBytes(assetPath)
    });
  }

  return assets;
}

function findSectionPaths(pkg: ReturnType<typeof openHwpxPackage>): string[] {
  const naturalPaths = pkg.findPaths(/^Contents\/section\d+\.xml$/i).sort(compareSectionPath);
  if (!pkg.has('Contents/content.hpf')) return naturalPaths;

  const content = pkg.readXml('Contents/content.hpf');
  const manifest = new Map<string, string>();
  for (const item of findNamedChildren(content, 'item')) {
    const id = readAttributeObject(item, 'id');
    const href = readAttributeObject(item, 'href') || readAttributeObject(item, 'full-path');
    if (id && href) manifest.set(id, normalizeContentPath(href));
  }

  const ordered: string[] = [];
  for (const itemRef of findNamedChildren(content, 'itemref')) {
    const idRef = readAttributeObject(itemRef, 'idref');
    const href = idRef ? manifest.get(idRef) : '';
    if (!href || !/^Contents\/section\d+\.xml$/i.test(href) || !pkg.has(href)) continue;
    if (!ordered.includes(href)) ordered.push(href);
  }

  for (const path of naturalPaths) {
    if (!ordered.includes(path)) ordered.push(path);
  }
  return ordered.length ? ordered : naturalPaths;
}

function compareSectionPath(left: string, right: string): number {
  return sectionIndexFromPath(left) - sectionIndexFromPath(right) || left.localeCompare(right);
}

function sectionIndexFromPath(path: string): number {
  const match = path.match(/section(\d+)\.xml$/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function normalizeContentPath(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  return normalized.startsWith('Contents/') ? normalized : `Contents/${normalized}`;
}

function parseSection(sectionXml: unknown, index: number, styles: HwpxStyleContext, warnings: string[]): ParsedSection {
  const root = unwrapKnownRoot(sectionXml, ['sec', 'section']);
  const pageProfile = readPageProfile(root);
  const blocks: HwpxDocumentBlock[] = [];

  if (!isObject(root)) {
    warnings.push('섹션 XML 루트를 해석하지 못했습니다.');
    return {
      pages: [{ index, blocks, layout: pageProfile.layout }],
      tableCount: 0,
      imageCount: 0,
      metrics: emptySectionMetrics()
    };
  }

  blocks.push(...parseContainerFlow(root, styles));

  const tableCount = blocks.reduce((count, block) => count + countBlocks(block, 'table'), 0);
  const imageCount = blocks.reduce((count, block) => count + countBlocks(block, 'image'), 0);
  if (!blocks.length) warnings.push('섹션에서 표시 가능한 본문 블록을 찾지 못했습니다.');
  const decorations = collectSectionDecorations(root, styles, pageProfile);
  const pages = decorateSectionPages(paginateSectionBlocks(blocks, pageProfile), decorations, pageProfile);
  const metrics = collectSectionMetrics(blocks, Math.max(0, pages.length - 1));

  return {
    pages: pages.map((page, pageIndex) => ({ ...page, index: pageIndex })),
    tableCount,
    imageCount,
    metrics
  };
}

function collectSectionDecorations(
  root: unknown,
  styles: HwpxStyleContext,
  pageProfile: HwpxPageProfile
): HwpxSectionDecorations {
  const bodyWidth = Math.max(
    1,
    pageProfile.layout.width - (pageProfile.layout.margin.left ?? 0) - (pageProfile.layout.margin.right ?? 0)
  );
  const headerHeight = Math.max(0, pageProfile.headerHeightPx);
  const footerHeight = Math.max(0, pageProfile.footerHeightPx);
  const footerTop = Math.max(
    0,
    pageProfile.layout.height
      - (pageProfile.layout.margin.top ?? 0)
      - (pageProfile.layout.margin.bottom ?? 0)
      - Math.max(footerHeight, 1)
  );
  return {
    header: collectHeaderDecorationBlocks(root, styles, Math.max(1, bodyWidth), headerHeight),
    footer: collectFooterDecorationBlocks(Math.max(1, bodyWidth), footerTop, footerHeight),
    pageNumber: findNamedChildren(root, 'pageNum').length > 0
  };
}

function collectHeaderDecorationBlocks(
  root: unknown,
  styles: HwpxStyleContext,
  widthPx: number,
  headerHeightPx: number
): HwpxDocumentBlock[] {
  const control = findNamedChildren(root, 'header')[0];
  const subList = firstDirectChild(control, 'subList');
  const blocks = subList ? parseContainerFlow(subList, styles) : [];
  const images = collectImageBlocks(blocks);
  const decorations: HwpxDocumentBlock[] = [];
  const slogan = images[0];

  if (slogan) {
    const width = Math.max(1, slogan.width ?? slogan._hwpxLayout?.position?.widthPx ?? 0);
    const height = Math.max(1, slogan.height ?? slogan._hwpxLayout?.position?.heightPx ?? slogan._hwpxLayout?.heightPx ?? 0);
    decorations.push({
      ...slogan,
      inline: false,
      _hwpxLayout: {
        heightPx: height,
        source: 'hwpx-header',
        position: {
          leftPx: Math.max(0, widthPx - width),
          topPx: Math.max(0, Math.round((Math.max(headerHeightPx, height) - height) / 2) - 2),
          widthPx: width,
          heightPx: height,
          zIndex: 200,
          source: 'hwpx-header'
        }
      }
    });
  }

  if (headerHeightPx > 8) {
    decorations.push(createDecorationRuleBlock('hwpx-header-rule', 0, Math.max(0, headerHeightPx - 4), widthPx, 2, 190));
  }

  return decorations;
}

function collectFooterDecorationBlocks(
  widthPx: number,
  footerTopPx: number,
  footerHeightPx: number
): HwpxDocumentBlock[] {
  if (footerHeightPx <= 8) return [];
  return [
    createDecorationRuleBlock('hwpx-footer-rule', 0, Math.max(0, footerTopPx + footerHeightPx - 4), widthPx, 2, 190)
  ];
}

function createPageNumberDecorationBlock(
  pageNumber: number,
  pageProfile: HwpxPageProfile
): HwpxDocumentBlock {
  const bodyWidth = Math.max(
    1,
    pageProfile.layout.width - (pageProfile.layout.margin.left ?? 0) - (pageProfile.layout.margin.right ?? 0)
  );
  const footerHeight = Math.max(18, pageProfile.footerHeightPx);
  const footerTop = Math.max(
    0,
    pageProfile.layout.height
      - (pageProfile.layout.margin.top ?? 0)
      - (pageProfile.layout.margin.bottom ?? 0)
      - footerHeight
  );
  const heightPx = 18;

  return {
    type: 'paragraph',
    align: 'center',
    lineHeight: `${heightPx}px`,
    runs: [{
      text: `- ${pageNumber} -`,
      fontSizePt: 9,
      color: '#000000'
    }],
    _hwpxLayout: {
      heightPx,
      source: 'hwpx-footer-page-number',
      position: {
        leftPx: 0,
        topPx: Math.max(0, footerTop + Math.round((footerHeight - heightPx) / 2)),
        widthPx: bodyWidth,
        heightPx,
        zIndex: 210,
        source: 'hwpx-footer'
      }
    }
  };
}

function createDecorationRuleBlock(
  source: string,
  leftPx: number,
  topPx: number,
  widthPx: number,
  heightPx: number,
  zIndex: number
): HwpxDocumentBlock {
  return {
    type: 'paragraph',
    runs: [],
    _hwpxLayout: {
      heightPx,
      source,
      position: {
        leftPx,
        topPx,
        widthPx,
        heightPx,
        zIndex,
        source
      }
    }
  };
}

function collectImageBlocks(blocks: readonly HwpxDocumentBlock[]): HwpxImageBlock[] {
  const images: HwpxImageBlock[] = [];
  for (const block of blocks) {
    if (block.type === 'image') {
      images.push(block);
      continue;
    }
    if (block.type !== 'table') continue;
    for (const row of block.rows) {
      for (const cell of row.cells) images.push(...collectImageBlocks(cell.blocks as HwpxDocumentBlock[]));
    }
  }
  return images;
}

function decorateSectionPages(
  pages: readonly DocumentPage[],
  decorations: HwpxSectionDecorations,
  pageProfile: HwpxPageProfile
): DocumentPage[] {
  if (!decorations.header.length && !decorations.footer.length && !decorations.pageNumber) return [...pages];
  return pages.map((page) => ({
    ...page,
    blocks: [
      ...decorations.header.map((block) => cloneBlock(block)),
      ...page.blocks,
      ...decorations.footer.map((block) => cloneBlock(block)),
      ...(decorations.pageNumber ? [createPageNumberDecorationBlock(page.index + 1, pageProfile)] : [])
    ]
  }));
}

function parseContainerFlow(node: unknown, styles: HwpxStyleContext): HwpxDocumentBlock[] {
  const blocks: HwpxDocumentBlock[] = [];
  for (const [key, value] of objectEntries(node)) {
    if (isInternalKey(key)) continue;
    if (key === 'p') {
      for (const child of asArray(value)) blocks.push(...parseParagraphFlow(child, styles));
    } else if (key === 'tbl') {
      for (const child of asArray(value)) blocks.push(parseTable(child, styles));
    }
  }
  return blocks;
}

function emptySectionMetrics(): HwpxSectionMetrics {
  return {
    explicitPageBreakCount: 0,
    estimatedPageBreakCount: 0,
    lineSegmentParagraphCount: 0,
    rowHeightTableCount: 0
  };
}

function collectSectionMetrics(blocks: readonly HwpxDocumentBlock[], estimatedPageBreakCount: number): HwpxSectionMetrics {
  const metrics = blocks.reduce((current, block) => mergeSectionMetrics(current, collectBlockMetrics(block)), emptySectionMetrics());
  return {
    ...metrics,
    estimatedPageBreakCount
  };
}

function collectBlockMetrics(block: HwpxDocumentBlock): HwpxSectionMetrics {
  const own: HwpxSectionMetrics = {
    explicitPageBreakCount: block._hwpxLayout?.breakBefore || block._hwpxLayout?.breakAfter ? 1 : 0,
    estimatedPageBreakCount: 0,
    lineSegmentParagraphCount: block.type === 'paragraph' && block._hwpxLayout?.lineSegments?.length ? 1 : 0,
    rowHeightTableCount: block.type === 'table' && block._hwpxLayout?.rowHeightsPx.some((height) => height > 0) ? 1 : 0
  };
  if (block.type !== 'table') return own;
  return block.rows.reduce((rowMetrics, row) => {
    return row.cells.reduce((cellMetrics, cell) => {
      return cell.blocks.reduce((blockMetrics, child) => {
        return mergeSectionMetrics(blockMetrics, collectBlockMetrics(child as HwpxDocumentBlock));
      }, cellMetrics);
    }, rowMetrics);
  }, own);
}

function mergeSectionMetrics(left: HwpxSectionMetrics, right: HwpxSectionMetrics): HwpxSectionMetrics {
  return {
    explicitPageBreakCount: left.explicitPageBreakCount + right.explicitPageBreakCount,
    estimatedPageBreakCount: left.estimatedPageBreakCount + right.estimatedPageBreakCount,
    lineSegmentParagraphCount: left.lineSegmentParagraphCount + right.lineSegmentParagraphCount,
    rowHeightTableCount: left.rowHeightTableCount + right.rowHeightTableCount
  };
}

function countBlocks(block: DocumentBlock, type: DocumentBlock['type']): number {
  const self = block.type === type ? 1 : 0;
  if (block.type !== 'table') return self;
  return block.rows.reduce((rowCount, row) => {
    return rowCount + row.cells.reduce((cellCount, cell) => {
      return cellCount + cell.blocks.reduce((blockCount, child) => blockCount + countBlocks(child, type), 0);
    }, 0);
  }, self);
}

function paginateSectionBlocks(blocks: readonly HwpxDocumentBlock[], pageProfile: HwpxPageProfile): DocumentPage[] {
  if (hasTopLevelExplicitPageBreaks(blocks)) {
    return paginateExplicitPageBreakBlocks(blocks, pageProfile);
  }

  const pageHeight = Math.max(240, pageProfile.contentHeightPx);
  const expandedBlocks = blocks.flatMap((block) => {
    return block.type === 'table' && !block._hwpxLayout?.breakBefore
      ? splitTableForPagination(block, pageHeight)
      : [block];
  });
  const pages: DocumentPage[] = [];
  let current: HwpxDocumentBlock[] = [];
  let currentHeight = 0;
  let currentRenderedBottom = 0;

  const flush = (): void => {
    pages.push({
      index: pages.length,
      blocks: current,
      layout: pageProfile.layout
    });
    current = [];
    currentHeight = 0;
    currentRenderedBottom = 0;
  };

  for (const block of expandedBlocks) {
    let blockToPlace = block;
    let layout = blockToPlace._hwpxLayout;
    if (layout?.breakBefore && current.length) flush();

    const blockHeight = Math.max(1, estimatePaginationHeight(blockToPlace));
    if (current.length && currentHeight + blockHeight > pageHeight) flush();

    if (current.length) {
      blockToPlace = avoidHwpxPositionedTableOverlap(blockToPlace, currentRenderedBottom);
      layout = blockToPlace._hwpxLayout;
    }

    current.push(blockToPlace);
    currentHeight += Math.min(blockHeight, pageHeight);
    currentRenderedBottom = updateRenderedFlowBottom(currentRenderedBottom, blockToPlace);
    if (layout?.breakAfter && current.length) flush();
  }

  if (current.length || !pages.length) flush();
  return pages;
}

function hasTopLevelExplicitPageBreaks(blocks: readonly HwpxDocumentBlock[]): boolean {
  return blocks.some((block, index) => {
    return index > 0 && hasExplicitPageBreakBefore(block._hwpxLayout);
  });
}

function paginateExplicitPageBreakBlocks(blocks: readonly HwpxDocumentBlock[], pageProfile: HwpxPageProfile): DocumentPage[] {
  const pages: DocumentPage[] = [];
  let current: HwpxDocumentBlock[] = [];

  const flush = (): void => {
    pages.push({
      index: pages.length,
      blocks: current,
      layout: pageProfile.layout
    });
    current = [];
  };

  for (const block of blocks) {
    const layout = block._hwpxLayout;
    if (hasExplicitPageBreakBefore(layout) && current.length) flush();
    current.push(block);
    if (layout?.breakAfter && current.length) flush();
  }

  if (current.length || !pages.length) flush();
  return pages;
}

function hasExplicitPageBreakBefore(layout: HwpxBlockLayout | undefined): boolean {
  if (!layout) return false;
  const pageBreak = layout.pageBreak;
  if (pageBreak) return isPageBreakBeforeValue(pageBreak);
  return Boolean(layout.breakBefore);
}

function isPageBreakBeforeValue(value: string): boolean {
  const normalized = value.trim().toUpperCase();
  return normalized === '1' || normalized === 'TRUE' || normalized === 'PAGE';
}

function updateRenderedFlowBottom(currentBottom: number, block: HwpxDocumentBlock): number {
  const renderedHeight = estimateRenderedBlockHeight(block);
  const position = block._hwpxLayout?.position;
  if (position && !isHwpxPositionedTableFlowBlock(block)) {
    return Math.max(currentBottom, position.topPx + renderedHeight);
  }
  return currentBottom + renderedHeight;
}

function avoidHwpxPositionedTableOverlap(block: HwpxDocumentBlock, currentFlowBottom: number): HwpxDocumentBlock {
  if (block.type !== 'table') return block;
  const layout = block._hwpxLayout;
  const position = layout?.position;
  if (!position || currentFlowBottom <= 0) return block;
  if (isHwpxPositionedTableFlowBlock(block)) return block;
  if (position.topPx >= currentFlowBottom) return block;
  return {
    ...block,
    _hwpxLayout: {
      ...layout,
      position: {
        ...position,
        topPx: currentFlowBottom + HWPX_POSITIONED_TABLE_FLOW_CLEARANCE_PX
      }
    }
  };
}

function isHwpxPositionedTableFlowBlock(block: HwpxDocumentBlock): boolean {
  if (block.type !== 'table') return false;
  const position = block._hwpxLayout?.position;
  return Boolean(position
    && isTopAndBottomTextWrap(position.textWrap)
    && position.flowWithText === true
    && position.allowOverlap !== true);
}

function estimateRenderedBlockHeight(block: HwpxDocumentBlock): number {
  if (block.type === 'table') return estimateRenderedTableHeight(block);
  if (block.type === 'paragraph') return estimateRenderedParagraphHeight(block);
  return estimateBlockHeight(block);
}

function estimateRenderedParagraphHeight(block: HwpxParagraphBlock): number {
  const baseHeight = estimateBlockHeight(block);
  const text = block.runs.map((run) => run.text).join('');
  const charCount = text.replace(/\s+/g, '').length;
  if (!charCount) return baseHeight;
  const fontSizePt = block.runs.reduce((max, run) => Math.max(max, run.fontSizePt ?? 0), 0) || 11;
  const lineHeightPx = Math.max(14, Math.round(fontSizePt * (96 / 72) * 1.35));
  const charsPerLine = Math.max(12, Math.round(80 * (11 / Math.max(8, fontSizePt))));
  const renderedLines = Math.max(1, Math.ceil(charCount / charsPerLine));
  return Math.max(baseHeight, renderedLines * lineHeightPx + boxVertical(block.margin));
}

function estimateRenderedTableHeight(table: HwpxTableBlock): number {
  const layoutHeight = table._hwpxLayout?.heightPx ?? 0;
  const rowHeight = table.rows.reduce((sum, row) => sum + estimateRenderedTableRowHeight(row), 0);
  const flowMargin = isHwpxPositionedTableFlowBlock(table)
    ? boxVertical(table._hwpxLayout?.position?.margin)
    : 0;
  return Math.max(1, layoutHeight, rowHeight) + flowMargin;
}

function estimateRenderedTableRowHeight(row: HwpxTableRow): number {
  const rowHeight = row._hwpxLayout?.heightPx ?? 0;
  const cellHeight = row.cells.reduce((max, cell) => {
    return Math.max(max, estimateRenderedTableCellHeight(cell));
  }, 0);
  return Math.max(1, rowHeight, cellHeight);
}

function estimateRenderedTableCellHeight(cell: HwpxTableCell): number {
  const explicitHeight = cell.height ?? 0;
  const layoutHeight = cell._hwpxLayout?.renderHeightPx
    ?? cell._hwpxLayout?.heightPx
    ?? cell._hwpxLayout?.sourceHeightPx
    ?? 0;
  const contentHeight = Math.max(
    cell._hwpxLayout?.contentHeightPx ?? 0,
    estimateBlocksHeight(cell.blocks)
  ) + boxVertical(cell.padding);
  return Math.max(1, explicitHeight, layoutHeight, contentHeight);
}

function splitTableForPagination(table: HwpxTableBlock, pageHeight: number): HwpxDocumentBlock[] {
  const layout = table._hwpxLayout;
  if (!layout || table.rows.length <= 1 || estimatePaginationHeight(table) <= pageHeight * 1.08) return [table];

  const chunks: HwpxDocumentBlock[] = [];
  let startRow = 0;

  while (startRow < table.rows.length) {
    const repeatHeader = startRow > layout.repeatHeaderRows && layout.repeatHeaderRows > 0;
    const headerHeight = repeatHeader
      ? layout.rowHeightsPx.slice(0, layout.repeatHeaderRows).reduce((sum, height) => sum + tableHeightForPagination(height), 0)
      : 0;
    const availableHeight = Math.max(120, pageHeight - headerHeight);
    let endRow = startRow;
    let usedHeight = 0;
    let lastSafeBreak = startRow;
    let consumedSplitRow = false;

    while (endRow < table.rows.length) {
      const rowHeight = tableRowHeightForPagination(table, endRow);
      if (usedHeight > 0 && usedHeight + rowHeight > availableHeight) {
        const longRowRepeatHeader = endRow > layout.repeatHeaderRows && layout.repeatHeaderRows > 0;
        const longRowChunks = splitLongTableRow(table, endRow, pageHeight, longRowRepeatHeader);
        const firstLongRowHeight = firstBodyRowsHeight(longRowChunks[0], longRowRepeatHeader ? layout.repeatHeaderRows : 0);

        if (
          longRowChunks.length > 1
          && firstLongRowHeight > 0
          && usedHeight + firstLongRowHeight <= availableHeight * 1.08
        ) {
          const prefixChunk = sliceTableBlock(table, startRow, endRow, repeatHeader);
          chunks.push(appendBodyRowsToTableChunk(
            prefixChunk,
            longRowChunks[0],
            longRowRepeatHeader ? layout.repeatHeaderRows : 0
          ));
          chunks.push(...longRowChunks.slice(1));
          startRow = endRow + 1;
          consumedSplitRow = true;
        }
        break;
      }
      usedHeight += rowHeight;
      endRow += 1;
      if (isSafeTableBreak(table, endRow)) lastSafeBreak = endRow;
      if (usedHeight >= availableHeight && lastSafeBreak > startRow) {
        endRow = lastSafeBreak;
        break;
      }
    }

    if (consumedSplitRow) continue;
    if (endRow <= startRow) endRow = startRow + 1;
    if (endRow === startRow + 1) {
      const longRowChunks = splitLongTableRow(table, startRow, pageHeight, repeatHeader);
      if (longRowChunks.length > 1) {
        chunks.push(...longRowChunks);
        startRow = endRow;
        continue;
      }
    }

    chunks.push(sliceTableBlock(table, startRow, endRow, repeatHeader));
    startRow = endRow;
  }

  return chunks.length ? chunks : [table];
}

function isSafeTableBreak(table: HwpxTableBlock, breakRow: number): boolean {
  return table.rows.every((row, rowIndex) => {
    return row.cells.every((cell) => {
      const span = Math.max(1, cell.rowSpan);
      return !(rowIndex < breakRow && rowIndex + span > breakRow);
    });
  });
}

function firstBodyRowsHeight(block: HwpxDocumentBlock | undefined, headerRowCount: number): number {
  if (!block || block.type !== 'table') return 0;
  return block.rows.slice(Math.max(0, headerRowCount)).reduce((sum, row) => {
    return sum + tableHeightForPagination(row._hwpxLayout?.heightPx ?? estimateBlocksHeight(row.cells.flatMap((cell) => cell.blocks)));
  }, 0);
}

function appendBodyRowsToTableChunk(
  target: HwpxTableBlock,
  source: HwpxDocumentBlock,
  sourceHeaderRowCount: number
): HwpxTableBlock {
  if (source.type !== 'table') return target;
  const appendedRows = source.rows
    .slice(Math.max(0, sourceHeaderRowCount))
    .map((row, offset) => cloneTableRow(row, target.rows.length + offset));
  if (!appendedRows.length) return target;

  const rows = [...target.rows, ...appendedRows];
  const rowHeightsPx = rows.map((row) => row._hwpxLayout?.heightPx ?? estimateBlocksHeight(row.cells.flatMap((cell) => cell.blocks)));
  return {
    ...target,
    rows,
    _hwpxLayout: {
      ...(target._hwpxLayout ?? {
        heightPx: estimateBlockHeight(target),
        colCount: target.columnWidths?.length ?? 0,
        repeatHeaderRows: 0,
        rowHeightsPx: []
      }),
      heightPx: rowHeightsPx.reduce((sum, height) => sum + height, 0),
      rowHeightsPx,
      source: 'table-row-prefix-continuation'
    }
  };
}

function splitLongTableRow(
  table: HwpxTableBlock,
  rowIndex: number,
  pageHeight: number,
  repeatHeader: boolean
): HwpxDocumentBlock[] {
  const layout = table._hwpxLayout;
  const row = table.rows[rowIndex];
  if (!layout || !row) return [];

  const colCount = Math.max(1, layout.colCount);
  const candidate = row.cells
    .filter((cell) => cell.blocks.length > 1 && cell.colSpan / colCount >= 0.7)
    .sort((left, right) => right.blocks.length - left.blocks.length)[0];
  if (!candidate) return [];

  const headerHeight = repeatHeader
    ? layout.rowHeightsPx.slice(0, layout.repeatHeaderRows).reduce((sum, height) => sum + tableHeightForPagination(height), 0)
    : 0;
  const availableHeight = Math.max(120, pageHeight - headerHeight);
  const sourceHeight = Math.max(row._hwpxLayout?.heightPx ?? 0, candidate.height ?? 0);
  const baseFragmentCount = Math.max(1, Math.ceil(tableHeightForLongRowContinuation(sourceHeight) / availableHeight));
  const fragmentCount = Math.min(20, baseFragmentCount);
  if (fragmentCount <= 1) return [];
  const trailingRowsHeight = trailingShortRowsHeightForReserve(table, rowIndex, availableHeight, baseFragmentCount);
  const fragments = splitLastFragmentForTrailingRows(
    splitBlocksIntoFragments(candidate.blocks as HwpxDocumentBlock[], fragmentCount, availableHeight),
    availableHeight,
    trailingRowsHeight
  );
  if (fragments.length <= 1) return [];

  return fragments.map((fragment, fragmentIndex) => {
    const normalizedFragment = addLongRowContinuationHeaderReserve(
      normalizeLongRowFragmentBlocks(fragment),
      fragmentIndex
    );
    const chunk = sliceTableBlock(table, rowIndex, rowIndex + 1, repeatHeader);
    const bodyRow = chunk.rows[chunk.rows.length - 1];
    const bodyCellIndex = bodyRow.cells.findIndex((cell) => {
      return (cell._hwpxLayout?.colIndex ?? 0) === (candidate._hwpxLayout?.colIndex ?? 0)
        && cell.colSpan === candidate.colSpan;
    });
    const bodyCell = bodyRow.cells[bodyCellIndex];
    const fragmentHeight = Math.max(1, Math.min(availableHeight, estimateBlocksHeight(fragment)));
    const renderFragmentHeight = Math.max(1, Math.min(availableHeight, estimateBlocksHeight(normalizedFragment)));
    const patchedCells = [...bodyRow.cells];

    if (bodyCell) {
      const patchedCell: HwpxTableCell = {
        ...bodyCell,
        blocks: normalizedFragment,
        height: renderFragmentHeight,
        _hwpxLayout: {
          ...(bodyCell._hwpxLayout ?? {
            rowIndex,
            colIndex: bodyCellIndex,
            colSpan: bodyCell.colSpan,
            rowSpan: bodyCell.rowSpan,
            sourceHeightPx: fragmentHeight,
            contentHeightPx: renderFragmentHeight
          }),
          sourceHeightPx: fragmentHeight,
          contentHeightPx: renderFragmentHeight,
          renderHeightPx: renderFragmentHeight
        }
      };
      patchedCells[bodyCellIndex] = patchedCell;
    }

    const patchedBodyRow: HwpxTableRow = {
      ...bodyRow,
      cells: patchedCells,
      _hwpxLayout: {
        rowIndex: bodyRow._hwpxLayout?.rowIndex ?? rowIndex,
        heightPx: fragmentHeight,
        renderHeightPx: renderFragmentHeight
      }
    };
    const patchedRows = [...chunk.rows];
    patchedRows[patchedRows.length - 1] = patchedBodyRow;
    const rowHeightsPx = patchedRows.map((chunkRow) => chunkRow._hwpxLayout?.heightPx ?? 0);
    const renderHeightPx = patchedRows.reduce((sum, chunkRow) => {
      return sum + (chunkRow._hwpxLayout?.renderHeightPx ?? chunkRow._hwpxLayout?.heightPx ?? 0);
    }, 0);
    return {
      ...chunk,
      rows: patchedRows,
      _hwpxLayout: {
        ...(chunk._hwpxLayout ?? layout),
        heightPx: rowHeightsPx.reduce((sum, height) => sum + height, 0),
        renderHeightPx,
        rowHeightsPx,
        source: `table-row-continuation:${fragmentIndex + 1}/${fragments.length}`
      }
    };
  });
}

function trailingShortRowsHeightForReserve(
  table: HwpxTableBlock,
  rowIndex: number,
  availableHeight: number,
  fragmentCount: number
): number {
  if (fragmentCount < 3 || rowIndex >= table.rows.length - 1) return 0;

  const trailingRowsHeight = table.rows.slice(rowIndex + 1).reduce((sum, _row, offset) => {
    return sum + tableRowHeightForPagination(table, rowIndex + 1 + offset);
  }, 0);
  if (trailingRowsHeight <= 0 || trailingRowsHeight > availableHeight * 0.25) return 0;

  const row = table.rows[rowIndex];
  const rowHeight = tableRowHeightForPagination(table, rowIndex);
  const longRowDominatesTail = rowHeight > availableHeight * 2 && rowHeight > trailingRowsHeight * 8;
  const isSingleBodyCell = row?.cells.length === 1 && row.cells[0].colSpan >= Math.max(1, table._hwpxLayout?.colCount ?? 1);
  if (!longRowDominatesTail || !isSingleBodyCell) return 0;

  return trailingRowsHeight;
}

function splitLastFragmentForTrailingRows(
  fragments: HwpxDocumentBlock[][],
  availableHeight: number,
  trailingRowsHeight: number
): HwpxDocumentBlock[][] {
  if (trailingRowsHeight <= 0 || fragments.length < 2) return fragments;

  const last = fragments[fragments.length - 1];
  if (!last?.length || estimateBlocksHeight(last) <= availableHeight * 1.08) return fragments;

  const compactLast = last.map((block) => compactDenseTableForTrailingFragment(block));
  const expandedLast = compactLast.flatMap((block) => splitBlockForTrailingFragment(block, availableHeight));
  const splitIndex = findTrailingFragmentSplitIndex(expandedLast, availableHeight, trailingRowsHeight);
  if (splitIndex <= 0 || splitIndex >= expandedLast.length) return fragments;

  return [
    ...fragments.slice(0, -1),
    expandedLast.slice(0, splitIndex).map(cloneBlock),
    expandedLast.slice(splitIndex).map(cloneBlock)
  ];
}

function compactDenseTableForTrailingFragment(block: HwpxDocumentBlock): HwpxDocumentBlock {
  if (block.type !== 'table') return block;

  const rows = block.rows.map((row) => ({
    ...row,
    cells: row.cells.map((cell) => ({
      ...cell,
      blocks: (cell.blocks as HwpxDocumentBlock[]).map(compactDenseTableForTrailingFragment)
    }))
  }));
  const rowHeightsPx = block._hwpxLayout?.rowHeightsPx
    ?? rows.map((row) => row._hwpxLayout?.heightPx ?? estimateBlocksHeight(row.cells.flatMap((cell) => cell.blocks)));
  const scale = denseTrailingTableRowHeightScale(rowHeightsPx);
  if (scale >= 1) return { ...block, rows };

  const scaledRowHeightsPx = rowHeightsPx.map((height) => Math.max(8, height * scale));
  const scaledRows = rows.map((row, rowIndex): HwpxTableRow => ({
    ...row,
    cells: row.cells.map((cell) => normalizeTrailingDenseCellHeight(cell, scaledRowHeightsPx)),
    _hwpxLayout: {
      ...(row._hwpxLayout ?? { rowIndex }),
      heightPx: scaledRowHeightsPx[rowIndex] ?? row._hwpxLayout?.heightPx ?? 1,
      renderHeightPx: scaledRowHeightsPx[rowIndex] ?? row._hwpxLayout?.renderHeightPx
    }
  }));
  const scaledHeight = scaledRowHeightsPx.reduce((sum, height) => sum + height, 0);

  return {
    ...block,
    rows: scaledRows,
    _hwpxLayout: block._hwpxLayout
      ? {
          ...block._hwpxLayout,
          heightPx: scaledHeight,
          renderHeightPx: scaledHeight,
          rowHeightsPx: scaledRowHeightsPx,
          source: block._hwpxLayout.source ? `${block._hwpxLayout.source}:dense-tail` : 'dense-tail'
        }
      : undefined
  };
}

function denseTrailingTableRowHeightScale(rowHeightsPx: readonly number[]): number {
  const rowCount = rowHeightsPx.length;
  if (rowCount < 40) return 1;

  const totalHeight = rowHeightsPx.reduce((sum, height) => sum + height, 0);
  const compactRows = rowHeightsPx.filter((height) => height <= 28).length;
  if (compactRows / rowCount < 0.78 || totalHeight > rowCount * 36) return 1;

  return 0.70;
}

function normalizeTrailingDenseCellHeight(
  cell: HwpxTableCell,
  rowHeightsPx: readonly number[]
): HwpxTableCell {
  if (!cell._hwpxLayout) return cell;

  const rowIndex = Math.max(0, cell._hwpxLayout.rowIndex);
  const rowSpan = Math.max(1, cell._hwpxLayout.rowSpan);
  const renderHeightPx = rowHeightsPx
    .slice(rowIndex, rowIndex + rowSpan)
    .reduce((sum, height) => sum + height, 0);

  return {
    ...cell,
    _hwpxLayout: {
      ...cell._hwpxLayout,
      renderHeightPx: Math.max(8, renderHeightPx)
    }
  };
}

function splitBlockForTrailingFragment(block: HwpxDocumentBlock, availableHeight: number): HwpxDocumentBlock[] {
  if (block.type !== 'table' || estimateBlockHeight(block) <= availableHeight * 0.92) return [block];
  const splitHeight = Math.max(120, availableHeight * 0.84);
  const chunks = splitTableForPagination(block, splitHeight) as HwpxDocumentBlock[];
  return chunks.length > 1 ? chunks : [block];
}

function findTrailingFragmentSplitIndex(
  blocks: readonly HwpxDocumentBlock[],
  availableHeight: number,
  trailingRowsHeight: number
): number {
  const finalBudget = Math.max(120, availableHeight - trailingRowsHeight);
  const heights = blocks.map((block) => Math.max(1, estimateBlockHeight(block)));
  const totalHeight = heights.reduce((sum, height) => sum + height, 0);
  let headHeight = 0;
  let fallback = -1;

  for (let index = 0; index < heights.length - 1; index += 1) {
    headHeight += heights[index];
    const tailHeight = totalHeight - headHeight;
    if (headHeight <= availableHeight * 1.08) fallback = index + 1;
    if (headHeight <= availableHeight * 1.08 && tailHeight <= finalBudget * 1.08) return index + 1;
  }

  return fallback;
}

function normalizeLongRowFragmentBlocks(blocks: readonly HwpxDocumentBlock[]): HwpxDocumentBlock[] {
  const normalized = blocks.map((block) => normalizeLongRowFragmentBlock(block));
  return normalized.filter((block, index) => {
    return !isCollapsibleLongRowSpacer(block, normalized[index - 1], normalized[index + 1]);
  });
}

function addLongRowContinuationHeaderReserve(
  blocks: readonly HwpxDocumentBlock[],
  fragmentIndex: number
): HwpxDocumentBlock[] {
  const reserveHeight = longRowContinuationHeaderReserveHeight(blocks, fragmentIndex);
  if (reserveHeight <= 0) return [...blocks];
  return [createHwpxFlowSpacer(reserveHeight, 'long-row-continuation-header'), ...blocks];
}

function longRowContinuationHeaderReserveHeight(
  blocks: readonly HwpxDocumentBlock[],
  fragmentIndex: number
): number {
  if (fragmentIndex <= 0) return 0;
  const text = blocks
    .slice(0, 3)
    .map(visibleBlockText)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.includes('분양가상한제 적용주택의 분양가 공개')) {
    return HWPX_PRICE_DISCLOSURE_CONTINUATION_HEADER_RESERVE_PX;
  }
  if (text.includes('성능부문 성능항목 성능등급')) {
    return HWPX_PERFORMANCE_CONTINUATION_HEADER_RESERVE_PX;
  }
  return 0;
}

function createHwpxFlowSpacer(heightPx: number, source: string): HwpxParagraphBlock {
  return {
    type: 'paragraph',
    runs: [{ text: '' }],
    _hwpxLayout: {
      heightPx: Math.max(1, heightPx),
      source
    }
  };
}

function normalizeLongRowFragmentBlock(block: HwpxDocumentBlock): HwpxDocumentBlock {
  if (block.type === 'paragraph') return normalizeLongRowFragmentParagraph(block);
  if (block.type !== 'table') return block;
  return {
    ...block,
    rows: block.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => ({
        ...cell,
        blocks: normalizeLongRowFragmentBlocks(cell.blocks as HwpxDocumentBlock[])
      }))
    }))
  };
}

function normalizeLongRowFragmentParagraph(block: HwpxParagraphBlock): HwpxParagraphBlock {
  const layout = block._hwpxLayout;
  const lineSegments = layout?.lineSegments;
  if (!layout || !lineSegments?.length) return block;

  const stackedLineHeightPx = lineSegments.reduce((sum, segment) => {
    return sum + Math.max(1, Math.round(segment.heightPx));
  }, 0);
  const heightPx = Math.max(1, Math.min(layout.heightPx, stackedLineHeightPx));
  if (heightPx === layout.heightPx) return block;

  return {
    ...block,
    _hwpxLayout: {
      ...layout,
      heightPx,
      source: layout.source ? `${layout.source}:fragment-flow` : 'fragment-flow'
    }
  };
}

function isCollapsibleLongRowSpacer(
  block: HwpxDocumentBlock,
  previous: HwpxDocumentBlock | undefined,
  next: HwpxDocumentBlock | undefined
): boolean {
  if (block.type !== 'paragraph') return false;
  if (block.runs.some((run) => run.text.trim().length > 0)) return false;
  const heightPx = block._hwpxLayout?.heightPx ?? 0;
  if (heightPx < 48) return false;
  return next?.type === 'table' || previous?.type === 'table';
}

function splitBlocksIntoFragments(
  blocks: readonly HwpxDocumentBlock[],
  fragmentCount: number,
  maxFragmentHeight = 0,
  depth = 0
): HwpxDocumentBlock[][] {
  const flowBlocks = blocks.flatMap((block) => splitPageSpanningBlockForFlow(block));
  const expandedBlocks = depth < 3 && maxFragmentHeight > 0
    ? flowBlocks.flatMap((block) => {
        if (block.type !== 'table' || estimateBlockHeight(block) <= maxFragmentHeight * 1.08) return [block];
        return splitTableForPagination(block, maxFragmentHeight) as HwpxDocumentBlock[];
      })
    : flowBlocks;

  if (fragmentCount <= 1 || expandedBlocks.length <= 1) return [expandedBlocks.map(cloneBlock)];

  const weighted = expandedBlocks.map((block) => ({ block, height: Math.max(1, estimateBlockHeight(block)) }));
  const totalHeight = weighted.reduce((sum, item) => sum + item.height, 0);
  const targetFragmentHeight = Math.max(1, Math.ceil(totalHeight / fragmentCount));
  const fragments: HwpxDocumentBlock[][] = [];
  let current: HwpxDocumentBlock[] = [];
  let currentHeight = 0;

  weighted.forEach((item, index) => {
    const remainingBlocks = weighted.length - index;
    const remainingFragments = fragmentCount - fragments.length;
    if (
      current.length
      && fragments.length < fragmentCount - 1
      && currentHeight + item.height > targetFragmentHeight
      && remainingBlocks >= remainingFragments
    ) {
      fragments.push(current);
      current = [];
      currentHeight = 0;
    }
    current.push(cloneBlock(item.block));
    currentHeight += item.height;
  });

  if (current.length) fragments.push(current);
  return rebalanceSectionPreludeFragments(fragments, maxFragmentHeight);
}

function rebalanceSectionPreludeFragments(
  fragments: HwpxDocumentBlock[][],
  maxFragmentHeight: number
): HwpxDocumentBlock[][] {
  const balanced = fragments.map((fragment) => [...fragment]);
  for (let index = 0; index < balanced.length - 1; index += 1) {
    const current = balanced[index];
    const next = balanced[index + 1];
    if (!current.length || !next.length) continue;
    const nextStartsSectionBody = startsWithTable(next) || startsWithSectionBodyContent(next);
    if (!nextStartsSectionBody) continue;

    const preludeStart = trailingSectionPreludeStart(current, maxFragmentHeight);
    const danglingHeadingStart = preludeStart > 0
      ? preludeStart
      : trailingDanglingSectionHeadingStart(current, next);
    if (danglingHeadingStart <= 0) continue;

    const moved = current.splice(danglingHeadingStart);
    balanced[index + 1] = [...moved, ...next];
  }

  return balanced.filter((fragment) => fragment.length > 0);
}

function trailingDanglingSectionHeadingStart(
  fragment: readonly HwpxDocumentBlock[],
  next: readonly HwpxDocumentBlock[]
): number {
  if (!startsWithSectionBodyContent(next)) return -1;
  for (let index = fragment.length - 1; index >= 0; index -= 1) {
    const block = fragment[index];
    if (!visibleBlockText(block)) continue;
    return isSectionHeadingBlock(block) ? index : -1;
  }
  return -1;
}

function startsWithSectionBodyContent(fragment: readonly HwpxDocumentBlock[]): boolean {
  const meaningful = fragment.filter((block) => visibleBlockText(block).length > 0 || block.type === 'table').slice(0, 4);
  if (!meaningful.length) return false;
  if (meaningful[0].type === 'table') return true;
  const firstText = visibleBlockText(meaningful[0]);
  if (!/^[■※\-ㆍ•]/.test(firstText)) return false;
  return meaningful.slice(1).some((block) => block.type === 'table');
}

function trailingSectionPreludeStart(fragment: readonly HwpxDocumentBlock[], maxFragmentHeight: number): number {
  const maxPreludeHeight = Math.max(96, Math.round((maxFragmentHeight || 720) * 0.16));
  let tailHeight = 0;
  let trailingPreludeBlocks = 0;

  for (let index = fragment.length - 1; index >= 0; index -= 1) {
    const block = fragment[index];
    tailHeight += Math.max(1, estimateBlockHeight(block));
    if (tailHeight > maxPreludeHeight) return -1;
    if (isSectionHeadingBlock(block)) return trailingPreludeBlocks >= 2 ? index : -1;
    if (!isSectionPreludeTailBlock(block)) return -1;
    if (visibleBlockText(block)) trailingPreludeBlocks += 1;
  }

  return -1;
}

function startsWithTable(fragment: readonly HwpxDocumentBlock[]): boolean {
  const first = fragment.find((block) => visibleBlockText(block).length > 0 || block.type === 'table');
  return first?.type === 'table';
}

function isSectionPreludeTailBlock(block: HwpxDocumentBlock): boolean {
  if (block.type !== 'paragraph') return false;
  const text = visibleBlockText(block);
  if (!text) return true;
  const height = estimateBlockHeight(block);
  return height <= 80 && /^[■※\-ㆍ•]|^\[[^\]]+\]/.test(text);
}

function isSectionHeadingBlock(block: HwpxDocumentBlock): boolean {
  const height = estimateBlockHeight(block);
  if (height > 96) return false;
  return /^\d+\.\s*\S/.test(visibleBlockText(block));
}

function visibleBlockText(block: HwpxDocumentBlock): string {
  if (block.type === 'paragraph') {
    return block.runs.map((run) => run.text).join('').replace(/\s+/g, ' ').trim();
  }
  if (block.type === 'image') return block.altText.trim();
  return block.rows
    .flatMap((row) => row.cells)
    .flatMap((cell) => cell.blocks as HwpxDocumentBlock[])
    .map(visibleBlockText)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitPageSpanningBlockForFlow(block: HwpxDocumentBlock): HwpxDocumentBlock[] {
  if (block.type === 'paragraph') return splitPageSpanningParagraphForFlow(block);
  if (block.type !== 'table') return [block];
  return [{
    ...block,
    rows: block.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => ({
        ...cell,
        blocks: (cell.blocks as HwpxDocumentBlock[]).flatMap((child) => splitPageSpanningBlockForFlow(child))
      }))
    }))
  }];
}

function splitPageSpanningParagraphForFlow(block: HwpxParagraphBlock): HwpxParagraphBlock[] {
  const layout = block._hwpxLayout;
  const lineSegments = layout?.lineSegments;
  if (!layout || !lineSegments?.length) return [block];

  const groups = groupLineSegmentsByPageFlow(lineSegments);
  if (groups.length <= 1) return [block];

  const totalLength = textRunsLength(block.runs);
  if (totalLength <= 0) return [block];

  return groups.map((group, groupIndex): HwpxParagraphBlock => {
    const start = groupIndex === 0
      ? 0
      : clampNumber(groups[groupIndex][0]?.textPosition ?? 0, 0, totalLength);
    const nextStart = groups[groupIndex + 1]?.[0]?.textPosition;
    const end = clampNumber(nextStart ?? totalLength, start, totalLength);
    const normalizedSegments = normalizeLineSegmentGroupForParagraph(group, start);
    const heightPx = Math.max(1, lineSegmentGroupHeightPx(normalizedSegments));
    return {
      ...block,
      runs: sliceTextRuns(block.runs, start, end),
      _hwpxLayout: {
        ...layout,
        heightPx,
        lineSegments: normalizedSegments,
        source: layout.source ? `${layout.source}:page-flow-part` : 'page-flow-part'
      }
    };
  });
}

function normalizeLineSegmentGroupForParagraph(
  group: readonly HwpxLineSegment[],
  textOffset: number
): HwpxLineSegment[] {
  const top = Math.min(...group.map((segment) => segment.verticalPosition));
  return group.map((segment, index) => ({
    ...segment,
    index,
    textPosition: Math.max(0, segment.textPosition - textOffset),
    verticalPosition: Math.max(0, segment.verticalPosition - top)
  }));
}

function lineSegmentGroupHeightPx(group: readonly HwpxLineSegment[]): number {
  if (!group.length) return 0;
  const top = Math.min(...group.map((segment) => segment.verticalPosition));
  const bottom = Math.max(...group.map((segment) => {
    return segment.verticalPosition + Math.max(segment.verticalSize, segment.textHeight, segment.spacing);
  }));
  return hwpUnitToPx(Math.max(0, bottom - top));
}

function sliceTextRuns(runs: readonly TextRun[], start: number, end: number): TextRun[] {
  const sliced: TextRun[] = [];
  let offset = 0;

  for (const run of runs) {
    const nextOffset = offset + run.text.length;
    if (nextOffset > start && offset < end) {
      const from = Math.max(0, start - offset);
      const to = Math.min(run.text.length, end - offset);
      const text = run.text.slice(from, to);
      if (text.length) sliced.push({ ...run, text });
    }
    offset = nextOffset;
  }

  return sliced.length ? sliced : [{ text: '' }];
}

function sliceTableBlock(table: HwpxTableBlock, startRow: number, endRow: number, repeatHeader: boolean): HwpxTableBlock {
  const layout = table._hwpxLayout;
  const baseLayout = layout ?? {
    heightPx: estimateBlockHeight(table),
    colCount: table.columnWidths?.length ?? 0,
    repeatHeaderRows: 0,
    rowHeightsPx: []
  };
  const headerRows = repeatHeader && layout
    ? table.rows.slice(0, layout.repeatHeaderRows)
    : [];
  const sourceRows = [...headerRows, ...table.rows.slice(startRow, endRow)];
  const rows = sourceRows.map((row, index) => cloneTableRow(row, index));
  const rowHeightsPx = rows.map((row) => row._hwpxLayout?.heightPx ?? estimateBlocksHeight(row.cells.flatMap((cell) => cell.blocks)));

  return {
    ...table,
    rows,
    _hwpxLayout: {
      ...baseLayout,
      heightPx: rowHeightsPx.reduce((sum, height) => sum + height, 0),
      rowHeightsPx,
      position: startRow === 0 ? baseLayout.position : undefined
    }
  };
}

function cloneTableRow(row: HwpxTableRow, rowIndex: number): HwpxTableRow {
  return {
    ...row,
    cells: row.cells.map((cell) => cloneTableCell(cell, rowIndex)),
    _hwpxLayout: {
      rowIndex,
      heightPx: row._hwpxLayout?.heightPx ?? estimateBlocksHeight(row.cells.flatMap((cell) => cell.blocks))
    }
  };
}

function cloneTableCell(cell: HwpxTableCell, rowIndex: number): HwpxTableCell {
  return {
    ...cell,
    blocks: cell.blocks.map((block) => cloneBlock(block as HwpxDocumentBlock)),
    _hwpxLayout: cell._hwpxLayout
      ? {
          ...cell._hwpxLayout,
          rowIndex
        }
      : undefined
  };
}

function cloneBlock(block: HwpxDocumentBlock): HwpxDocumentBlock {
  if (block.type !== 'table') {
    return { ...block };
  }

  return {
    ...block,
    rows: block.rows.map((row, index) => cloneTableRow(row, index)),
    columnWidths: block.columnWidths ? [...block.columnWidths] : undefined,
    _hwpxLayout: block._hwpxLayout
      ? {
          ...block._hwpxLayout,
          rowHeightsPx: [...block._hwpxLayout.rowHeightsPx]
        }
      : undefined
  };
}

function parseParagraphFlow(node: unknown, styles: HwpxStyleContext): HwpxDocumentBlock[] {
  const blocks: HwpxDocumentBlock[] = [];
  const paraStyleId = readAttributeObject(node, 'paraPrIDRef');
  const paragraphStyle = paraStyleId ? styles.paraStyles.get(paraStyleId) : undefined;
  const lineMetrics = readParagraphLineMetrics(node);
  const pageBreak = readAttributeObject(node, 'pageBreak');
  const columnBreak = readAttributeObject(node, 'columnBreak');
  let breakBeforePending = Boolean(paragraphStyle?.breakBefore)
    || isBreakEnabled(pageBreak)
    || hasParagraphBreakControl(node);
  let runs: TextRun[] = [];
  let activeHref = '';

  const paragraphLayout = (heightPx: number): HwpxBlockLayout => ({
    heightPx,
    ...(breakBeforePending ? { breakBefore: true } : {}),
    ...(lineMetrics.lineSegments.length ? { lineSegments: lineMetrics.lineSegments } : {}),
    ...(pageBreak ? { pageBreak } : {}),
    ...(columnBreak ? { source: `columnBreak:${columnBreak}` } : {})
  });

  const pushObjectBlock = (block: HwpxDocumentBlock): void => {
    if (!breakBeforePending) {
      blocks.push(block);
      return;
    }

    blocks.push({
      ...block,
      _hwpxLayout: {
        ...(block._hwpxLayout ?? { heightPx: estimateBlockHeight(block) }),
        breakBefore: true,
        ...(pageBreak ? { pageBreak } : {})
      }
    } as HwpxDocumentBlock);
    breakBeforePending = false;
  };

  const flushParagraph = (force = false): void => {
    if (!force && !runs.some((run) => run.text.length > 0)) {
      runs = [];
      return;
    }
    const finalRuns = runs.length ? runs : [{ text: '' }];
    const heightPx = Math.max(
      lineMetrics.heightPx,
      estimateParagraphTextHeight(finalRuns, paragraphStyle)
    );
    const block: HwpxParagraphBlock = {
      type: 'paragraph',
      styleId: paraStyleId || undefined,
      align: readParagraphAlign(node, paragraphStyle),
      margin: paragraphStyle?.margin,
      textIndent: paragraphStyle?.textIndent,
      lineHeight: paragraphStyle?.lineHeight || (lineMetrics.lineHeightPx > 0 ? `${lineMetrics.lineHeightPx}px` : undefined),
      runs: finalRuns,
      _hwpxLayout: paragraphLayout(heightPx)
    };
    blocks.push({
      ...block,
      _hwpxLayout: paragraphLayout(heightPx)
    });
    breakBeforePending = false;
    runs = [];
  };

  for (const runNode of directChildren(node, 'run')) {
    const charStyleId = readAttributeObject(runNode, 'charPrIDRef');
    const charStyle = charStyleId ? styles.charStyles.get(charStyleId) : undefined;
    const styledRun = (text: string): TextRun => ({
      ...charStyle,
      styleId: charStyleId || charStyle?.styleId,
      ...(activeHref ? { href: activeHref } : {}),
      text
    });

    for (const [key, value] of objectEntries(runNode)) {
      if (isInternalKey(key) || key === 'secPr' || key === 'linesegarray') continue;
      if (key === 'ctrl') {
        for (const ctrlNode of asArray(value)) {
          const hyperlink = readHyperlinkFieldHref(ctrlNode);
          if (hyperlink) activeHref = hyperlink;
          if (activeHref && hasHyperlinkFieldEnd(ctrlNode)) activeHref = '';
        }
        continue;
      }
      if (key === 't') {
        for (const textNode of asArray(value)) {
          runs.push(styledRun(textValue(textNode)));
        }
        continue;
      }
      if (key === 'compose') {
        for (const composeNode of asArray(value)) {
          const text = textValue(composeNode);
          if (text) runs.push(styledRun(text));
        }
        continue;
      }
      if (key === 'tab') {
        runs.push(styledRun('\t'));
        continue;
      }
      if (key === 'lineBreak') {
        runs.push(styledRun('\n'));
        continue;
      }
      if (key === 'pic') {
        flushParagraph();
        for (const picture of asArray(value)) pushObjectBlock(parseImage(picture, styles, lineMetrics));
        continue;
      }
      if (key === 'tbl') {
        flushParagraph();
        for (const table of asArray(value)) pushObjectBlock(parseTable(table, styles, lineMetrics));
      }
    }
  }

  if (!blocks.length && !runs.length) {
    const text = collectDirectParagraphText(node);
    if (text) runs.push({ text });
  }

  const shouldKeepEmptyParagraph = !blocks.length
    && (lineMetrics.heightPx > 0 || breakBeforePending || directChildren(node, 'run').length > 0);
  flushParagraph(shouldKeepEmptyParagraph);
  return blocks;
}

function readHyperlinkFieldHref(ctrlNode: unknown): string {
  for (const fieldBegin of directChildren(ctrlNode, 'fieldBegin')) {
    if (readAttributeObject(fieldBegin, 'type').toUpperCase() !== 'HYPERLINK') continue;
    const parameters = firstDirectChild(fieldBegin, 'parameters');
    const path = readStringParam(parameters, 'Path');
    const command = readStringParam(parameters, 'Command').split(';')[0] || '';
    const href = normalizeHwpxHyperlinkHref(path || command);
    if (href) return href;
  }
  return '';
}

function hasHyperlinkFieldEnd(ctrlNode: unknown): boolean {
  return directChildren(ctrlNode, 'fieldEnd').some((fieldEnd) => {
    const fieldId = readAttributeObject(fieldEnd, 'fieldid');
    return !fieldId || fieldId === '627600491';
  });
}

function readStringParam(parametersNode: unknown, name: string): string {
  for (const param of directChildren(parametersNode, 'stringParam')) {
    if (readAttributeObject(param, 'name') === name) return textValue(param);
  }
  return '';
}

function normalizeHwpxHyperlinkHref(value: string): string {
  const href = value.trim();
  if (!href || /[\u0000-\u001f\u007f]/.test(href)) return '';
  if (/^javascript:/i.test(href)) return '';
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  if (/^www\./i.test(href)) return `https://${href}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(href)) return `https://${href}`;
  return '';
}

function parseTable(node: unknown, styles: HwpxStyleContext, anchor?: HwpxParagraphLineMetrics): HwpxTableBlock {
  const rows: HwpxTableRow[] = [];
  const columnWidthDraft = new Map<number, number>();
  const tablePaint = styles.borderFills.get(readAttributeObject(node, 'borderFillIDRef'));
  const tableSize = firstDirectChild(node, 'sz');
  const tableWidth = hwpUnitAttributeToPx(tableSize, 'width');
  const tableHeight = hwpUnitAttributeToFractionalPx(tableSize, 'height');
  const tablePosition = readHwpxObjectPosition(node, {
    widthPx: tableWidth,
    heightPx: tableHeight,
    source: 'sz'
  }, anchor, 'hwpx-table-pos', true);
  const tableInMargin = firstDirectChild(node, 'inMargin');
  const declaredColCount = readPositiveIntegerAttribute(node, 'colCnt', 0);
  const pageBreak = readAttributeObject(node, 'pageBreak');
  const repeatHeaderRequested = readBooleanAttribute(node, 'repeatHeader');

  for (const [rowIndex, rowNode] of directChildren(node, 'tr').entries()) {
    const cells: HwpxTableCell[] = [];
    for (const cellNode of directChildren(rowNode, 'tc')) {
      const cellAddress = firstDirectChild(cellNode, 'cellAddr');
      const subList = firstDirectChild(cellNode, 'subList');
      const nestedBlocks = subList
        ? parseContainerFlow(subList, styles)
        : parseParagraphFlow(cellNode, styles);
      const cellSize = firstDirectChild(cellNode, 'cellSz');
      const cellSpan = firstDirectChild(cellNode, 'cellSpan');
      const hasOwnMargin = readBooleanAttribute(cellNode, 'hasMargin');
      const cellMargin = hasOwnMargin ? firstDirectChild(cellNode, 'cellMargin') : tableInMargin || firstDirectChild(cellNode, 'cellMargin');
      const colIndex = readNonNegativeIntegerAttribute(cellAddress, 'colAddr', cells.length);
      const rowAddress = readNonNegativeIntegerAttribute(cellAddress, 'rowAddr', rowIndex);
      const colSpan = readPositiveIntegerAttribute(cellSpan, 'colSpan', 1);
      const rowSpan = readPositiveIntegerAttribute(cellSpan, 'rowSpan', 1);
      const width = hwpUnitAttributeToPx(cellSize, 'width');
      const sourceHeight = hwpUnitAttributeToFractionalPx(cellSize, 'height');
      const contentHeight = hwpUnitAttributeToFractionalPx(subList, 'textHeight');
      const nestedHeight = estimateBlocksHeight(nestedBlocks);
      const layoutHeight = Math.max(sourceHeight, contentHeight);
      const height = layoutHeight || nestedHeight;
      const paint = styles.borderFills.get(readAttributeObject(cellNode, 'borderFillIDRef'));

      recordColumnWidth(columnWidthDraft, colIndex, colSpan, width);
      cells.push({
        blocks: nestedBlocks.length ? nestedBlocks : [{ type: 'paragraph', runs: [{ text: '' }] }],
        colSpan,
        rowSpan,
        width: width || undefined,
        height: height || undefined,
        padding: readCellPadding(cellMargin),
        align: readCellAlign(nestedBlocks),
        verticalAlign: normalizeVerticalAlign(readAttributeObject(subList, 'vertAlign')),
        border: paint?.border || tablePaint?.border,
        borderEdges: paint?.borderEdges || tablePaint?.borderEdges,
        background: paint?.background || tablePaint?.background,
        _hwpxLayout: {
          rowIndex: rowAddress,
          colIndex,
          colSpan,
          rowSpan,
          sourceHeightPx: sourceHeight,
          contentHeightPx: contentHeight || nestedHeight,
          ...(readBooleanAttribute(cellNode, 'header') ? { isHeader: true } : {})
        }
      });
    }
    if (cells.length) {
      cells.sort((left, right) => (left._hwpxLayout?.colIndex ?? 0) - (right._hwpxLayout?.colIndex ?? 0));
      rows.push({
        cells,
        _hwpxLayout: {
          rowIndex,
          heightPx: 0
        }
      });
    }
  }

  const rowHeightsPx = computeRowSpanAwareRowHeights(rows);
  const normalizedRows = rows.map((row, rowIndex): HwpxTableRow => ({
    ...row,
    _hwpxLayout: {
      rowIndex: row._hwpxLayout?.rowIndex ?? rowIndex,
      heightPx: rowHeightsPx[rowIndex] ?? estimateBlocksHeight(row.cells.flatMap((cell) => cell.blocks))
    }
  }));
  const computedTableHeight = Math.max(tableHeight, rowHeightsPx.reduce((sum, height) => sum + height, 0));
  const colCount = Math.max(
    declaredColCount,
    ...rows.flatMap((row) => row.cells.map((cell) => (cell._hwpxLayout?.colIndex ?? 0) + cell.colSpan)),
    0
  );
  const columnWidths = buildColumnWidths(columnWidthDraft, colCount, tableWidth);
  const repeatHeaderRows = countRepeatHeaderRows(normalizedRows, repeatHeaderRequested);

  return {
    type: 'table',
    rows: normalizedRows,
    width: tableWidth || undefined,
    columnWidths,
    border: tablePaint?.border,
    borderEdges: tablePaint?.borderEdges,
    background: tablePaint?.background,
    _hwpxLayout: {
      heightPx: computedTableHeight,
      source: 'table-row-height',
      pageBreak,
      colCount,
      repeatHeaderRows,
      rowHeightsPx,
      ...(tablePosition ? { position: tablePosition } : {})
    }
  };
}

function parseImage(node: unknown, styles: HwpxStyleContext, anchor?: HwpxParagraphLineMetrics): HwpxImageBlock {
  const idRef = findFirstAttribute(node, ['binaryItemIDRef', 'binItemIDRef', 'idRef', 'href']);
  const imageSize = readHwpxImageSize(node);
  const width = imageSize.widthPx;
  const height = imageSize.heightPx;
  const position = readHwpxObjectPosition(node, imageSize, anchor, 'hwpx-image-pos', false);
  const outMargin = firstDirectChild(node, 'outMargin');
  const marginHeight = hwpUnitAttributeToPx(outMargin, 'top') + hwpUnitAttributeToPx(outMargin, 'bottom');
  const assetId = idRef && styles.binDataMap.has(idRef) ? idRef : (idRef || 'embedded-image');

  return {
    type: 'image',
    assetId,
    altText: readShapeComment(node) || '이미지',
    width: width || undefined,
    height: height || undefined,
    inline: readAttributeObject(firstDirectChild(node, 'pos'), 'treatAsChar') !== '0',
    _hwpxLayout: {
      heightPx: Math.max(1, height + marginHeight),
      source: `image-size:${imageSize.source}`,
      ...(position ? { position } : {})
    }
  };
}

function readHwpxImageSize(node: unknown): HwpxObjectSize {
  const candidates = ['curSz', 'sz', 'orgSz'] as const;
  let fallback: HwpxObjectSize = { widthPx: 0, heightPx: 0, source: 'missing-size' };

  for (const name of candidates) {
    const sizeNode = firstDirectChild(node, name);
    const size = {
      widthPx: hwpUnitAttributeToPx(sizeNode, 'width'),
      heightPx: hwpUnitAttributeToPx(sizeNode, 'height'),
      source: name
    };
    if (size.widthPx > 0 && size.heightPx > 0) return size;
    if ((size.widthPx > 0 || size.heightPx > 0) && fallback.source === 'missing-size') {
      fallback = size;
    }
  }

  return fallback;
}

function readHwpxObjectPosition(
  node: unknown,
  size: HwpxObjectSize,
  anchor: HwpxParagraphLineMetrics | undefined,
  source: string,
  floatingOnly: boolean
): HwpxPositionLayout | undefined {
  const pos = firstDirectChild(node, 'pos');
  if (!pos) return undefined;

  const treatAsChar = readAttributeObject(pos, 'treatAsChar') !== '0';
  if (floatingOnly && treatAsChar) return undefined;

  const offset = firstDirectChild(node, 'offset');
  const horizontalRelTo = readAttributeObject(pos, 'horzRelTo');
  const verticalRelTo = readAttributeObject(pos, 'vertRelTo');
  const horizontalAlign = readAttributeObject(pos, 'horzAlign');
  const verticalAlign = readAttributeObject(pos, 'vertAlign');
  const positionOffsetLeft = signedHwpUnitAttributeToPx(pos, 'horzOffset');
  const positionOffsetTop = signedHwpUnitAttributeToPx(pos, 'vertOffset');
  const shapeOffsetLeft = signedHwpUnitAttributeToPx(offset, 'x');
  const shapeOffsetTop = signedHwpUnitAttributeToPx(offset, 'y');
  const objectOffsetLeft = Math.round(positionOffsetLeft + shapeOffsetLeft);
  const objectOffsetTop = Math.round(positionOffsetTop + shapeOffsetTop);
  const hasOffset = positionOffsetLeft !== 0
    || positionOffsetTop !== 0
    || shapeOffsetLeft !== 0
    || shapeOffsetTop !== 0;
  const textWrap = readAttributeObject(node, 'textWrap') || readAttributeObject(pos, 'textWrap');
  const flowWithText = readOptionalBooleanAttribute(pos, 'flowWithText');
  const allowOverlap = readOptionalBooleanAttribute(pos, 'allowOverlap');
  const margin = readObjectOutMargin(firstDirectChild(node, 'outMargin'));

  if (!floatingOnly && treatAsChar && !hasOffset) return undefined;

  const anchorPosition = paragraphAnchorPosition(anchor);
  const baseLeft = horizontalRelTo === 'PARA' ? anchorPosition.leftPx : 0;
  const baseTop = verticalRelTo === 'PARA' ? anchorPosition.topPx : 0;
  const zIndex = readNonNegativeIntegerAttribute(node, 'zOrder', 0);

  return {
    leftPx: Math.round(baseLeft + objectOffsetLeft),
    topPx: Math.round(baseTop + objectOffsetTop),
    offsetLeftPx: objectOffsetLeft,
    offsetTopPx: objectOffsetTop,
    ...(size.widthPx > 0 ? { widthPx: size.widthPx } : {}),
    ...(size.heightPx > 0 ? { heightPx: size.heightPx } : {}),
    ...(zIndex > 0 ? { zIndex } : {}),
    source,
    ...(horizontalRelTo ? { horizontalRelTo } : {}),
    ...(verticalRelTo ? { verticalRelTo } : {}),
    ...(horizontalAlign ? { horizontalAlign } : {}),
    ...(verticalAlign ? { verticalAlign } : {}),
    ...(textWrap ? { textWrap } : {}),
    ...(flowWithText !== undefined ? { flowWithText } : {}),
    ...(allowOverlap !== undefined ? { allowOverlap } : {}),
    ...(margin ? { margin } : {})
  };
}

function readObjectOutMargin(node: unknown): BoxSpacing | undefined {
  if (!node) return undefined;
  return {
    left: hwpUnitAttributeToPx(node, 'left'),
    right: hwpUnitAttributeToPx(node, 'right'),
    top: hwpUnitAttributeToPx(node, 'top'),
    bottom: hwpUnitAttributeToPx(node, 'bottom')
  };
}

function paragraphAnchorPosition(metrics: HwpxParagraphLineMetrics | undefined): { readonly leftPx: number; readonly topPx: number } {
  if (!metrics?.lineSegments.length) return { leftPx: 0, topPx: 0 };
  return {
    leftPx: hwpUnitToPx(Math.min(...metrics.lineSegments.map((segment) => segment.horizontalPosition))),
    topPx: hwpUnitToPx(Math.min(...metrics.lineSegments.map((segment) => segment.verticalPosition)))
  };
}

function readPageProfile(root: unknown): HwpxPageProfile {
  const pagePr = firstDescendant(root, 'pagePr');
  if (!pagePr) {
    return {
      layout: DEFAULT_PAGE_LAYOUT,
      contentHeightPx: DEFAULT_PAGE_LAYOUT.height - (DEFAULT_PAGE_LAYOUT.margin.top ?? 0) - (DEFAULT_PAGE_LAYOUT.margin.bottom ?? 0),
      headerFooterHeightPx: 0,
      headerHeightPx: 0,
      footerHeightPx: 0
    };
  }

  const marginNode = firstDirectChild(pagePr, 'margin');
  const headerHeightPx = hwpUnitAttributeToPx(marginNode, 'header');
  const footerHeightPx = hwpUnitAttributeToPx(marginNode, 'footer');
  const headerFooterHeightPx = headerHeightPx + footerHeightPx;
  const reservedDecorationHeightPx = headerHeightPx + footerHeightPx;
  const layout = {
    width: hwpUnitAttributeToPx(pagePr, 'width') || DEFAULT_PAGE_LAYOUT.width,
    height: hwpUnitAttributeToPx(pagePr, 'height') || DEFAULT_PAGE_LAYOUT.height,
    margin: {
      top: hwpUnitAttributeToPx(marginNode, 'top') || DEFAULT_PAGE_LAYOUT.margin.top,
      right: hwpUnitAttributeToPx(marginNode, 'right') || DEFAULT_PAGE_LAYOUT.margin.right,
      bottom: hwpUnitAttributeToPx(marginNode, 'bottom') || DEFAULT_PAGE_LAYOUT.margin.bottom,
      left: hwpUnitAttributeToPx(marginNode, 'left') || DEFAULT_PAGE_LAYOUT.margin.left
    }
  };
  const contentHeightPx = Math.max(
    240,
    layout.height - (layout.margin.top ?? 0) - (layout.margin.bottom ?? 0) - reservedDecorationHeightPx
  );
  return {
    layout,
    contentHeightPx,
    headerFooterHeightPx,
    headerHeightPx,
    footerHeightPx
  };
}

function readParagraphLineMetrics(node: unknown): HwpxParagraphLineMetrics {
  const lineSegments = directChildren(firstDirectChild(node, 'linesegarray'), 'lineseg')
    .map((segmentNode, index) => {
      const verticalSize = readNumberAttribute(segmentNode, 'vertsize');
      const textHeight = readNumberAttribute(segmentNode, 'textheight');
      const spacing = readNumberAttribute(segmentNode, 'spacing');
      const heightHwpUnit = Math.max(verticalSize, textHeight, spacing);
      const segment: HwpxLineSegment = {
        index,
        textPosition: readNumberAttribute(segmentNode, 'textpos'),
        verticalPosition: readNumberAttribute(segmentNode, 'vertpos'),
        verticalSize,
        textHeight,
        baseline: readNumberAttribute(segmentNode, 'baseline'),
        spacing,
        horizontalPosition: readNumberAttribute(segmentNode, 'horzpos'),
        horizontalSize: readNumberAttribute(segmentNode, 'horzsize'),
        flags: readNumberAttribute(segmentNode, 'flags'),
        heightPx: hwpxLineSegmentHeightToPx(heightHwpUnit)
      };
      return segment;
    })
    .filter((segment) => segment.heightPx > 0);

  if (!lineSegments.length) {
    return { heightPx: 0, lineHeightPx: 0, pageSpanCount: 0, lineSegments: [] };
  }

  const segmentGroups = groupLineSegmentsByPageFlow(lineSegments);
  const totalHeightPx = hwpUnitToPx(segmentGroups.reduce((sum, group) => {
    const top = Math.min(...group.map((segment) => segment.verticalPosition));
    const bottom = Math.max(...group.map((segment) => {
      return segment.verticalPosition + Math.max(segment.verticalSize, segment.textHeight, segment.spacing);
    }));
    return sum + Math.max(0, bottom - top);
  }, 0));
  const averageLineHeightPx = Math.round(
    lineSegments.reduce((sum, segment) => sum + segment.heightPx, 0) / lineSegments.length
  );

  return {
    heightPx: totalHeightPx,
    lineHeightPx: Math.max(1, averageLineHeightPx),
    pageSpanCount: segmentGroups.length,
    lineSegments
  };
}

function groupLineSegmentsByPageFlow(lineSegments: readonly HwpxLineSegment[]): HwpxLineSegment[][] {
  const groups: HwpxLineSegment[][] = [];
  let current: HwpxLineSegment[] = [];
  let previousTop = Number.NEGATIVE_INFINITY;

  for (const segment of lineSegments) {
    if (current.length && segment.verticalPosition < previousTop) {
      groups.push(current);
      current = [];
    }
    current.push(segment);
    previousTop = segment.verticalPosition;
  }

  if (current.length) groups.push(current);
  return groups;
}

function estimateBlockHeight(block: HwpxDocumentBlock): number {
  if (block._hwpxLayout?.heightPx && block._hwpxLayout.heightPx > 0) return block._hwpxLayout.heightPx;
  if (block.type === 'paragraph') return estimateParagraphTextHeight(block.runs, block);
  if (block.type === 'image') return Math.max(1, block.height ?? 96);
  return Math.max(1, block.rows.reduce((sum, row) => {
    return sum + (row._hwpxLayout?.heightPx ?? estimateBlocksHeight(row.cells.flatMap((cell) => cell.blocks)));
  }, 0));
}

function estimatePaginationHeight(block: HwpxDocumentBlock): number {
  if (block.type !== 'table') return estimateBlockHeight(block);
  const layout = block._hwpxLayout;
  if (!layout) return tableHeightForPagination(estimateBlockHeight(block));
  const tableHeight = layout.rowHeightsPx.reduce((sum, height) => sum + tableHeightForPagination(height), 0);
  const flowMargin = isHwpxPositionedTableFlowBlock(block) ? boxVertical(layout.position?.margin) : 0;
  return Math.max(1, tableHeight + flowMargin);
}

function tableRowHeightForPagination(table: HwpxTableBlock, rowIndex: number): number {
  const rowHeight = table._hwpxLayout?.rowHeightsPx[rowIndex]
    ?? table.rows[rowIndex]?._hwpxLayout?.heightPx
    ?? 1;
  return tableHeightForPagination(rowHeight);
}

function tableHeightForPagination(height: number): number {
  return Math.max(1, Math.round(Math.max(1, height) * HWPX_TABLE_PAGINATION_SCALE));
}

function tableHeightForLongRowContinuation(height: number): number {
  return Math.max(1, Math.round(Math.max(1, height) * HWPX_LONG_ROW_PAGINATION_SCALE));
}

function estimateBlocksHeight(blocks: readonly DocumentBlock[]): number {
  return blocks.reduce((sum, block) => sum + estimateBlockHeight(block as HwpxDocumentBlock), 0);
}

function textRunsLength(runs: readonly TextRun[]): number {
  return runs.reduce((sum, run) => sum + run.text.length, 0);
}

function estimateParagraphTextHeight(runs: readonly TextRun[], paragraphStyle?: Pick<ParagraphBlock, 'margin'>): number {
  const text = runs.map((run) => run.text).join('');
  const explicitLines = Math.max(1, text.split('\n').length);
  const charCount = text.replace(/\s+/g, '').length;
  const wrappedLines = Math.max(explicitLines, Math.ceil(charCount / 80) || 1);
  const fontSizePt = runs.reduce((max, run) => Math.max(max, run.fontSizePt ?? 0), 0) || 11;
  const lineHeightPx = Math.max(14, Math.round(fontSizePt * (96 / 72) * 1.35));
  return Math.max(1, wrappedLines * lineHeightPx + boxVertical(paragraphStyle?.margin));
}

function boxVertical(spacing: BoxSpacing | undefined): number {
  return Math.max(0, spacing?.top ?? 0) + Math.max(0, spacing?.bottom ?? 0);
}

function recordColumnWidth(widths: Map<number, number>, colIndex: number, colSpan: number, width: number): void {
  if (width <= 0) return;
  const safeSpan = Math.max(1, colSpan);
  const perColumnWidth = Math.round(width / safeSpan);
  for (let offset = 0; offset < safeSpan; offset += 1) {
    const index = colIndex + offset;
    widths.set(index, Math.max(widths.get(index) ?? 0, perColumnWidth));
  }
}

function buildColumnWidths(widths: Map<number, number>, colCount: number, tableWidth: number): number[] | undefined {
  const safeColCount = Math.max(0, colCount);
  if (!safeColCount) return undefined;
  const fallbackWidth = tableWidth > 0 ? Math.max(1, Math.round(tableWidth / safeColCount)) : 1;
  const result = Array.from({ length: safeColCount }, (_value, index) => widths.get(index) || fallbackWidth);
  return result.some((width) => width > 0) ? result : undefined;
}

function readCellAlign(blocks: readonly HwpxDocumentBlock[]): TableCell['align'] {
  const paragraph = blocks.find((block) => block.type === 'paragraph');
  return paragraph?.type === 'paragraph' ? paragraph.align : undefined;
}

function computeRowSpanAwareRowHeights(rows: readonly HwpxTableRow[]): number[] {
  const rowCount = rows.length;
  const heights = Array.from({ length: rowCount }, () => 0);
  if (!rowCount) return heights;
  const spanningCells: Array<{
    readonly rowIndex: number;
    readonly rowSpan: number;
    readonly totalHeight: number;
  }> = [];

  rows.forEach((row, physicalRowIndex) => {
    row.cells.forEach((cell) => {
      const layout = cell._hwpxLayout;
      const rawRowIndex = layout?.rowIndex ?? physicalRowIndex;
      const rowIndex = Math.min(rowCount - 1, Math.max(0, rawRowIndex));
      const rowSpan = Math.max(1, Math.min(layout?.rowSpan ?? cell.rowSpan, rowCount - rowIndex));
      const declaredHeight = declaredCellHeight(cell);
      const estimatedContentHeight = estimateBlocksHeight(cell.blocks as HwpxDocumentBlock[]) + boxVertical(cell.padding);
      const totalHeight = Math.max(declaredHeight, estimatedContentHeight);
      if (rowSpan > 1) {
        spanningCells.push({ rowIndex, rowSpan, totalHeight });
        return;
      }

      heights[rowIndex] = Math.max(heights[rowIndex], totalHeight);
    });
  });

  for (const cell of spanningCells) {
    const coveredIndexes = Array.from({ length: cell.rowSpan }, (_value, offset) => cell.rowIndex + offset)
      .filter((index) => index >= 0 && index < rowCount);
    if (!coveredIndexes.length) continue;

    const coveredHeight = coveredIndexes.reduce((sum, index) => sum + heights[index], 0);
    const deficit = Math.max(0, cell.totalHeight - coveredHeight);
    if (deficit <= 0) continue;

    const distributed = deficit / coveredIndexes.length;
    for (const index of coveredIndexes) {
      heights[index] += distributed;
    }
  }

  return heights.map((height, rowIndex) => {
    if (height > 0) return Math.max(1, height);
    return Math.max(1, estimateBlocksHeight(rows[rowIndex]?.cells.flatMap((cell) => cell.blocks) ?? []));
  });
}

function declaredCellHeight(cell: HwpxTableCell): number {
  const layout = cell._hwpxLayout;
  return Math.max(
    layout?.sourceHeightPx ?? 0,
    layout?.contentHeightPx ?? 0,
    cell.height ?? 0
  );
}

function countRepeatHeaderRows(rows: readonly HwpxTableRow[], repeatHeaderRequested: boolean): number {
  if (!repeatHeaderRequested) return 0;
  let count = 0;
  for (const row of rows) {
    if (!row.cells.some((cell) => cell._hwpxLayout?.isHeader)) break;
    count += 1;
  }
  return count;
}

function hasParagraphBreakControl(node: unknown): boolean {
  return directChildren(node, 'run').some((runNode) => {
    return directChildren(runNode, 'ctrl').some((ctrlNode) => {
      return hasDirectChild(ctrlNode, 'pageBreak') || hasDirectChild(ctrlNode, 'columnBreak');
    });
  });
}

function isBreakEnabled(value: string): boolean {
  if (!value) return false;
  const normalized = value.trim().toUpperCase();
  return normalized !== '0' && normalized !== 'FALSE' && normalized !== 'NONE';
}

function isUnderlineEnabled(node: unknown): boolean {
  return directChildren(node, 'underline').some((underlineNode) => {
    const type = readAttributeObject(underlineNode, 'type');
    if (type) return isBreakEnabled(type);
    const shape = readAttributeObject(underlineNode, 'shape');
    return shape ? isBreakEnabled(shape) : true;
  });
}

function isStrikeoutEnabled(node: unknown): boolean {
  return directChildren(node, 'strikeout').some((strikeoutNode) => {
    const shape = readAttributeObject(strikeoutNode, 'shape') || readAttributeObject(strikeoutNode, 'type');
    return shape ? isBreakEnabled(shape) : true;
  });
}

function readParagraphAlign(node: unknown, paragraphStyle?: Partial<ParagraphBlock>): ParagraphBlock['align'] {
  return normalizeAlign(readAttributeObject(node, 'align') || readAttributeObject(node, 'horizontalAlign')) || paragraphStyle?.align || 'left';
}

function readFontFamily(node: unknown, fonts: Map<string, string>): string {
  const fontRef = firstDescendant(node, 'fontRef');
  const fontId = readAttributeObject(fontRef, 'hangul')
    || readAttributeObject(fontRef, 'latin')
    || readAttributeObject(fontRef, 'other')
    || readAttributeObject(node, 'fontRef');
  return fontId ? (fonts.get(fontId) || '') : '';
}

function readCellPadding(node: unknown): BoxSpacing | undefined {
  if (!node) return undefined;
  return {
    left: hwpUnitAttributeToPx(node, 'left'),
    right: hwpUnitAttributeToPx(node, 'right'),
    top: hwpUnitAttributeToPx(node, 'top'),
    bottom: hwpUnitAttributeToPx(node, 'bottom')
  };
}

function readShapeComment(node: unknown): string {
  const comment = firstDescendant(node, 'shapeComment');
  return textValue(comment).trim();
}

function collectDirectParagraphText(node: unknown): string {
  return directChildren(node, 'run')
    .flatMap((runNode) => directChildren(runNode, 't').map(textValue))
    .join('');
}

function borderEdgesFromBorderFillNode(node: unknown): BorderEdges | undefined {
  const edges: BorderEdges = {
    top: borderEdgeFromNode(firstDirectChild(node, 'topBorder')),
    right: borderEdgeFromNode(firstDirectChild(node, 'rightBorder')),
    bottom: borderEdgeFromNode(firstDirectChild(node, 'bottomBorder')),
    left: borderEdgeFromNode(firstDirectChild(node, 'leftBorder'))
  };
  return hasAnyBorderEdge(edges) ? edges : undefined;
}

function borderEdgeFromNode(node: unknown): string | undefined {
  if (!node) return undefined;
  const borderType = readAttributeObject(node, 'type');
  if (!borderType || borderType === 'NONE') return '0 none transparent';
  const width = readAttributeObject(node, 'width') || '0.12 mm';
  const color = normalizeColor(readAttributeObject(node, 'color')) || '#000000';
  return `${borderWidthToPx(width)}px ${hwpxBorderTypeToCss(borderType)} ${color}`;
}

function firstVisibleBorderEdge(edges: BorderEdges | undefined): string | undefined {
  if (!edges) return undefined;
  return [edges.top, edges.right, edges.bottom, edges.left]
    .find((edge) => Boolean(edge && !edge.startsWith('0 none')));
}

function hasAnyBorderEdge(edges: BorderEdges): boolean {
  return Boolean(edges.top || edges.right || edges.bottom || edges.left);
}

function borderWidthToPx(width: string): number {
  const numeric = Number(width.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) return 1;
  if (width.includes('mm')) return Math.max(0.5, Math.min(8, Math.round(numeric * 3.78 * 10) / 10));
  return Math.max(0.5, Math.min(8, Math.round(numeric * 10) / 10));
}

function hwpxBorderTypeToCss(type: string): string {
  switch (type) {
    case 'SOLID':
      return 'solid';
    case 'DASH':
    case 'DASH_DOT':
    case 'DASH_DOT_DOT':
    case 'LONG_DASH':
      return 'dashed';
    case 'DOT':
      return 'dotted';
    case 'DOUBLE':
    case 'DOUBLE_SLIM':
    case 'SLIM_THICK':
    case 'THICK_SLIM':
    case 'SLIM_THICK_SLIM':
      return 'double';
    default:
      return 'solid';
  }
}

function findNamedChildren(node: unknown, name: string): unknown[] {
  const found: unknown[] = [];
  visitXml(node, (childName, child) => {
    if (childName === name) found.push(child);
  });
  return found;
}

function directChildren(node: unknown, name: string): unknown[] {
  if (!isObject(node)) return [];
  return asArray(node[name]);
}

function firstDirectChild(node: unknown, name: string): unknown {
  return directChildren(node, name)[0];
}

function firstDescendant(node: unknown, name: string): unknown {
  let result: unknown;
  visitXml(node, (childName, child) => {
    if (result === undefined && childName === name) result = child;
  });
  return result;
}

function hasDirectChild(node: unknown, name: string): boolean {
  return directChildren(node, name).length > 0;
}

function visitXml(node: unknown, visitor: (name: string, node: unknown) => void): void {
  if (Array.isArray(node)) {
    for (const item of node) visitXml(item, visitor);
    return;
  }
  if (!isObject(node)) return;

  for (const [key, value] of Object.entries(node)) {
    if (isInternalKey(key)) continue;
    for (const child of asArray(value)) {
      visitor(key, child);
      visitXml(child, visitor);
    }
  }
}

function unwrapKnownRoot(node: unknown, names: string[]): unknown {
  let current = node;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!isObject(current)) return current;
    const currentObject = current;
    const nextKey = names.find((name) => currentObject[name] !== undefined)
      || Object.keys(currentObject).find((key) => !isInternalKey(key));
    if (!nextKey) return current;
    const nextValue = currentObject[nextKey];
    current = Array.isArray(nextValue) ? nextValue[0] : nextValue;
    if (names.includes(nextKey)) return current;
  }
  return current;
}

function findFirstAttribute(node: unknown, names: string[]): string {
  let result = '';
  visitXml(node, (_name, child) => {
    if (result || !isObject(child)) return;
    for (const attributeName of names) {
      const value = readAttribute(child, attributeName);
      if (value) {
        result = value;
        return;
      }
    }
  });
  if (!result && isObject(node)) {
    for (const attributeName of names) {
      const value = readAttribute(node, attributeName);
      if (value) return value;
    }
  }
  return result;
}

function readAttributeObject(node: unknown, name: string): string {
  return isObject(node) ? readAttribute(node, name) : '';
}

function readAttribute(node: XmlObject, name: string): string {
  const direct = node[`@_${name}`];
  if (typeof direct === 'string' || typeof direct === 'number') return String(direct);
  const prefixed = Object.entries(node).find(([key]) => {
    return key.startsWith('@_') && key.slice(2).split(':').pop() === name;
  })?.[1];
  if (typeof prefixed === 'string' || typeof prefixed === 'number') return String(prefixed);
  return '';
}

function readNumberAttribute(node: unknown, name: string): number {
  const value = Number(readAttributeObject(node, name));
  return Number.isFinite(value) ? value : 0;
}

function readBooleanAttribute(node: unknown, name: string): boolean {
  const value = readAttributeObject(node, name).trim().toUpperCase();
  return value === '1' || value === 'TRUE' || value === 'YES';
}

function readOptionalBooleanAttribute(node: unknown, name: string): boolean | undefined {
  const value = readAttributeObject(node, name).trim().toUpperCase();
  if (!value) return undefined;
  return value === '1' || value === 'TRUE' || value === 'YES';
}

function readPositiveIntegerAttribute(node: unknown, name: string, fallback: number): number {
  const value = readNumberAttribute(node, name);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function readNonNegativeIntegerAttribute(node: unknown, name: string, fallback: number): number {
  const value = readNumberAttribute(node, name);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function hwpUnitAttributeToPx(node: unknown, name: string): number {
  const value = readNumberAttribute(node, name);
  return hwpUnitToPx(value);
}

function hwpUnitAttributeToFractionalPx(node: unknown, name: string): number {
  const value = readNumberAttribute(node, name);
  return value > 0 ? value / HWPUNIT_PER_PX : 0;
}

function signedHwpUnitAttributeToPx(node: unknown, name: string): number {
  const value = normalizeSigned32(readNumberAttribute(node, name));
  return value === 0 ? 0 : Math.round(value / HWPUNIT_PER_PX);
}

function hwpUnitToPx(value: number): number {
  return value > 0 ? Math.round(value / HWPUNIT_PER_PX) : 0;
}

function hwpxLineSegmentHeightToPx(value: number): number {
  return value > 0 ? Math.max(1, Math.round((value / HWPUNIT_PER_PX) * 0.97)) : 0;
}

function normalizeSigned32(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value > 0x7fffffff ? value - 0x100000000 : value;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function objectEntries(node: unknown): [string, unknown][] {
  return isObject(node) ? Object.entries(node) : [];
}

function isObject(value: unknown): value is XmlObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInternalKey(key: string): boolean {
  return key.startsWith('@_') || key === '#text';
}

function textValue(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (isObject(node)) {
    const direct = node['#text'];
    if (typeof direct === 'string' || typeof direct === 'number') return String(direct);
  }
  return '';
}

function normalizeAlign(value: string): ParagraphBlock['align'] | undefined {
  const upper = value.toUpperCase();
  if (upper === 'CENTER') return 'center';
  if (upper === 'RIGHT') return 'right';
  if (upper === 'JUSTIFY' || upper === 'DISTRIBUTE' || upper === 'JUSTIFY_LOW') return 'justify';
  if (upper === 'LEFT') return 'left';
  return undefined;
}

function normalizeVerticalAlign(value: string): TableCell['verticalAlign'] | undefined {
  const upper = value.toUpperCase();
  if (upper === 'CENTER' || upper === 'MIDDLE') return 'middle';
  if (upper === 'BOTTOM') return 'bottom';
  if (upper === 'TOP') return 'top';
  return undefined;
}

function isTopAndBottomTextWrap(value: string | undefined): boolean {
  const normalized = value?.trim().replace(/_/g, '-').toLowerCase();
  return normalized === 'top-and-bottom';
}

function normalizeColor(value: string): string {
  if (!value || value === 'none') return '';
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{8}$/i.test(value)) return `#${value.slice(3)}`;
  return '';
}

function normalizeAssetPath(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  return normalized.startsWith('BinData/') ? normalized : `BinData/${normalized}`;
}

function assetIdFromPath(path: string): string {
  const filename = path.split('/').pop() || path;
  return filename.replace(/\.[^.]+$/, '') || path;
}

function inferMimeType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}
