# Hancom Page Audit

한컴 Viewer를 기준으로 테스트 문서의 모든 페이지를 페이지 단위로 캡처한 비교 결과입니다.
`review`와 `layout-review`는 자동화가 계속 진행될 수 있는 advisory일 뿐, clean visual pass가 아닙니다.

## Verdict Policy

- pass: close
- advisory: layout-review, review (raw/blur/layout 지표를 보고 사람이 확인해야 함)
- strict failure: capture-error, capture-review, mismatch
- thresholds: close raw<=18.0, review raw<=32.0, layout-review blur<=32.0 and layout<=30.0

## goyeopje.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje.hwp`
- pages: 2
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=29.491 blur=26.943 layout=17.897

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 29.491 | 26.943 | 17.897 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/base/goyeopje/compare/page-001-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'layout-review': 2}
- severity: {'advisory': 2}
- advisory pages: p2 layout-review raw=35.059 blur=31.049 layout=19.079, p11 layout-review raw=35.972 blur=29.949 layout=11.775

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 2 | advisory | layout-review | 35.059 | 31.049 | 19.079 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/base/goyeopje-full-2024/compare/page-002-compare.png` |
| 11 | advisory | layout-review | 35.972 | 29.949 | 11.775 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/base/goyeopje-full-2024/compare/page-011-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 1}
- severity: {'advisory': 2}
- advisory pages: p1 layout-review raw=35.613 blur=29.762 layout=25.810, p2 review raw=28.887 blur=25.231 layout=27.762

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 35.613 | 29.762 | 25.810 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/base/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 28.887 | 25.231 | 27.762 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/base/attachment-sale-notice/compare/page-002-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 2, 'layout-review': 1}
- severity: {'advisory': 3}
- advisory pages: p1 review raw=28.464 blur=26.306 layout=40.836, p3 review raw=30.594 blur=27.944 layout=33.394, p16 layout-review raw=35.961 blur=30.507 layout=23.598

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 28.464 | 26.306 | 40.836 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/base/incheon-2a/compare/page-001-compare.png` |
| 3 | advisory | review | 30.594 | 27.944 | 33.394 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/base/incheon-2a/compare/page-003-compare.png` |
| 16 | advisory | layout-review | 35.961 | 30.507 | 23.598 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/base/incheon-2a/compare/page-016-compare.png` |

