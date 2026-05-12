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
- advisory pages: p1 review raw=22.715 blur=21.307 layout=32.109

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 22.715 | 21.307 | 32.109 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/goyeopje/compare/page-001-compare.png` |
| 2 | pass | close | 14.607 | 13.914 | 20.568 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/goyeopje/compare/page-002-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'close': 4, 'review': 7}
- severity: {'pass': 4, 'advisory': 7}
- advisory pages: p2 review raw=20.540 blur=18.493 layout=28.976, p6 review raw=24.683 blur=22.926 layout=40.610, p7 review raw=19.806 blur=18.731 layout=31.591, p8 review raw=23.496 blur=22.236 layout=37.174, p9 review raw=23.230 blur=21.772 layout=36.591, p10 review raw=21.879 blur=20.163 layout=20.542, p11 review raw=26.790 blur=24.780 layout=42.257

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | pass | close | 17.748 | 15.737 | 23.771 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/goyeopje-full-2024/compare/page-001-compare.png` |
| 2 | advisory | review | 20.540 | 18.493 | 28.976 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/goyeopje-full-2024/compare/page-002-compare.png` |
| 3 | pass | close | 8.243 | 7.319 | 13.198 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/goyeopje-full-2024/compare/page-003-compare.png` |
| 4 | pass | close | 16.566 | 15.955 | 26.414 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/goyeopje-full-2024/compare/page-004-compare.png` |
| 5 | pass | close | 16.575 | 15.515 | 29.012 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/goyeopje-full-2024/compare/page-005-compare.png` |
| 6 | advisory | review | 24.683 | 22.926 | 40.610 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/goyeopje-full-2024/compare/page-006-compare.png` |
| 7 | advisory | review | 19.806 | 18.731 | 31.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/goyeopje-full-2024/compare/page-007-compare.png` |
| 8 | advisory | review | 23.496 | 22.236 | 37.174 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/goyeopje-full-2024/compare/page-008-compare.png` |
| 9 | advisory | review | 23.230 | 21.772 | 36.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/goyeopje-full-2024/compare/page-009-compare.png` |
| 10 | advisory | review | 21.879 | 20.163 | 20.542 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/goyeopje-full-2024/compare/page-010-compare.png` |
| 11 | advisory | review | 26.790 | 24.780 | 42.257 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/goyeopje-full-2024/compare/page-011-compare.png` |

## gyeolseokgye.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/gyeolseokgye.hwp`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.521 blur=17.853 layout=23.960

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.521 | 17.853 | 23.960 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/gyeolseokgye/compare/page-001-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'review': 4}
- severity: {'advisory': 4}
- advisory pages: p1 review raw=31.367 blur=24.728 layout=29.843, p2 review raw=24.176 blur=20.061 layout=26.130, p3 review raw=22.422 blur=19.492 layout=23.349, p4 review raw=24.633 blur=19.804 layout=24.784

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 31.367 | 24.728 | 29.843 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 24.176 | 20.061 | 26.130 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | advisory | review | 22.422 | 19.492 | 23.349 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 24.633 | 19.804 | 24.784 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/attachment-sale-notice/compare/page-004-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 9, 'close': 9}
- severity: {'advisory': 9, 'pass': 9}
- advisory pages: p1 review raw=24.049 blur=23.513 layout=51.640, p2 review raw=21.401 blur=20.020 layout=44.581, p3 review raw=26.473 blur=24.488 layout=45.217, p4 review raw=24.118 blur=21.786 layout=35.859, p5 review raw=24.469 blur=20.746 layout=42.522, p11 review raw=18.936 blur=18.709 layout=43.663, p15 review raw=18.841 blur=17.209 layout=42.690, p16 review raw=29.543 blur=28.187 layout=43.286, +1 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 24.049 | 23.513 | 51.640 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-001-compare.png` |
| 2 | advisory | review | 21.401 | 20.020 | 44.581 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-002-compare.png` |
| 3 | advisory | review | 26.473 | 24.488 | 45.217 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-003-compare.png` |
| 4 | advisory | review | 24.118 | 21.786 | 35.859 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-004-compare.png` |
| 5 | advisory | review | 24.469 | 20.746 | 42.522 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-005-compare.png` |
| 6 | pass | close | 15.392 | 15.114 | 36.609 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-006-compare.png` |
| 7 | pass | close | 16.081 | 14.944 | 33.682 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-007-compare.png` |
| 8 | pass | close | 17.344 | 15.940 | 33.893 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-008-compare.png` |
| 9 | pass | close | 17.752 | 17.291 | 38.184 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-009-compare.png` |
| 10 | pass | close | 16.337 | 15.803 | 40.563 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-010-compare.png` |
| 11 | advisory | review | 18.936 | 18.709 | 43.663 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-011-compare.png` |
| 12 | pass | close | 17.537 | 15.846 | 39.933 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-012-compare.png` |
| 13 | pass | close | 17.071 | 15.748 | 45.228 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-013-compare.png` |
| 14 | pass | close | 17.513 | 15.597 | 44.348 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-014-compare.png` |
| 15 | advisory | review | 18.841 | 17.209 | 42.690 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-015-compare.png` |
| 16 | advisory | review | 29.543 | 28.187 | 43.286 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-016-compare.png` |
| 17 | advisory | review | 26.755 | 22.944 | 34.555 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-017-compare.png` |
| 18 | pass | close | 15.531 | 14.546 | 23.870 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/target-width-480/incheon-2a/compare/page-018-compare.png` |

