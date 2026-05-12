# Hancom Page Audit

한컴 Viewer를 기준으로 테스트 문서의 모든 페이지를 페이지 단위로 캡처한 비교 결과입니다.
`review`와 `layout-review`는 자동화가 계속 진행될 수 있는 advisory일 뿐, clean visual pass가 아닙니다.

## Verdict Policy

- pass: close
- advisory: layout-review, review (raw/blur/layout 지표를 보고 사람이 확인해야 함)
- strict failure: capture-error, capture-review, mismatch
- thresholds: close raw<=18.0, review raw<=32.0, layout-review blur<=32.0 and layout<=30.0

## gyeolseokgye.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/gyeolseokgye.hwp`
- pages: 1
- verdicts: {'review': 5}
- severity: {'advisory': 5}
- advisory pages: p1 review raw=18.766 blur=18.363 layout=24.233, p1 review raw=18.233 blur=18.080 layout=24.273, p1 review raw=18.644 blur=18.277 layout=24.580, p1 review raw=18.956 blur=18.576 layout=24.197, p1 review raw=18.759 blur=18.451 layout=24.575

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.766 | 18.363 | 24.233 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeol-more/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 18.233 | 18.080 | 24.273 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeol-more/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 18.644 | 18.277 | 24.580 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeol-more/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 18.956 | 18.576 | 24.197 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeol-more/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 18.759 | 18.451 | 24.575 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeol-more/gyeolseokgye/compare/page-001-compare.png` |

