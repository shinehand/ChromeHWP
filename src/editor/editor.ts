import './editor.css';

import { base64ToUint8Array, isSupportedHwpFilename } from '../shared/bytes';
import { takePendingDocument } from '../shared/storage';
import type { ParsedDocument } from '../core/document-model';
import { extractEditableDocumentFromDom } from '../core/export/editable-document';
import { exportEditableDomToStandaloneHtml } from '../core/export/html';
import { writeHwpxPackage } from '../core/export/hwpx-writer';
import { exportEditableDocumentToPlainText } from '../core/export/plain-text';
import { parseHwp } from '../core/hwp/hwp-parser';
import { parseHwpx } from '../core/hwpx/hwpx-parser';
import { renderDocumentToDom } from '../core/render/text-renderer';

const fileInput = requireElement<HTMLInputElement>('#fileInput');
const openButton = requireElement<HTMLButtonElement>('#openButton');
const exportButton = requireElement<HTMLButtonElement>('#exportButton');
const dropZone = requireElement<HTMLElement>('#dropZone');
const workspace = requireElement<HTMLElement>('#workspace');
const documentPreview = requireElement<HTMLElement>('#documentPreview');
const documentMeta = requireElement<HTMLParagraphElement>('#documentMeta');
const filenameValue = requireElement<HTMLElement>('#filenameValue');
const sizeValue = requireElement<HTMLElement>('#sizeValue');
const formatValue = requireElement<HTMLElement>('#formatValue');
const exportFormatSelect = createExportFormatSelect();
let disposeRenderedDocument: (() => void) | undefined;
let currentDocument: OpenDocumentState | undefined;

type ExportFormat = 'txt' | 'html' | 'hwpx';
type OpenDocumentFormat = 'hwp' | 'hwpx' | 'plain';

interface OpenDocumentState {
  readonly filename: string;
  readonly size: number;
  readonly format: OpenDocumentFormat;
  readonly bytes?: Uint8Array;
}

exportButton.parentElement?.insertBefore(exportFormatSelect, exportButton);

openButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  fileInput.value = '';
  if (file) void openLocalFile(file);
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  const file = event.dataTransfer?.files?.[0];
  if (file) void openLocalFile(file);
});

exportButton.addEventListener('click', () => {
  void exportCurrentDocument();
});

void hydrateFromLaunchSource();

async function hydrateFromLaunchSource(): Promise<void> {
  const params = new URLSearchParams(location.search);
  if (params.get('source') === 'pending') {
    const pending = await takePendingDocument();
    if (pending) {
      const bytes = base64ToUint8Array(pending.bytesBase64);
      await openBytes(pending.filename, bytes);
      return;
    }
  }

  const sourceUrl = params.get('sourceUrl');
  if (sourceUrl) {
    showEmptyState(`원격 문서 링크가 전달되었습니다: ${sourceUrl}`);
  }
}

async function openLocalFile(file: File): Promise<void> {
  if (!isSupportedHwpFilename(file.name)) {
    showEmptyState('지원하는 파일은 .hwp, .hwpx 입니다.');
    return;
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  await openBytes(file.name, bytes);
}

async function openBytes(filename: string, bytes: Uint8Array): Promise<void> {
  if (filename.toLowerCase().endsWith('.hwpx')) {
    const parsed = await parseHwpx({ filename, bytes });
    showParsedDocument(filename, bytes.byteLength, 'HWPX', parsed, bytes);
    return;
  }

  if (filename.toLowerCase().endsWith('.hwp')) {
    const parsed = await parseHwp({ filename, bytes });
    showParsedDocument(filename, bytes.byteLength, 'HWP', parsed, bytes);
    return;
  }

  showPlainTextDocument(filename, bytes.byteLength, getFormatFromFilename(filename), buildPreviewText(filename, bytes));
}

function showParsedDocument(filename: string, size: number, format: string, parsed: ParsedDocument, bytes: Uint8Array): void {
  showDocumentShell(filename, size, format);
  disposeRenderedDocument?.();
  disposeRenderedDocument = renderDocumentToDom(parsed, documentPreview);
  documentPreview.dataset.parser = parsed.metadata.parser;
  currentDocument = {
    filename,
    size,
    format: parsed.format,
    bytes: copyBytes(bytes)
  };
  setExportControlsEnabled(true);
}

function showPlainTextDocument(filename: string, size: number, format: string, previewText: string): void {
  showDocumentShell(filename, size, format);
  disposeRenderedDocument?.();
  disposeRenderedDocument = undefined;
  documentPreview.textContent = previewText;
  documentPreview.dataset.plainText = previewText;
  currentDocument = { filename, size, format: 'plain' };
  setExportControlsEnabled(true);
}

function showDocumentShell(filename: string, size: number, format: string): void {
  dropZone.hidden = true;
  workspace.hidden = false;
  filenameValue.textContent = filename;
  sizeValue.textContent = formatBytes(size);
  formatValue.textContent = exportAwareFormatLabel(format);
  documentMeta.textContent = `${filename} · ${formatBytes(size)} · ${exportAwareStatus(format)}`;
}

function showEmptyState(message: string): void {
  disposeRenderedDocument?.();
  disposeRenderedDocument = undefined;
  currentDocument = undefined;
  dropZone.hidden = false;
  workspace.hidden = true;
  documentMeta.textContent = message;
  setExportControlsEnabled(false);
}

async function exportCurrentDocument(): Promise<void> {
  if (!currentDocument) return;

  setExportBusy(true);
  try {
    const editableDocument = extractEditableDocumentFromDom(documentPreview, currentDocument.filename);
    const basename = exportBasename(currentDocument.filename);
    const format = exportFormatSelect.value as ExportFormat;

    if (format === 'txt') {
      const text = exportEditableDocumentToPlainText(editableDocument);
      downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${basename}.txt`);
      showExportResult(`${basename}.txt`);
      return;
    }

    if (format === 'html') {
      const html = await exportEditableDomToStandaloneHtml(documentPreview, { title: currentDocument.filename });
      downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${basename}.html`);
      showExportResult(`${basename}.html`);
      return;
    }

    const hwpxBytes = await writeHwpxPackage(editableDocument, {
      title: currentDocument.filename,
      sourceBytes: currentDocument.format === 'hwpx' ? currentDocument.bytes : undefined
    });
    downloadBlob(new Blob([copyBytesToArrayBuffer(hwpxBytes)], { type: 'application/hwp+zip' }), `${basename}.hwpx`);
    showExportResult(
      `${basename}.hwpx`,
      currentDocument.format === 'hwp' ? 'HWP 원본 바이너리가 아니라 HWPX 편집본입니다.' : undefined
    );
  } catch (error) {
    documentMeta.textContent = `내보내기 실패: ${errorMessage(error)}`;
  } finally {
    setExportBusy(false);
  }
}

function getFormatFromFilename(filename: string): string {
  return filename.toLowerCase().endsWith('.hwpx') ? 'HWPX' : 'HWP';
}

function buildPreviewText(filename: string, bytes: Uint8Array): string {
  const signature = Array.from(bytes.subarray(0, 16))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join(' ');
  return [
    `${filename}`,
    '',
    '문서 파일을 정상 수신했습니다.',
    '',
    `첫 16바이트: ${signature || '-'}`
  ].join('\n');
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function createExportFormatSelect(): HTMLSelectElement {
  const select = document.createElement('select');
  select.id = 'exportFormatSelect';
  select.ariaLabel = '내보내기 형식';
  select.title = '내보내기 형식';

  for (const [value, label] of [
    ['txt', 'TXT'],
    ['html', 'HTML'],
    ['hwpx', 'HWPX 편집본']
  ] satisfies Array<[ExportFormat, string]>) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.append(option);
  }

  select.value = 'txt';
  select.disabled = true;
  return select;
}

function setExportControlsEnabled(enabled: boolean): void {
  exportButton.disabled = !enabled;
  exportFormatSelect.disabled = !enabled;
}

function setExportBusy(isBusy: boolean): void {
  exportButton.disabled = isBusy || !currentDocument;
  exportFormatSelect.disabled = isBusy || !currentDocument;
  exportButton.textContent = isBusy ? '내보내는 중' : '내보내기';
}

function showExportResult(filename: string, note?: string): void {
  if (!currentDocument) return;
  documentMeta.textContent = [
    currentDocument.filename,
    formatBytes(currentDocument.size),
    `${filename} 생성`,
    note
  ].filter(Boolean).join(' · ');
}

function exportAwareFormatLabel(format: string): string {
  return format === 'HWP' ? 'HWP 읽기 / HWPX 내보내기' : format;
}

function exportAwareStatus(format: string): string {
  return format === 'HWP'
    ? 'HWP 원본 저장은 지원하지 않으며 HWPX 편집본으로 내보냅니다.'
    : 'TXT, HTML, HWPX 편집본으로 내보낼 수 있습니다.';
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function exportBasename(filename: string): string {
  const withoutExtension = filename.replace(/\.[^.]+$/, '').trim();
  return (withoutExtension || 'chrome-hwp-document').replace(/[\\/:*?"<>|]/g, '_');
}

function copyBytes(bytes: Uint8Array): Uint8Array {
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(bytes);
  return copied;
}

function copyBytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`필수 UI 요소를 찾지 못했습니다: ${selector}`);
  return element;
}
