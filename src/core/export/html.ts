export interface HtmlExportOptions {
  readonly title: string;
}

const EXPORT_CSS = `
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  background: #eef1f6;
}

body {
  margin: 0;
  color: #111111;
  font-family: "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
}

.chrome-hwp-export {
  padding: 28px;
}

.document-preview {
  margin: 0 auto;
  display: grid;
  justify-content: center;
  gap: 26px;
}

.hwp-page {
  box-sizing: border-box;
  background: #ffffff;
  box-shadow: 0 8px 28px rgba(23, 32, 51, 0.14);
  color: #111111;
}

.hwp-page-body {
  box-sizing: border-box;
  min-height: inherit;
}

.hwp-paragraph {
  margin: 0 0 7px;
  word-break: keep-all;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.hwp-run {
  white-space: pre-wrap;
}

.hwp-table {
  border-collapse: collapse;
  table-layout: fixed;
  margin: 4px 0 8px;
  max-width: 100%;
  font-size: inherit;
  width: auto;
}

.hwp-table td,
.hwp-table th {
  box-sizing: border-box;
  border: 1px solid #000000;
  padding: 2px 4px;
  min-width: 18px;
  overflow-wrap: anywhere;
}

.hwp-table .hwp-paragraph {
  margin: 0;
}

.hwp-image {
  margin: 4px 0 8px;
}

.hwp-image-inline {
  display: inline-block;
  vertical-align: middle;
}

.hwp-image img {
  display: block;
  max-width: 100%;
  height: auto;
}

.hwp-image-missing {
  display: inline-flex;
  min-width: 96px;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  border: 1px solid #aeb7c6;
  color: #68758a;
  font-size: 12px;
}

@media print {
  html,
  body {
    background: #ffffff;
  }

  .chrome-hwp-export {
    padding: 0;
  }

  .hwp-page {
    box-shadow: none;
    break-after: page;
    page-break-after: always;
  }
}
`;

export async function exportEditableDomToStandaloneHtml(root: HTMLElement, options: HtmlExportOptions): Promise<string> {
  const clone = root.cloneNode(true) as HTMLElement;
  sanitizeExportTree(clone);
  await inlineImagesAsDataUris(clone);

  return [
    '<!doctype html>',
    '<html lang="ko">',
    '<head>',
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `  <title>${escapeHtml(options.title)}</title>`,
    `  <style>${EXPORT_CSS}</style>`,
    '</head>',
    '<body>',
    `  <main class="chrome-hwp-export">${clone.outerHTML}</main>`,
    '</body>',
    '</html>'
  ].join('\n');
}

function sanitizeExportTree(root: HTMLElement): void {
  const elements = [root, ...Array.from(root.querySelectorAll<Element>('*'))];
  for (const element of elements) {
    const tagName = element.tagName.toLowerCase();
    if (['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'].includes(tagName)) {
      element.remove();
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on')
        || name === 'contenteditable'
        || name === 'spellcheck'
        || name.startsWith('data-')
        || ((name === 'src' || name === 'href') && value.startsWith('javascript:'))) {
        element.removeAttribute(attribute.name);
      }
    }
  }
}

async function inlineImagesAsDataUris(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(images.map(inlineImageAsDataUri));
}

async function inlineImageAsDataUri(image: HTMLImageElement): Promise<void> {
  const source = image.getAttribute('src') || image.currentSrc || image.src;
  if (!source || source.startsWith('data:')) return;

  try {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`이미지 응답 실패: ${response.status}`);
    const blob = await response.blob();
    const mimeType = blob.type || inferMimeTypeFromPath(source);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    image.setAttribute('src', `data:${mimeType};base64,${bytesToBase64(bytes)}`);
  } catch {
    image.removeAttribute('src');
  }
}

function inferMimeTypeFromPath(path: string): string {
  const lower = path.split('?')[0]?.toLowerCase() || '';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  return 'image/png';
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
