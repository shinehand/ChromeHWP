export const HWP_TAG = {
    DOCUMENT_PROPERTIES: 16,
    ID_MAPPINGS: 17,
    BIN_DATA: 18,
    FACE_NAME: 19,
    BORDER_FILL: 20,
    CHAR_SHAPE: 21,
    TAB_DEF: 22,
    NUMBERING: 23,
    BULLET: 24,
    PARA_SHAPE: 25,
    STYLE: 26,
    PARA_HEADER: 66,
    PARA_TEXT: 67,
    PARA_CHAR_SHAPE: 68,
    PARA_LINE_SEG: 69,
    PARA_RANGE_TAG: 70,
    CTRL_HEADER: 71,
    LIST_HEADER: 72,
    PAGE_DEF: 73,
    FOOTNOTE_SHAPE: 74,
    PAGE_BORDER_FILL: 75,
    PAGE_NUM_PARA: 76,
    TABLE: 77,
    SHAPE_COMPONENT: 78,
    SHAPE_COMPONENT_LINE: 79,
    SHAPE_COMPONENT_RECTANGLE: 80,
    SHAPE_COMPONENT_ELLIPSE: 81,
    SHAPE_COMPONENT_ARC: 82,
    SHAPE_COMPONENT_POLYGON: 83,
    SHAPE_COMPONENT_OLE: 84,
    SHAPE_COMPONENT_PICTURE: 85,
    SHAPE_COMPONENT_CONTAINER: 86,
    CONTAINER: 87,
    EQEDIT: 88,
    CTRL_DATA: 89,
    CHART_DATA: 95,
    VIDEO_DATA: 98,
    MEMO_SHAPE: 99
};
export function readHwpRecord(bytes, offset) {
    if (offset + 4 > bytes.length)
        return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const headerOffset = offset;
    const header = view.getUint32(offset, true);
    offset += 4;
    const tagId = header & 0x3ff;
    const level = (header >>> 10) & 0x3ff;
    let size = (header >>> 20) & 0xfff;
    if (size === 0xfff) {
        if (offset + 4 > bytes.length)
            return null;
        size = view.getUint32(offset, true);
        offset += 4;
    }
    if (size < 0 || offset + size > bytes.length)
        return null;
    return {
        tagId,
        level,
        size,
        headerOffset,
        bodyOffset: offset,
        nextOffset: offset + size,
        body: bytes.subarray(offset, offset + size)
    };
}
export function readHwpRecords(bytes, limit = 500000) {
    const records = [];
    let offset = 0;
    while (offset < bytes.length && records.length < limit) {
        const record = readHwpRecord(bytes, offset);
        if (!record)
            break;
        records.push(record);
        if (record.nextOffset <= offset)
            break;
        offset = record.nextOffset;
    }
    return records;
}
export function decodeParaText(body) {
    const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
    const chars = [];
    for (let offset = 0; offset + 2 <= body.length; offset += 2) {
        const code = view.getUint16(offset, true);
        if (code === 0x0000)
            continue;
        if (code === 0x0009) {
            chars.push('\t');
            offset += 14;
            continue;
        }
        if (code === 0x000a || code === 0x000d) {
            chars.push('\n');
            continue;
        }
        if (code === 0x0018) {
            chars.push('-');
            continue;
        }
        if (code === 0x001e || code === 0x001f) {
            chars.push(' ');
            continue;
        }
        if (isExtendedControlCode(code)) {
            offset += 14;
            continue;
        }
        if (isInlineControlCode(code))
            continue;
        if (code >= 0x20 || code === 0x000b) {
            chars.push(String.fromCharCode(code));
        }
    }
    return chars.join('').replace(/\n{3,}/g, '\n\n').trimEnd();
}
export function scanUtf16Text(bytes, minimumBytes = 20) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let bestStart = -1;
    let bestLength = 0;
    let bestScore = 0;
    let runStart = -1;
    let runLength = 0;
    let hangulCount = 0;
    const flush = () => {
        if (runLength >= minimumBytes && hangulCount > 0) {
            const score = runLength + hangulCount * 12;
            if (score > bestScore) {
                bestScore = score;
                bestStart = runStart;
                bestLength = runLength;
            }
        }
        runStart = -1;
        runLength = 0;
        hangulCount = 0;
    };
    for (let offset = 0; offset + 2 <= bytes.length; offset += 2) {
        const code = view.getUint16(offset, true);
        if (isReadableCodePoint(code)) {
            if (runStart < 0)
                runStart = offset;
            runLength += 2;
            if (code >= 0xac00 && code <= 0xd7a3)
                hangulCount += 1;
        }
        else {
            flush();
        }
    }
    flush();
    if (bestStart < 0)
        return '';
    return new TextDecoder('utf-16le')
        .decode(bytes.subarray(bestStart, bestStart + bestLength))
        .replace(/\u0000/g, '')
        .trim();
}
export function scoreRecords(records) {
    let score = records.length;
    for (const record of records) {
        if (record.tagId === HWP_TAG.PARA_TEXT)
            score += decodeParaText(record.body).replace(/\s+/g, '').length * 20;
        if (record.tagId === HWP_TAG.PARA_HEADER)
            score += 5;
        if (record.tagId === HWP_TAG.PARA_CHAR_SHAPE || record.tagId === HWP_TAG.PARA_LINE_SEG)
            score += 2;
        if (record.tagId === HWP_TAG.CTRL_HEADER || record.tagId === HWP_TAG.LIST_HEADER)
            score += 4;
        if (record.tagId === HWP_TAG.TABLE || record.tagId === HWP_TAG.SHAPE_COMPONENT_PICTURE)
            score += 10;
    }
    return score;
}
function isExtendedControlCode(code) {
    return code === 0x0002 || code === 0x0003 || code === 0x000b || (code >= 0x000f && code <= 0x0017);
}
function isInlineControlCode(code) {
    return code < 0x20 && code !== 0x0009 && code !== 0x000a && code !== 0x000d;
}
function isReadableCodePoint(code) {
    return code === 0x0009
        || code === 0x000a
        || code === 0x000d
        || (code >= 0x0020 && code <= 0x007e)
        || (code >= 0x1100 && code <= 0x11ff)
        || (code >= 0x3130 && code <= 0x318f)
        || (code >= 0xac00 && code <= 0xd7a3)
        || (code >= 0x4e00 && code <= 0x9fff);
}
