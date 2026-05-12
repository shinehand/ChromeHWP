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
- advisory pages: p1 review raw=22.621 blur=20.873 layout=32.109

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 22.621 | 20.873 | 32.109 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/goyeopje/compare/page-001-compare.png` |
| 2 | pass | close | 14.573 | 13.747 | 20.568 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/goyeopje/compare/page-002-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'close': 4, 'review': 7}
- severity: {'pass': 4, 'advisory': 7}
- advisory pages: p2 review raw=20.166 blur=17.718 layout=28.976, p6 review raw=24.648 blur=22.685 layout=40.610, p7 review raw=19.827 blur=18.479 layout=31.591, p8 review raw=23.500 blur=21.980 layout=37.174, p9 review raw=23.269 blur=21.401 layout=36.591, p10 review raw=22.001 blur=19.831 layout=20.542, p11 review raw=26.707 blur=24.376 layout=42.257

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | pass | close | 17.620 | 14.909 | 23.771 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/goyeopje-full-2024/compare/page-001-compare.png` |
| 2 | advisory | review | 20.166 | 17.718 | 28.976 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/goyeopje-full-2024/compare/page-002-compare.png` |
| 3 | pass | close | 8.143 | 6.949 | 13.198 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/goyeopje-full-2024/compare/page-003-compare.png` |
| 4 | pass | close | 16.567 | 15.784 | 26.414 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/goyeopje-full-2024/compare/page-004-compare.png` |
| 5 | pass | close | 16.565 | 15.302 | 29.012 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/goyeopje-full-2024/compare/page-005-compare.png` |
| 6 | advisory | review | 24.648 | 22.685 | 40.610 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/goyeopje-full-2024/compare/page-006-compare.png` |
| 7 | advisory | review | 19.827 | 18.479 | 31.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/goyeopje-full-2024/compare/page-007-compare.png` |
| 8 | advisory | review | 23.500 | 21.980 | 37.174 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/goyeopje-full-2024/compare/page-008-compare.png` |
| 9 | advisory | review | 23.269 | 21.401 | 36.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/goyeopje-full-2024/compare/page-009-compare.png` |
| 10 | advisory | review | 22.001 | 19.831 | 20.542 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/goyeopje-full-2024/compare/page-010-compare.png` |
| 11 | advisory | review | 26.707 | 24.376 | 42.257 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/goyeopje-full-2024/compare/page-011-compare.png` |

## gyeolseokgye.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/gyeolseokgye.hwp`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.291 blur=17.712 layout=23.960

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.291 | 17.712 | 23.960 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/gyeolseokgye/compare/page-001-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'review': 4}
- severity: {'advisory': 4}
- advisory pages: p1 review raw=30.675 blur=22.834 layout=29.843, p2 review raw=23.330 blur=18.625 layout=26.130, p3 review raw=21.920 blur=18.418 layout=23.349, p4 review raw=23.955 blur=18.643 layout=24.784

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 30.675 | 22.834 | 29.843 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 23.330 | 18.625 | 26.130 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | advisory | review | 21.920 | 18.418 | 23.349 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 23.955 | 18.643 | 24.784 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/attachment-sale-notice/compare/page-004-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 9, 'close': 9}
- severity: {'advisory': 9, 'pass': 9}
- advisory pages: p1 review raw=24.037 blur=23.420 layout=51.640, p2 review raw=21.369 blur=19.751 layout=44.581, p3 review raw=26.079 blur=24.030 layout=45.217, p4 review raw=23.829 blur=21.024 layout=35.859, p5 review raw=23.877 blur=19.604 layout=42.522, p11 review raw=18.967 blur=18.707 layout=43.663, p15 review raw=18.755 blur=16.824 layout=42.690, p16 review raw=29.313 blur=27.752 layout=43.286, +1 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 24.037 | 23.420 | 51.640 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-001-compare.png` |
| 2 | advisory | review | 21.369 | 19.751 | 44.581 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-002-compare.png` |
| 3 | advisory | review | 26.079 | 24.030 | 45.217 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-003-compare.png` |
| 4 | advisory | review | 23.829 | 21.024 | 35.859 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-004-compare.png` |
| 5 | advisory | review | 23.877 | 19.604 | 42.522 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-005-compare.png` |
| 6 | pass | close | 15.299 | 14.955 | 36.609 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-006-compare.png` |
| 7 | pass | close | 15.864 | 14.381 | 33.682 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-007-compare.png` |
| 8 | pass | close | 17.108 | 15.379 | 33.893 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-008-compare.png` |
| 9 | pass | close | 17.571 | 17.079 | 38.184 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-009-compare.png` |
| 10 | pass | close | 16.216 | 15.575 | 40.563 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-010-compare.png` |
| 11 | advisory | review | 18.967 | 18.707 | 43.663 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-011-compare.png` |
| 12 | pass | close | 17.312 | 15.414 | 39.933 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-012-compare.png` |
| 13 | pass | close | 17.047 | 15.463 | 45.228 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-013-compare.png` |
| 14 | pass | close | 17.312 | 15.203 | 44.348 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-014-compare.png` |
| 15 | advisory | review | 18.755 | 16.824 | 42.690 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-015-compare.png` |
| 16 | advisory | review | 29.313 | 27.752 | 43.286 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-016-compare.png` |
| 17 | advisory | review | 26.164 | 21.828 | 34.555 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-017-compare.png` |
| 18 | pass | close | 15.462 | 14.339 | 23.870 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-360/incheon-2a/compare/page-018-compare.png` |

