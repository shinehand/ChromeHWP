const CFB_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const FREE_SECTOR = 0xffffffff;
const END_OF_CHAIN = 0xfffffffe;
const FAT_SECTOR = 0xfffffffd;
const DIFAT_SECTOR = 0xfffffffc;
const MAX_REGULAR_SECTOR = 0xfffffff9;
const DIRECTORY_ENTRY_SIZE = 128;
const MINI_SECTOR_SIZE = 64;
export class CfbReader {
    entries;
    bytes;
    view;
    sectorSize;
    miniStreamCutoff;
    firstDirectorySector;
    firstMiniFatSector;
    miniFatSectorCount;
    fat;
    miniFat;
    miniStream;
    entriesByPath;
    constructor(bytes) {
        this.bytes = bytes;
        this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        this.assertSignature();
        this.sectorSize = 1 << this.readU16(0x1e);
        this.miniStreamCutoff = this.readU32(0x38);
        this.firstDirectorySector = this.readU32(0x30);
        this.firstMiniFatSector = this.readU32(0x3c);
        this.miniFatSectorCount = this.readU32(0x40);
        this.fat = this.readFat();
        const rawEntries = this.readRawDirectoryEntries();
        const root = rawEntries[0];
        this.miniStream = root ? this.readRegularStream(root.startSector, root.size) : new Uint8Array();
        this.miniFat = this.readMiniFat();
        this.entries = this.buildEntryPaths(rawEntries);
        this.entriesByPath = new Map();
        for (const entry of this.entries) {
            if (entry.path)
                this.entriesByPath.set(normalizeLookupPath(entry.path), entry);
            if (entry.name)
                this.entriesByPath.set(normalizeLookupPath(entry.name), entry);
        }
    }
    static open(bytes) {
        return new CfbReader(bytes);
    }
    findEntry(path) {
        return this.entriesByPath.get(normalizeLookupPath(path)) ?? null;
    }
    findEntriesUnder(storagePath, namePattern) {
        const prefix = normalizePath(storagePath);
        return this.entries
            .filter((entry) => entry.type === 'stream')
            .filter((entry) => entry.path === prefix || entry.path.startsWith(`${prefix}/`))
            .filter((entry) => !namePattern || namePattern.test(entry.name) || namePattern.test(entry.path))
            .sort((left, right) => left.path.localeCompare(right.path, 'ko'));
    }
    readStream(pathOrEntry) {
        const entry = typeof pathOrEntry === 'string' ? this.findEntry(pathOrEntry) : pathOrEntry;
        if (!entry)
            throw new Error(`CFB 스트림을 찾지 못했습니다: ${String(pathOrEntry)}`);
        if (entry.type !== 'stream' && entry.type !== 'root') {
            throw new Error(`CFB 항목이 스트림이 아닙니다: ${entry.path || entry.name}`);
        }
        if (entry.size <= 0)
            return new Uint8Array();
        if (entry.size < this.miniStreamCutoff && entry.type === 'stream' && this.miniStream.length > 0) {
            return this.readMiniStream(entry.startSector, entry.size);
        }
        return this.readRegularStream(entry.startSector, entry.size);
    }
    assertSignature() {
        if (this.bytes.length < 512)
            throw new Error('CFB 파일이 너무 작습니다.');
        for (let index = 0; index < CFB_SIGNATURE.length; index += 1) {
            if (this.bytes[index] !== CFB_SIGNATURE[index]) {
                throw new Error('MS-CFB 시그니처가 아닙니다.');
            }
        }
    }
    readFat() {
        const declaredFatSectorCount = this.readU32(0x2c);
        const entriesPerSector = this.sectorSize / 4;
        const difatSectors = this.readDifatSectorIds(declaredFatSectorCount);
        const fatSectorCount = Math.max(declaredFatSectorCount, difatSectors.length);
        const fat = new Uint32Array(fatSectorCount * entriesPerSector);
        for (let index = 0; index < fatSectorCount; index += 1) {
            const sectorId = difatSectors[index];
            if (!isRegularSector(sectorId))
                continue;
            const offset = this.sectorOffset(sectorId);
            if (offset + this.sectorSize > this.bytes.length)
                continue;
            for (let slot = 0; slot < entriesPerSector; slot += 1) {
                fat[index * entriesPerSector + slot] = this.readU32(offset + slot * 4);
            }
        }
        return fat;
    }
    readDifatSectorIds(declaredFatSectorCount) {
        const entriesPerDifatSector = this.sectorSize / 4 - 1;
        const sectors = [];
        for (let index = 0; index < 109; index += 1) {
            const sectorId = this.readU32(0x4c + index * 4);
            if (!isRegularSector(sectorId))
                break;
            sectors.push(sectorId);
            if (declaredFatSectorCount > 0 && sectors.length >= declaredFatSectorCount)
                return sectors;
        }
        let difatSector = this.readU32(0x44);
        const difatSectorCount = this.readU32(0x48);
        const visited = new Set();
        for (let index = 0; index < difatSectorCount && isRegularSector(difatSector) && !visited.has(difatSector); index += 1) {
            visited.add(difatSector);
            const offset = this.sectorOffset(difatSector);
            if (offset + this.sectorSize > this.bytes.length)
                break;
            for (let slot = 0; slot < entriesPerDifatSector; slot += 1) {
                const sectorId = this.readU32(offset + slot * 4);
                if (isRegularSector(sectorId))
                    sectors.push(sectorId);
                if (declaredFatSectorCount > 0 && sectors.length >= declaredFatSectorCount)
                    return sectors;
            }
            difatSector = this.readU32(offset + entriesPerDifatSector * 4);
        }
        return sectors;
    }
    readMiniFat() {
        if (!isRegularSector(this.firstMiniFatSector) || this.miniFatSectorCount === 0)
            return new Uint32Array();
        const entriesPerSector = this.sectorSize / 4;
        const bytes = this.readSectorChain(this.firstMiniFatSector, this.fat, this.miniFatSectorCount * this.sectorSize);
        const count = Math.floor(bytes.length / 4);
        const miniFat = new Uint32Array(Math.max(count, this.miniFatSectorCount * entriesPerSector));
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        for (let index = 0; index < count; index += 1)
            miniFat[index] = view.getUint32(index * 4, true);
        return miniFat;
    }
    readRawDirectoryEntries() {
        if (!isRegularSector(this.firstDirectorySector))
            return [];
        const directoryBytes = this.readSectorChain(this.firstDirectorySector, this.fat);
        const entries = [];
        const view = new DataView(directoryBytes.buffer, directoryBytes.byteOffset, directoryBytes.byteLength);
        const decoder = new TextDecoder('utf-16le');
        const entryCount = Math.floor(directoryBytes.length / DIRECTORY_ENTRY_SIZE);
        for (let id = 0; id < entryCount; id += 1) {
            const offset = id * DIRECTORY_ENTRY_SIZE;
            const nameLength = view.getUint16(offset + 64, true);
            const safeNameLength = Math.max(0, Math.min(nameLength, 64));
            const rawName = safeNameLength >= 2
                ? decoder.decode(directoryBytes.subarray(offset, offset + safeNameLength - 2)).replace(/\u0000/g, '')
                : '';
            const typeByte = directoryBytes[offset + 66] ?? 0;
            const type = entryTypeFromByte(typeByte);
            entries.push({
                id,
                name: rawName,
                type,
                leftSiblingId: view.getUint32(offset + 68, true),
                rightSiblingId: view.getUint32(offset + 72, true),
                childId: view.getUint32(offset + 76, true),
                startSector: view.getUint32(offset + 116, true),
                size: Number(view.getBigUint64(offset + 120, true))
            });
        }
        return entries;
    }
    buildEntryPaths(rawEntries) {
        const output = new Map();
        const root = rawEntries[0];
        if (!root)
            return [];
        output.set(0, { ...root, path: '' });
        const walkStorageChildren = (storage, parentPath) => {
            for (const childId of this.collectSiblingTree(rawEntries, storage.childId)) {
                const child = rawEntries[childId];
                if (!child || child.type === 'empty' || !child.name)
                    continue;
                const path = parentPath ? `${parentPath}/${child.name}` : child.name;
                output.set(child.id, { ...child, path });
                if (child.type === 'storage' || child.type === 'root')
                    walkStorageChildren(child, path);
            }
        };
        walkStorageChildren(root, '');
        for (const entry of rawEntries) {
            if (!output.has(entry.id) && entry.type !== 'empty' && entry.name) {
                output.set(entry.id, { ...entry, path: entry.name });
            }
        }
        return Array.from(output.values());
    }
    collectSiblingTree(entries, startId) {
        const result = [];
        const visited = new Set();
        const visit = (id) => {
            if (!isDirectoryId(id) || visited.has(id))
                return;
            const entry = entries[id];
            if (!entry)
                return;
            visited.add(id);
            visit(entry.leftSiblingId);
            result.push(id);
            visit(entry.rightSiblingId);
        };
        visit(startId);
        return result;
    }
    readRegularStream(startSector, size) {
        return this.readSectorChain(startSector, this.fat, size).slice(0, size);
    }
    readMiniStream(startSector, size) {
        if (!isRegularSector(startSector) || size <= 0)
            return new Uint8Array();
        const result = new Uint8Array(size);
        let written = 0;
        let sector = startSector;
        const visited = new Set();
        while (isRegularSector(sector) && written < size && !visited.has(sector)) {
            visited.add(sector);
            const offset = sector * MINI_SECTOR_SIZE;
            const length = Math.min(MINI_SECTOR_SIZE, size - written);
            if (offset + length > this.miniStream.length)
                break;
            result.set(this.miniStream.subarray(offset, offset + length), written);
            written += length;
            sector = this.miniFat[sector] ?? END_OF_CHAIN;
        }
        return written === size ? result : result.slice(0, written);
    }
    readSectorChain(startSector, fat, maxBytes = Number.POSITIVE_INFINITY) {
        if (!isRegularSector(startSector))
            return new Uint8Array();
        const chunks = [];
        let total = 0;
        let sector = startSector;
        const visited = new Set();
        while (isRegularSector(sector) && !visited.has(sector) && total < maxBytes) {
            visited.add(sector);
            const offset = this.sectorOffset(sector);
            if (offset + this.sectorSize > this.bytes.length)
                break;
            const length = Math.min(this.sectorSize, maxBytes - total);
            chunks.push(this.bytes.subarray(offset, offset + length));
            total += length;
            sector = fat[sector] ?? END_OF_CHAIN;
        }
        return concatChunks(chunks, total);
    }
    sectorOffset(sectorId) {
        return (sectorId + 1) * this.sectorSize;
    }
    readU16(offset) {
        return this.view.getUint16(offset, true);
    }
    readU32(offset) {
        return this.view.getUint32(offset, true);
    }
}
function concatChunks(chunks, total) {
    const output = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        output.set(chunk, offset);
        offset += chunk.length;
    }
    return output;
}
function entryTypeFromByte(value) {
    if (value === 1)
        return 'storage';
    if (value === 2)
        return 'stream';
    if (value === 5)
        return 'root';
    return 'empty';
}
function normalizePath(path) {
    return path.replace(/^\/+/, '').replace(/\\/g, '/');
}
function normalizeLookupPath(path) {
    return normalizePath(path).toLowerCase();
}
function isRegularSector(sectorId) {
    return sectorId >= 0 && sectorId <= MAX_REGULAR_SECTOR && sectorId !== FREE_SECTOR && sectorId !== END_OF_CHAIN && sectorId !== FAT_SECTOR && sectorId !== DIFAT_SECTOR;
}
function isDirectoryId(id) {
    return id >= 0 && id < 0xfffffffa;
}
