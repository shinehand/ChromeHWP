import './popup.css';

import { arrayBufferToBase64, isSupportedHwpFilename } from '../shared/bytes';
import { setPendingDocument } from '../shared/storage';

interface RuntimeResponse {
  readonly ok: boolean;
  readonly error?: string;
}

const fileInput = requireElement<HTMLInputElement>('#fileInput');
const dropZone = requireElement<HTMLElement>('#dropZone');
const openFileButton = requireElement<HTMLButtonElement>('#openFileButton');
const openEditorButton = requireElement<HTMLButtonElement>('#openEditorButton');
const status = requireElement<HTMLParagraphElement>('#status');
let isBusy = false;

openFileButton.addEventListener('click', () => {
  if (!isBusy) fileInput.click();
});

openEditorButton.addEventListener('click', () => {
  if (isBusy) return;
  setBusy(true);
  setStatus('에디터 탭을 여는 중...');
  sendRuntimeMessage({ type: 'OPEN_EDITOR_TAB' })
    .then((response) => {
      if (!response.ok) throw new Error(response.error || '에디터 탭을 열지 못했습니다.');
      window.close();
    })
    .catch((error: unknown) => {
      setBusy(false);
      setStatus(getErrorMessage(error), true);
    });
});

dropZone.addEventListener('click', () => {
  if (!isBusy) fileInput.click();
});

dropZone.addEventListener('keydown', (event) => {
  if (isBusy) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});

dropZone.addEventListener('dragover', (event) => {
  if (isBusy) return;
  event.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  if (isBusy) return;

  const file = event.dataTransfer?.files?.[0];
  if (file) void openFile(file);
});

fileInput.addEventListener('change', () => {
  if (isBusy) return;

  const file = fileInput.files?.[0];
  fileInput.value = '';
  if (file) void openFile(file);
});

async function openFile(file: File): Promise<void> {
  if (!isSupportedHwpFilename(file.name)) {
    setStatus('지원하는 파일은 .hwp, .hwpx 입니다.', true);
    return;
  }

  setBusy(true);
  setStatus(`${file.name} 전달 준비 중...`);
  try {
    const bytesBase64 = arrayBufferToBase64(await file.arrayBuffer());
    await setPendingDocument({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      source: 'popup-upload',
      bytesBase64,
      createdAt: Date.now()
    });

    setStatus('에디터 탭을 여는 중...');
    const response = await sendRuntimeMessage({ type: 'OPEN_PENDING_DOCUMENT_TAB' });
    if (!response.ok) throw new Error(response.error || '파일 전달에 실패했습니다.');
    window.close();
  } catch (error) {
    setBusy(false);
    setStatus(getErrorMessage(error), true);
  }
}

function setBusy(nextBusy: boolean): void {
  isBusy = nextBusy;
  fileInput.disabled = nextBusy;
  openFileButton.disabled = nextBusy;
  openEditorButton.disabled = nextBusy;
  dropZone.tabIndex = nextBusy ? -1 : 0;
  dropZone.classList.toggle('busy', nextBusy);
  dropZone.classList.remove('dragover');
  dropZone.setAttribute('aria-disabled', String(nextBusy));
  status.classList.toggle('busy', nextBusy);
}

function setStatus(message: string, isError = false): void {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function sendRuntimeMessage(message: unknown): Promise<RuntimeResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response?: RuntimeResponse) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(response || { ok: false, error: '백그라운드 응답이 없습니다.' });
    });
  });
}

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/quota|QUOTA_BYTES|exceeded/i.test(message)) {
    return '파일이 Chrome 임시 저장소 한도를 초과했습니다. 에디터 탭에서 직접 파일을 열어 주십시오.';
  }
  return message;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`필수 UI 요소를 찾지 못했습니다: ${selector}`);
  return element;
}
