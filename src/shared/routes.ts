export const EDITOR_PATH = 'src/editor/editor.html';

export function getEditorUrl(params: Record<string, string> = {}): string {
  const url = new URL(chrome.runtime.getURL(EDITOR_PATH));
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}
