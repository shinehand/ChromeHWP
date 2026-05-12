import { CfbReader } from './cfb-reader';
import { decompressSync, inflateSync } from 'fflate';
import { decodeParaText, HWP_TAG, scanUtf16Text } from './hwp-records';
import { assertReadableHwpHeader, decodeRecordStream, parseHwpFileHeader, readUInt16, readUInt32 } from './hwp-streams';
const HWPUNIT_PER_PX = 75;
const PT_TO_PX = 96 / 72;
const MIN_PARAGRAPH_HEIGHT_PX = 12;
const MIN_TABLE_ROW_HEIGHT_PX = 14;
const MAX_LINE_SEGMENT_HEIGHT_PX = 240;
const TABLE_BORDER_ESTIMATE_PX = 1;
const BLOCK_GAP_PX = 6;
const PAGE_PACK_TOLERANCE = 1.18;
const TABLE_SPLIT_TOLERANCE = 1.2;
const PAGE_COORDINATE_RESET_TOP_PX = 140;
const PAGE_COORDINATE_RESET_MIN_PREVIOUS_BOTTOM_PX = 480;
const PAGE_COORDINATE_RESET_OVERLAP_PX = 80;
const POSITIONED_FLOW_CLEARANCE_PX = 48;
const DEFAULT_PAGE_LAYOUT = {
    width: 794,
    height: 1123,
    margin: { top: 72, right: 80, bottom: 72, left: 80 }
};
const paragraphMetrics = new WeakMap();
export async function parseHwp(input) {
    const cfb = CfbReader.open(input.bytes);
    const fileHeader = parseHwpFileHeader(cfb.readStream('FileHeader'));
    assertReadableHwpHeader(fileHeader);
    const warnings = [];
    const docInfo = parseDocInfo(cfb, fileHeader.flags.compressed, warnings);
    const sectionEntries = findSectionEntries(cfb, fileHeader.flags.distributed);
    if (!sectionEntries.length)
        throw new Error('HWP 본문 Section 스트림을 찾지 못했습니다.');
    const assets = collectBinDataAssets(cfb, docInfo);
    const stats = emptyParseStats();
    const context = {
        docInfo,
        imageResolver: new HwpImageResolver(assets, docInfo.binDataRefs),
        stats,
        nonBodyControls: []
    };
    const sections = sectionEntries.map((entry) => {
        const sectionBytes = cfb.readStream(entry);
        const decoded = decodeRecordStream(sectionBytes, fileHeader.flags.compressed);
        return parseSection(decoded.records, decoded.bytes, warnings, context);
    });
    const pages = paginateSections(sections, context);
    if (docInfo.sectionCount > 0 && docInfo.sectionCount !== sectionEntries.length) {
        warnings.push(`DocInfo 구역 수(${docInfo.sectionCount})와 실제 Section 스트림 수(${sectionEntries.length})가 다릅니다.`);
    }
    if (stats.unresolvedImageCount > 0) {
        warnings.push(`그림 레코드 ${stats.unresolvedImageCount}개를 BinData 자산과 연결하지 못했습니다.`);
    }
    return {
        format: 'hwp',
        title: input.filename,
        metadata: {
            sectionCount: sectionEntries.length,
            assetCount: assets.length,
            parser: 'hwp-ms-cfb-records',
            warnings,
            details: {
                version: fileHeader.version,
                compressed: fileHeader.flags.compressed,
                distributed: fileHeader.flags.distributed,
                docInfoSectionCount: docInfo.sectionCount,
                docInfoRecordCount: docInfo.recordCount,
                fontCount: docInfo.fonts.length,
                fonts: docInfo.fonts,
                binDataCount: docInfo.binDataCount,
                borderFillCount: docInfo.borderFillCount,
                charShapeCount: docInfo.charShapeCount,
                paraShapeCount: docInfo.paraShapeCount,
                paragraphCount: stats.paragraphCount,
                tableCount: stats.tableCount,
                tableCellCount: stats.tableCellCount,
                listHeaderCount: stats.listHeaderCount,
                controlCount: stats.controlCount,
                pictureRecordCount: stats.pictureRecordCount,
                imageCount: stats.imageCount,
                unresolvedImageCount: stats.unresolvedImageCount,
                pageDefCount: stats.pageDefCount,
                pageNumParaCount: stats.pageNumParaCount,
                headerControlCount: stats.headerControlCount,
                footerControlCount: stats.footerControlCount,
                sectionControlCount: stats.sectionControlCount,
                preservedNonBodyControlCount: stats.preservedNonBodyControlCount,
                headerDecorationBlockCount: stats.headerDecorationBlockCount,
                footerDecorationBlockCount: stats.footerDecorationBlockCount,
                tableSplitPolicyNoneCount: stats.tableSplitPolicyNoneCount,
                tableSplitPolicyCellCount: stats.tableSplitPolicyCellCount,
                tableSplitPolicySplitCount: stats.tableSplitPolicySplitCount,
                tableSplitPolicyUnknownCount: stats.tableSplitPolicyUnknownCount,
                lineSegmentCount: stats.lineSegmentCount,
                estimatedPageCount: stats.estimatedPageCount,
                pageSplitCount: stats.pageSplitCount,
                splitTableCount: stats.splitTableCount,
                hwpNonBodyControlsJson: JSON.stringify(context.nonBodyControls.slice(0, 100)),
                pageWidths: pages.map((page) => page.layout?.width ?? 0),
                pageHeights: pages.map((page) => page.layout?.height ?? 0)
            }
        },
        pages,
        assets
    };
}
function parseDocInfo(cfb, compressed, warnings) {
    const entry = cfb.findEntry('DocInfo');
    if (!entry) {
        warnings.push('DocInfo 스트림을 찾지 못했습니다.');
        return emptyDocInfo();
    }
    const decoded = decodeRecordStream(cfb.readStream(entry), compressed);
    const idMappingCounts = [];
    const fonts = [];
    const binDataRefs = [];
    const borderFills = [];
    const charShapes = [];
    const paraShapes = [];
    let sectionCount = 0;
    let binDataCount = 0;
    let borderFillCount = 0;
    let charShapeCount = 0;
    let paraShapeCount = 0;
    let faceNameId = 0;
    let binDataRefId = 1;
    let borderFillId = 1;
    for (const record of decoded.records) {
        if (record.tagId === HWP_TAG.DOCUMENT_PROPERTIES && record.body.length >= 2) {
            sectionCount = readUInt16(record.body, 0);
        }
        if (record.tagId === HWP_TAG.ID_MAPPINGS) {
            for (let offset = 0; offset + 4 <= record.body.length; offset += 4) {
                idMappingCounts.push(readUInt32(record.body, offset));
            }
        }
        if (record.tagId === HWP_TAG.BIN_DATA) {
            const binDataRef = parseBinDataRef(record.body, binDataRefId);
            if (binDataRef)
                binDataRefs.push(binDataRef);
            binDataRefId += 1;
            binDataCount += 1;
        }
        if (record.tagId === HWP_TAG.FACE_NAME) {
            const font = parseFaceName(record.body);
            if (font)
                fonts[faceNameId] = font;
            faceNameId += 1;
        }
        if (record.tagId === HWP_TAG.BORDER_FILL) {
            borderFills[borderFillId] = parseBorderFill(record.body);
            borderFillId += 1;
            borderFillCount += 1;
        }
        if (record.tagId === HWP_TAG.CHAR_SHAPE) {
            charShapes[charShapeCount] = parseCharShape(record.body, fonts);
            charShapeCount += 1;
        }
        if (record.tagId === HWP_TAG.PARA_SHAPE) {
            paraShapes[paraShapeCount] = parseParaShape(record.body);
            paraShapeCount += 1;
        }
    }
    return {
        sectionCount,
        idMappingCounts,
        fonts: uniqueStrings(fonts).slice(0, 80),
        binDataRefs,
        borderFills,
        charShapes,
        paraShapes,
        binDataCount,
        borderFillCount,
        charShapeCount,
        paraShapeCount,
        recordCount: decoded.records.length
    };
}
function parseSection(records, decodedBytes, warnings, context) {
    const layout = findSectionPageLayout(records, context);
    const pageNumbering = records.some((record) => record.tagId === HWP_TAG.PAGE_NUM_PARA);
    if (pageNumbering) {
        context.stats.pageNumParaCount += records.filter((record) => record.tagId === HWP_TAG.PAGE_NUM_PARA).length;
    }
    const artifacts = emptySectionArtifacts();
    const parsed = parseBlockRange(records, 0, null, context, artifacts, { topLevelBody: true });
    const blocks = parsed.blocks;
    const headerDecorations = buildHeaderFooterDecorations(artifacts.headerAreas, 'header', layout ?? DEFAULT_PAGE_LAYOUT, context);
    const footerDecorations = buildHeaderFooterDecorations(artifacts.footerAreas, 'footer', layout ?? DEFAULT_PAGE_LAYOUT, context);
    const resolvedLayout = layout
        ? mergeDecorationInset(layout, headerDecorations, footerDecorations)
        : layout;
    if (!blocks.length) {
        const recovered = scanUtf16Text(decodedBytes);
        if (recovered) {
            blocks.push(createParagraphBlock(recovered, context));
            warnings.push('본문 레코드 구조 해석 대신 UTF-16 텍스트 복구를 사용했습니다.');
        }
    }
    return {
        blocks,
        ...(resolvedLayout ? { layout: resolvedLayout } : {}),
        ...(pageNumbering ? { pageNumbering: true } : {}),
        ...(headerDecorations.length ? { headerDecorations } : {}),
        ...(footerDecorations.length ? { footerDecorations } : {})
    };
}
function emptySectionArtifacts() {
    return {
        headerAreas: [],
        footerAreas: [],
        sectionControls: []
    };
}
function buildHeaderFooterDecorations(areas, zone, layout, context) {
    const bodyWidth = pageBodyWidth(layout);
    const bodyHeight = Math.max(0, layout.height - (layout.margin.top ?? 0) - (layout.margin.bottom ?? 0));
    const footerInset = Math.max(0, layout.decorationInset?.bottom ?? 0);
    const footerTop = Math.max(0, bodyHeight - Math.max(footerInset, 1));
    const source = zone === 'header' ? 'hwpx-header-hwp-control' : 'hwpx-footer-hwp-control';
    const blocks = [];
    let cursorTop = 0;
    for (const area of areas) {
        for (const block of area.blocks) {
            const decorated = cloneDecorationBlock(block, source, zone === 'footer' ? footerTop : 0, cursorTop, bodyWidth);
            blocks.push(decorated);
            cursorTop += estimateBlockHeight(decorated, bodyWidth) + 2;
        }
    }
    if (zone === 'header')
        context.stats.headerDecorationBlockCount += blocks.length;
    else
        context.stats.footerDecorationBlockCount += blocks.length;
    return blocks;
}
function cloneDecorationBlock(block, source, baseTopPx, fallbackTopPx, bodyWidth) {
    const heightPx = estimateBlockHeight(block, bodyWidth);
    const position = resolveDecorationPosition(block, baseTopPx, fallbackTopPx, bodyWidth, heightPx, source);
    const baseLayout = block._hwpxLayout ?? { heightPx };
    const nextLayout = {
        ...baseLayout,
        heightPx: Math.max(1, Math.round(baseLayout.heightPx || heightPx)),
        source,
        position
    };
    if (block.type === 'paragraph') {
        return { ...block, _hwpxLayout: nextLayout };
    }
    if (block.type === 'table') {
        return { ...block, _hwpxLayout: nextLayout };
    }
    return { ...block, inline: false, _hwpxLayout: nextLayout };
}
function resolveDecorationPosition(block, baseTopPx, fallbackTopPx, bodyWidth, heightPx, source) {
    const existing = block._hwpxLayout?.position;
    const inferred = existing ?? inferDecorationParagraphPosition(block);
    const rawTop = inferred?.topPx ?? fallbackTopPx;
    const topPx = baseTopPx > 0 && rawTop < baseTopPx
        ? baseTopPx + rawTop
        : rawTop;
    return {
        leftPx: Math.max(0, Math.round(inferred?.leftPx ?? 0)),
        topPx: Math.max(0, Math.round(topPx)),
        widthPx: Math.max(1, Math.round(inferred?.widthPx ?? resolveFlowBlockWidth(block, bodyWidth))),
        heightPx: Math.max(1, Math.round(inferred?.heightPx ?? heightPx)),
        zIndex: Math.max(180, inferred?.zIndex ?? 0),
        source
    };
}
function inferDecorationParagraphPosition(block) {
    if (block.type !== 'paragraph')
        return null;
    const segments = block._hwpxLayout?.lineSegments ?? [];
    if (!segments.length)
        return null;
    const left = Math.min(...segments.map((segment) => Math.max(0, segment.horizontalPosition)));
    const top = Math.min(...segments.map((segment) => Math.max(0, segment.verticalPosition)));
    const right = Math.max(...segments.map((segment) => Math.max(0, segment.horizontalPosition + segment.horizontalSize)));
    const bottom = Math.max(...segments.map((segment) => Math.max(0, segment.verticalPosition + segment.verticalSize)));
    return {
        leftPx: hwpUnitToPx(left),
        topPx: hwpUnitToPx(top),
        widthPx: hwpUnitToPx(Math.max(0, right - left)),
        heightPx: hwpUnitToPx(Math.max(0, bottom - top)),
        source: 'hwp-header-footer-line-seg'
    };
}
function mergeDecorationInset(layout, headerDecorations, footerDecorations) {
    const current = layout.decorationInset ?? {};
    const top = Math.max(current.top ?? 0, decorationInsetHeight(headerDecorations, layout));
    const bottom = Math.max(current.bottom ?? 0, decorationInsetHeight(footerDecorations, layout));
    if (top === (current.top ?? 0) && bottom === (current.bottom ?? 0))
        return layout;
    return {
        ...layout,
        decorationInset: {
            ...(layout.decorationInset ?? {}),
            top,
            bottom
        }
    };
}
function decorationInsetHeight(blocks, layout) {
    if (!blocks.length)
        return 0;
    const bodyWidth = pageBodyWidth(layout);
    return blocks.reduce((height, block) => Math.max(height, estimateBlockHeight(block, bodyWidth)), 0);
}
function paginateSections(sections, context) {
    const pages = [];
    for (const section of sections) {
        const layout = section.layout ?? DEFAULT_PAGE_LAYOUT;
        const pageBlocks = paginateBlocks(section.blocks, layout, context);
        for (const blocks of pageBlocks) {
            const pageNumber = pages.length + 1;
            const decoratedBlocks = [
                ...(section.headerDecorations ?? []),
                ...blocks,
                ...(section.footerDecorations ?? [])
            ];
            pages.push({
                index: pages.length,
                blocks: section.pageNumbering
                    ? [...decoratedBlocks, createPageNumberDecorationBlock(pageNumber, layout)]
                    : decoratedBlocks,
                layout
            });
        }
    }
    if (!pages.length)
        pages.push({ index: 0, blocks: [], layout: DEFAULT_PAGE_LAYOUT });
    context.stats.estimatedPageCount = pages.length;
    return pages;
}
function paginateBlocks(blocks, layout, context) {
    const bodyWidth = pageBodyWidth(layout);
    const pageBudget = pageBodyHeight(layout);
    const pageCoordinateSpan = pageCoordinateSpanPx(layout);
    const flowContentTopOffset = Math.max(0, layout.decorationInset?.top ?? 0);
    const flowBlocks = blocks.flatMap((block) => splitOversizedBlock(block, pageBudget, bodyWidth, context));
    const pages = [];
    let current = [];
    let usedHeight = 0;
    let visualBottom = 0;
    let positionedContentBottom = 0;
    let resetAnchorBottom = 0;
    const flush = () => {
        if (!current.length)
            return;
        pages.push(current);
        current = [];
        usedHeight = 0;
        visualBottom = 0;
        positionedContentBottom = 0;
        resetAnchorBottom = 0;
    };
    for (const block of flowBlocks) {
        let blockToPlace = block;
        const blockHeight = estimateBlockHeight(blockToPlace, bodyWidth);
        let visualMetrics = blockVisualMetrics(blockToPlace, bodyWidth, blockHeight);
        const fittedBlock = fitPositionedBlockWithinPage(blockToPlace, visualMetrics, pageCoordinateSpan, visualBottom);
        if (fittedBlock !== blockToPlace) {
            blockToPlace = fittedBlock;
            visualMetrics = blockVisualMetrics(blockToPlace, bodyWidth, blockHeight);
        }
        const rebasedBlock = rebaseBlockPageCoordinate(blockToPlace, visualMetrics, pageCoordinateSpan);
        if (rebasedBlock) {
            if (current.length) {
                flush();
                context.stats.pageSplitCount += 1;
            }
            blockToPlace = rebasedBlock;
            visualMetrics = blockVisualMetrics(blockToPlace, bodyWidth, blockHeight);
        }
        const gap = current.length ? BLOCK_GAP_PX : 0;
        const coordinateReset = shouldSplitOnPageCoordinateReset(visualMetrics, resetAnchorBottom);
        const flowAfterPositionedContent = shouldPlaceFlowBlockAfterPositionedContent(visualMetrics, positionedContentBottom);
        const projectedHeight = flowAfterPositionedContent
            ? positionedContentBottom + POSITIONED_FLOW_CLEARANCE_PX + blockHeight
            : usedHeight + gap + blockHeight;
        if (current.length && (coordinateReset || projectedHeight > pageBudget * PAGE_PACK_TOLERANCE)) {
            flush();
            context.stats.pageSplitCount += 1;
        }
        if (current.length) {
            const flowAdjustedBlock = shouldPlaceFlowBlockAfterPositionedContent(visualMetrics, positionedContentBottom)
                ? positionFlowBlockAfterPositionedContent(blockToPlace, positionedContentBottom + POSITIONED_FLOW_CLEARANCE_PX, bodyWidth, blockHeight)
                : blockToPlace;
            if (flowAdjustedBlock !== blockToPlace) {
                blockToPlace = flowAdjustedBlock;
                visualMetrics = blockVisualMetrics(blockToPlace, bodyWidth, blockHeight);
            }
            const fittedFlowBlock = fitPositionedBlockWithinPage(blockToPlace, visualMetrics, pageCoordinateSpan, visualBottom);
            if (fittedFlowBlock !== blockToPlace) {
                blockToPlace = fittedFlowBlock;
                visualMetrics = blockVisualMetrics(blockToPlace, bodyWidth, blockHeight);
            }
            const rebasedFlowBlock = rebaseBlockPageCoordinate(blockToPlace, visualMetrics, pageCoordinateSpan);
            if (rebasedFlowBlock) {
                flush();
                context.stats.pageSplitCount += 1;
                blockToPlace = rebasedFlowBlock;
                visualMetrics = blockVisualMetrics(blockToPlace, bodyWidth, blockHeight);
            }
            if (current.length) {
                const adjustedBlock = avoidPositionedContentOverlap(blockToPlace, visualMetrics, visualBottom, bodyWidth, blockHeight);
                if (adjustedBlock !== blockToPlace) {
                    blockToPlace = adjustedBlock;
                    visualMetrics = blockVisualMetrics(blockToPlace, bodyWidth, blockHeight);
                }
                const rebasedAdjustedBlock = rebaseBlockPageCoordinate(blockToPlace, visualMetrics, pageCoordinateSpan);
                if (rebasedAdjustedBlock) {
                    flush();
                    context.stats.pageSplitCount += 1;
                    blockToPlace = rebasedAdjustedBlock;
                    visualMetrics = blockVisualMetrics(blockToPlace, bodyWidth, blockHeight);
                }
            }
        }
        current.push(blockToPlace);
        usedHeight += (usedHeight > 0 ? BLOCK_GAP_PX : 0) + blockHeight;
        visualBottom = Math.max(visualBottom, blockVisualBottom(blockToPlace, visualMetrics, usedHeight, flowContentTopOffset));
        positionedContentBottom = Math.max(positionedContentBottom, blockPositionedVisualBottom(visualMetrics));
        resetAnchorBottom = Math.max(resetAnchorBottom, blockResetAnchorBottom(blockToPlace, visualMetrics));
    }
    flush();
    return pages.length ? pages : [[]];
}
function pageCoordinateSpanPx(layout) {
    const marginTop = layout.margin?.top ?? 0;
    return Math.max(pageBodyHeight(layout), layout.height - marginTop);
}
function rebaseBlockPageCoordinate(block, metrics, pageCoordinateSpan) {
    if (!metrics || pageCoordinateSpan <= 0 || metrics.topPx < pageCoordinateSpan)
        return null;
    const pageOffset = Math.floor(metrics.topPx / pageCoordinateSpan) * pageCoordinateSpan;
    if (pageOffset <= 0)
        return null;
    return offsetBlockVerticalCoordinate(block, pageOffset);
}
function offsetBlockVerticalCoordinate(block, offsetPx) {
    if (block.type === 'paragraph')
        return offsetParagraphVerticalCoordinate(block, offsetPx);
    if (block.type === 'table')
        return offsetTableVerticalCoordinate(block, offsetPx);
    return offsetImageVerticalCoordinate(block, offsetPx);
}
function offsetParagraphVerticalCoordinate(block, offsetPx) {
    const layout = block._hwpxLayout;
    if (!layout)
        return block;
    const offsetUnits = Math.round(offsetPx * HWPUNIT_PER_PX);
    return {
        ...block,
        _hwpxLayout: {
            ...layout,
            ...(layout.position
                ? {
                    position: {
                        ...layout.position,
                        topPx: layout.position.topPx - offsetPx
                    }
                }
                : {}),
            ...(layout.lineSegments?.length
                ? {
                    lineSegments: layout.lineSegments.map((segment) => ({
                        ...segment,
                        verticalPosition: segment.verticalPosition - offsetUnits
                    }))
                }
                : {})
        }
    };
}
function offsetTableVerticalCoordinate(block, offsetPx) {
    const layout = block._hwpxLayout;
    const position = layout?.position;
    if (!layout || !position)
        return block;
    return {
        ...block,
        _hwpxLayout: {
            ...layout,
            position: {
                ...position,
                topPx: position.topPx - offsetPx
            }
        }
    };
}
function offsetImageVerticalCoordinate(block, offsetPx) {
    const layout = block._hwpxLayout;
    const position = layout?.position;
    if (!layout || !position)
        return block;
    return {
        ...block,
        _hwpxLayout: {
            ...layout,
            position: {
                ...position,
                topPx: position.topPx - offsetPx
            }
        }
    };
}
function createPageNumberDecorationBlock(pageNumber, layout) {
    const bodyWidth = pageBodyWidth(layout);
    const bodyHeight = pageBodyHeight(layout);
    return {
        type: 'paragraph',
        runs: [{ text: `- ${pageNumber} -`, fontSizePt: 9 }],
        align: 'center',
        lineHeight: '1.2',
        _hwpxLayout: {
            heightPx: 18,
            source: 'hwpx-footer-page-number',
            position: {
                leftPx: 0,
                topPx: Math.max(0, bodyHeight - 22),
                widthPx: bodyWidth,
                heightPx: 18,
                source: 'hwpx-footer-page-number'
            }
        }
    };
}
function shouldPlaceFlowBlockAfterPositionedContent(metrics, currentPositionedBottom) {
    return !metrics && currentPositionedBottom > 0;
}
function shouldSplitOnPageCoordinateReset(metrics, currentVisualBottom) {
    if (!metrics)
        return false;
    if (metrics.topPx > PAGE_COORDINATE_RESET_TOP_PX)
        return false;
    if (currentVisualBottom < PAGE_COORDINATE_RESET_MIN_PREVIOUS_BOTTOM_PX)
        return false;
    return metrics.topPx + Math.min(metrics.heightPx, PAGE_COORDINATE_RESET_TOP_PX) < currentVisualBottom - PAGE_COORDINATE_RESET_OVERLAP_PX;
}
function blockPositionedVisualBottom(metrics) {
    if (!metrics)
        return 0;
    return metrics.topPx + metrics.heightPx;
}
function blockVisualBottom(block, metrics, fallbackBottom, flowContentTopOffset) {
    if (isFlowRenderedBlock(block))
        return fallbackBottom + flowContentTopOffset;
    if (!metrics)
        return fallbackBottom;
    return Math.max(fallbackBottom, metrics.topPx + metrics.heightPx);
}
function isFlowRenderedBlock(block) {
    if (block.type === 'paragraph')
        return !block._hwpxLayout?.position;
    if (block.type === 'table')
        return !block._hwpxLayout?.position;
    return block.inline !== false && !block._hwpxLayout?.position;
}
function blockResetAnchorBottom(block, metrics) {
    if (!metrics || block.type !== 'table')
        return 0;
    if (metrics.heightPx < PAGE_COORDINATE_RESET_MIN_PREVIOUS_BOTTOM_PX)
        return 0;
    return metrics.topPx + metrics.heightPx;
}
function fitPositionedBlockWithinPage(block, metrics, pageCoordinateSpan, currentVisualBottom) {
    const fittedTable = fitInferredTableWithinPage(block, metrics, pageCoordinateSpan, currentVisualBottom);
    if (fittedTable !== block)
        return fittedTable;
    return fitFlowPositionedImageWithinPage(block, metrics, pageCoordinateSpan, currentVisualBottom);
}
function fitInferredTableWithinPage(block, metrics, pageCoordinateSpan, currentVisualBottom) {
    if (block.type !== 'table' || !metrics || pageCoordinateSpan <= 0)
        return block;
    const layout = block._hwpxLayout;
    const position = layout?.position;
    if (position?.source !== 'hwp-table-line-seg-inferred')
        return block;
    if (metrics.topPx + metrics.heightPx <= pageCoordinateSpan + BLOCK_GAP_PX)
        return block;
    const fitTop = Math.max(0, pageCoordinateSpan - metrics.heightPx - BLOCK_GAP_PX);
    const clearTop = currentVisualBottom > 0 ? currentVisualBottom + BLOCK_GAP_PX : 0;
    const topPx = Math.max(fitTop, clearTop);
    if (topPx >= metrics.topPx)
        return block;
    return {
        ...block,
        _hwpxLayout: {
            ...layout,
            heightPx: layout?.heightPx ?? metrics.heightPx,
            position: {
                ...position,
                topPx
            }
        }
    };
}
function fitFlowPositionedImageWithinPage(block, metrics, pageCoordinateSpan, currentVisualBottom) {
    if (block.type !== 'image' || !metrics || pageCoordinateSpan <= 0)
        return block;
    const layout = block._hwpxLayout;
    const position = layout?.position;
    if (position?.source !== 'hwp-flow-after-positioned')
        return block;
    if (metrics.topPx + metrics.heightPx <= pageCoordinateSpan + BLOCK_GAP_PX)
        return block;
    const fitTop = Math.max(0, pageCoordinateSpan - metrics.heightPx - BLOCK_GAP_PX);
    const clearTop = currentVisualBottom > 0 ? currentVisualBottom + BLOCK_GAP_PX : 0;
    const topPx = Math.max(fitTop, clearTop);
    if (topPx >= metrics.topPx)
        return block;
    return {
        ...block,
        _hwpxLayout: {
            ...layout,
            heightPx: layout?.heightPx ?? metrics.heightPx,
            position: {
                ...position,
                topPx
            }
        }
    };
}
function avoidPositionedContentOverlap(block, metrics, currentVisualBottom, availableWidth, estimatedHeight) {
    if (!metrics || currentVisualBottom <= 0 || metrics.topPx >= currentVisualBottom - BLOCK_GAP_PX)
        return block;
    if (block.type === 'paragraph' && block._hwpxLayout?.source === 'hwp-para-line-seg') {
        return positionFlowBlockAfterPositionedContent(block, currentVisualBottom + BLOCK_GAP_PX, availableWidth, estimatedHeight);
    }
    if (block.type !== 'table')
        return block;
    const layout = block._hwpxLayout;
    const position = layout?.position;
    if (position?.source !== 'hwp-table-line-seg-inferred')
        return block;
    return {
        ...block,
        _hwpxLayout: {
            ...layout,
            heightPx: layout?.heightPx ?? metrics.heightPx,
            position: {
                ...position,
                topPx: currentVisualBottom + BLOCK_GAP_PX
            }
        }
    };
}
function positionFlowBlockAfterPositionedContent(block, topPx, availableWidth, estimatedHeight) {
    const position = {
        leftPx: 0,
        topPx: Math.max(0, Math.round(topPx)),
        widthPx: resolveFlowBlockWidth(block, availableWidth),
        heightPx: Math.max(1, Math.round(estimatedHeight)),
        source: 'hwp-flow-after-positioned'
    };
    if (block.type === 'paragraph') {
        return {
            ...block,
            _hwpxLayout: {
                ...(block._hwpxLayout ?? { heightPx: estimatedHeight }),
                heightPx: block._hwpxLayout?.heightPx ?? estimatedHeight,
                position
            }
        };
    }
    if (block.type === 'table') {
        return {
            ...block,
            _hwpxLayout: {
                ...(block._hwpxLayout ?? { heightPx: estimatedHeight }),
                heightPx: block._hwpxLayout?.heightPx ?? estimatedHeight,
                position
            }
        };
    }
    return {
        ...block,
        _hwpxLayout: {
            ...(block._hwpxLayout ?? { heightPx: estimatedHeight }),
            heightPx: block._hwpxLayout?.heightPx ?? estimatedHeight,
            position
        }
    };
}
function resolveFlowBlockWidth(block, availableWidth) {
    if (block.type === 'table')
        return resolveEstimatedTableWidth(block, availableWidth);
    if (block.type === 'image')
        return Math.max(1, Math.min(block.width ?? availableWidth, availableWidth));
    return availableWidth;
}
function splitOversizedBlock(block, pageBudget, availableWidth, context) {
    if (block.type !== 'table')
        return [block];
    const fragments = splitTableForPagination(block, pageBudget, availableWidth);
    if (fragments.length > 1)
        context.stats.splitTableCount += 1;
    return fragments;
}
function parseBlockRange(records, startIndex, stopLevel, context, artifacts, scope = { topLevelBody: false }) {
    return parseFlowRecords(records, startIndex, context, (record) => stopLevel !== null && record.level <= stopLevel, artifacts, scope);
}
function parseFlowRecords(records, startIndex, context, shouldStop, artifacts, scope = { topLevelBody: false }) {
    const blocks = [];
    let currentParagraph = null;
    const ensureParagraph = () => {
        currentParagraph ??= emptyParagraphDraft();
        return currentParagraph;
    };
    const flush = () => {
        if (!currentParagraph)
            return;
        const paragraph = currentParagraph;
        const text = paragraph.textParts.join('').replace(/\n{3,}/g, '\n\n').trim();
        currentParagraph = null;
        if (!text)
            return;
        blocks.push(createParagraphBlock(text, context, paragraph));
    };
    let index = startIndex;
    while (index < records.length) {
        const record = records[index];
        if (shouldStop(record, index))
            break;
        if (record.tagId === HWP_TAG.PARA_HEADER) {
            flush();
            currentParagraph = parseParaHeader(record.body);
            index += 1;
            continue;
        }
        if (record.tagId === HWP_TAG.PARA_TEXT) {
            const text = decodeParaText(record.body);
            if (text)
                ensureParagraph().textParts.push(text);
            index += 1;
            continue;
        }
        if (record.tagId === HWP_TAG.PARA_CHAR_SHAPE) {
            ensureParagraph().charShapeRanges = parseParaCharShape(record.body);
            index += 1;
            continue;
        }
        if (record.tagId === HWP_TAG.PARA_LINE_SEG) {
            const lineSegments = parseParaLineSegments(record.body);
            context.stats.lineSegmentCount += lineSegments.length;
            ensureParagraph().lineSegments = lineSegments;
            index += 1;
            continue;
        }
        if (record.tagId === HWP_TAG.CTRL_HEADER) {
            flush();
            const parsed = parseControlSubtree(records, index, context, artifacts, scope);
            blocks.push(...parsed.blocks);
            index = parsed.nextIndex;
            continue;
        }
        if (record.tagId === HWP_TAG.LIST_HEADER) {
            flush();
            context.stats.listHeaderCount += 1;
            const parsed = parseListContent(records, index, record.level - 1, context, artifacts, scope);
            blocks.push(...parsed.blocks);
            index = parsed.nextIndex;
            continue;
        }
        if (record.tagId === HWP_TAG.TABLE) {
            flush();
            const table = buildTableBlock(parseTableInfo(record.body), [], context);
            if (table)
                blocks.push(table);
            index += 1;
            continue;
        }
        if (record.tagId === HWP_TAG.SHAPE_COMPONENT_PICTURE) {
            flush();
            const image = parsePictureBlock(record.body, null, context);
            blocks.push(image ?? createParagraphBlock('그림 개체', context));
            index += 1;
            continue;
        }
        index += 1;
    }
    flush();
    return { blocks, nextIndex: index };
}
function parseControlSubtree(records, controlIndex, context, artifacts, scope = { topLevelBody: false }) {
    const control = records[controlIndex];
    const controlId = readControlId(control.body);
    const objectInfo = parseObjectInfo(control.body);
    const childRecordCount = countControlChildRecords(records, controlIndex + 1, control.level);
    context.stats.controlCount += 1;
    if (controlId === 'tbl ') {
        const parsed = parseTableControl(records, controlIndex + 1, control.level, context, objectInfo, artifacts);
        return { blocks: parsed.block ? [parsed.block] : [], nextIndex: parsed.nextIndex };
    }
    if (controlId === 'gso ') {
        return parseGsoControl(records, controlIndex + 1, control.level, control.body, context, artifacts, scope);
    }
    if (controlId === 'head' || controlId === 'foot') {
        const parsed = parseBlockRange(records, controlIndex + 1, control.level, context, artifacts);
        const area = {
            controlId,
            applyPageType: parseHeaderFooterApplyPageType(control.body),
            blocks: parsed.blocks
        };
        if (controlId === 'head') {
            artifacts?.headerAreas.push(area);
            context.stats.headerControlCount += 1;
        }
        else {
            artifacts?.footerAreas.push(area);
            context.stats.footerControlCount += 1;
        }
        recordNonBodyControl(context, artifacts, control, controlId, childRecordCount, parsed.blocks.length, area.applyPageType, objectInfo);
        return { blocks: [], nextIndex: parsed.nextIndex };
    }
    if (controlId === 'secd') {
        const nextIndex = findSubtreeEnd(records, controlIndex + 1, control.level);
        context.stats.sectionControlCount += 1;
        recordNonBodyControl(context, artifacts, control, controlId, childRecordCount, 0, undefined, objectInfo);
        return { blocks: [], nextIndex };
    }
    if (isNonBodyControl(controlId)) {
        const nextIndex = findSubtreeEnd(records, controlIndex + 1, control.level);
        recordNonBodyControl(context, artifacts, control, controlId, childRecordCount, 0, undefined, objectInfo);
        return { blocks: [], nextIndex };
    }
    return parseBlockRange(records, controlIndex + 1, control.level, context, artifacts, scope);
}
function parseGsoControl(records, startIndex, controlLevel, controlBody, context, artifacts, scope = { topLevelBody: false }) {
    const objectInfo = parseObjectInfo(controlBody);
    const nestedBlocks = [];
    let pictureBody = null;
    let index = startIndex;
    while (index < records.length) {
        const record = records[index];
        if (record.level <= controlLevel)
            break;
        if (record.tagId === HWP_TAG.SHAPE_COMPONENT_PICTURE && !pictureBody) {
            pictureBody = record.body;
            index += 1;
            continue;
        }
        if (record.tagId === HWP_TAG.LIST_HEADER && !pictureBody) {
            context.stats.listHeaderCount += 1;
            const parsed = parseListContent(records, index, controlLevel, context, artifacts);
            nestedBlocks.push(...parsed.blocks);
            index = parsed.nextIndex;
            continue;
        }
        if (record.tagId === HWP_TAG.CTRL_HEADER && !pictureBody) {
            const parsed = parseControlSubtree(records, index, context, artifacts);
            nestedBlocks.push(...parsed.blocks);
            index = parsed.nextIndex;
            continue;
        }
        index += 1;
    }
    if (pictureBody) {
        const image = parsePictureBlock(pictureBody, objectInfo, context, scope);
        return {
            blocks: [image ?? createParagraphBlock(objectInfo.description || '그림 개체', context)],
            nextIndex: index
        };
    }
    return { blocks: nestedBlocks, nextIndex: index };
}
function parseTableControl(records, startIndex, controlLevel, context, objectInfo, artifacts) {
    const tableChildLevel = controlLevel + 1;
    let tableInfo = null;
    const cells = [];
    let index = startIndex;
    while (index < records.length) {
        const record = records[index];
        if (record.level <= controlLevel)
            break;
        if (record.level === tableChildLevel && record.tagId === HWP_TAG.TABLE) {
            tableInfo = parseTableInfo(record.body);
            index += 1;
            continue;
        }
        if (record.level === tableChildLevel && record.tagId === HWP_TAG.LIST_HEADER) {
            context.stats.listHeaderCount += 1;
            const parsed = parseTableCell(records, index, controlLevel, context, tableInfo, artifacts);
            if (parsed.cell)
                cells.push(parsed.cell);
            index = parsed.nextIndex;
            continue;
        }
        if (record.level === tableChildLevel)
            break;
        index = findSubtreeEnd(records, index + 1, record.level);
    }
    return {
        block: buildTableBlock(tableInfo, cells, context, objectInfo),
        nextIndex: index
    };
}
function parseTableCell(records, listHeaderIndex, tableControlLevel, context, tableInfo, artifacts) {
    const listHeader = records[listHeaderIndex];
    const cellInfo = parseTableCellInfo(listHeader.body, tableInfo);
    const content = parseFlowRecords(records, listHeaderIndex + 1, context, (record) => record.level <= tableControlLevel
        || (record.level === listHeader.level && record.tagId === HWP_TAG.LIST_HEADER), artifacts);
    if (!cellInfo) {
        return { cell: null, nextIndex: content.nextIndex };
    }
    context.stats.tableCellCount += 1;
    const paint = resolveHwpCellPaint(context.docInfo, cellInfo.borderFillId || tableInfo?.borderFillId || 0);
    const model = {
        blocks: content.blocks,
        colSpan: cellInfo.colSpan,
        rowSpan: cellInfo.rowSpan,
        ...(cellInfo.width > 0 ? { width: cellInfo.width } : {}),
        ...(cellInfo.height > 0 ? { height: cellInfo.height } : {}),
        padding: cellInfo.padding,
        verticalAlign: cellInfo.verticalAlign,
        ...(paint.border ? { border: paint.border } : {}),
        ...(paint.borderEdges ? { borderEdges: paint.borderEdges } : {}),
        ...(paint.background ? { background: paint.background } : {})
    };
    return {
        cell: {
            row: cellInfo.row,
            col: cellInfo.col,
            rowSpan: cellInfo.rowSpan,
            colSpan: cellInfo.colSpan,
            width: cellInfo.width,
            model
        },
        nextIndex: content.nextIndex
    };
}
function parseListContent(records, listHeaderIndex, parentLevel, context, artifacts, scope = { topLevelBody: false }) {
    const listHeader = records[listHeaderIndex];
    return parseFlowRecords(records, listHeaderIndex + 1, context, (record, index) => record.level <= parentLevel
        || (index > listHeaderIndex + 1 && record.level === listHeader.level && record.tagId === HWP_TAG.LIST_HEADER), artifacts, scope);
}
function buildTableBlock(tableInfo, cells, context, objectInfo = null) {
    if (!tableInfo && !cells.length)
        return null;
    const rowCount = Math.max(1, tableInfo?.rowCount ?? 0, ...cells.map((cell) => cell.row + cell.rowSpan));
    const colCount = Math.max(1, tableInfo?.colCount ?? 0, ...cells.map((cell) => cell.col + cell.colSpan));
    const sortedCells = cells
        .filter((cell) => cell.row >= 0 && cell.col >= 0 && cell.row < rowCount && cell.col < colCount)
        .sort((left, right) => (left.row - right.row) || (left.col - right.col));
    const rows = Array.from({ length: rowCount }, () => ({ cells: [] }));
    if (!sortedCells.length && tableInfo) {
        synthesizeEmptyCells(rows, rowCount, colCount);
    }
    else {
        placeTableCells(rows, sortedCells, rowCount, colCount);
    }
    const columnWidths = synthesizeColumnWidths(sortedCells, colCount);
    const width = columnWidths.reduce((sum, value) => sum + value, 0);
    context.stats.tableCount += 1;
    recordTableSplitPolicy(context, tableInfo);
    const objectWidth = objectInfo && objectInfo.width > 0 ? objectInfo.width : 0;
    const objectHeight = objectInfo && objectInfo.height > 0 ? objectInfo.height : 0;
    const objectPosition = objectInfo && !objectInfo.inline && (objectInfo.horizontalOffset !== 0 || objectInfo.verticalOffset !== 0)
        ? {
            leftPx: objectInfo.horizontalOffset,
            topPx: objectInfo.verticalOffset,
            ...(objectWidth > 0 ? { widthPx: objectWidth } : {}),
            ...(objectHeight > 0 ? { heightPx: objectHeight } : {}),
            ...(objectInfo.zIndex ? { zIndex: objectInfo.zIndex } : {}),
            source: 'hwp-object-common'
        }
        : null;
    const inferredPosition = objectPosition ? null : inferHwpTablePosition(rows, objectInfo);
    const tablePosition = objectPosition ?? inferredPosition;
    const tablePaint = resolveHwpCellPaint(context.docInfo, tableInfo?.borderFillId ?? 0);
    const rawRowSizes = tableInfo?.rowSizes ?? [];
    const rowSizesAreHeights = tableRowSizesLookLikeHeights(rawRowSizes, {
        rowCount,
        colCount,
        cellCount: sortedCells.length
    });
    const rowHeightsPx = rowSizesAreHeights ? rawRowSizes.map(hwpUnitToPx) : [];
    const shouldAttachLayout = Boolean(tablePosition
        || objectHeight > 0
        || rowHeightsPx.some((height) => height > 0)
        || tableInfo?.repeatHeader
        || tableInfo?.pageBreak);
    return {
        type: 'table',
        rows,
        ...(objectWidth > 0 ? { width: objectWidth } : (width > 0 ? { width } : {})),
        ...(columnWidths.length ? { columnWidths } : {}),
        ...(tablePaint.border ? { border: tablePaint.border } : {}),
        ...(tablePaint.borderEdges ? { borderEdges: tablePaint.borderEdges } : {}),
        ...(tablePaint.background ? { background: tablePaint.background } : {}),
        ...(shouldAttachLayout
            ? {
                _hwpxLayout: {
                    heightPx: objectHeight,
                    repeatHeaderRows: tableInfo?.repeatHeader ? 1 : 0,
                    ...(tableInfo?.pageBreak ? { pageBreak: tableInfo.pageBreak } : {}),
                    rowHeightsPx,
                    source: rowSizesAreHeights ? 'hwp-table-row-sizes' : 'hwp-table',
                    ...(tablePosition ? { position: tablePosition } : {})
                }
            }
            : {})
    };
}
function tableRowSizesLookLikeHeights(rowSizes, context) {
    if (!rowSizes.length)
        return false;
    if (context.rowCount > 0 && rowSizes.length !== context.rowCount)
        return false;
    const values = rowSizes.map((value) => Math.max(0, Number(value) || 0));
    if (!values.some((value) => value > 0))
        return false;
    const sum = values.reduce((total, value) => total + value, 0);
    const maxValue = Math.max(...values);
    if (context.cellCount > 0
        && sum === context.cellCount
        && maxValue <= Math.max(context.colCount + 2, 16)) {
        return false;
    }
    return maxValue >= 100;
}
function inferHwpTablePosition(rows, objectInfo = null) {
    const points = [];
    for (const row of rows) {
        for (const cell of row.cells) {
            collectHwpLineSegmentPositions(cell.blocks, points);
        }
    }
    if (!points.length)
        return null;
    const top = Math.min(...points.map((point) => point.top));
    const left = Math.min(...points.map((point) => point.left));
    if (top <= 0)
        return null;
    return {
        leftPx: Math.max(0, hwpUnitToPx(left) - 6),
        topPx: Math.max(0, hwpUnitToPx(top) - 8),
        source: 'hwp-table-line-seg-inferred',
        ...(objectInfo?.textWrap ? { textWrap: objectInfo.textWrap } : {})
    };
}
function collectHwpLineSegmentPositions(blocks, points) {
    for (const block of blocks) {
        if (block.type === 'paragraph' && block._hwpxLayout?.source === 'hwp-para-line-seg') {
            const segments = block._hwpxLayout.lineSegments ?? [];
            for (const segment of segments) {
                if (segment.verticalPosition > 0) {
                    points.push({
                        left: Math.max(0, segment.horizontalPosition),
                        top: segment.verticalPosition
                    });
                }
            }
        }
        else if (block.type === 'table') {
            for (const row of block.rows) {
                for (const cell of row.cells)
                    collectHwpLineSegmentPositions(cell.blocks, points);
            }
        }
    }
}
function parseTableInfo(body) {
    if (body.length < 18)
        return null;
    const attr = readUInt32(body, 0);
    const splitPage = attr & 0x3;
    const rowCount = readUInt16(body, 4);
    const colCount = readUInt16(body, 6);
    const cellSpacing = hwpUnitToPx(readInt16(body, 8));
    const defaultCellPadding = {
        left: hwpUnitToPx(readInt16(body, 10)),
        right: hwpUnitToPx(readInt16(body, 12)),
        top: hwpUnitToPx(readInt16(body, 14)),
        bottom: hwpUnitToPx(readInt16(body, 16))
    };
    const rowSizes = [];
    let offset = 18;
    for (let row = 0; row < rowCount && offset + 2 <= body.length; row += 1, offset += 2) {
        rowSizes.push(readUInt16(body, offset));
    }
    const borderFillId = offset + 2 <= body.length ? readUInt16(body, offset) : 0;
    return {
        attr,
        splitPage,
        pageBreak: hwpTablePageBreakFromSplitPage(splitPage),
        rowCount,
        colCount,
        cellSpacing,
        defaultCellPadding,
        rowSizes,
        repeatHeader: Boolean(attr & 0x4),
        borderFillId
    };
}
function parseTableCellInfo(body, tableInfo) {
    if (body.length < 34)
        return null;
    const listFlags = readUInt32(body, 4);
    const padding = {
        left: hwpUnitToPx(readInt16(body, 24)),
        right: hwpUnitToPx(readInt16(body, 26)),
        top: hwpUnitToPx(readInt16(body, 28)),
        bottom: hwpUnitToPx(readInt16(body, 30))
    };
    return {
        paragraphCount: readUInt16(body, 0),
        row: readUInt16(body, 10),
        col: readUInt16(body, 8),
        colSpan: Math.max(1, readUInt16(body, 12)),
        rowSpan: Math.max(1, readUInt16(body, 14)),
        width: hwpUnitToPx(readUInt32(body, 16)),
        height: hwpUnitToPx(readUInt32(body, 20)),
        padding: hasAnyBoxValue(padding) ? padding : tableInfo?.defaultCellPadding ?? {},
        borderFillId: readUInt16(body, 32),
        verticalAlign: cellVerticalAlign(listFlags)
    };
}
function parseObjectInfo(body) {
    const attr = body.length >= 8 ? readUInt32(body, 4) : 0;
    const descLen = body.length >= 46 ? readUInt16(body, 44) : 0;
    return {
        controlId: readControlId(body),
        horizontalOffset: body.length >= 16 ? hwpSignedUnitToPx(readInt32(body, 12)) : 0,
        verticalOffset: body.length >= 12 ? hwpSignedUnitToPx(readInt32(body, 8)) : 0,
        width: body.length >= 20 ? hwpUnitToPx(readUInt32(body, 16)) : 0,
        height: body.length >= 24 ? hwpUnitToPx(readUInt32(body, 20)) : 0,
        zIndex: body.length >= 28 ? readInt32(body, 24) : 0,
        description: decodeUtf16String(body, 46, descLen),
        inline: Boolean(attr & 1),
        flowWithText: Boolean((attr >> 13) & 0x1),
        allowOverlap: Boolean((attr >> 14) & 0x1),
        textWrap: hwpObjectTextWrap((attr >> 21) & 0x7)
    };
}
function hwpObjectTextWrap(code = 0) {
    return [
        'top-and-bottom',
        'square',
        'tight',
        'through',
        'behind-text',
        'in-front-of-text'
    ][Number(code) || 0] || 'top-and-bottom';
}
function parsePictureBlock(body, objectInfo, context, scope = { topLevelBody: false }) {
    context.stats.pictureRecordCount += 1;
    const asset = context.imageResolver.resolve(body);
    if (!asset) {
        context.stats.unresolvedImageCount += 1;
        return null;
    }
    context.stats.imageCount += 1;
    const width = firstPositive(objectInfo?.width, hwpUnitToPx(readUInt32(body, 52)), hwpUnitToPx(readUInt32(body, 20)), hwpUnitToPx(readUInt32(body, 28)));
    const height = firstPositive(objectInfo?.height, hwpUnitToPx(readUInt32(body, 56)), hwpUnitToPx(readUInt32(body, 32)), hwpUnitToPx(readUInt32(body, 40)));
    const positioned = objectInfo && !objectInfo.inline && (objectInfo.horizontalOffset !== 0
        || objectInfo.verticalOffset !== 0
        || objectInfo.zIndex !== 0)
        ? {
            heightPx: height,
            position: {
                leftPx: objectInfo.horizontalOffset,
                topPx: objectInfo.verticalOffset,
                ...(width > 0 ? { widthPx: width } : {}),
                ...(height > 0 ? { heightPx: height } : {}),
                ...(objectInfo.zIndex ? { zIndex: objectInfo.zIndex } : {}),
                source: 'hwp-picture-object-common'
            }
        }
        : undefined;
    const floatingInlineAnchor = objectInfo
        && scope.topLevelBody
        && objectInfo.inline
        && objectInfo.flowWithText
        && objectInfo.allowOverlap
        && objectInfo.zIndex > 0
        && objectInfo.horizontalOffset === 0
        && objectInfo.verticalOffset === 0;
    return {
        type: 'image',
        assetId: asset.id,
        altText: objectInfo?.description || asset.id || '이미지',
        ...(width > 0 ? { width } : {}),
        ...(height > 0 ? { height } : {}),
        ...(objectInfo ? { inline: objectInfo.inline } : {}),
        ...(positioned
            ? { _hwpxLayout: positioned }
            : floatingInlineAnchor
                ? {
                    _hwpxLayout: {
                        heightPx: height,
                        source: 'hwp-floating-inline-anchor-image',
                        flowWithText: objectInfo.flowWithText,
                        allowOverlap: objectInfo.allowOverlap
                    }
                }
                : {})
    };
}
function createParagraphBlock(text, context, draft) {
    context.stats.paragraphCount += 1;
    const paraShape = context.docInfo.paraShapes[draft?.paraShapeId ?? -1] ?? null;
    const margin = paraShape?.margin && hasAnyBoxValue(paraShape.margin) ? paraShape.margin : undefined;
    const lineHeight = resolveParagraphLineHeight(draft, paraShape);
    const runs = buildTextRuns(text, draft, context);
    const fallbackLineHeightPx = paragraphLineHeightPx({ type: 'paragraph', runs, lineHeight }, textRunsFontSizePx(runs));
    const segmentLayout = createParagraphLineSegmentLayout(draft, fallbackLineHeightPx);
    const block = {
        type: 'paragraph',
        runs,
        ...(paraShape?.align ? { align: paraShape.align } : {}),
        ...(margin ? { margin } : {}),
        ...(paraShape?.textIndent ? { textIndent: paraShape.textIndent } : {}),
        ...(lineHeight ? { lineHeight } : {}),
        ...(segmentLayout ? { _hwpxLayout: segmentLayout } : {})
    };
    paragraphMetrics.set(block, createParagraphMetrics(text, block, draft));
    return block;
}
function createParagraphLineSegmentLayout(draft, fallbackLineHeightPx) {
    const sourceSegments = draft?.lineSegments ?? [];
    if (!sourceSegments.length)
        return undefined;
    const maxSegmentHeightPx = Math.max(24, Math.min(MAX_LINE_SEGMENT_HEIGHT_PX, Math.round(fallbackLineHeightPx * 3)));
    const lineSegments = sourceSegments
        .map((segment, index) => {
        const verticalSize = firstPositive(segment.textHeight, segment.height, segment.lineSpacing);
        return {
            index,
            textPosition: Math.max(0, segment.chpos),
            verticalPosition: segment.y,
            verticalSize: segment.height,
            textHeight: segment.textHeight,
            baseline: segment.baseline,
            spacing: segment.lineSpacing,
            horizontalPosition: Math.max(0, segment.x),
            horizontalSize: Math.max(0, segment.width),
            flags: segment.flags,
            heightPx: Math.min(maxSegmentHeightPx, hwpUnitToPx(verticalSize))
        };
    })
        .filter((segment) => segment.heightPx > 0);
    if (!lineSegments.length)
        return undefined;
    const heightPx = lineSegments.reduce((sum, segment) => sum + segment.heightPx, 0);
    return {
        heightPx,
        lineSegments,
        source: 'hwp-para-line-seg'
    };
}
function findSectionEntries(cfb, distributed) {
    const storageName = distributed ? 'ViewText' : 'BodyText';
    const entries = cfb.findEntriesUnder(storageName, /^Section\d+$/i);
    return entries.sort((left, right) => sectionNumber(left.name) - sectionNumber(right.name));
}
function collectBinDataAssets(cfb, docInfo) {
    return cfb.findEntriesUnder('BinData')
        .map((entry) => {
        const streamNumber = binDataNumberFromName(entry.name || entry.path);
        const binRef = findBinDataRefForStream(docInfo.binDataRefs, streamNumber);
        const bytes = normalizeBinDataBytes(cfb.readStream(entry));
        const mimeType = inferMimeType(`${entry.name || entry.path}.${binRef?.extension ?? ''}`, bytes);
        return {
            id: entry.name || entry.path,
            mimeType,
            bytes,
            path: entry.path
        };
    });
}
function emptyDocInfo() {
    return {
        sectionCount: 0,
        idMappingCounts: [],
        fonts: [],
        binDataRefs: [],
        borderFills: [],
        charShapes: [],
        paraShapes: [],
        binDataCount: 0,
        borderFillCount: 0,
        charShapeCount: 0,
        paraShapeCount: 0,
        recordCount: 0
    };
}
function emptyParseStats() {
    return {
        paragraphCount: 0,
        tableCount: 0,
        tableCellCount: 0,
        listHeaderCount: 0,
        controlCount: 0,
        pictureRecordCount: 0,
        imageCount: 0,
        unresolvedImageCount: 0,
        pageDefCount: 0,
        pageNumParaCount: 0,
        headerControlCount: 0,
        footerControlCount: 0,
        sectionControlCount: 0,
        preservedNonBodyControlCount: 0,
        headerDecorationBlockCount: 0,
        footerDecorationBlockCount: 0,
        tableSplitPolicyNoneCount: 0,
        tableSplitPolicyCellCount: 0,
        tableSplitPolicySplitCount: 0,
        tableSplitPolicyUnknownCount: 0,
        lineSegmentCount: 0,
        estimatedPageCount: 0,
        pageSplitCount: 0,
        splitTableCount: 0
    };
}
class HwpImageResolver {
    assets;
    assetsByNumber;
    cursor = 0;
    constructor(assets, binDataRefs) {
        this.assets = assets.filter(isLikelyImageAsset);
        this.assetsByNumber = new Map();
        for (const asset of this.assets) {
            const number = binDataNumber(asset);
            if (number > 0 && !this.assetsByNumber.has(number))
                this.assetsByNumber.set(number, asset);
            const binRef = findBinDataRefForStream(binDataRefs, number);
            if (binRef?.refId && !this.assetsByNumber.has(binRef.refId))
                this.assetsByNumber.set(binRef.refId, asset);
            if (binRef?.binDataId && !this.assetsByNumber.has(binRef.binDataId))
                this.assetsByNumber.set(binRef.binDataId, asset);
        }
    }
    resolve(pictureBody) {
        for (const candidate of pictureBinIdCandidates(pictureBody)) {
            const asset = this.assetsByNumber.get(candidate);
            if (asset)
                return asset;
        }
        const asset = this.assets[this.cursor] ?? null;
        if (asset)
            this.cursor += 1;
        return asset;
    }
}
function pictureBinIdCandidates(body) {
    return uniquePositive([
        readUInt32BE(body, 68),
        readUInt16BE(body, 70),
        body[71] ?? 0,
        readUInt32(body, 68),
        readUInt16(body, 68),
        readUInt16(body, 70),
        ...scanPictureBinIdTail(body)
    ]).filter((value) => value <= 100000);
}
function findSectionPageLayout(records, context) {
    let firstLayout;
    for (const record of records) {
        if (record.tagId !== HWP_TAG.PAGE_DEF)
            continue;
        const layout = parsePageDef(record.body);
        context.stats.pageDefCount += 1;
        if (layout && !firstLayout)
            firstLayout = layout;
    }
    return firstLayout;
}
function parsePageDef(body) {
    if (body.length < 32)
        return null;
    const width = readInt32(body, 0);
    const height = readInt32(body, 4);
    if (width <= 0 || height <= 0)
        return null;
    return {
        width: hwpUnitToPx(width) || DEFAULT_PAGE_LAYOUT.width,
        height: hwpUnitToPx(height) || DEFAULT_PAGE_LAYOUT.height,
        margin: {
            left: hwpUnitToPx(readInt32(body, 8)),
            right: hwpUnitToPx(readInt32(body, 12)),
            top: hwpUnitToPx(readInt32(body, 16)),
            bottom: hwpUnitToPx(readInt32(body, 20))
        },
        decorationInset: {
            top: body.length >= 28 ? hwpUnitToPx(readInt32(body, 24)) : 0,
            bottom: body.length >= 32 ? hwpUnitToPx(readInt32(body, 28)) : 0
        }
    };
}
function parseFaceName(body) {
    const direct = readLengthPrefixedUtf16(body, 1);
    if (isPlausibleFontName(direct.text))
        return direct.text;
    for (const offset of [0, 2]) {
        const candidate = readLengthPrefixedUtf16(body, offset);
        if (isPlausibleFontName(candidate.text))
            return candidate.text;
    }
    return extractUtf16Strings(body, [0, 1])
        .find(isPlausibleFontName) ?? '';
}
function parseBinDataRef(body, refId) {
    if (body.length < 2)
        return null;
    const attr = readUInt16(body, 0);
    const typeCode = attr & 0xf;
    let offset = 2;
    if (typeCode === 0) {
        const absolutePath = readLengthPrefixedUtf16(body, offset);
        offset = absolutePath.nextOffset;
        const relativePath = readLengthPrefixedUtf16(body, offset);
        const extension = inferExtension(absolutePath.text || relativePath.text);
        return {
            refId,
            type: 'LINK',
            binDataId: 0,
            extension
        };
    }
    const binDataId = offset + 2 <= body.length ? readUInt16(body, offset) : 0;
    offset += 2;
    const extension = typeCode === 1 ? readLengthPrefixedUtf16(body, offset).text.toLowerCase() : '';
    return {
        refId,
        type: typeCode === 1 ? 'EMBEDDING' : (typeCode === 2 ? 'STORAGE' : 'UNKNOWN'),
        binDataId,
        extension: extension.replace(/^\./, '')
    };
}
function parseBorderFill(body) {
    if (body.length < 32)
        return null;
    const fill = parseBorderFillBrush(body, 32);
    const borderAt = (index) => {
        const offset = 2 + (index * 6);
        if (offset + 6 > body.length)
            return { type: 'NONE', widthMm: 0, color: '' };
        const typeId = body[offset] & 0x1f;
        const widthId = body[offset + 1] & 0x0f;
        return {
            type: hwpBorderTypeName(typeId),
            widthMm: hwpBorderWidthMm(widthId),
            color: hwpColorRefToCss(readUInt32(body, offset + 2))
        };
    };
    return {
        borderFlags: readUInt16(body, 0),
        left: borderAt(0),
        right: borderAt(1),
        top: borderAt(2),
        bottom: borderAt(3),
        fillColor: fill.fillColor,
        fillGradient: fill.fillGradient,
        fillType: fill.fillType
    };
}
function parseBorderFillBrush(body, offset) {
    if (offset + 4 > body.length)
        return { fillColor: '', fillGradient: null, fillType: 0 };
    const fillType = readUInt32(body, offset);
    let cursor = offset + 4;
    let fillColor = '';
    let fillGradient = null;
    if ((fillType & 0x00000001) && cursor + 12 <= body.length) {
        fillColor = hwpColorRefToCss(readUInt32(body, cursor));
        cursor += 12;
    }
    if ((fillType & 0x00000004) && cursor + 21 <= body.length) {
        const gradientType = body[cursor] ?? 0;
        const angle = readUInt32(body, cursor + 1);
        const gradientColorCount = Math.max(0, readUInt32(body, cursor + 17));
        cursor += 21;
        const positionBytes = gradientColorCount > 2 ? gradientColorCount * 4 : 0;
        if (positionBytes && cursor + positionBytes + (gradientColorCount * 4) <= body.length) {
            cursor += positionBytes;
        }
        const colors = [];
        for (let index = 0; index < gradientColorCount && cursor + 4 <= body.length; index += 1, cursor += 4) {
            const color = hwpColorRefToCss(readUInt32(body, cursor));
            if (color)
                colors.push(color);
        }
        if (colors.length >= 2) {
            fillGradient = {
                type: gradientType === 2 ? 'RADIAL' : 'LINEAR',
                angle,
                colors
            };
        }
        else if (!fillColor && colors[0]) {
            fillColor = colors[0];
        }
    }
    return { fillColor, fillGradient, fillType };
}
function parseCharShape(body, fonts) {
    if (body.length < 56)
        return null;
    const attr = readUInt32(body, 46);
    const fontFamily = fonts[readUInt16(body, 0)] || '';
    const fontFamilyLatin = fonts[readUInt16(body, 2)] || '';
    const fontSizeRaw = readUInt32(body, 42);
    const letterSpacing = readSignedByte(body[21] ?? 0);
    return {
        fontFamily,
        fontFamilyLatin: fontFamilyLatin !== fontFamily ? fontFamilyLatin : '',
        fontSizePt: fontSizeRaw > 0 ? Math.round(fontSizeRaw / 10) / 10 : 0,
        color: hwpColorRefToCss(readUInt32(body, 52)),
        letterSpacing: letterSpacing ? `${letterSpacing}%` : '',
        bold: Boolean(attr & (1 << 1)),
        italic: Boolean(attr & 1),
        underline: ((attr >> 2) & 0x3) !== 0,
        strike: Boolean((attr >> 18) & 0x7)
    };
}
function parseParaShape(body) {
    if (body.length < 26)
        return null;
    const attr = readUInt32(body, 0);
    const attr3 = body.length >= 50 ? readUInt32(body, 46) : 0;
    const modernLineSpacing = body.length >= 54 ? readUInt32(body, 50) : 0;
    const legacyLineSpacing = body.length >= 28 ? readUInt32(body, 24) : 0;
    const modernLineSpacingType = modernLineSpacing ? hwpLineSpacingTypeFromCode(attr3 & 0x1f) : '';
    const lineSpacingType = modernLineSpacingType || hwpLineSpacingTypeFromCode(attr & 0x3);
    const lineSpacing = modernLineSpacing
        ? (lineSpacingType === 'percent' ? Math.round(modernLineSpacing / 100) : modernLineSpacing)
        : legacyLineSpacing;
    return {
        align: hwpAlignFromAttr(attr),
        margin: {
            left: hwpSignedUnitToPx(readInt32(body, 4)),
            right: hwpSignedUnitToPx(readInt32(body, 8)),
            top: hwpSignedUnitToPx(readInt32(body, 16)),
            bottom: hwpSignedUnitToPx(readInt32(body, 20))
        },
        textIndent: hwpSignedUnitToPx(readInt32(body, 12)),
        lineSpacingType,
        lineSpacing
    };
}
function parseParaHeader(body) {
    const draft = emptyParagraphDraft();
    if (body.length >= 10)
        draft.paraShapeId = readUInt16(body, 8);
    if (body.length >= 11)
        draft.styleId = body[10] ?? 0;
    return draft;
}
function parseParaCharShape(body) {
    const ranges = [];
    for (let offset = 0; offset + 8 <= body.length; offset += 8) {
        ranges.push({
            start: readUInt32(body, offset),
            charShapeId: readUInt32(body, offset + 4)
        });
    }
    return ranges
        .filter((range) => range.start <= 1000000 && range.charShapeId <= 1000000)
        .sort((left, right) => left.start - right.start);
}
function parseParaLineSegments(body) {
    const segments = [];
    for (let offset = 0; offset + 36 <= body.length; offset += 36) {
        const height = readInt32(body, offset + 8);
        const textHeight = readInt32(body, offset + 12);
        if (height <= 0 && textHeight <= 0)
            continue;
        segments.push({
            chpos: readInt32(body, offset),
            y: readInt32(body, offset + 4),
            height,
            textHeight,
            baseline: readInt32(body, offset + 16),
            lineSpacing: readInt32(body, offset + 20),
            x: readInt32(body, offset + 24),
            width: readInt32(body, offset + 28),
            flags: readUInt32(body, offset + 32)
        });
    }
    return segments;
}
function emptyParagraphDraft() {
    return {
        textParts: [],
        paraShapeId: 0,
        styleId: 0,
        charShapeRanges: [],
        lineSegments: []
    };
}
function buildTextRuns(text, draft, context) {
    const ranges = draft?.charShapeRanges?.length
        ? draft.charShapeRanges
        : [{ start: 0, charShapeId: 0 }];
    const runs = [];
    let cursor = 0;
    for (let index = 0; index < ranges.length; index += 1) {
        const range = ranges[index];
        const start = clampInteger(range.start, 0, text.length);
        const end = clampInteger(ranges[index + 1]?.start ?? text.length, start, text.length);
        if (start > cursor) {
            runs.push({ text: text.slice(cursor, start), ...textRunStyle(0, context) });
        }
        if (end > start) {
            runs.push({ text: text.slice(start, end), ...textRunStyle(range.charShapeId, context) });
        }
        cursor = Math.max(cursor, end);
    }
    if (cursor < text.length)
        runs.push({ text: text.slice(cursor), ...textRunStyle(0, context) });
    return mergeAdjacentRuns(runs.length ? runs : [{ text }]);
}
function textRunStyle(charShapeId, context) {
    const shape = context.docInfo.charShapes[charShapeId] ?? null;
    if (!shape)
        return {};
    return {
        ...(shape.fontFamily ? { fontFamily: shape.fontFamily } : {}),
        ...(shape.fontSizePt > 0 ? { fontSizePt: shape.fontSizePt } : {}),
        ...(shape.color ? { color: shape.color } : {}),
        ...(shape.letterSpacing ? { letterSpacing: shape.letterSpacing } : {}),
        ...(shape.bold ? { bold: true } : {}),
        ...(shape.italic ? { italic: true } : {}),
        ...(shape.underline ? { underline: true } : {}),
        ...(shape.strike ? { strike: true } : {})
    };
}
function mergeAdjacentRuns(runs) {
    const merged = [];
    for (const run of runs) {
        if (!run.text)
            continue;
        const previous = merged[merged.length - 1];
        if (previous && sameRunStyle(previous, run)) {
            merged[merged.length - 1] = { ...previous, text: previous.text + run.text };
        }
        else {
            merged.push(run);
        }
    }
    return merged.length ? merged : [{ text: '' }];
}
function sameRunStyle(left, right) {
    return left.fontFamily === right.fontFamily
        && left.fontSizePt === right.fontSizePt
        && left.href === right.href
        && left.color === right.color
        && left.letterSpacing === right.letterSpacing
        && left.bold === right.bold
        && left.italic === right.italic
        && left.underline === right.underline
        && left.strike === right.strike;
}
function resolveParagraphLineHeight(draft, paraShape) {
    if (paraShape?.lineSpacingType === 'percent' && paraShape.lineSpacing > 0) {
        return `${Math.max(50, Math.min(400, paraShape.lineSpacing))}%`;
    }
    if ((paraShape?.lineSpacingType === 'fixed' || paraShape?.lineSpacingType === 'minimum') && paraShape.lineSpacing > 0) {
        const px = hwpUnitToPx(paraShape.lineSpacing);
        if (px > 0)
            return `${Math.max(1, Math.min(120, px))}px`;
    }
    const lineHeights = draft?.lineSegments
        .map((segment) => firstPositive(segment.textHeight, segment.height, segment.lineSpacing))
        .filter((value) => value > 0) ?? [];
    if (!lineHeights.length)
        return undefined;
    const average = lineHeights.reduce((sum, value) => sum + value, 0) / lineHeights.length;
    const px = hwpUnitToPx(average);
    return px > 0 ? `${Math.max(1, Math.min(120, px))}px` : undefined;
}
function createParagraphMetrics(text, block, draft) {
    const segmentLineCount = draft?.lineSegments.length ?? 0;
    const segmentLineHeight = medianPositive(draft?.lineSegments.map((segment) => hwpUnitToPx(firstPositive(segment.textHeight, segment.height, segment.lineSpacing))) ?? []);
    const segmentHeight = segmentLineCount > 0 && segmentLineHeight > 0
        ? segmentLineCount * segmentLineHeight
        : 0;
    const fontPx = paragraphFontSizePx(block);
    return {
        lineCount: segmentLineCount || text.split(/\n/).length || 1,
        lineHeightPx: segmentLineHeight || paragraphLineHeightPx(block, fontPx),
        segmentHeightPx: segmentHeight
    };
}
function pageBodyWidth(layout) {
    const margins = layout.margin ?? {};
    return Math.max(120, layout.width - (margins.left ?? 0) - (margins.right ?? 0));
}
function pageBodyHeight(layout) {
    const margins = layout.margin ?? {};
    const inset = layout.decorationInset ?? {};
    return Math.max(240, layout.height
        - (margins.top ?? 0)
        - (margins.bottom ?? 0)
        - (inset.top ?? 0)
        - (inset.bottom ?? 0));
}
function estimateBlockHeight(block, availableWidth) {
    if (block.type === 'paragraph')
        return estimateParagraphHeight(block, availableWidth);
    if (block.type === 'table')
        return estimateTableHeight(block, availableWidth);
    return estimateImageHeight(block);
}
function blockVisualMetrics(block, availableWidth, estimatedHeight) {
    if (block.type === 'paragraph')
        return paragraphVisualMetrics(block, estimatedHeight);
    if (block.type === 'table')
        return tableVisualMetrics(block, availableWidth, estimatedHeight);
    return imageVisualMetrics(block, estimatedHeight);
}
function paragraphVisualMetrics(block, estimatedHeight) {
    const layout = block._hwpxLayout;
    if (layout?.position) {
        return {
            topPx: Math.max(0, Math.round(layout.position.topPx)),
            heightPx: Math.max(estimatedHeight, Math.round(layout.position.heightPx ?? layout.heightPx ?? 0))
        };
    }
    if (layout?.source !== 'hwp-para-line-seg' || !layout.lineSegments?.length)
        return null;
    const top = Math.min(...layout.lineSegments.map((segment) => segment.verticalPosition));
    const bottom = Math.max(...layout.lineSegments.map((segment) => segment.verticalPosition + Math.max(0, segment.verticalSize)));
    const topPx = hwpUnitToPx(Math.max(0, top));
    const rawSpanPx = hwpUnitToPx(Math.max(0, bottom - top));
    const stackedHeightPx = lineSegmentStackedHeightPx(layout);
    if (isImplausibleLineSegmentSpan(rawSpanPx, stackedHeightPx)) {
        return {
            topPx: 0,
            heightPx: Math.max(estimatedHeight, stackedHeightPx, Math.round(layout.heightPx ?? 0))
        };
    }
    const heightPx = Math.max(estimatedHeight, rawSpanPx, stackedHeightPx, Math.round(layout.heightPx ?? 0));
    return { topPx, heightPx };
}
function lineSegmentStackedHeightPx(layout) {
    return layout.lineSegments?.reduce((sum, segment) => sum + Math.max(0, Math.round(segment.heightPx)), 0) ?? 0;
}
function isImplausibleLineSegmentSpan(rawSpanPx, stackedHeightPx) {
    if (rawSpanPx <= MAX_LINE_SEGMENT_HEIGHT_PX)
        return false;
    return rawSpanPx > Math.max(MAX_LINE_SEGMENT_HEIGHT_PX, stackedHeightPx * 4);
}
function tableVisualMetrics(block, availableWidth, estimatedHeight) {
    const position = block._hwpxLayout?.position;
    if (!position)
        return null;
    return {
        topPx: Math.max(0, Math.round(position.topPx)),
        heightPx: Math.max(estimatedHeight, Math.round(position.heightPx ?? 0), Math.round(block._hwpxLayout?.renderHeightPx ?? block._hwpxLayout?.heightPx ?? 0), estimateTableHeight(block, availableWidth))
    };
}
function imageVisualMetrics(block, estimatedHeight) {
    const position = block._hwpxLayout?.position;
    if (!position)
        return null;
    return {
        topPx: Math.max(0, Math.round(position.topPx)),
        heightPx: Math.max(estimatedHeight, Math.round(position.heightPx ?? block._hwpxLayout?.heightPx ?? 0))
    };
}
function estimateBlocksHeight(blocks, availableWidth) {
    return blocks.reduce((sum, block, index) => {
        return sum + (index > 0 ? BLOCK_GAP_PX : 0) + estimateBlockHeight(block, availableWidth);
    }, 0);
}
function estimateParagraphHeight(block, availableWidth) {
    const fontPx = paragraphFontSizePx(block);
    const metrics = paragraphMetrics.get(block);
    const text = block.runs.map((run) => run.text).join('');
    const fallbackLineHeight = paragraphLineHeightPx(block, fontPx);
    const wrappedLineCount = estimateWrappedLineCount(text, availableWidth, fontPx);
    const metricLineCount = metrics?.lineCount ?? 0;
    const useSegmentCount = metricLineCount > 0
        && metricLineCount <= Math.max(wrappedLineCount * 3, wrappedLineCount + 4);
    const rawLineHeight = useSegmentCount && metrics?.lineHeightPx ? metrics.lineHeightPx : fallbackLineHeight;
    const lineHeight = Math.min(Math.max(8, rawLineHeight), Math.max(8, fallbackLineHeight * 2.5), 48);
    const lineCount = useSegmentCount ? Math.max(metricLineCount, wrappedLineCount) : wrappedLineCount;
    const textHeight = Math.max(useSegmentCount ? Math.min(metrics?.segmentHeightPx ?? 0, lineCount * lineHeight) : 0, lineCount * Math.max(8, lineHeight));
    return Math.max(MIN_PARAGRAPH_HEIGHT_PX, Math.ceil(textHeight + boxVertical(block.margin)));
}
function paragraphFontSizePx(block) {
    return textRunsFontSizePx(block.runs);
}
function textRunsFontSizePx(runs) {
    const fontSizes = runs
        .map((run) => run.fontSizePt)
        .filter((value) => Number.isFinite(value) && Number(value) > 0);
    if (!fontSizes.length)
        return 12 * PT_TO_PX;
    const averagePt = fontSizes.reduce((sum, value) => sum + value, 0) / fontSizes.length;
    return Math.max(8, averagePt * PT_TO_PX);
}
function paragraphLineHeightPx(block, fontPx) {
    const lineHeight = block.lineHeight?.trim() ?? '';
    if (lineHeight.endsWith('%')) {
        const percent = Number(lineHeight.slice(0, -1));
        if (Number.isFinite(percent) && percent > 0)
            return Math.max(8, fontPx * percent / 100);
    }
    if (lineHeight.endsWith('px')) {
        const px = Number(lineHeight.slice(0, -2));
        if (Number.isFinite(px) && px > 0)
            return Math.max(8, px);
    }
    const numeric = Number(lineHeight);
    if (Number.isFinite(numeric) && numeric > 0)
        return Math.max(8, fontPx * numeric);
    return fontPx * 1.25;
}
function estimateWrappedLineCount(text, availableWidth, fontPx) {
    if (!text)
        return 1;
    const charWidth = Math.max(5, fontPx * 0.92);
    const charsPerLine = Math.max(8, Math.floor(availableWidth / charWidth));
    return text.split(/\n/).reduce((count, line) => {
        return count + Math.max(1, Math.ceil(countDisplayColumns(line) / charsPerLine));
    }, 0);
}
function countDisplayColumns(text) {
    let columns = 0;
    for (const char of text) {
        columns += /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3\u4e00-\u9fff]/u.test(char) ? 1.05 : 0.6;
    }
    return Math.max(1, Math.ceil(columns));
}
function estimateImageHeight(block) {
    const height = Number(block.height) || 0;
    if (height > 0)
        return Math.max(24, height);
    const width = Number(block.width) || 0;
    return width > 0 ? Math.max(24, Math.round(width * 0.65)) : 96;
}
function estimateTableHeight(block, availableWidth) {
    const rowHeights = estimateTableRowHeights(block, availableWidth);
    if (!rowHeights.length)
        return MIN_TABLE_ROW_HEIGHT_PX;
    return Math.ceil(rowHeights.reduce((sum, height) => sum + height, 0) + TABLE_BORDER_ESTIMATE_PX * rowHeights.length);
}
function estimateTableRowHeights(block, availableWidth) {
    const rows = block.rows;
    if (!rows.length)
        return [];
    const tableWidth = resolveEstimatedTableWidth(block, availableWidth);
    const columnWidths = resolveEstimatedColumnWidths(block, tableWidth);
    const explicitRowHeights = Array.from({ length: rows.length }, () => 0);
    const contentRowHeights = Array.from({ length: rows.length }, () => 0);
    rows.forEach((row, rowIndex) => {
        let columnOffset = 0;
        for (const cell of row.cells) {
            const colSpan = Math.max(1, cell.colSpan || 1);
            const rowSpan = Math.max(1, cell.rowSpan || 1);
            const cellWidth = columnSpanWidthPx(columnWidths, columnOffset, colSpan, tableWidth);
            const explicitHeight = Number(cell.height) || 0;
            const contentHeight = estimateBlocksHeight(cell.blocks, Math.max(32, cellWidth - boxHorizontal(cell.padding)))
                + boxVertical(cell.padding)
                + TABLE_BORDER_ESTIMATE_PX * 2;
            const targetHeights = explicitHeight > 0 ? explicitRowHeights : contentRowHeights;
            const perRowHeight = Math.max(MIN_TABLE_ROW_HEIGHT_PX, explicitHeight > 0 ? explicitHeight : contentHeight) / rowSpan;
            for (let spanRow = rowIndex; spanRow < Math.min(rows.length, rowIndex + rowSpan); spanRow += 1) {
                targetHeights[spanRow] = Math.max(targetHeights[spanRow] ?? 0, perRowHeight);
            }
            columnOffset += colSpan;
        }
    });
    return explicitRowHeights.map((height, index) => {
        return Math.max(MIN_TABLE_ROW_HEIGHT_PX, Math.ceil(height || contentRowHeights[index] || 0));
    });
}
function splitTableForPagination(block, pageBudget, availableWidth) {
    if (block._hwpxLayout?.pageBreak === 'NONE')
        return [block];
    const rowHeights = estimateTableRowHeights(block, availableWidth);
    const tableHeight = rowHeights.reduce((sum, height) => sum + height, 0);
    if (block.rows.length <= 1 || tableHeight <= pageBudget * TABLE_SPLIT_TOLERANCE)
        return [block];
    const fragments = [];
    let startRow = 0;
    while (startRow < block.rows.length) {
        let used = 0;
        let endRow = startRow;
        let lastSafeBreak = startRow;
        while (endRow < block.rows.length) {
            const nextHeight = rowHeights[endRow] ?? MIN_TABLE_ROW_HEIGHT_PX;
            if (endRow > startRow && used + nextHeight > pageBudget)
                break;
            used += nextHeight;
            endRow += 1;
            if (isSafeTableBreak(block, endRow))
                lastSafeBreak = endRow;
        }
        if (endRow <= startRow)
            endRow = startRow + 1;
        if (lastSafeBreak > startRow && lastSafeBreak < endRow)
            endRow = lastSafeBreak;
        fragments.push(cloneTableRows(block, startRow, endRow));
        startRow = endRow;
    }
    return fragments.length > 1 ? fragments : [block];
}
function isSafeTableBreak(block, breakRow) {
    if (breakRow <= 0 || breakRow >= block.rows.length)
        return true;
    return !block.rows.some((row, rowIndex) => {
        return rowIndex < breakRow && row.cells.some((cell) => rowIndex + Math.max(1, cell.rowSpan || 1) > breakRow);
    });
}
function cloneTableRows(block, startRow, endRow) {
    const layout = block._hwpxLayout;
    const rowHeightsPx = layout?.rowHeightsPx?.slice(startRow, endRow) ?? [];
    const slicedHeightPx = rowHeightsPx.length
        ? rowHeightsPx.reduce((sum, height) => sum + Math.max(0, height), 0)
        : 0;
    const shouldPatchLayout = Boolean(layout && (startRow > 0 || endRow < block.rows.length || rowHeightsPx.length));
    return {
        ...block,
        rows: block.rows.slice(startRow, endRow),
        ...(layout && shouldPatchLayout
            ? {
                _hwpxLayout: {
                    ...layout,
                    ...(rowHeightsPx.length ? { rowHeightsPx } : {}),
                    ...(slicedHeightPx > 0 ? { heightPx: slicedHeightPx } : {}),
                    ...(startRow > 0 ? { position: undefined } : {})
                }
            }
            : {})
    };
}
function resolveEstimatedTableWidth(block, availableWidth) {
    const width = Number(block.width) || 0;
    if (width > 0)
        return Math.max(16, Math.min(width, availableWidth));
    return Math.max(16, availableWidth);
}
function resolveEstimatedColumnWidths(block, tableWidth) {
    const columnCount = Math.max(1, block.columnWidths?.length ?? 0, ...block.rows.map((row) => row.cells.reduce((sum, cell) => sum + Math.max(1, cell.colSpan || 1), 0)));
    const source = block.columnWidths?.length
        ? block.columnWidths.slice(0, columnCount)
        : Array.from({ length: columnCount }, () => 1);
    while (source.length < columnCount)
        source.push(1);
    const total = source.reduce((sum, value) => sum + (Number(value) > 0 ? Number(value) : 1), 0) || source.length;
    return source.map((value) => tableWidth * ((Number(value) > 0 ? Number(value) : 1) / total));
}
function columnSpanWidthPx(widths, start, span, fallbackWidth) {
    if (!widths.length)
        return fallbackWidth;
    const end = Math.min(widths.length, start + Math.max(1, span));
    const value = widths.slice(start, end).reduce((sum, width) => sum + width, 0);
    return value > 0 ? value : fallbackWidth / widths.length * Math.max(1, span);
}
function boxVertical(spacing) {
    if (!spacing)
        return 0;
    return Math.max(0, spacing.top ?? 0) + Math.max(0, spacing.bottom ?? 0);
}
function boxHorizontal(spacing) {
    if (!spacing)
        return 0;
    return Math.max(0, spacing.left ?? 0) + Math.max(0, spacing.right ?? 0);
}
function medianPositive(values) {
    const positive = values.filter((value) => Number.isFinite(value) && value > 0).sort((left, right) => left - right);
    if (!positive.length)
        return 0;
    return positive[Math.floor(positive.length / 2)] ?? 0;
}
function placeTableCells(rows, sortedCells, rowCount, colCount) {
    if (rowCount * colCount > 400) {
        for (const cell of sortedCells)
            rows[cell.row]?.cells.push(cell.model);
        return;
    }
    const starts = new Map();
    for (const cell of sortedCells) {
        const key = `${cell.row}:${cell.col}`;
        if (!starts.has(key))
            starts.set(key, cell);
    }
    const occupied = new Set();
    for (let row = 0; row < rowCount; row += 1) {
        for (let col = 0; col < colCount; col += 1) {
            const key = `${row}:${col}`;
            const cell = starts.get(key);
            if (cell) {
                rows[row]?.cells.push(cell.model);
                markOccupied(occupied, cell, rowCount, colCount);
                continue;
            }
            if (occupied.has(key))
                continue;
            rows[row]?.cells.push({ blocks: [], colSpan: 1, rowSpan: 1 });
        }
    }
}
function markOccupied(occupied, cell, rowCount, colCount) {
    for (let row = cell.row; row < Math.min(rowCount, cell.row + cell.rowSpan); row += 1) {
        for (let col = cell.col; col < Math.min(colCount, cell.col + cell.colSpan); col += 1) {
            occupied.add(`${row}:${col}`);
        }
    }
}
function synthesizeEmptyCells(rows, rowCount, colCount) {
    if (rowCount * colCount > 400) {
        rows[0]?.cells.push({ blocks: [], colSpan: colCount, rowSpan: rowCount });
        return;
    }
    for (const row of rows) {
        for (let col = 0; col < colCount; col += 1) {
            row.cells.push({ blocks: [], colSpan: 1, rowSpan: 1 });
        }
    }
}
function synthesizeColumnWidths(cells, colCount) {
    const widths = Array.from({ length: colCount }, () => 0);
    for (const cell of cells) {
        if (cell.colSpan !== 1 || cell.width <= 0 || cell.col >= colCount)
            continue;
        widths[cell.col] = Math.max(widths[cell.col] ?? 0, cell.width);
    }
    for (const cell of cells) {
        if (cell.colSpan <= 1 || cell.width <= 0 || cell.col >= colCount)
            continue;
        const start = Math.max(0, cell.col);
        const end = Math.min(colCount, cell.col + cell.colSpan);
        const spanIndexes = Array.from({ length: end - start }, (_value, offset) => start + offset);
        const existing = spanIndexes.reduce((sum, col) => sum + (widths[col] ?? 0), 0);
        if (existing >= cell.width)
            continue;
        const missing = spanIndexes.filter((col) => !(widths[col] && widths[col] > 0));
        if (missing.length) {
            const distributed = (cell.width - existing) / missing.length;
            for (const col of missing)
                widths[col] = Math.max(widths[col] ?? 0, distributed);
            continue;
        }
        const basis = existing || spanIndexes.length;
        for (const col of spanIndexes) {
            const ratio = (widths[col] ?? 0) / basis || (1 / spanIndexes.length);
            widths[col] = (widths[col] ?? 0) + ((cell.width - existing) * ratio);
        }
    }
    if (!widths.some((width) => width > 0))
        return [];
    const known = widths.filter((width) => width > 0);
    const fallback = known.reduce((sum, width) => sum + width, 0) / Math.max(1, known.length);
    return widths.map((width) => width > 0 ? width : fallback);
}
function extractUtf16Strings(bytes, starts = [0]) {
    const strings = [];
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (const start of starts) {
        let run = [];
        const flush = () => {
            if (run.length >= 2) {
                const text = String.fromCharCode(...run).trim();
                if (/[\p{L}\p{N}]/u.test(text))
                    strings.push(text);
            }
            run = [];
        };
        for (let offset = start; offset + 2 <= bytes.length; offset += 2) {
            const code = view.getUint16(offset, true);
            if (isPrintableUtf16(code))
                run.push(code);
            else
                flush();
        }
        flush();
    }
    return uniqueStrings(strings);
}
function decodeUtf16String(bytes, offset, charLength) {
    if (charLength <= 0 || offset >= bytes.length)
        return '';
    const byteLength = Math.min(bytes.length - offset, charLength * 2);
    return new TextDecoder('utf-16le')
        .decode(bytes.subarray(offset, offset + byteLength))
        .replace(/\u0000/g, '')
        .trim();
}
function readLengthPrefixedUtf16(bytes, offset) {
    if (offset + 2 > bytes.length)
        return { text: '', nextOffset: offset };
    const charLength = readUInt16(bytes, offset);
    const textOffset = offset + 2;
    if (charLength <= 0)
        return { text: '', nextOffset: textOffset };
    const byteLength = Math.min(bytes.length - textOffset, charLength * 2);
    const text = new TextDecoder('utf-16le')
        .decode(bytes.subarray(textOffset, textOffset + byteLength))
        .replace(/\u0000/g, '')
        .trim();
    return {
        text,
        nextOffset: textOffset + byteLength
    };
}
function isPrintableUtf16(code) {
    return (code >= 0x20 && code <= 0x7e)
        || (code >= 0x1100 && code <= 0x11ff)
        || (code >= 0x3130 && code <= 0x318f)
        || (code >= 0xac00 && code <= 0xd7a3)
        || (code >= 0x4e00 && code <= 0x9fff);
}
function isPlausibleFontName(value) {
    if (!value || value.length > 80)
        return false;
    if (/[\u0000-\u001f\ufffd]/u.test(value))
        return false;
    return /[\p{L}\p{N}]/u.test(value);
}
function hwpAlignFromAttr(attr) {
    const value = (attr >>> 2) & 0x7;
    if (value === 1)
        return 'left';
    if (value === 2)
        return 'right';
    if (value === 3)
        return 'center';
    return 'justify';
}
function hwpLineSpacingTypeFromCode(code) {
    if (code === 0)
        return 'percent';
    if (code === 1)
        return 'fixed';
    if (code === 2)
        return 'space-only';
    if (code === 3)
        return 'minimum';
    return '';
}
function resolveHwpCellPaint(docInfo, borderFillId) {
    const borderFill = borderFillId > 0 ? docInfo.borderFills[borderFillId] : null;
    if (!borderFill)
        return {};
    const borderEdges = hwpBorderFillToCssEdges(borderFill);
    const border = firstVisibleBorderEdge(borderEdges);
    const gradient = hwpFillGradientToCss(borderFill.fillGradient);
    const background = gradient
        || (borderFill.fillColor && borderFill.fillColor.toLowerCase() !== '#ffffff'
            ? borderFill.fillColor
            : undefined);
    return {
        ...(border ? { border } : {}),
        ...(borderEdges ? { borderEdges } : {}),
        ...(background ? { background } : {})
    };
}
function hwpFillGradientToCss(fillGradient) {
    const colors = fillGradient?.colors.filter(Boolean) ?? [];
    if (colors.length < 2)
        return '';
    const angle = Number.isFinite(fillGradient?.angle)
        ? 90 - Number(fillGradient?.angle)
        : 90;
    if (fillGradient?.type === 'RADIAL')
        return `radial-gradient(circle, ${colors.join(', ')})`;
    return `linear-gradient(${angle}deg, ${colors.join(', ')})`;
}
function hwpBorderFillToCssEdges(borderFill) {
    const edges = {
        top: hwpBorderSpecToCss(borderFill.top),
        right: hwpBorderSpecToCss(borderFill.right),
        bottom: hwpBorderSpecToCss(borderFill.bottom),
        left: hwpBorderSpecToCss(borderFill.left)
    };
    return hasAnyBorderEdge(edges) ? edges : undefined;
}
function hwpBorderSpecToCss(side) {
    const style = hwpBorderTypeToCss(side.type);
    if (style === 'none' || side.widthMm <= 0)
        return '0 none transparent';
    const width = hwpBorderWidthToCss(side.widthMm);
    const color = side.color || '#000000';
    return `${width} ${style} ${color}`;
}
function firstVisibleBorderEdge(edges) {
    if (!edges)
        return undefined;
    return [edges.top, edges.right, edges.bottom, edges.left]
        .find((edge) => Boolean(edge && !edge.startsWith('0 none')));
}
function hasAnyBorderEdge(edges) {
    return Boolean(edges.top || edges.right || edges.bottom || edges.left);
}
function hwpBorderTypeName(typeId) {
    switch (typeId) {
        case 1: return 'SOLID';
        case 2: return 'DASH';
        case 3: return 'DOT';
        case 4: return 'DASH_DOT';
        case 5: return 'DASH_DOT_DOT';
        case 6: return 'LONG_DASH';
        case 7: return 'LARGE_DOT';
        case 8:
        case 9:
        case 10:
        case 11:
        case 13:
            return 'DOUBLE';
        case 12: return 'SOLID';
        case 14: return 'INSET';
        case 15: return 'OUTSET';
        case 16: return 'GROOVE';
        case 17: return 'RIDGE';
        default: return 'NONE';
    }
}
function hwpBorderTypeToCss(type) {
    switch (type) {
        case 'SOLID': return 'solid';
        case 'DASH':
        case 'LONG_DASH':
        case 'DASH_DOT':
        case 'DASH_DOT_DOT':
            return 'dashed';
        case 'DOT':
        case 'LARGE_DOT':
            return 'dotted';
        case 'DOUBLE': return 'double';
        case 'INSET': return 'inset';
        case 'OUTSET': return 'outset';
        case 'GROOVE': return 'groove';
        case 'RIDGE': return 'ridge';
        default: return 'none';
    }
}
function hwpBorderWidthMm(widthId) {
    return [
        0.1, 0.12, 0.15, 0.2,
        0.25, 0.3, 0.4, 0.5,
        0.6, 0.7, 1.0, 1.5,
        2.0, 3.0, 4.0, 5.0
    ][widthId] ?? 0.1;
}
function hwpBorderWidthToCss(widthMm) {
    const px = Math.max(0.5, Math.min(8, Math.round(widthMm * 3.78 * 10) / 10));
    return `${px}px`;
}
function hwpColorRefToCss(value) {
    if (!Number.isFinite(value))
        return '';
    const red = value & 0xff;
    const green = (value >>> 8) & 0xff;
    const blue = (value >>> 16) & 0xff;
    if (red === 0 && green === 0 && blue === 0)
        return '#000000';
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
function hwpUnitToPx(value) {
    if (!Number.isFinite(value) || value <= 0)
        return 0;
    return Math.max(1, Math.round(value / HWPUNIT_PER_PX));
}
function hwpSignedUnitToPx(value) {
    if (!Number.isFinite(value) || value === 0)
        return 0;
    return Math.round(value / HWPUNIT_PER_PX);
}
function hasAnyBoxValue(spacing) {
    if (!spacing)
        return false;
    return Boolean(spacing.top || spacing.right || spacing.bottom || spacing.left);
}
function readSignedByte(value) {
    return value > 127 ? value - 256 : value;
}
function clampInteger(value, min, max) {
    if (!Number.isFinite(value))
        return min;
    return Math.max(min, Math.min(max, Math.trunc(value)));
}
function scanPictureBinIdTail(body) {
    const values = [];
    for (let offset = 64; offset + 2 <= body.length; offset += 2) {
        const little = readUInt16(body, offset);
        const big = readUInt16BE(body, offset);
        if (little > 0 && little <= 100000)
            values.push(little);
        if (big > 0 && big <= 100000)
            values.push(big);
    }
    return values;
}
function normalizeBinDataBytes(bytes) {
    if (detectImageMagicMime(bytes))
        return bytes;
    for (const decode of [inflateSync, decompressSync]) {
        try {
            const decoded = decode(bytes);
            if (detectImageMagicMime(decoded))
                return decoded;
        }
        catch {
            // Some BinData streams are already plain bytes; failed attempts are expected.
        }
    }
    return bytes;
}
function detectImageMagicMime(bytes) {
    if (bytes.length >= 8
        && bytes[0] === 0x89
        && bytes[1] === 0x50
        && bytes[2] === 0x4e
        && bytes[3] === 0x47)
        return 'image/png';
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
        return 'image/jpeg';
    if (bytes.length >= 6
        && bytes[0] === 0x47
        && bytes[1] === 0x49
        && bytes[2] === 0x46)
        return 'image/gif';
    if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d)
        return 'image/bmp';
    if (bytes.length >= 12
        && bytes[0] === 0x52
        && bytes[1] === 0x49
        && bytes[2] === 0x46
        && bytes[3] === 0x46
        && bytes[8] === 0x57
        && bytes[9] === 0x45
        && bytes[10] === 0x42
        && bytes[11] === 0x50)
        return 'image/webp';
    return '';
}
function findBinDataRefForStream(refs, streamId) {
    if (streamId <= 0)
        return null;
    return refs.find((ref) => ref.binDataId === streamId) ?? refs.find((ref) => ref.refId === streamId) ?? null;
}
function inferExtension(name) {
    const match = name.match(/\.([a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : '';
}
function uniqueStrings(values) {
    const output = [];
    const seen = new Set();
    for (const value of values) {
        const normalized = value.trim();
        if (!normalized || seen.has(normalized))
            continue;
        seen.add(normalized);
        output.push(normalized);
    }
    return output;
}
function isNonBodyControl(controlId) {
    return controlId === 'secd'
        || controlId === 'head'
        || controlId === 'foot'
        || controlId === 'fn  '
        || controlId === 'en  ';
}
function recordNonBodyControl(context, artifacts, control, controlId, childRecordCount, blockCount, applyPageType, objectInfo) {
    const summary = {
        controlId,
        kind: hwpControlKind(controlId),
        level: control.level,
        childRecordCount,
        blockCount,
        ...(applyPageType ? { applyPageType } : {}),
        ...(objectInfo && objectInfo.width > 0 ? { widthPx: objectInfo.width } : {}),
        ...(objectInfo && objectInfo.height > 0 ? { heightPx: objectInfo.height } : {})
    };
    context.nonBodyControls.push(summary);
    artifacts?.sectionControls.push(summary);
    context.stats.preservedNonBodyControlCount += 1;
}
function countControlChildRecords(records, startIndex, parentLevel) {
    let count = 0;
    for (let index = startIndex; index < records.length && records[index].level > parentLevel; index += 1) {
        count += 1;
    }
    return count;
}
function hwpControlKind(controlId) {
    switch (controlId) {
        case 'head': return 'header';
        case 'foot': return 'footer';
        case 'secd': return 'sectionDefinition';
        case 'fn  ': return 'footnote';
        case 'en  ': return 'endnote';
        default: return controlId ? 'control' : '';
    }
}
function parseHeaderFooterApplyPageType(body) {
    const attr = body.length >= 8 ? readUInt32(body, 4) : 0;
    switch (attr & 0x3) {
        case 1: return 'odd';
        case 2: return 'even';
        case 3: return 'first';
        default: return 'all';
    }
}
function hwpTablePageBreakFromSplitPage(splitPage) {
    if (splitPage === 1)
        return 'CELL';
    if (splitPage === 2)
        return 'SPLIT';
    if (splitPage === 0)
        return 'NONE';
    return `UNKNOWN_${splitPage}`;
}
function recordTableSplitPolicy(context, tableInfo) {
    switch (tableInfo?.pageBreak) {
        case 'NONE':
            context.stats.tableSplitPolicyNoneCount += 1;
            break;
        case 'CELL':
            context.stats.tableSplitPolicyCellCount += 1;
            break;
        case 'SPLIT':
            context.stats.tableSplitPolicySplitCount += 1;
            break;
        default:
            context.stats.tableSplitPolicyUnknownCount += 1;
            break;
    }
}
function readControlId(body) {
    if (body.length < 4)
        return '';
    return String.fromCharCode(body[3] ?? 0, body[2] ?? 0, body[1] ?? 0, body[0] ?? 0);
}
function findSubtreeEnd(records, startIndex, parentLevel) {
    let index = startIndex;
    while (index < records.length && records[index].level > parentLevel)
        index += 1;
    return index;
}
function cellVerticalAlign(flags) {
    const value = (flags >>> 5) & 0x3;
    if (value === 1)
        return 'middle';
    if (value === 2)
        return 'bottom';
    return 'top';
}
function firstPositive(...values) {
    for (const value of values) {
        if (Number.isFinite(value) && Number(value) > 0)
            return Number(value);
    }
    return 0;
}
function uniquePositive(values) {
    const output = [];
    const seen = new Set();
    for (const value of values) {
        if (!Number.isFinite(value) || value <= 0 || seen.has(value))
            continue;
        seen.add(value);
        output.push(value);
    }
    return output;
}
function binDataNumber(asset) {
    return binDataNumberFromName(`${asset.id} ${asset.path ?? ''}`);
}
function binDataNumberFromName(name) {
    const match = name.match(/(?:BIN|BinaryData)0*(\d+)/i);
    return match ? Number(match[1]) : 0;
}
function isLikelyImageAsset(asset) {
    if (asset.mimeType.startsWith('image/'))
        return true;
    return /\.(png|jpe?g|gif|bmp|webp)$/i.test(`${asset.id} ${asset.path ?? ''}`);
}
function sectionNumber(name) {
    const match = name.match(/Section(\d+)/i);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}
function inferMimeType(name, bytes) {
    const detected = bytes ? detectImageMagicMime(bytes) : '';
    if (detected)
        return detected;
    const lower = name.toLowerCase();
    if (lower.endsWith('.png'))
        return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg'))
        return 'image/jpeg';
    if (lower.endsWith('.gif'))
        return 'image/gif';
    if (lower.endsWith('.bmp'))
        return 'image/bmp';
    if (lower.endsWith('.webp'))
        return 'image/webp';
    return 'application/octet-stream';
}
function readInt16(bytes, offset) {
    if (offset + 2 > bytes.length)
        return 0;
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt16(offset, true);
}
function readInt32(bytes, offset) {
    if (offset + 4 > bytes.length)
        return 0;
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt32(offset, true);
}
function readUInt16BE(bytes, offset) {
    if (offset + 2 > bytes.length)
        return 0;
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(offset, false);
}
function readUInt32BE(bytes, offset) {
    if (offset + 4 > bytes.length)
        return 0;
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, false);
}
