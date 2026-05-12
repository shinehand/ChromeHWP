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
- verdicts: {'review': 9}
- severity: {'advisory': 9}
- advisory pages: p1 review raw=20.304 blur=19.560 layout=20.798, p1 review raw=20.274 blur=19.538 layout=20.959, p1 review raw=20.218 blur=19.498 layout=21.091, p1 review raw=20.182 blur=19.473 layout=21.091, p1 review raw=19.756 blur=19.133 layout=21.047, p1 review raw=19.242 blur=18.721 layout=23.336, p1 review raw=19.752 blur=19.158 layout=21.388, p1 review raw=19.395 blur=18.900 layout=23.050, +1 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 20.304 | 19.560 | 20.798 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 20.274 | 19.538 | 20.959 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 20.218 | 19.498 | 21.091 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 20.182 | 19.473 | 21.091 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 19.756 | 19.133 | 21.047 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 19.242 | 18.721 | 23.336 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 19.752 | 19.158 | 21.388 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 19.395 | 18.900 | 23.050 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 20.576 | 19.637 | 21.195 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye/gyeolseokgye/compare/page-001-compare.png` |

