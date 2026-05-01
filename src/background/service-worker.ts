import { getEditorUrl } from '../shared/routes';
import { arrayBufferToBase64, isSupportedHwpFilename } from '../shared/bytes';
import { setPendingDocument } from '../shared/storage';

const OPEN_LINK_MENU_ID = 'chrome-hwp-open-link';
const OPEN_PAGE_MENU_ID = 'chrome-hwp-open-page';
const DOCUMENT_URL_PATTERNS = [
  '*://*/*.hwp*',
  '*://*/*.hwpx*',
  '*://*/*.HWP*',
  '*://*/*.HWPX*',
  'file:///*.hwp*',
  'file:///*.hwpx*',
  'file:///*.HWP*',
  'file:///*.HWPX*'
];
const SUPPORTED_DOCUMENT_PROTOCOLS = new Set(['http:', 'https:', 'file:']);
const HWP_EXTENSION_IN_URL = /\.(hwp|hwpx)(?:$|[?#&=/])/i;

interface UploadedDocumentPayload {
  readonly filename?: string;
  readonly mimeType?: string;
  readonly bytesBase64?: string;
}

interface ValidUploadedDocumentPayload {
  readonly filename: string;
  readonly mimeType?: string;
  readonly bytesBase64: string;
}

interface RuntimeResponse {
  readonly ok: boolean;
  readonly error?: string;
}

interface OpenDocumentUrlPayload {
  readonly url?: string;
}

chrome.runtime.onInstalled.addListener(registerContextMenus);
chrome.runtime.onStartup.addListener(registerContextMenus);

function registerContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    reportRuntimeError('contextMenus.removeAll');

    chrome.contextMenus.create({
      id: OPEN_LINK_MENU_ID,
      title: 'ChromeHWP로 HWP/HWPX 링크 열기',
      contexts: ['link'],
      targetUrlPatterns: DOCUMENT_URL_PATTERNS
    }, () => {
      reportRuntimeError('contextMenus.create(link)');
    });

    chrome.contextMenus.create({
      id: OPEN_PAGE_MENU_ID,
      title: 'ChromeHWP로 현재 HWP/HWPX 파일 열기',
      contexts: ['page', 'frame'],
      documentUrlPatterns: DOCUMENT_URL_PATTERNS
    }, () => {
      reportRuntimeError('contextMenus.create(page)');
    });
  });
}

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === OPEN_LINK_MENU_ID && info.linkUrl) {
    void openExternalDocument(info.linkUrl);
    return;
  }

  if (info.menuItemId === OPEN_PAGE_MENU_ID) {
    const pageUrl = info.frameUrl || info.pageUrl;
    if (pageUrl) void openExternalDocument(pageUrl);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'OPEN_EDITOR_TAB') {
    respond(sendResponse, openEditorTab());
    return true;
  }

  if (message?.type === 'OPEN_PENDING_DOCUMENT_TAB') {
    respond(sendResponse, openEditorTab({ source: 'pending' }));
    return true;
  }

  if (message?.type === 'OPEN_UPLOADED_DOCUMENT') {
    const payload = message.payload as UploadedDocumentPayload | undefined;

    if (!isValidUploadedPayload(payload)) {
      sendResponse({ ok: false, error: '지원하는 HWP/HWPX 파일 데이터가 아닙니다.' });
      return false;
    }

    respond(sendResponse, stageUploadedDocument(payload).then(() => openEditorTab({ source: 'pending' })));
    return true;
  }

  if (message?.type === 'OPEN_DOCUMENT_URL') {
    const payload = message.payload as OpenDocumentUrlPayload | undefined;
    if (!payload?.url || !isSupportedDocumentUrl(payload.url)) {
      sendResponse({ ok: false, error: '지원하는 HWP/HWPX 문서 URL이 아닙니다.' });
      return false;
    }

    respond(sendResponse, openExternalDocument(payload.url));
    return true;
  }

  return false;
});

async function stageUploadedDocument(payload: ValidUploadedDocumentPayload): Promise<void> {
  await setPendingDocument({
    filename: sanitizeFilename(payload.filename, 'document.hwp'),
    mimeType: payload.mimeType || 'application/octet-stream',
    source: 'popup-upload',
    bytesBase64: payload.bytesBase64,
    createdAt: Date.now()
  });
}

async function openExternalDocument(url: string): Promise<void> {
  if (!isSupportedDocumentUrl(url)) {
    await openEditorTab({ sourceUrl: url });
    return;
  }

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'include',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const filename = getDocumentFilename(response, url);
    if (!isSupportedHwpFilename(filename)) {
      throw new Error('응답에서 HWP/HWPX 파일명을 확인하지 못했습니다.');
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new Error('빈 문서입니다.');
    }

    await setPendingDocument({
      filename,
      mimeType: response.headers.get('content-type') || 'application/octet-stream',
      source: 'context-menu',
      bytesBase64: arrayBufferToBase64(buffer),
      createdAt: Date.now()
    });
    await openEditorTab({ source: 'pending' });
  } catch {
    await openEditorTab({ sourceUrl: url });
  }
}

async function openEditorTab(params: Record<string, string> = {}): Promise<void> {
  await chrome.tabs.create({ url: getEditorUrl(params) });
}

function getDocumentFilename(response: Response, url: string): string {
  const headerFilename = parseContentDispositionFilename(response.headers.get('content-disposition'));
  const urlFilename = decodeFilenameFromUrl(url);
  const fallback = isSupportedHwpFilename(urlFilename) ? urlFilename : 'document';
  const candidate = sanitizeFilename(headerFilename || urlFilename, fallback);

  if (isSupportedHwpFilename(candidate)) {
    return candidate;
  }

  const inferredExtension = inferExtension(response, url);
  return inferredExtension ? `${candidate}.${inferredExtension}` : 'document.hwp';
}

function inferExtension(response: Response, url: string): 'hwp' | 'hwpx' | null {
  const contentType = response.headers.get('content-type')?.toLowerCase() || '';
  if (/\.hwpx(?:$|[?#])/i.test(url) || contentType.includes('hwpx') || contentType.includes('hwp+zip')) {
    return 'hwpx';
  }
  if (/\.hwp(?:$|[?#])/i.test(url) || contentType.includes('hwp') || contentType.includes('haansoft')) {
    return 'hwp';
  }
  return null;
}

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null;

  const encodedMatch = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(header);
  if (encodedMatch) return decodeHeaderFilename(encodedMatch[1]);

  const plainMatch = /filename\s*=\s*(?:"([^"]+)"|([^;]+))/i.exec(header);
  if (!plainMatch) return null;
  return decodeHeaderFilename(plainMatch[1] || plainMatch[2]);
}

function decodeHeaderFilename(value: string): string | null {
  const trimmed = value.trim().replace(/^"|"$/g, '');
  if (!trimmed) return null;

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function decodeFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const lastSegment = parsed.pathname.split('/').filter(Boolean).at(-1) || 'document';
    return decodeURIComponent(lastSegment);
  } catch {
    return 'document';
  }
}

function isSupportedDocumentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!SUPPORTED_DOCUMENT_PROTOCOLS.has(parsed.protocol)) return false;

    const filename = decodeFilenameFromUrl(url);
    if (isSupportedHwpFilename(filename)) return true;

    return HWP_EXTENSION_IN_URL.test(decodeURIComponent(url));
  } catch {
    return false;
  }
}

function isValidUploadedPayload(payload: UploadedDocumentPayload | undefined): payload is ValidUploadedDocumentPayload {
  return Boolean(
    payload?.filename &&
    payload.bytesBase64 &&
    isSupportedHwpFilename(sanitizeFilename(payload.filename, ''))
  );
}

function sanitizeFilename(filename: string | null | undefined, fallback: string): string {
  const cleaned = (filename || '')
    .replace(/\0/g, '')
    .split(/[\\/]/)
    .filter(Boolean)
    .at(-1)
    ?.trim();
  return cleaned || fallback;
}

function respond(sendResponse: (response: RuntimeResponse) => void, task: Promise<unknown>): void {
  task
    .then(() => sendResponse({ ok: true }))
    .catch((error: unknown) => sendResponse({ ok: false, error: getErrorMessage(error) }));
}

function reportRuntimeError(scope: string): void {
  const error = chrome.runtime.lastError;
  if (error) console.warn(`[ChromeHWP] ${scope}: ${error.message}`);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
