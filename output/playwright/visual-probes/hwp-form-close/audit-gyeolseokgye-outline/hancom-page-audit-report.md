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
- verdicts: {'review': 3}
- severity: {'advisory': 3}
- advisory pages: p1 review raw=20.304 blur=19.559 layout=20.798, p1 review raw=18.232 blur=18.079 layout=24.273, p1 review raw=18.059 blur=17.967 layout=24.619

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 20.304 | 19.559 | 20.798 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye-outline/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 18.232 | 18.079 | 24.273 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye-outline/gyeolseokgye/compare/page-001-compare.png` |
| 1 | advisory | review | 18.059 | 17.967 | 24.619 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwp-form-close/audit-gyeolseokgye-outline/gyeolseokgye/compare/page-001-compare.png` |

