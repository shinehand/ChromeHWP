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
- advisory pages: p1 review raw=30.357 blur=27.708 layout=17.867

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 30.357 | 27.708 | 17.867 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/render-auto/goyeopje/compare/page-001-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'mismatch': 1, 'layout-review': 1}
- severity: {'strict-failure': 1, 'advisory': 1}
- advisory pages: p11 layout-review raw=34.677 blur=29.086 layout=11.876
- strict failure pages: p2 mismatch raw=36.344 blur=32.074 layout=19.023

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 2 | strict-failure | mismatch | 36.344 | 32.074 | 19.023 | strict-failure: raw/blur/layout evidence does not meet the visual guard. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/render-auto/goyeopje-full-2024/compare/page-002-compare.png` |
| 11 | advisory | layout-review | 34.677 | 29.086 | 11.876 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/render-auto/goyeopje-full-2024/compare/page-011-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 1}
- severity: {'advisory': 2}
- advisory pages: p1 layout-review raw=36.261 blur=30.149 layout=25.449, p2 review raw=30.309 blur=26.437 layout=28.325

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 36.261 | 30.149 | 25.449 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/render-auto/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 30.309 | 26.437 | 28.325 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/render-auto/attachment-sale-notice/compare/page-002-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 2, 'layout-review': 1}
- severity: {'advisory': 3}
- advisory pages: p1 review raw=27.728 blur=25.678 layout=41.062, p3 review raw=30.680 blur=28.033 layout=33.508, p16 layout-review raw=36.142 blur=30.569 layout=23.549

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 27.728 | 25.678 | 41.062 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/render-auto/incheon-2a/compare/page-001-compare.png` |
| 3 | advisory | review | 30.680 | 28.033 | 33.508 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/render-auto/incheon-2a/compare/page-003-compare.png` |
| 16 | advisory | layout-review | 36.142 | 30.569 | 23.549 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/render-auto/incheon-2a/compare/page-016-compare.png` |

