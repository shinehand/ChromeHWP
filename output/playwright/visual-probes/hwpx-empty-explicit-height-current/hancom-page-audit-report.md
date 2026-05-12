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
| 1 | advisory | review | 22.838 | 22.060 | 32.109 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje/compare/page-001-compare.png` |
| 2 | pass | close | 14.668 | 14.267 | 20.568 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje/compare/page-002-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'close': 4, 'review': 7}
- severity: {'pass': 4, 'advisory': 7}
- advisory pages: p2 review raw=20.626 blur=19.433 layout=28.976, p6 review raw=24.911 blur=23.651 layout=40.610, p7 review raw=19.977 blur=19.332 layout=31.591, p8 review raw=23.695 blur=22.881 layout=37.174, p9 review raw=23.387 blur=22.487 layout=36.591, p10 review raw=22.079 blur=20.955 layout=20.542, p11 review raw=27.001 blur=25.706 layout=42.257

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | pass | close | 17.956 | 16.865 | 23.771 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje-full-2024/compare/page-001-compare.png` |
| 2 | advisory | review | 20.626 | 19.433 | 28.976 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje-full-2024/compare/page-002-compare.png` |
| 3 | pass | close | 8.285 | 7.781 | 13.198 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje-full-2024/compare/page-003-compare.png` |
| 4 | pass | close | 16.606 | 16.269 | 26.414 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje-full-2024/compare/page-004-compare.png` |
| 5 | pass | close | 16.762 | 16.066 | 29.012 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje-full-2024/compare/page-005-compare.png` |
| 6 | advisory | review | 24.911 | 23.651 | 40.610 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje-full-2024/compare/page-006-compare.png` |
| 7 | advisory | review | 19.977 | 19.332 | 31.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje-full-2024/compare/page-007-compare.png` |
| 8 | advisory | review | 23.695 | 22.881 | 37.174 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje-full-2024/compare/page-008-compare.png` |
| 9 | advisory | review | 23.387 | 22.487 | 36.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje-full-2024/compare/page-009-compare.png` |
| 10 | advisory | review | 22.079 | 20.955 | 20.542 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje-full-2024/compare/page-010-compare.png` |
| 11 | advisory | review | 27.001 | 25.706 | 42.257 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/goyeopje-full-2024/compare/page-011-compare.png` |

## gyeolseokgye.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/gyeolseokgye.hwp`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.523 blur=18.048 layout=23.960

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.523 | 18.048 | 23.960 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/gyeolseokgye/compare/page-001-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 3}
- severity: {'advisory': 4}
- advisory pages: p1 layout-review raw=32.870 blur=28.269 layout=29.843, p2 review raw=25.125 blur=22.266 layout=26.130, p3 review raw=22.987 blur=21.035 layout=23.349, p4 review raw=25.643 blur=22.039 layout=24.784

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 32.870 | 28.269 | 29.843 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 25.125 | 22.266 | 26.130 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | advisory | review | 22.987 | 21.035 | 23.349 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 25.643 | 22.039 | 24.784 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/attachment-sale-notice/compare/page-004-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 10, 'close': 8}
- severity: {'advisory': 10, 'pass': 8}
- advisory pages: p1 review raw=24.147 blur=23.792 layout=51.640, p2 review raw=21.555 blur=20.717 layout=44.516, p3 review raw=26.071 blur=25.073 layout=45.011, p4 review raw=24.379 blur=22.736 layout=35.573, p5 review raw=25.121 blur=22.896 layout=43.192, p11 review raw=19.005 blur=18.850 layout=43.670, p12 review raw=18.787 blur=17.470 layout=39.682, p15 review raw=19.253 blur=18.278 layout=42.656, +2 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 24.147 | 23.792 | 51.640 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-001-compare.png` |
| 2 | advisory | review | 21.555 | 20.717 | 44.516 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-002-compare.png` |
| 3 | advisory | review | 26.071 | 25.073 | 45.011 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-003-compare.png` |
| 4 | advisory | review | 24.379 | 22.736 | 35.573 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-004-compare.png` |
| 5 | advisory | review | 25.121 | 22.896 | 43.192 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-005-compare.png` |
| 6 | pass | close | 15.409 | 15.250 | 36.609 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-006-compare.png` |
| 7 | pass | close | 16.253 | 15.621 | 33.574 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-007-compare.png` |
| 8 | pass | close | 17.533 | 16.617 | 33.843 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-008-compare.png` |
| 9 | pass | close | 17.792 | 17.507 | 38.180 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-009-compare.png` |
| 10 | pass | close | 16.293 | 16.042 | 40.394 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-010-compare.png` |
| 11 | advisory | review | 19.005 | 18.850 | 43.670 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-011-compare.png` |
| 12 | advisory | review | 18.787 | 17.470 | 39.682 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-012-compare.png` |
| 13 | pass | close | 17.322 | 16.562 | 45.228 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-013-compare.png` |
| 14 | pass | close | 17.637 | 16.579 | 44.348 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-014-compare.png` |
| 15 | advisory | review | 19.253 | 18.278 | 42.656 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-015-compare.png` |
| 16 | advisory | review | 30.570 | 29.557 | 43.111 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-016-compare.png` |
| 17 | advisory | review | 27.084 | 24.683 | 34.140 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-017-compare.png` |
| 18 | pass | close | 16.114 | 15.499 | 23.896 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwpx-empty-explicit-height-current/incheon-2a/compare/page-018-compare.png` |

