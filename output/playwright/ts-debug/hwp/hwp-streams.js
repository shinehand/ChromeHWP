import { decompressSync, inflateSync } from 'fflate';
import { readHwpRecords, scoreRecords } from './hwp-records';
export function parseHwpFileHeader(bytes) {
    if (bytes.length < 40)
        throw new Error('HWP FileHeader 스트림이 너무 작습니다.');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const signature = new TextDecoder('ascii').decode(bytes.subarray(0, 32)).replace(/\u0000/g, '').trim();
    if (!/^HWP Document File/i.test(signature))
        throw new Error(`HWP FileHeader 시그니처가 올바르지 않습니다: ${signature}`);
    const versionRaw = view.getUint32(32, true);
    const properties = view.getUint32(36, true);
    return {
        signature,
        versionRaw,
        version: [
            (versionRaw >>> 24) & 0xff,
            (versionRaw >>> 16) & 0xff,
            (versionRaw >>> 8) & 0xff,
            versionRaw & 0xff
        ].join('.'),
        properties,
        flags: {
            compressed: Boolean(properties & (1 << 0)),
            passwordProtected: Boolean(properties & (1 << 1)),
            distributed: Boolean(properties & (1 << 2)),
            script: Boolean(properties & (1 << 3)),
            drm: Boolean(properties & (1 << 4)),
            xmlTemplate: Boolean(properties & (1 << 5)),
            history: Boolean(properties & (1 << 6)),
            certificateEncrypted: Boolean(properties & (1 << 8))
        }
    };
}
export function assertReadableHwpHeader(header) {
    if (header.flags.drm)
        throw new Error('DRM 보안 HWP 문서는 열 수 없습니다.');
    if (header.flags.certificateEncrypted)
        throw new Error('공인인증서 암호화 HWP 문서는 열 수 없습니다.');
    if (header.flags.passwordProtected && !header.flags.distributed)
        throw new Error('암호가 설정된 HWP 문서는 열 수 없습니다.');
}
export function decodeRecordStream(streamBytes, compressedHint) {
    const attempts = buildStreamAttempts(streamBytes, compressedHint);
    let best = null;
    let bestScore = -1;
    for (const attempt of attempts) {
        const records = readHwpRecords(attempt.bytes);
        const score = scoreRecords(records);
        if (records.length > 0 && score > bestScore) {
            bestScore = score;
            best = { ...attempt, records };
        }
    }
    if (best)
        return best;
    return {
        mode: 'raw-unstructured',
        bytes: streamBytes,
        records: []
    };
}
function buildStreamAttempts(bytes, compressedHint) {
    const attempts = [];
    const seen = new Set();
    const add = (mode, value) => {
        const key = `${value.length}:${Array.from(value.subarray(0, 16)).join(',')}`;
        if (seen.has(key))
            return;
        seen.add(key);
        attempts.push({ mode, bytes: value });
    };
    const tryAdd = (mode, decode) => {
        try {
            add(mode, decode());
        }
        catch {
            // The parser intentionally tries several legal HWP stream encodings.
        }
    };
    if (!compressedHint)
        add('raw', bytes);
    tryAdd('deflate-raw', () => inflateSync(bytes));
    tryAdd('deflate', () => decompressSync(bytes));
    if (compressedHint)
        add('raw', bytes);
    return attempts;
}
export function readUInt16(bytes, offset) {
    if (offset + 2 > bytes.length)
        return 0;
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(offset, true);
}
export function readUInt32(bytes, offset) {
    if (offset + 4 > bytes.length)
        return 0;
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, true);
}
