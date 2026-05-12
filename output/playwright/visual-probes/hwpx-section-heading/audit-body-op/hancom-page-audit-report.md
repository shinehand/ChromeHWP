# Hancom Page Audit

한컴 Viewer를 기준으로 테스트 문서의 모든 페이지를 페이지 단위로 캡처한 비교 결과입니다.
`review`와 `layout-review`는 자동화가 계속 진행될 수 있는 advisory일 뿐, clean visual pass가 아닙니다.

## Verdict Policy

- pass: close
- advisory: layout-review, review (raw/blur/layout 지표를 보고 사람이 확인해야 함)
- strict failure: capture-error, capture-review, mismatch
- thresholds: close raw<=18.0, review raw<=32.0, layout-review blur<=32.0 and layout<=30.0

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 10}
- severity: {'advisory': 10}
- advisory pages: p13 review raw=19.273 blur=17.517 layout=40.804, p15 review raw=20.275 blur=18.869 layout=42.084, p13 review raw=19.133 blur=17.443 layout=41.486, p15 review raw=20.201 blur=18.843 layout=42.294, p13 review raw=19.003 blur=17.383 layout=41.488, p15 review raw=20.129 blur=18.816 layout=42.294, p13 review raw=18.723 blur=17.240 layout=41.667, p15 review raw=19.973 blur=18.763 layout=42.424, +2 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 13 | advisory | review | 19.273 | 17.517 | 40.804 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 20.275 | 18.869 | 42.084 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 19.133 | 17.443 | 41.486 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 20.201 | 18.843 | 42.294 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 19.003 | 17.383 | 41.488 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 20.129 | 18.816 | 42.294 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 18.723 | 17.240 | 41.667 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 19.973 | 18.763 | 42.424 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 18.472 | 17.141 | 41.917 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 19.834 | 18.731 | 42.444 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op/incheon-2a/compare/page-015-compare.png` |

