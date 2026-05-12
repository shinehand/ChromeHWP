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
- advisory pages: p1 review raw=30.722 blur=28.091 layout=17.811

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 30.722 | 28.091 | 17.811 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-018/goyeopje/compare/page-001-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'mismatch': 2}
- severity: {'strict-failure': 2}
- strict failure pages: p2 mismatch raw=36.361 blur=32.245 layout=19.019, p11 mismatch raw=40.175 blur=33.756 layout=11.919

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 2 | strict-failure | mismatch | 36.361 | 32.245 | 19.019 | strict-failure: raw/blur/layout evidence does not meet the visual guard. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-018/goyeopje-full-2024/compare/page-002-compare.png` |
| 11 | strict-failure | mismatch | 40.175 | 33.756 | 11.919 | strict-failure: raw/blur/layout evidence does not meet the visual guard. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-018/goyeopje-full-2024/compare/page-011-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 1}
- severity: {'advisory': 2}
- advisory pages: p1 layout-review raw=37.633 blur=31.443 layout=25.034, p2 review raw=30.777 blur=26.928 layout=28.400

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 37.633 | 31.443 | 25.034 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-018/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 30.777 | 26.928 | 28.400 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-018/attachment-sale-notice/compare/page-002-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 2, 'layout-review': 1}
- severity: {'advisory': 3}
- advisory pages: p1 review raw=29.842 blur=27.544 layout=40.573, p3 review raw=31.873 blur=28.979 layout=33.018, p16 layout-review raw=36.332 blur=30.723 layout=23.465

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 29.842 | 27.544 | 40.573 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-018/incheon-2a/compare/page-001-compare.png` |
| 3 | advisory | review | 31.873 | 28.979 | 33.018 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-018/incheon-2a/compare/page-003-compare.png` |
| 16 | advisory | layout-review | 36.332 | 30.723 | 23.465 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/stroke-018/incheon-2a/compare/page-016-compare.png` |

