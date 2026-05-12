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
- verdicts: {'layout-review': 1, 'review': 3}
- severity: {'advisory': 4}
- advisory pages: p1 layout-review raw=35.529 blur=30.251 layout=27.561, p2 review raw=28.887 blur=25.231 layout=27.762, p3 review raw=27.490 blur=24.885 layout=22.429, p4 review raw=29.372 blur=24.661 layout=22.135

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 35.529 | 30.251 | 27.561 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/lh-css-variants/no-lh-special-fitwidth/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 28.887 | 25.231 | 27.762 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/lh-css-variants/no-lh-special-fitwidth/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | advisory | review | 27.490 | 24.885 | 22.429 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/lh-css-variants/no-lh-special-fitwidth/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 29.372 | 24.661 | 22.135 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/lh-css-variants/no-lh-special-fitwidth/attachment-sale-notice/compare/page-004-compare.png` |

