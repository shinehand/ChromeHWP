#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const JSZIP_PATH = path.join(ROOT_DIR, 'lib', 'jszip.min.js');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

const require = createRequire(import.meta.url);
const JSZip = loadBundledJsZip();

function loadBundledJsZip() {
  const required = require(JSZIP_PATH);
  if (required?.loadAsync) return required;

  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.ArrayBuffer = ArrayBuffer;
  sandbox.Buffer = Buffer;
  sandbox.clearImmediate = clearImmediate;
  sandbox.clearTimeout = clearTimeout;
  sandbox.setImmediate = setImmediate;
  sandbox.setTimeout = setTimeout;
  sandbox.Uint8Array = Uint8Array;
  vm.runInNewContext(readFileSync(JSZIP_PATH, 'utf8'), sandbox, { filename: JSZIP_PATH });
  if (sandbox.JSZip?.loadAsync) return sandbox.JSZip;

  throw new Error(`JSZip bundle did not expose loadAsync: ${JSZIP_PATH}`);
}

function printUsage() {
  console.log(`Usage:
  node scripts/dump_hwpx_table_metrics.mjs <file.hwpx> [options]

Options:
  --out <path>       Write JSON to a file instead of stdout.
  --section <path>   Limit scanning to a section XML path. May be repeated.
  --compact          Emit compact JSON instead of pretty JSON.
  --help             Show this help.`);
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    inputPath: '',
    outputPath: '',
    sectionFilters: [],
    pretty: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
    if (arg === '--compact') {
      options.pretty = false;
      continue;
    }
    if (arg === '--out') {
      options.outputPath = argv[index + 1] || '';
      index += 1;
      if (!options.outputPath) fail('--out requires a path');
      continue;
    }
    if (arg.startsWith('--out=')) {
      options.outputPath = arg.slice('--out='.length);
      if (!options.outputPath) fail('--out requires a path');
      continue;
    }
    if (arg === '--section') {
      const sectionPath = argv[index + 1] || '';
      index += 1;
      if (!sectionPath) fail('--section requires a section XML path');
      options.sectionFilters.push(normalizeZipPath(sectionPath));
      continue;
    }
    if (arg.startsWith('--section=')) {
      const sectionPath = arg.slice('--section='.length);
      if (!sectionPath) fail('--section requires a section XML path');
      options.sectionFilters.push(normalizeZipPath(sectionPath));
      continue;
    }
    if (arg.startsWith('-')) {
      fail(`unknown option: ${arg}`);
    }
    if (options.inputPath) {
      fail(`unexpected extra argument: ${arg}`);
    }
    options.inputPath = arg;
  }

  if (!options.inputPath) {
    printUsage();
    process.exit(1);
  }
  return options;
}

function normalizeZipPath(value = '') {
  return String(value).replace(/\\/g, '/').replace(/^\/+/, '');
}

function localName(name = '') {
  const parts = String(name).split(':');
  return parts[parts.length - 1] || '';
}

function decodeXmlEntities(value = '') {
  return String(value).replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
    const normalized = entity.toLowerCase();
    if (normalized === 'amp') return '&';
    if (normalized === 'lt') return '<';
    if (normalized === 'gt') return '>';
    if (normalized === 'quot') return '"';
    if (normalized === 'apos') return "'";
    if (normalized.startsWith('#x')) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    }
    if (normalized.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    }
    return match;
  });
}

function coerceValue(value) {
  if (typeof value !== 'string') return value;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (/^-?(?:\d+\.\d+|\d+\.|\.\d+)$/.test(value)) return Number(value);
  return value;
}

function normalizeAttrs(attrs = {}) {
  return Object.fromEntries(
    Object.entries(attrs).map(([key, value]) => [key, coerceValue(value)]),
  );
}

function parseAttrs(source = '') {
  const attrs = {};
  const attrPattern = /([A-Za-z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
  for (const match of source.matchAll(attrPattern)) {
    attrs[localName(match[1])] = decodeXmlEntities(match[3] ?? match[4] ?? '');
  }
  return attrs;
}

function parseStartTag(token) {
  const trimmed = token
    .replace(/^</, '')
    .replace(/>$/, '')
    .replace(/\/\s*$/, '')
    .trim();
  const spaceIndex = trimmed.search(/\s/);
  if (spaceIndex === -1) {
    return { name: trimmed, attrSource: '' };
  }
  return {
    name: trimmed.slice(0, spaceIndex),
    attrSource: trimmed.slice(spaceIndex + 1),
  };
}

function parseXmlTree(xml = '') {
  const root = {
    name: '#document',
    localName: '#document',
    attrs: {},
    children: [],
    parent: null,
    start: 0,
    end: xml.length,
  };
  const stack = [root];
  const tagPattern = /<[^<>]+>/g;

  for (const match of xml.matchAll(tagPattern)) {
    const token = match[0];
    const start = match.index ?? 0;
    const end = start + token.length;
    if (/^<\?/.test(token) || /^<!/.test(token)) continue;

    const closeMatch = token.match(/^<\s*\/\s*([A-Za-z_][\w:.-]*)\s*>$/);
    if (closeMatch) {
      const closeLocalName = localName(closeMatch[1]);
      for (let index = stack.length - 1; index > 0; index -= 1) {
        const node = stack[index];
        stack.pop();
        node.end = end;
        if (node.localName === closeLocalName || node.name === closeMatch[1]) break;
      }
      continue;
    }

    const startMatch = token.match(/^<\s*([A-Za-z_][\w:.-]*)/);
    if (!startMatch) continue;

    const { name, attrSource } = parseStartTag(token);
    const parent = stack[stack.length - 1];
    const selfClosing = /\/\s*>$/.test(token);
    const node = {
      name,
      localName: localName(name),
      attrs: parseAttrs(attrSource),
      children: [],
      parent,
      start,
      startTagEnd: end,
      end: selfClosing ? end : null,
    };
    parent.children.push(node);
    if (!selfClosing) stack.push(node);
  }

  return root;
}

function directChildren(node, wantedLocalName) {
  return (node?.children || []).filter((child) => child.localName === wantedLocalName);
}

function firstDirectChild(node, wantedLocalName) {
  return directChildren(node, wantedLocalName)[0] || null;
}

function childAttrs(node, wantedLocalName) {
  return firstDirectChild(node, wantedLocalName)?.attrs || {};
}

function numberAttr(attrs = {}, key, fallback = null) {
  const value = attrs[key];
  if (value == null || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function presentAttrs(attrs = {}, keys = []) {
  const out = {};
  for (const key of keys) {
    if (attrs[key] != null && attrs[key] !== '') {
      out[key] = coerceValue(attrs[key]);
    }
  }
  return out;
}

function countDescendants(node, wantedLocalName) {
  if (!node) return 0;
  let count = 0;
  const stack = [...(node.children || [])];
  while (stack.length) {
    const current = stack.pop();
    if (current.localName === wantedLocalName) count += 1;
    stack.push(...(current.children || []));
  }
  return count;
}

function collectDescendants(node, wantedLocalName, out = []) {
  for (const child of node.children || []) {
    if (child.localName === wantedLocalName) out.push(child);
    collectDescendants(child, wantedLocalName, out);
  }
  return out;
}

function nearestAncestor(node, wantedLocalName) {
  let current = node?.parent || null;
  while (current) {
    if (current.localName === wantedLocalName) return current;
    current = current.parent;
  }
  return null;
}

function tableContext(node) {
  let current = node?.parent || null;
  while (current && current.localName !== '#document') {
    if (current.localName === 'header' || current.localName === 'footer') {
      return current.localName;
    }
    current = current.parent;
  }
  return 'body';
}

function isBreakEnabled(value) {
  return value != null && value !== '' && String(value) !== '0';
}

function nodeTextPreview(xml, node, maxLength = 160) {
  if (!xml || !node || !Number.isFinite(node.start) || !Number.isFinite(node.end)) return '';
  const source = xml.slice(node.start, node.end);
  const text = decodeXmlEntities(source.replace(/<[^<>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function paragraphBreakMetrics(paragraphs = []) {
  const breaks = [];
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const pageBreak = paragraph.attrs.pageBreak;
    const columnBreak = paragraph.attrs.columnBreak;
    if (isBreakEnabled(pageBreak) || isBreakEnabled(columnBreak)) {
      breaks.push({
        paragraphIndex,
        pageBreak: coerceValue(pageBreak ?? ''),
        columnBreak: coerceValue(columnBreak ?? ''),
      });
    }
  });
  return breaks;
}

function lineSegmentFlowMetrics(paragraphs = [], xml = '') {
  const pageSpanParagraphs = [];
  let lineSegmentCount = 0;
  let pageFlowBreakCount = 0;
  let maxPageSpanCount = 0;

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const segments = collectDescendants(paragraph, 'lineseg')
      .map((segmentNode) => normalizeAttrs(segmentNode.attrs))
      .map((attrs) => ({
        textPosition: Number(attrs.textpos ?? attrs.textPosition ?? 0),
        verticalPosition: Number(attrs.vertpos ?? attrs.verticalPosition ?? 0),
        verticalSize: Number(attrs.vertsize ?? attrs.verticalSize ?? 0),
        textHeight: Number(attrs.textheight ?? attrs.textHeight ?? 0),
        spacing: Number(attrs.spacing ?? 0),
        horizontalPosition: Number(attrs.horzpos ?? attrs.horizontalPosition ?? 0),
        horizontalSize: Number(attrs.horzsize ?? attrs.horizontalSize ?? 0),
      }))
      .filter((segment) => Number.isFinite(segment.verticalPosition));

    if (!segments.length) return;
    lineSegmentCount += segments.length;

    let pageSpanCount = 1;
    let previousTop = Number.NEGATIVE_INFINITY;
    for (const segment of segments) {
      if (segment.verticalPosition < previousTop) pageSpanCount += 1;
      previousTop = segment.verticalPosition;
    }

    maxPageSpanCount = Math.max(maxPageSpanCount, pageSpanCount);
    if (pageSpanCount <= 1) return;

    pageFlowBreakCount += pageSpanCount - 1;
    pageSpanParagraphs.push({
      paragraphIndex,
      lineSegmentCount: segments.length,
      pageSpanCount,
      textPreview: nodeTextPreview(xml, paragraph, 180),
    });
  });

  return {
    lineSegmentCount,
    pageFlowBreakCount,
    maxPageSpanCount,
    pageSpanParagraphs,
  };
}

function buildCellMetrics(cellNode, rowIndex, cellIndex, xml = '') {
  const cellAttrs = normalizeAttrs(cellNode.attrs);
  const cellAddrAttrs = childAttrs(cellNode, 'cellAddr');
  const cellSpanAttrs = childAttrs(cellNode, 'cellSpan');
  const cellSizeAttrs = childAttrs(cellNode, 'cellSz');
  const cellMarginAttrs = childAttrs(cellNode, 'cellMargin');
  const subListNode = firstDirectChild(cellNode, 'subList');
  const subListAttrs = subListNode?.attrs || {};
  const paragraphs = directChildren(subListNode, 'p');
  const breaks = paragraphBreakMetrics(paragraphs);
  const lineSegmentFlow = lineSegmentFlowMetrics(paragraphs, xml);

  const width = numberAttr(cellSizeAttrs, 'width');
  const height = numberAttr(cellSizeAttrs, 'height');
  const rowAddress = numberAttr(cellAddrAttrs, 'rowAddr', rowIndex);
  const colAddress = numberAttr(cellAddrAttrs, 'colAddr', cellIndex);
  const colSpan = numberAttr(cellSpanAttrs, 'colSpan', 1);
  const rowSpan = numberAttr(cellSpanAttrs, 'rowSpan', 1);

  return {
    index: cellIndex,
    rowIndex,
    row: rowAddress,
    col: colAddress,
    colSpan,
    rowSpan,
    width,
    height,
    attrs: cellAttrs,
    cellAddr: normalizeAttrs(cellAddrAttrs),
    cellSpan: normalizeAttrs(cellSpanAttrs),
    cellSz: normalizeAttrs(cellSizeAttrs),
    cellMargin: normalizeAttrs(cellMarginAttrs),
    textPreview: nodeTextPreview(xml, subListNode || cellNode),
    subList: {
      attrs: normalizeAttrs(subListAttrs),
      textWidth: numberAttr(subListAttrs, 'textWidth'),
      textHeight: numberAttr(subListAttrs, 'textHeight'),
      paragraphCount: paragraphs.length,
      pageBreakParagraphCount: breaks.filter((entry) => isBreakEnabled(entry.pageBreak)).length,
      columnBreakParagraphCount: breaks.filter((entry) => isBreakEnabled(entry.columnBreak)).length,
      paragraphBreaks: breaks,
      lineSegmentFlow,
    },
    subListParagraphCount: paragraphs.length,
    nestedTableCount: Math.max(0, countDescendants(subListNode, 'tbl')),
  };
}

function buildTableMetrics(tableNode, tableIndex, sectionIndex, sectionTableIndex, xmlPath, tableIndexByNode, xml = '') {
  const tableAttrs = normalizeAttrs(tableNode.attrs);
  const rowNodes = directChildren(tableNode, 'tr');
  const parentTable = nearestAncestor(tableNode, 'tbl');
  const paragraphBreaks = [];

  const rows = rowNodes.map((rowNode, rowIndex) => {
    const cells = directChildren(rowNode, 'tc').map((cellNode, cellIndex) => {
      const cell = buildCellMetrics(cellNode, rowIndex, cellIndex, xml);
      for (const paragraphBreak of cell.subList.paragraphBreaks) {
        paragraphBreaks.push({
          rowIndex,
          cellIndex,
          ...paragraphBreak,
        });
      }
      return cell;
    });
    const rowHeights = cells
      .map((cell) => cell.height)
      .filter((height) => Number.isFinite(height));
    return {
      index: rowIndex,
      attrs: normalizeAttrs(rowNode.attrs),
      cellCount: cells.length,
      height: rowHeights.length ? Math.max(...rowHeights) : null,
      cellHeights: cells.map((cell) => cell.height),
      lineSegmentFlow: summarizeRowLineSegmentFlow(cells),
      textPreview: nodeTextPreview(xml, rowNode, 180),
      cells,
    };
  });

  const cells = rows.flatMap((row) => row.cells);
  const headerCells = cells.filter((cell) => isBreakEnabled(cell.attrs.header));
  const tableSizeAttrs = childAttrs(tableNode, 'sz');

  return {
    index: tableIndex,
    sectionIndex,
    sectionTableIndex,
    xmlPath,
    context: tableContext(tableNode),
    textPreview: nodeTextPreview(xml, tableNode, 240),
    nestingDepth: countTableAncestors(tableNode),
    parentTableIndex: parentTable ? tableIndexByNode.get(parentTable) ?? null : null,
    id: tableAttrs.id ?? null,
    attrs: tableAttrs,
    pagination: {
      ...presentAttrs(tableNode.attrs, ['pageBreak', 'repeatHeader', 'noAdjust']),
      headerCellCount: headerCells.length,
      paragraphPageBreakCount: paragraphBreaks.filter((entry) => isBreakEnabled(entry.pageBreak)).length,
      paragraphColumnBreakCount: paragraphBreaks.filter((entry) => isBreakEnabled(entry.columnBreak)).length,
      paragraphBreaks,
    },
    declaredRowCount: numberAttr(tableNode.attrs, 'rowCnt'),
    declaredColCount: numberAttr(tableNode.attrs, 'colCnt'),
    rowCount: rows.length,
    cellCount: cells.length,
    rowHeights: rows.map((row) => row.height),
    tableSize: {
      attrs: normalizeAttrs(tableSizeAttrs),
      width: numberAttr(tableSizeAttrs, 'width'),
      height: numberAttr(tableSizeAttrs, 'height'),
    },
    position: normalizeAttrs(childAttrs(tableNode, 'pos')),
    outMargin: normalizeAttrs(childAttrs(tableNode, 'outMargin')),
    inMargin: normalizeAttrs(childAttrs(tableNode, 'inMargin')),
    rows,
  };
}

function summarizeRowLineSegmentFlow(cells) {
  const pageSpanParagraphs = [];
  let lineSegmentCount = 0;
  let pageFlowBreakCount = 0;
  let maxPageSpanCount = 0;

  cells.forEach((cell) => {
    const flow = cell.subList?.lineSegmentFlow;
    if (!flow) return;
    lineSegmentCount += Number(flow.lineSegmentCount || 0);
    pageFlowBreakCount += Number(flow.pageFlowBreakCount || 0);
    maxPageSpanCount = Math.max(maxPageSpanCount, Number(flow.maxPageSpanCount || 0));
    for (const paragraph of flow.pageSpanParagraphs || []) {
      pageSpanParagraphs.push({
        cellIndex: cell.index,
        row: cell.row,
        col: cell.col,
        ...paragraph,
      });
    }
  });

  return {
    lineSegmentCount,
    pageFlowBreakCount,
    maxPageSpanCount,
    pageSpanParagraphs: pageSpanParagraphs.slice(0, 12),
  };
}

function summarizeTableDiagnostics(tables) {
  const diagnostics = {
    cellPageBreakTableCount: 0,
    repeatHeaderTableCount: 0,
    rowSpanTableCount: 0,
    nestedTableCount: 0,
    suspiciousDeclaredHeightTables: [],
    longestTablesByRows: [],
    longestTablesByHeight: [],
  };

  const tableSummaries = tables.map((table) => {
    const cells = table.rows.flatMap((row) => row.cells);
    const rowSpanCellCount = cells.filter((cell) => Number(cell.rowSpan) > 1).length;
    const nestedTableCount = cells.reduce((sum, cell) => sum + Number(cell.nestedTableCount || 0), 0);
    const declaredHeight = Number(table.tableSize?.height || 0);
    const rowHeightSum = table.rowHeights
      .filter((height) => Number.isFinite(height))
      .reduce((sum, height) => sum + Number(height), 0);
    const tallRows = table.rows
      .map((row) => ({
        index: row.index,
        height: Number(row.height || 0),
        cellCount: row.cellCount,
        pageFlowBreakCount: row.lineSegmentFlow?.pageFlowBreakCount || 0,
        maxPageSpanCount: row.lineSegmentFlow?.maxPageSpanCount || 0,
        textPreview: row.textPreview,
      }))
      .filter((row) => row.height > 0)
      .sort((a, b) => b.height - a.height)
      .slice(0, 8);

    return {
      index: table.index,
      sectionIndex: table.sectionIndex,
      sectionTableIndex: table.sectionTableIndex,
      rowCount: table.rowCount,
      cellCount: table.cellCount,
      pageBreak: table.pagination?.pageBreak || null,
      repeatHeader: table.pagination?.repeatHeader || 0,
      noAdjust: table.pagination?.noAdjust || 0,
      rowSpanCellCount,
      nestedTableCount,
      declaredHeight,
      rowHeightSum,
      declaredToRowsRatio: rowHeightSum > 0 && declaredHeight > 0 ? Number((declaredHeight / rowHeightSum).toFixed(4)) : null,
      position: table.position,
      textPreview: table.textPreview,
      tallRows,
    };
  });

  diagnostics.cellPageBreakTableCount = tableSummaries.filter((table) => table.pageBreak === 'CELL').length;
  diagnostics.repeatHeaderTableCount = tableSummaries.filter((table) => Number(table.repeatHeader || 0) > 0).length;
  diagnostics.rowSpanTableCount = tableSummaries.filter((table) => table.rowSpanCellCount > 0).length;
  diagnostics.nestedTableCount = tableSummaries.reduce((sum, table) => sum + table.nestedTableCount, 0);
  diagnostics.suspiciousDeclaredHeightTables = tableSummaries
    .filter((table) => table.rowCount >= 8 && table.declaredHeight > 0 && table.rowHeightSum > 0 && table.declaredHeight / table.rowHeightSum < 0.2)
    .sort((a, b) => a.declaredToRowsRatio - b.declaredToRowsRatio)
    .slice(0, 12);
  diagnostics.longestTablesByRows = [...tableSummaries]
    .sort((a, b) => b.rowCount - a.rowCount)
    .slice(0, 12);
  diagnostics.longestTablesByHeight = [...tableSummaries]
    .sort((a, b) => b.rowHeightSum - a.rowHeightSum)
    .slice(0, 12);

  return diagnostics;
}

function countTableAncestors(node) {
  let count = 0;
  let current = node?.parent || null;
  while (current) {
    if (current.localName === 'tbl') count += 1;
    current = current.parent;
  }
  return count;
}

function zipFindFile(zip, requestedPath) {
  const normalized = normalizeZipPath(requestedPath);
  if (zip.files[normalized]) return normalized;
  const lower = normalized.toLowerCase();
  return Object.keys(zip.files).find((key) => normalizeZipPath(key).toLowerCase() === lower) || null;
}

function naturalSectionPaths(zip) {
  return Object.keys(zip.files)
    .filter((key) => !zip.files[key].dir && /(?:^|\/)Contents\/section\d+\.xml$/i.test(normalizeZipPath(key)))
    .sort((a, b) => {
      const ai = Number((a.match(/section(\d+)\.xml$/i) || [])[1] || 0);
      const bi = Number((b.match(/section(\d+)\.xml$/i) || [])[1] || 0);
      return ai - bi;
    });
}

async function orderedSectionPaths(zip) {
  const naturalPaths = naturalSectionPaths(zip);
  const contentPath = zipFindFile(zip, 'Contents/content.hpf');
  if (!contentPath) return naturalPaths;

  try {
    const xml = await zip.files[contentPath].async('string');
    const itemById = new Map();
    for (const match of xml.matchAll(/<[^:>\s]*:?item\b([^>]*)>/gi)) {
      const attrs = parseAttrs(match[1]);
      const href = attrs.href || attrs['full-path'];
      if (attrs.id && href) itemById.set(attrs.id, normalizeZipPath(href));
    }

    const ordered = [];
    for (const match of xml.matchAll(/<[^:>\s]*:?itemref\b([^>]*)>/gi)) {
      const attrs = parseAttrs(match[1]);
      const href = itemById.get(attrs.idref);
      if (!href || !/section\d+\.xml$/i.test(href)) continue;
      const requested = /^Contents\//i.test(href) ? href : `Contents/${href}`;
      const key = zipFindFile(zip, requested);
      if (key && !ordered.includes(key)) ordered.push(key);
    }

    for (const key of naturalPaths) {
      if (!ordered.includes(key)) ordered.push(key);
    }
    return ordered.length ? ordered : naturalPaths;
  } catch {
    return naturalPaths;
  }
}

async function buildReport(inputPath, sectionFilters = []) {
  const resolvedInputPath = path.resolve(inputPath);
  if (!existsSync(resolvedInputPath)) fail(`input file not found: ${resolvedInputPath}`);
  if (!existsSync(JSZIP_PATH)) fail(`JSZip bundle not found: ${JSZIP_PATH}`);

  const buffer = await readFile(resolvedInputPath);
  const zip = await JSZip.loadAsync(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  let sectionPaths = await orderedSectionPaths(zip);

  if (sectionFilters.length) {
    const selected = [];
    for (const sectionFilter of sectionFilters) {
      const key = zipFindFile(zip, sectionFilter);
      if (!key) fail(`section XML not found in package: ${sectionFilter}`);
      selected.push(key);
    }
    sectionPaths = selected;
  }
  if (!sectionPaths.length) fail('no Contents/section*.xml files found in package');

  const tables = [];
  const sections = [];

  for (let sectionIndex = 0; sectionIndex < sectionPaths.length; sectionIndex += 1) {
    const xmlPath = sectionPaths[sectionIndex];
    const xml = await zip.files[xmlPath].async('string');
    const tree = parseXmlTree(xml);
    const tableNodes = collectDescendants(tree, 'tbl');
    const tableIndexByNode = new Map(
      tableNodes.map((tableNode, sectionTableIndex) => [tableNode, tables.length + sectionTableIndex]),
    );

    const sectionTableIndices = [];
    tableNodes.forEach((tableNode, sectionTableIndex) => {
      const tableIndex = tables.length;
      sectionTableIndices.push(tableIndex);
      tables.push(buildTableMetrics(
        tableNode,
        tableIndex,
        sectionIndex,
        sectionTableIndex,
        xmlPath,
        tableIndexByNode,
        xml,
      ));
    });

    sections.push({
      index: sectionIndex,
      xmlPath,
      tableCount: tableNodes.length,
      tableIndices: sectionTableIndices,
    });
  }

  return {
    source: resolvedInputPath,
    generatedAt: new Date().toISOString(),
    dependencies: {
      jszip: {
        source: path.relative(ROOT_DIR, JSZIP_PATH),
        version: JSZip.version || null,
      },
      packageJsonPresent: existsSync(PACKAGE_JSON_PATH),
    },
    sectionCount: sections.length,
    tableCount: tables.length,
    diagnostics: summarizeTableDiagnostics(tables),
    sections,
    tables,
  };
}

const options = parseArgs(process.argv.slice(2));
const report = await buildReport(options.inputPath, options.sectionFilters);
const json = options.pretty
  ? `${JSON.stringify(report, null, 2)}\n`
  : JSON.stringify(report);

if (options.outputPath) {
  await writeFile(path.resolve(options.outputPath), json);
} else {
  process.stdout.write(json);
}
