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
- advisory pages: p1 review raw=25.036 blur=23.651 layout=25.644

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 25.036 | 23.651 | 25.644 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje/compare/page-001-compare.png` |
| 2 | pass | close | 16.238 | 15.537 | 17.852 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje/compare/page-002-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'review': 8, 'close': 3}
- severity: {'advisory': 8, 'pass': 3}
- advisory pages: p1 review raw=23.560 blur=21.646 layout=20.895, p2 review raw=30.202 blur=28.368 layout=32.736, p6 review raw=30.389 blur=28.361 layout=37.268, p7 review raw=21.007 blur=19.934 layout=28.252, p8 review raw=24.604 blur=23.351 layout=33.900, p9 review raw=24.468 blur=23.106 layout=32.710, p10 review raw=29.633 blur=27.238 layout=21.773, p11 review raw=28.960 blur=26.896 layout=36.197

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 23.560 | 21.646 | 20.895 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje-full-2024/compare/page-001-compare.png` |
| 2 | advisory | review | 30.202 | 28.368 | 32.736 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje-full-2024/compare/page-002-compare.png` |
| 3 | pass | close | 13.582 | 12.603 | 12.061 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje-full-2024/compare/page-003-compare.png` |
| 4 | pass | close | 16.849 | 16.494 | 24.976 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje-full-2024/compare/page-004-compare.png` |
| 5 | pass | close | 17.991 | 17.396 | 28.088 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje-full-2024/compare/page-005-compare.png` |
| 6 | advisory | review | 30.389 | 28.361 | 37.268 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje-full-2024/compare/page-006-compare.png` |
| 7 | advisory | review | 21.007 | 19.934 | 28.252 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje-full-2024/compare/page-007-compare.png` |
| 8 | advisory | review | 24.604 | 23.351 | 33.900 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje-full-2024/compare/page-008-compare.png` |
| 9 | advisory | review | 24.468 | 23.106 | 32.710 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje-full-2024/compare/page-009-compare.png` |
| 10 | advisory | review | 29.633 | 27.238 | 21.773 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje-full-2024/compare/page-010-compare.png` |
| 11 | advisory | review | 28.960 | 26.896 | 36.197 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/goyeopje-full-2024/compare/page-011-compare.png` |

## gyeolseokgye.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/gyeolseokgye.hwp`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=20.304 blur=19.560 layout=20.798

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 20.304 | 19.560 | 20.798 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/gyeolseokgye/compare/page-001-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 3}
- severity: {'advisory': 4}
- advisory pages: p1 layout-review raw=32.870 blur=28.269 layout=29.843, p2 review raw=25.125 blur=22.266 layout=26.130, p3 review raw=22.987 blur=21.035 layout=23.349, p4 review raw=25.643 blur=22.039 layout=24.784

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 32.870 | 28.269 | 29.843 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 25.125 | 22.266 | 26.130 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | advisory | review | 22.987 | 21.035 | 23.349 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 25.643 | 22.039 | 24.784 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/attachment-sale-notice/compare/page-004-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 10, 'close': 8}
- severity: {'advisory': 10, 'pass': 8}
- advisory pages: p1 review raw=24.807 blur=24.038 layout=49.512, p2 review raw=21.934 blur=20.991 layout=44.300, p3 review raw=27.175 blur=25.709 layout=43.894, p4 review raw=24.945 blur=23.367 layout=35.428, p5 review raw=25.262 blur=22.769 layout=41.755, p9 review raw=21.317 blur=19.758 layout=33.156, p11 review raw=20.549 blur=19.353 layout=41.386, p15 review raw=19.473 blur=18.244 layout=41.866, +2 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 24.807 | 24.038 | 49.512 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-001-compare.png` |
| 2 | advisory | review | 21.934 | 20.991 | 44.300 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-002-compare.png` |
| 3 | advisory | review | 27.175 | 25.709 | 43.894 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-003-compare.png` |
| 4 | advisory | review | 24.945 | 23.367 | 35.428 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-004-compare.png` |
| 5 | advisory | review | 25.262 | 22.769 | 41.755 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-005-compare.png` |
| 6 | pass | close | 15.409 | 15.244 | 36.594 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-006-compare.png` |
| 7 | pass | close | 16.545 | 15.840 | 33.405 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-007-compare.png` |
| 8 | pass | close | 17.804 | 16.844 | 33.893 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-008-compare.png` |
| 9 | advisory | review | 21.317 | 19.758 | 33.156 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-009-compare.png` |
| 10 | pass | close | 16.922 | 16.430 | 39.257 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-010-compare.png` |
| 11 | advisory | review | 20.549 | 19.353 | 41.386 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-011-compare.png` |
| 12 | pass | close | 17.974 | 16.789 | 39.055 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-012-compare.png` |
| 13 | pass | close | 17.171 | 16.376 | 44.515 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-013-compare.png` |
| 14 | pass | close | 17.715 | 16.439 | 43.006 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-014-compare.png` |
| 15 | advisory | review | 19.473 | 18.244 | 41.866 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-015-compare.png` |
| 16 | advisory | review | 30.230 | 28.968 | 42.505 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-016-compare.png` |
| 17 | advisory | review | 27.668 | 25.020 | 33.500 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-017-compare.png` |
| 18 | pass | close | 16.030 | 15.329 | 23.580 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/body-blur-018/incheon-2a/compare/page-018-compare.png` |

