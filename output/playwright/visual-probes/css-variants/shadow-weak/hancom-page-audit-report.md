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
- advisory pages: p1 review raw=31.478 blur=28.686 layout=17.793

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 31.478 | 28.686 | 17.793 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/shadow-weak/goyeopje/compare/page-001-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'mismatch': 2}
- severity: {'strict-failure': 2}
- strict failure pages: p2 mismatch raw=37.856 blur=33.349 layout=18.991, p11 mismatch raw=40.583 blur=33.815 layout=11.929

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 2 | strict-failure | mismatch | 37.856 | 33.349 | 18.991 | strict-failure: raw/blur/layout evidence does not meet the visual guard. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/shadow-weak/goyeopje-full-2024/compare/page-002-compare.png` |
| 11 | strict-failure | mismatch | 40.583 | 33.815 | 11.929 | strict-failure: raw/blur/layout evidence does not meet the visual guard. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/shadow-weak/goyeopje-full-2024/compare/page-011-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'mismatch': 1, 'layout-review': 1}
- severity: {'strict-failure': 1, 'advisory': 1}
- advisory pages: p2 layout-review raw=32.073 blur=28.013 layout=28.552
- strict failure pages: p1 mismatch raw=38.947 blur=32.377 layout=24.875

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | strict-failure | mismatch | 38.947 | 32.377 | 24.875 | strict-failure: raw/blur/layout evidence does not meet the visual guard. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/shadow-weak/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | layout-review | 32.073 | 28.013 | 28.552 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/shadow-weak/attachment-sale-notice/compare/page-002-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 1, 'mismatch': 1, 'layout-review': 1}
- severity: {'advisory': 2, 'strict-failure': 1}
- advisory pages: p1 review raw=29.839 blur=27.478 layout=40.592, p16 layout-review raw=36.675 blur=30.907 layout=23.398
- strict failure pages: p3 mismatch raw=32.294 blur=29.285 layout=32.962

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 29.839 | 27.478 | 40.592 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/shadow-weak/incheon-2a/compare/page-001-compare.png` |
| 3 | strict-failure | mismatch | 32.294 | 29.285 | 32.962 | strict-failure: raw/blur/layout evidence does not meet the visual guard. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/shadow-weak/incheon-2a/compare/page-003-compare.png` |
| 16 | advisory | layout-review | 36.675 | 30.907 | 23.398 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/css-variants/shadow-weak/incheon-2a/compare/page-016-compare.png` |

