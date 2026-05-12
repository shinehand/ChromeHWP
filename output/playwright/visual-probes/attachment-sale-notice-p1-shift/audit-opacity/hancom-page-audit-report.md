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
- verdicts: {'review': 5}
- severity: {'advisory': 5}
- advisory pages: p1 review raw=30.323 blur=26.404 layout=34.136, p1 review raw=29.555 blur=26.069 layout=37.400, p1 review raw=28.878 blur=25.843 layout=42.060, p1 review raw=30.623 blur=26.679 layout=33.688, p1 review raw=29.075 blur=25.845 layout=43.086

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 30.323 | 26.404 | 34.136 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-opacity/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | review | 29.555 | 26.069 | 37.400 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-opacity/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | review | 28.878 | 25.843 | 42.060 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-opacity/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | review | 30.623 | 26.679 | 33.688 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-opacity/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | review | 29.075 | 25.845 | 43.086 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-opacity/attachment-sale-notice/compare/page-001-compare.png` |

