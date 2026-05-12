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
- advisory pages: p1 review raw=22.838 blur=22.060 layout=32.109

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 22.838 | 22.060 | 32.109 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje/compare/page-001-compare.png` |
| 2 | pass | close | 14.668 | 14.267 | 20.568 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje/compare/page-002-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'close': 4, 'review': 7}
- severity: {'pass': 4, 'advisory': 7}
- advisory pages: p2 review raw=20.626 blur=19.433 layout=28.976, p6 review raw=27.147 blur=26.990 layout=43.133, p7 review raw=19.977 blur=19.332 layout=31.591, p8 review raw=23.695 blur=22.881 layout=37.174, p9 review raw=23.387 blur=22.487 layout=36.591, p10 review raw=22.079 blur=20.955 layout=20.542, p11 review raw=27.001 blur=25.706 layout=42.257

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | pass | close | 17.956 | 16.865 | 23.771 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje-full-2024/compare/page-001-compare.png` |
| 2 | advisory | review | 20.626 | 19.433 | 28.976 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje-full-2024/compare/page-002-compare.png` |
| 3 | pass | close | 8.285 | 7.781 | 13.198 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje-full-2024/compare/page-003-compare.png` |
| 4 | pass | close | 16.606 | 16.269 | 26.414 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje-full-2024/compare/page-004-compare.png` |
| 5 | pass | close | 16.762 | 16.066 | 29.012 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje-full-2024/compare/page-005-compare.png` |
| 6 | advisory | review | 27.147 | 26.990 | 43.133 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje-full-2024/compare/page-006-compare.png` |
| 7 | advisory | review | 19.977 | 19.332 | 31.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje-full-2024/compare/page-007-compare.png` |
| 8 | advisory | review | 23.695 | 22.881 | 37.174 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje-full-2024/compare/page-008-compare.png` |
| 9 | advisory | review | 23.387 | 22.487 | 36.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje-full-2024/compare/page-009-compare.png` |
| 10 | advisory | review | 22.079 | 20.955 | 20.542 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje-full-2024/compare/page-010-compare.png` |
| 11 | advisory | review | 27.001 | 25.706 | 42.257 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/goyeopje-full-2024/compare/page-011-compare.png` |

## gyeolseokgye.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/gyeolseokgye.hwp`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.569 blur=18.139 layout=24.061

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.569 | 18.139 | 24.061 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/gyeolseokgye/compare/page-001-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 3}
- severity: {'advisory': 4}
- advisory pages: p1 layout-review raw=32.870 blur=28.269 layout=29.843, p2 review raw=25.125 blur=22.266 layout=26.130, p3 review raw=22.987 blur=21.035 layout=23.349, p4 review raw=25.643 blur=22.039 layout=24.784

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 32.870 | 28.269 | 29.843 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 25.125 | 22.266 | 26.130 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | advisory | review | 22.987 | 21.035 | 23.349 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 25.643 | 22.039 | 24.784 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/attachment-sale-notice/compare/page-004-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 9, 'close': 9}
- severity: {'advisory': 9, 'pass': 9}
- advisory pages: p1 review raw=24.147 blur=23.792 layout=51.640, p2 review raw=21.657 blur=20.785 layout=44.581, p3 review raw=26.602 blur=25.450 layout=45.217, p4 review raw=24.630 blur=23.133 layout=35.859, p5 review raw=24.975 blur=22.703 layout=42.522, p11 review raw=18.985 blur=18.840 layout=43.663, p15 review raw=19.149 blur=18.096 layout=42.690, p16 review raw=29.836 blur=28.777 layout=43.286, +1 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 24.147 | 23.792 | 51.640 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-001-compare.png` |
| 2 | advisory | review | 21.657 | 20.785 | 44.581 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-002-compare.png` |
| 3 | advisory | review | 26.602 | 25.450 | 45.217 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-003-compare.png` |
| 4 | advisory | review | 24.630 | 23.133 | 35.859 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-004-compare.png` |
| 5 | advisory | review | 24.975 | 22.703 | 42.522 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-005-compare.png` |
| 6 | pass | close | 15.409 | 15.250 | 36.609 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-006-compare.png` |
| 7 | pass | close | 16.265 | 15.648 | 33.682 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-007-compare.png` |
| 8 | pass | close | 17.638 | 16.689 | 33.893 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-008-compare.png` |
| 9 | pass | close | 17.799 | 17.513 | 38.184 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-009-compare.png` |
| 10 | pass | close | 16.360 | 16.106 | 40.563 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-010-compare.png` |
| 11 | advisory | review | 18.985 | 18.840 | 43.663 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-011-compare.png` |
| 12 | pass | close | 17.870 | 16.827 | 39.933 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-012-compare.png` |
| 13 | pass | close | 17.243 | 16.478 | 45.228 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-013-compare.png` |
| 14 | pass | close | 17.669 | 16.610 | 44.348 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-014-compare.png` |
| 15 | advisory | review | 19.149 | 18.096 | 42.690 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-015-compare.png` |
| 16 | advisory | review | 29.836 | 28.777 | 43.286 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-016-compare.png` |
| 17 | advisory | review | 27.408 | 25.025 | 34.555 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-017-compare.png` |
| 18 | pass | close | 15.675 | 15.042 | 23.870 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-attendance-form-table-border-transparent/incheon-2a/compare/page-018-compare.png` |

