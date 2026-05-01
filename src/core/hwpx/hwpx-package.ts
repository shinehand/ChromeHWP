import { unzipSync } from 'fflate';
import { XMLParser } from 'fast-xml-parser';

const UTF8_DECODER = new TextDecoder('utf-8');

export interface HwpxEntry {
  readonly path: string;
  readonly bytes: Uint8Array;
}

export class HwpxPackage {
  readonly entries: Map<string, Uint8Array>;

  constructor(entries: Map<string, Uint8Array>) {
    this.entries = entries;
  }

  has(path: string): boolean {
    return this.entries.has(normalizePath(path));
  }

  readBytes(path: string): Uint8Array {
    const normalized = normalizePath(path);
    const bytes = this.entries.get(normalized);
    if (!bytes) throw new Error(`HWPX 패키지 항목을 찾지 못했습니다: ${normalized}`);
    return bytes;
  }

  readText(path: string): string {
    const text = UTF8_DECODER.decode(this.readBytes(path));
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  }

  readXml(path: string): unknown {
    return createXmlParser().parse(this.readText(path));
  }

  listPaths(): string[] {
    return Array.from(this.entries.keys()).sort((left, right) => left.localeCompare(right));
  }

  findPaths(pattern: RegExp): string[] {
    return this.listPaths().filter((entryPath) => pattern.test(entryPath));
  }
}

export function openHwpxPackage(bytes: Uint8Array): HwpxPackage {
  const unzipped = unzipSync(bytes);
  const entries = new Map<string, Uint8Array>();
  for (const [entryPath, entryBytes] of Object.entries(unzipped)) {
    entries.set(normalizePath(entryPath), entryBytes);
  }
  return new HwpxPackage(entries);
}

export function createXmlParser(): XMLParser {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    removeNSPrefix: true,
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: false,
    isArray: (_tagName, jPath) => {
      return /(^|\.)(p|run|t|tbl|tr|tc|pic|rect|line|binItem|font|style|paraPr|charPr)$/.test(String(jPath));
    }
  });
}

function normalizePath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\\/g, '/');
}
