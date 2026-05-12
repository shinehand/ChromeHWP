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
- advisory pages: p1 review raw=29.336 blur=26.822 layout=17.927

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 29.336 | 26.822 | 17.927 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/noframe/goyeopje/compare/page-001-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'layout-review': 2}
- severity: {'advisory': 2}
- advisory pages: p2 layout-review raw=35.418 blur=31.254 layout=19.473, p11 layout-review raw=36.174 blur=29.898 layout=11.733

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 2 | advisory | layout-review | 35.418 | 31.254 | 19.473 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/noframe/goyeopje-full-2024/compare/page-002-compare.png` |
| 11 | advisory | layout-review | 36.174 | 29.898 | 11.733 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/noframe/goyeopje-full-2024/compare/page-011-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 1}
- severity: {'advisory': 2}
- advisory pages: p1 layout-review raw=35.614 blur=29.822 layout=26.907, p2 review raw=28.674 blur=25.061 layout=27.839

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 35.614 | 29.822 | 26.907 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/noframe/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 28.674 | 25.061 | 27.839 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/noframe/attachment-sale-notice/compare/page-002-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 2, 'layout-review': 1}
- severity: {'advisory': 3}
- advisory pages: p1 review raw=28.711 blur=26.395 layout=40.941, p3 review raw=30.270 blur=27.654 layout=32.915, p16 layout-review raw=36.122 blur=30.642 layout=23.708

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 28.711 | 26.395 | 40.941 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/noframe/incheon-2a/compare/page-001-compare.png` |
| 3 | advisory | review | 30.270 | 27.654 | 32.915 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/noframe/incheon-2a/compare/page-003-compare.png` |
| 16 | advisory | layout-review | 36.122 | 30.642 | 23.708 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/noframe/incheon-2a/compare/page-016-compare.png` |

