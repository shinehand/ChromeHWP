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
- verdicts: {'review': 4, 'close': 2}
- severity: {'advisory': 4, 'pass': 2}
- advisory pages: p13 review raw=18.130 blur=17.053 layout=44.567, p15 review raw=19.621 blur=18.703 layout=43.645, p15 review raw=19.506 blur=18.704 layout=43.689, p15 review raw=19.407 blur=18.722 layout=43.709

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 13 | advisory | review | 18.130 | 17.053 | 44.567 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-extreme/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 19.621 | 18.703 | 43.645 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-extreme/incheon-2a/compare/page-015-compare.png` |
| 13 | pass | close | 17.931 | 17.026 | 44.583 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-extreme/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 19.506 | 18.704 | 43.689 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-extreme/incheon-2a/compare/page-015-compare.png` |
| 13 | pass | close | 17.778 | 17.034 | 44.757 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-extreme/incheon-2a/compare/page-013-compare.png` |
| 15 | advisory | review | 19.407 | 18.722 | 43.709 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-body-op-extreme/incheon-2a/compare/page-015-compare.png` |

