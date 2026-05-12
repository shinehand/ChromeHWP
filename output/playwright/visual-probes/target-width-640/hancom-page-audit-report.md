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
- advisory pages: p1 review raw=22.741 blur=21.673 layout=32.109

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 22.741 | 21.673 | 32.109 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/goyeopje/compare/page-001-compare.png` |
| 2 | pass | close | 14.626 | 14.073 | 20.568 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/goyeopje/compare/page-002-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'close': 4, 'review': 7}
- severity: {'pass': 4, 'advisory': 7}
- advisory pages: p2 review raw=20.429 blur=18.769 layout=28.976, p6 review raw=24.953 blur=23.265 layout=40.610, p7 review raw=19.916 blur=19.034 layout=31.591, p8 review raw=23.621 blur=22.556 layout=37.174, p9 review raw=23.356 blur=22.136 layout=36.591, p10 review raw=22.078 blur=20.544 layout=20.542, p11 review raw=26.879 blur=25.150 layout=42.257

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | pass | close | 17.759 | 15.998 | 23.771 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/goyeopje-full-2024/compare/page-001-compare.png` |
| 2 | advisory | review | 20.429 | 18.769 | 28.976 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/goyeopje-full-2024/compare/page-002-compare.png` |
| 3 | pass | close | 8.314 | 7.513 | 13.198 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/goyeopje-full-2024/compare/page-003-compare.png` |
| 4 | pass | close | 16.597 | 16.109 | 26.414 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/goyeopje-full-2024/compare/page-004-compare.png` |
| 5 | pass | close | 16.664 | 15.799 | 29.012 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/goyeopje-full-2024/compare/page-005-compare.png` |
| 6 | advisory | review | 24.953 | 23.265 | 40.610 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/goyeopje-full-2024/compare/page-006-compare.png` |
| 7 | advisory | review | 19.916 | 19.034 | 31.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/goyeopje-full-2024/compare/page-007-compare.png` |
| 8 | advisory | review | 23.621 | 22.556 | 37.174 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/goyeopje-full-2024/compare/page-008-compare.png` |
| 9 | advisory | review | 23.356 | 22.136 | 36.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/goyeopje-full-2024/compare/page-009-compare.png` |
| 10 | advisory | review | 22.078 | 20.544 | 20.542 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/goyeopje-full-2024/compare/page-010-compare.png` |
| 11 | advisory | review | 26.879 | 25.150 | 42.257 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/goyeopje-full-2024/compare/page-011-compare.png` |

## gyeolseokgye.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/gyeolseokgye.hwp`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.491 blur=17.894 layout=23.960

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.491 | 17.894 | 23.960 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/gyeolseokgye/compare/page-001-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 3}
- severity: {'advisory': 4}
- advisory pages: p1 layout-review raw=32.026 blur=26.490 layout=29.843, p2 review raw=24.681 blur=21.229 layout=26.130, p3 review raw=22.676 blur=20.254 layout=23.349, p4 review raw=25.064 blur=20.840 layout=24.784

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 32.026 | 26.490 | 29.843 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 24.681 | 21.229 | 26.130 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | advisory | review | 22.676 | 20.254 | 23.349 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 25.064 | 20.840 | 24.784 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/attachment-sale-notice/compare/page-004-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 9, 'close': 9}
- severity: {'advisory': 9, 'pass': 9}
- advisory pages: p1 review raw=24.109 blur=23.620 layout=51.640, p2 review raw=21.604 blur=20.431 layout=44.581, p3 review raw=26.469 blur=24.933 layout=45.217, p4 review raw=24.350 blur=22.443 layout=35.859, p5 review raw=24.645 blur=21.710 layout=42.522, p11 review raw=18.989 blur=18.802 layout=43.663, p15 review raw=19.103 blur=17.647 layout=42.690, p16 review raw=29.727 blur=28.459 layout=43.286, +1 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 24.109 | 23.620 | 51.640 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-001-compare.png` |
| 2 | advisory | review | 21.604 | 20.431 | 44.581 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-002-compare.png` |
| 3 | advisory | review | 26.469 | 24.933 | 45.217 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-003-compare.png` |
| 4 | advisory | review | 24.350 | 22.443 | 35.859 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-004-compare.png` |
| 5 | advisory | review | 24.645 | 21.710 | 42.522 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-005-compare.png` |
| 6 | pass | close | 15.393 | 15.183 | 36.609 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-006-compare.png` |
| 7 | pass | close | 16.151 | 15.317 | 33.682 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-007-compare.png` |
| 8 | pass | close | 17.496 | 16.303 | 33.893 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-008-compare.png` |
| 9 | pass | close | 17.766 | 17.376 | 38.184 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-009-compare.png` |
| 10 | pass | close | 16.329 | 15.955 | 40.563 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-010-compare.png` |
| 11 | advisory | review | 18.989 | 18.802 | 43.663 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-011-compare.png` |
| 12 | pass | close | 17.705 | 16.362 | 39.933 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-012-compare.png` |
| 13 | pass | close | 17.183 | 16.159 | 45.228 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-013-compare.png` |
| 14 | pass | close | 17.588 | 16.096 | 44.348 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-014-compare.png` |
| 15 | advisory | review | 19.103 | 17.647 | 42.690 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-015-compare.png` |
| 16 | advisory | review | 29.727 | 28.459 | 43.286 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-016-compare.png` |
| 17 | advisory | review | 27.072 | 23.988 | 34.555 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-017-compare.png` |
| 18 | pass | close | 15.626 | 14.825 | 23.870 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-640/incheon-2a/compare/page-018-compare.png` |

