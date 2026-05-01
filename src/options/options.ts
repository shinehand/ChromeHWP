import './options.css';

import { getOption, setOption } from '../shared/storage';

type RendererMode = 'dom' | 'canvas';

interface ExtensionOptions {
  readonly defaultRenderer: RendererMode;
  readonly autosaveHint: boolean;
}

const DEFAULT_OPTIONS: ExtensionOptions = {
  defaultRenderer: 'dom',
  autosaveHint: true
};
const STORAGE_KEY = 'extensionOptions';
const STATUS_TIMEOUT_MS = 1800;

const form = requireElement<HTMLFormElement>('#optionsForm');
const defaultRenderer = requireElement<HTMLSelectElement>('#defaultRenderer');
const autosaveHint = requireElement<HTMLInputElement>('#autosaveHint');
const saveButton = requireElement<HTMLButtonElement>('#saveButton');
const status = requireElement<HTMLParagraphElement>('#status');
let statusTimer: number | undefined;

void loadOptions();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  void saveOptions();
});

async function loadOptions(): Promise<void> {
  setBusy(true);
  try {
    const storedOptions = await getOption<unknown>(STORAGE_KEY, DEFAULT_OPTIONS);
    applyOptions(normalizeOptions(storedOptions));
    setStatus('설정을 불러왔습니다.');
  } catch (error) {
    applyOptions(DEFAULT_OPTIONS);
    setStatus(getErrorMessage(error), true);
  } finally {
    setBusy(false);
  }
}

async function saveOptions(): Promise<void> {
  setBusy(true);
  try {
    const nextOptions = readFormOptions();
    await setOption(STORAGE_KEY, nextOptions);
    applyOptions(nextOptions);
    setStatus('설정을 저장했습니다.');
  } catch (error) {
    setStatus(getErrorMessage(error), true);
  } finally {
    setBusy(false);
  }
}

function readFormOptions(): ExtensionOptions {
  return {
    defaultRenderer: defaultRenderer.value === 'canvas' ? 'canvas' : 'dom',
    autosaveHint: autosaveHint.checked
  };
}

function applyOptions(options: ExtensionOptions): void {
  defaultRenderer.value = options.defaultRenderer;
  autosaveHint.checked = options.autosaveHint;
}

function normalizeOptions(value: unknown): ExtensionOptions {
  if (!isRecord(value)) return DEFAULT_OPTIONS;

  return {
    defaultRenderer: value.defaultRenderer === 'canvas' ? 'canvas' : 'dom',
    autosaveHint: typeof value.autosaveHint === 'boolean' ? value.autosaveHint : DEFAULT_OPTIONS.autosaveHint
  };
}

function setBusy(isBusy: boolean): void {
  defaultRenderer.disabled = isBusy;
  autosaveHint.disabled = isBusy;
  saveButton.disabled = isBusy;
  form.classList.toggle('busy', isBusy);
}

function setStatus(message: string, isError = false): void {
  if (statusTimer) window.clearTimeout(statusTimer);
  status.textContent = message;
  status.classList.toggle('error', isError);
  statusTimer = window.setTimeout(() => {
    status.textContent = '';
    status.classList.remove('error');
    statusTimer = undefined;
  }, STATUS_TIMEOUT_MS);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`필수 UI 요소를 찾지 못했습니다: ${selector}`);
  return element;
}
