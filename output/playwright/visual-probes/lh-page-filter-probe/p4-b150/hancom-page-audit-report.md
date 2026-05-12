# Hancom Page Audit

한컴 Viewer를 기준으로 테스트 문서의 모든 페이지를 페이지 단위로 캡처한 비교 결과입니다.
`review`와 `layout-review`는 자동화가 계속 진행될 수 있는 advisory일 뿐, clean visual pass가 아닙니다.

## Verdict Policy

- pass: close
- advisory: layout-review, review (raw/blur/layout 지표를 보고 사람이 확인해야 함)
- strict failure: capture-error, capture-review, mismatch
- thresholds: close raw<=18.0, review raw<=32.0, layout-review blur<=32.0 and layout<=30.0

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'review': 3, 'close': 1}
- severity: {'advisory': 3, 'pass': 1}
- advisory pages: p1 review raw=30.392 blur=20.810 layout=28.033, p2 review raw=30.611 blur=21.123 layout=42.667, p4 review raw=22.958 blur=20.492 layout=40.786

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 30.392 | 20.810 | 28.033 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/lh-page-filter-probe/p4-b150/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 30.611 | 21.123 | 42.667 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/lh-page-filter-probe/p4-b150/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | pass | close | 17.692 | 16.941 | 34.259 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/lh-page-filter-probe/p4-b150/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 22.958 | 20.492 | 40.786 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/lh-page-filter-probe/p4-b150/attachment-sale-notice/compare/page-004-compare.png` |

