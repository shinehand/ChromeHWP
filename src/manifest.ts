const manifest = {
  manifest_version: 3,
  name: 'ChromeHWP Editor',
  short_name: 'ChromeHWP',
  version: '0.1.0',
  minimum_chrome_version: '112',
  description: '브라우저에서 HWP/HWPX 문서를 열고 편집하기 위한 Chrome 확장 프로그램입니다.',
  action: {
    default_title: 'ChromeHWP 열기',
    default_popup: 'src/popup/popup.html'
  },
  background: {
    service_worker: 'assets/service-worker.js',
    type: 'module'
  },
  options_ui: {
    page: 'src/options/options.html',
    open_in_tab: true
  },
  permissions: [
    'contextMenus',
    'storage'
  ],
  host_permissions: [
    'http://*/*',
    'https://*/*',
    'file:///*'
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'; worker-src 'self';"
  }
} as const;

export default manifest;
