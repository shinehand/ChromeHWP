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
- verdicts: {'review': 6}
- severity: {'advisory': 6}
- advisory pages: p1 review raw=20.525 blur=19.494 layout=20.852, p1 review raw=20.389 blur=19.529 layout=20.985, p1 review raw=18.226 blur=18.068 layout=24.282, p1 review raw=20.304 blur=19.560 layout=20.798, p1 review raw=20.304 blur=19.560 layout=20.798, p1 review raw=18.226 blur=18.068 layout=24.282

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 20.525 | 19.494 | 20.852 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye-spacing/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 20.389 | 19.529 | 20.985 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye-spacing/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 18.226 | 18.068 | 24.282 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye-spacing/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 20.304 | 19.560 | 20.798 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye-spacing/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 20.304 | 19.560 | 20.798 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye-spacing/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 18.226 | 18.068 | 24.282 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye-spacing/gyeolseokgye/compare/page-001-compare.png` |

