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
- advisory pages: p1 review raw=30.163 blur=27.560 layout=17.843

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 30.163 | 27.560 | 17.843 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-010/goyeopje/compare/page-001-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'layout-review': 1, 'mismatch': 1}
- severity: {'advisory': 1, 'strict-failure': 1}
- advisory pages: p2 layout-review raw=35.757 blur=31.685 layout=19.047
- strict failure pages: p11 mismatch raw=39.175 blur=32.822 layout=11.838

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 2 | advisory | layout-review | 35.757 | 31.685 | 19.047 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-010/goyeopje-full-2024/compare/page-002-compare.png` |
| 11 | strict-failure | mismatch | 39.175 | 32.822 | 11.838 | strict-failure: raw/blur/layout evidence does not meet the visual guard. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-010/goyeopje-full-2024/compare/page-011-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 1}
- severity: {'advisory': 2}
- advisory pages: p1 layout-review raw=36.888 blur=30.818 layout=25.268, p2 review raw=29.923 blur=26.158 layout=28.119

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 36.888 | 30.818 | 25.268 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-010/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 29.923 | 26.158 | 28.119 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-010/attachment-sale-notice/compare/page-002-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 2, 'layout-review': 1}
- severity: {'advisory': 3}
- advisory pages: p1 review raw=29.603 blur=27.333 layout=40.613, p3 review raw=31.417 blur=28.596 layout=33.108, p16 layout-review raw=36.169 blur=30.624 layout=23.524

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 29.603 | 27.333 | 40.613 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-010/incheon-2a/compare/page-001-compare.png` |
| 3 | advisory | review | 31.417 | 28.596 | 33.108 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-010/incheon-2a/compare/page-003-compare.png` |
| 16 | advisory | layout-review | 36.169 | 30.624 | 23.524 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-010/incheon-2a/compare/page-016-compare.png` |

