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
- verdicts: {'review': 14}
- severity: {'advisory': 14}
- advisory pages: p13 review raw=19.417 blur=17.604 layout=40.188, p15 review raw=20.352 blur=18.901 layout=41.713, p13 review raw=19.268 blur=17.719 layout=41.410, p15 review raw=20.255 blur=18.941 layout=42.289, p13 review raw=19.412 blur=17.867 layout=42.093, p15 review raw=19.723 blur=18.730 layout=43.696, p13 review raw=18.875 blur=17.504 layout=40.233, p15 review raw=19.953 blur=18.921 layout=41.724, +6 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 13 | advisory | review | 19.417 | 17.604 | 40.188 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 20.352 | 18.901 | 41.713 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 19.268 | 17.719 | 41.410 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 20.255 | 18.941 | 42.289 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 19.412 | 17.867 | 42.093 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 19.723 | 18.730 | 43.696 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 18.875 | 17.504 | 40.233 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 19.953 | 18.921 | 41.724 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 18.726 | 17.618 | 41.455 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 19.485 | 18.872 | 43.414 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 19.564 | 17.779 | 40.116 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 20.234 | 18.872 | 41.789 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 19.353 | 17.521 | 40.289 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 20.352 | 18.901 | 41.713 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-variants/incheon-2a/compare/page-015-compare.png` |

