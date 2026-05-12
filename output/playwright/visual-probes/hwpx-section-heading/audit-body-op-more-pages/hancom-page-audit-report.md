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
- verdicts: {'review': 9}
- severity: {'advisory': 9}
- advisory pages: p9 review raw=19.510 blur=18.604 layout=38.135, p11 review raw=20.027 blur=19.322 layout=43.633, p15 review raw=19.506 blur=18.704 layout=43.689, p9 review raw=19.212 blur=18.448 layout=38.151, p11 review raw=19.888 blur=19.307 layout=43.647, p15 review raw=19.407 blur=18.722 layout=43.709, p9 review raw=19.205 blur=18.445 layout=38.135, p11 review raw=19.921 blur=19.384 layout=43.633, +1 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 9 | advisory | review | 19.510 | 18.604 | 38.135 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-more-pages/incheon-2a/compare/page-009-compare.png` |
| 11 | advisory | review | 20.027 | 19.322 | 43.633 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-more-pages/incheon-2a/compare/page-011-compare.png` |
| 15 | advisory | review | 19.506 | 18.704 | 43.689 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-more-pages/incheon-2a/compare/page-015-compare.png` |
| 9 | advisory | review | 19.212 | 18.448 | 38.151 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-more-pages/incheon-2a/compare/page-009-compare.png` |
| 11 | advisory | review | 19.888 | 19.307 | 43.647 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-more-pages/incheon-2a/compare/page-011-compare.png` |
| 15 | advisory | review | 19.407 | 18.722 | 43.709 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-more-pages/incheon-2a/compare/page-015-compare.png` |
| 9 | advisory | review | 19.205 | 18.445 | 38.135 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-more-pages/incheon-2a/compare/page-009-compare.png` |
| 11 | advisory | review | 19.921 | 19.384 | 43.633 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-more-pages/incheon-2a/compare/page-011-compare.png` |
| 15 | advisory | review | 19.411 | 18.775 | 43.709 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-more-pages/incheon-2a/compare/page-015-compare.png` |

