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
- verdicts: {'layout-review': 4, 'mismatch': 1}
- severity: {'advisory': 4, 'strict-failure': 1}
- advisory pages: p1 layout-review raw=33.389 blur=28.665 layout=29.907, p1 layout-review raw=33.265 blur=28.576 layout=29.059, p1 layout-review raw=33.059 blur=28.179 layout=28.731, p1 layout-review raw=32.160 blur=27.413 layout=29.182
- strict failure pages: p1 mismatch raw=33.776 blur=29.221 layout=30.218

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 33.389 | 28.665 | 29.907 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | layout-review | 33.265 | 28.576 | 29.059 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | layout-review | 33.059 | 28.179 | 28.731 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | strict-failure | mismatch | 33.776 | 29.221 | 30.218 | strict-failure: raw/blur/layout evidence does not meet the visual guard. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | layout-review | 32.160 | 27.413 | 29.182 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit/attachment-sale-notice/compare/page-001-compare.png` |

