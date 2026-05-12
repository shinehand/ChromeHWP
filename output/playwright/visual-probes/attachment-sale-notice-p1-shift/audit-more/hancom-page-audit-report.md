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
- verdicts: {'mismatch': 2, 'layout-review': 1, 'review': 3}
- severity: {'strict-failure': 2, 'advisory': 4}
- advisory pages: p1 layout-review raw=33.448 blur=28.761 layout=29.828, p1 review raw=31.756 blur=27.169 layout=29.657, p1 review raw=31.193 blur=26.857 layout=32.247, p1 review raw=31.959 blur=27.220 layout=30.911
- strict failure pages: p1 mismatch raw=33.127 blur=28.601 layout=30.503, p1 mismatch raw=33.548 blur=29.051 layout=31.068

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | strict-failure | mismatch | 33.127 | 28.601 | 30.503 | strict-failure: raw/blur/layout evidence does not meet the visual guard. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-more/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | strict-failure | mismatch | 33.548 | 29.051 | 31.068 | strict-failure: raw/blur/layout evidence does not meet the visual guard. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-more/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | layout-review | 33.448 | 28.761 | 29.828 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-more/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | review | 31.756 | 27.169 | 29.657 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-more/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | review | 31.193 | 26.857 | 32.247 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-more/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | review | 31.959 | 27.220 | 30.911 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-more/attachment-sale-notice/compare/page-001-compare.png` |

