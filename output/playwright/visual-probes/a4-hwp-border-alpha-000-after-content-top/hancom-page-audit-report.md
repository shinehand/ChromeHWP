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
- verdicts: {'review': 1, 'close': 1}
- severity: {'advisory': 1, 'pass': 1}
- advisory pages: p1 review raw=21.987 blur=21.666 layout=32.478

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 21.987 | 21.666 | 32.478 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje/compare/page-001-compare.png` |
| 2 | pass | close | 13.963 | 13.802 | 20.743 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje/compare/page-002-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'close': 4, 'review': 7}
- severity: {'pass': 4, 'advisory': 7}
- advisory pages: p2 review raw=20.861 blur=19.994 layout=31.473, p6 review raw=26.907 blur=26.877 layout=43.133, p7 review raw=19.647 blur=19.261 layout=31.706, p8 review raw=23.458 blur=22.878 layout=37.262, p9 review raw=23.098 blur=22.440 layout=37.042, p10 review raw=21.896 blur=21.210 layout=22.035, p11 review raw=26.396 blur=25.513 layout=42.387

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | pass | close | 16.706 | 16.343 | 25.951 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje-full-2024/compare/page-001-compare.png` |
| 2 | advisory | review | 20.861 | 19.994 | 31.473 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje-full-2024/compare/page-002-compare.png` |
| 3 | pass | close | 7.872 | 7.702 | 14.008 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje-full-2024/compare/page-003-compare.png` |
| 4 | pass | close | 16.479 | 16.198 | 26.424 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje-full-2024/compare/page-004-compare.png` |
| 5 | pass | close | 16.535 | 16.104 | 29.012 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje-full-2024/compare/page-005-compare.png` |
| 6 | advisory | review | 26.907 | 26.877 | 43.133 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje-full-2024/compare/page-006-compare.png` |
| 7 | advisory | review | 19.647 | 19.261 | 31.706 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje-full-2024/compare/page-007-compare.png` |
| 8 | advisory | review | 23.458 | 22.878 | 37.262 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje-full-2024/compare/page-008-compare.png` |
| 9 | advisory | review | 23.098 | 22.440 | 37.042 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje-full-2024/compare/page-009-compare.png` |
| 10 | advisory | review | 21.896 | 21.210 | 22.035 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje-full-2024/compare/page-010-compare.png` |
| 11 | advisory | review | 26.396 | 25.513 | 42.387 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/goyeopje-full-2024/compare/page-011-compare.png` |

## gyeolseokgye.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/gyeolseokgye.hwp`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.257 blur=18.151 layout=24.470

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.257 | 18.151 | 24.470 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/gyeolseokgye/compare/page-001-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 3}
- severity: {'advisory': 4}
- advisory pages: p1 layout-review raw=32.870 blur=28.269 layout=29.843, p2 review raw=25.125 blur=22.266 layout=26.130, p3 review raw=22.987 blur=21.035 layout=23.349, p4 review raw=25.643 blur=22.039 layout=24.784

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 32.870 | 28.269 | 29.843 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 25.125 | 22.266 | 26.130 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | advisory | review | 22.987 | 21.035 | 23.349 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 25.643 | 22.039 | 24.784 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/attachment-sale-notice/compare/page-004-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 10, 'close': 8}
- severity: {'advisory': 10, 'pass': 8}
- advisory pages: p1 review raw=24.320 blur=23.945 layout=51.640, p2 review raw=21.821 blur=20.943 layout=44.581, p3 review raw=26.766 blur=25.607 layout=45.217, p4 review raw=24.795 blur=23.291 layout=35.859, p5 review raw=25.045 blur=22.721 layout=42.401, p9 review raw=20.482 blur=19.150 layout=34.664, p11 review raw=20.492 blur=19.455 layout=41.794, p15 review raw=19.252 blur=18.129 layout=42.684, +2 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 24.320 | 23.945 | 51.640 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-001-compare.png` |
| 2 | advisory | review | 21.821 | 20.943 | 44.581 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-002-compare.png` |
| 3 | advisory | review | 26.766 | 25.607 | 45.217 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-003-compare.png` |
| 4 | advisory | review | 24.795 | 23.291 | 35.859 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-004-compare.png` |
| 5 | advisory | review | 25.045 | 22.721 | 42.401 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-005-compare.png` |
| 6 | pass | close | 15.409 | 15.244 | 36.594 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-006-compare.png` |
| 7 | pass | close | 16.429 | 15.794 | 33.681 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-007-compare.png` |
| 8 | pass | close | 17.804 | 16.844 | 33.893 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-008-compare.png` |
| 9 | advisory | review | 20.482 | 19.150 | 34.664 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-009-compare.png` |
| 10 | pass | close | 16.535 | 16.277 | 40.563 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-010-compare.png` |
| 11 | advisory | review | 20.492 | 19.455 | 41.794 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-011-compare.png` |
| 12 | pass | close | 17.813 | 16.739 | 39.907 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-012-compare.png` |
| 13 | pass | close | 17.171 | 16.376 | 44.515 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-013-compare.png` |
| 14 | pass | close | 17.564 | 16.473 | 43.980 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-014-compare.png` |
| 15 | advisory | review | 19.252 | 18.129 | 42.684 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-015-compare.png` |
| 16 | advisory | review | 29.995 | 28.840 | 43.286 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-016-compare.png` |
| 17 | advisory | review | 27.541 | 25.131 | 34.425 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-017-compare.png` |
| 18 | pass | close | 15.837 | 15.202 | 23.870 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/a4-hwp-border-alpha-000-after-content-top/incheon-2a/compare/page-018-compare.png` |

