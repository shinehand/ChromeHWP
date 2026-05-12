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
- advisory pages: p13 review raw=20.122 blur=17.939 layout=39.845, p15 review raw=20.909 blur=19.098 layout=41.692, p13 review raw=20.937 blur=18.412 layout=39.519, p15 review raw=21.584 blur=19.433 layout=41.059, p13 review raw=22.404 blur=19.363 layout=25.994, p15 review raw=22.837 blur=20.167 layout=28.319, p13 review raw=25.243 blur=21.402 layout=19.491, p15 review raw=25.338 blur=21.860 layout=20.277, +2 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 13 | advisory | review | 20.122 | 17.939 | 39.845 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-run-variants/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 20.909 | 19.098 | 41.692 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-run-variants/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 20.937 | 18.412 | 39.519 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-run-variants/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 21.584 | 19.433 | 41.059 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-run-variants/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 22.404 | 19.363 | 25.994 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-run-variants/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 22.837 | 20.167 | 28.319 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-run-variants/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 25.243 | 21.402 | 19.491 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-run-variants/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 25.338 | 21.860 | 20.277 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-run-variants/incheon-2a/compare/page-015-compare.png` |
| 13 | advisory | review | 28.434 | 23.926 | 20.396 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-run-variants/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 28.204 | 24.059 | 19.590 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-run-variants/incheon-2a/compare/page-015-compare.png` |

