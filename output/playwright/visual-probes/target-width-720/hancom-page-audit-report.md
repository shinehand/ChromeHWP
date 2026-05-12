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
- advisory pages: p1 review raw=22.781 blur=21.759 layout=32.109

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 22.781 | 21.759 | 32.109 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/goyeopje/compare/page-001-compare.png` |
| 2 | pass | close | 14.661 | 14.186 | 20.568 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/goyeopje/compare/page-002-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'close': 4, 'review': 7}
- severity: {'pass': 4, 'advisory': 7}
- advisory pages: p2 review raw=20.515 blur=19.003 layout=28.976, p6 review raw=24.868 blur=23.452 layout=40.610, p7 review raw=19.956 blur=19.130 layout=31.591, p8 review raw=23.678 blur=22.678 layout=37.174, p9 review raw=23.404 blur=22.258 layout=36.591, p10 review raw=22.106 blur=20.699 layout=20.542, p11 review raw=27.012 blur=25.372 layout=42.257

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | pass | close | 17.868 | 16.336 | 23.771 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/goyeopje-full-2024/compare/page-001-compare.png` |
| 2 | advisory | review | 20.515 | 19.003 | 28.976 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/goyeopje-full-2024/compare/page-002-compare.png` |
| 3 | pass | close | 8.315 | 7.581 | 13.198 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/goyeopje-full-2024/compare/page-003-compare.png` |
| 4 | pass | close | 16.608 | 16.184 | 26.414 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/goyeopje-full-2024/compare/page-004-compare.png` |
| 5 | pass | close | 16.740 | 15.895 | 29.012 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/goyeopje-full-2024/compare/page-005-compare.png` |
| 6 | advisory | review | 24.868 | 23.452 | 40.610 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/goyeopje-full-2024/compare/page-006-compare.png` |
| 7 | advisory | review | 19.956 | 19.130 | 31.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/goyeopje-full-2024/compare/page-007-compare.png` |
| 8 | advisory | review | 23.678 | 22.678 | 37.174 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/goyeopje-full-2024/compare/page-008-compare.png` |
| 9 | advisory | review | 23.404 | 22.258 | 36.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/goyeopje-full-2024/compare/page-009-compare.png` |
| 10 | advisory | review | 22.106 | 20.699 | 20.542 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/goyeopje-full-2024/compare/page-010-compare.png` |
| 11 | advisory | review | 27.012 | 25.372 | 42.257 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/goyeopje-full-2024/compare/page-011-compare.png` |

## gyeolseokgye.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/gyeolseokgye.hwp`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.563 blur=17.958 layout=23.960

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.563 | 17.958 | 23.960 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/gyeolseokgye/compare/page-001-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 3}
- severity: {'advisory': 4}
- advisory pages: p1 layout-review raw=32.395 blur=27.107 layout=29.843, p2 review raw=24.759 blur=21.580 layout=26.130, p3 review raw=22.790 blur=20.544 layout=23.349, p4 review raw=25.265 blur=21.247 layout=24.784

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 32.395 | 27.107 | 29.843 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 24.759 | 21.580 | 26.130 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | advisory | review | 22.790 | 20.544 | 23.349 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 25.265 | 21.247 | 24.784 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/attachment-sale-notice/compare/page-004-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 9, 'close': 9}
- severity: {'advisory': 9, 'pass': 9}
- advisory pages: p1 review raw=24.130 blur=23.708 layout=51.640, p2 review raw=21.609 blur=20.555 layout=44.581, p3 review raw=26.444 blur=25.111 layout=45.217, p4 review raw=24.365 blur=22.686 layout=35.859, p5 review raw=24.778 blur=22.070 layout=42.522, p11 review raw=18.978 blur=18.813 layout=43.663, p15 review raw=19.131 blur=17.795 layout=42.690, p16 review raw=29.857 blur=28.625 layout=43.286, +1 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 24.130 | 23.708 | 51.640 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-001-compare.png` |
| 2 | advisory | review | 21.609 | 20.555 | 44.581 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-002-compare.png` |
| 3 | advisory | review | 26.444 | 25.111 | 45.217 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-003-compare.png` |
| 4 | advisory | review | 24.365 | 22.686 | 35.859 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-004-compare.png` |
| 5 | advisory | review | 24.778 | 22.070 | 42.522 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-005-compare.png` |
| 6 | pass | close | 15.412 | 15.226 | 36.609 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-006-compare.png` |
| 7 | pass | close | 16.183 | 15.433 | 33.682 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-007-compare.png` |
| 8 | pass | close | 17.487 | 16.424 | 33.893 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-008-compare.png` |
| 9 | pass | close | 17.786 | 17.453 | 38.184 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-009-compare.png` |
| 10 | pass | close | 16.357 | 16.041 | 40.563 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-010-compare.png` |
| 11 | advisory | review | 18.978 | 18.813 | 43.663 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-011-compare.png` |
| 12 | pass | close | 17.797 | 16.568 | 39.933 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-012-compare.png` |
| 13 | pass | close | 17.234 | 16.289 | 45.228 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-013-compare.png` |
| 14 | pass | close | 17.626 | 16.296 | 44.348 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-014-compare.png` |
| 15 | advisory | review | 19.131 | 17.795 | 42.690 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-015-compare.png` |
| 16 | advisory | review | 29.857 | 28.625 | 43.286 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-016-compare.png` |
| 17 | advisory | review | 27.212 | 24.353 | 34.555 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-017-compare.png` |
| 18 | pass | close | 15.699 | 14.920 | 23.870 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-720/incheon-2a/compare/page-018-compare.png` |

