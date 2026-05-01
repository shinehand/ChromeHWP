export interface PendingDocumentPayload {
  readonly filename: string;
  readonly mimeType: string;
  readonly source: 'popup-upload' | 'context-menu' | 'editor-drop';
  readonly bytesBase64: string;
  readonly createdAt: number;
}

const PENDING_DOCUMENT_KEY = 'pendingDocument';

export async function setPendingDocument(payload: PendingDocumentPayload): Promise<void> {
  await chrome.storage.session.set({ [PENDING_DOCUMENT_KEY]: payload });
}

export async function takePendingDocument(): Promise<PendingDocumentPayload | null> {
  const result = await chrome.storage.session.get(PENDING_DOCUMENT_KEY);
  await chrome.storage.session.remove(PENDING_DOCUMENT_KEY);
  const payload = result[PENDING_DOCUMENT_KEY] as PendingDocumentPayload | undefined;
  return payload ?? null;
}

export async function getOption<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T | undefined) ?? fallback;
}

export async function setOption<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}
