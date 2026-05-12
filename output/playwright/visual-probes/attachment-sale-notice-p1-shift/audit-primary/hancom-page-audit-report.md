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
- verdicts: {'review': 2, 'mismatch': 1}
- severity: {'advisory': 2, 'strict-failure': 1}
- advisory pages: p1 review raw=31.558 blur=27.088 layout=31.068, p1 review raw=31.543 blur=27.232 layout=31.609
- strict failure pages: p1 mismatch raw=32.627 blur=28.247 layout=31.524

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 31.558 | 27.088 | 31.068 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-primary/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | strict-failure | mismatch | 32.627 | 28.247 | 31.524 | strict-failure: raw/blur/layout evidence does not meet the visual guard. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-primary/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | review | 31.543 | 27.232 | 31.609 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-primary/attachment-sale-notice/compare/page-001-compare.png` |

