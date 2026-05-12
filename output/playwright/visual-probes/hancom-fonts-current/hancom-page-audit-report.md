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
- advisory pages: p1 review raw=22.837 blur=22.058 layout=32.109

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 22.837 | 22.058 | 32.109 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje/compare/page-001-compare.png` |
| 2 | pass | close | 14.667 | 14.267 | 20.568 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje/compare/page-002-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'close': 4, 'review': 7}
- severity: {'pass': 4, 'advisory': 7}
- advisory pages: p2 review raw=20.626 blur=19.433 layout=28.976, p6 review raw=24.911 blur=23.651 layout=40.610, p7 review raw=19.976 blur=19.331 layout=31.591, p8 review raw=23.698 blur=22.883 layout=37.174, p9 review raw=23.382 blur=22.484 layout=36.604, p10 review raw=22.080 blur=20.937 layout=20.544, p11 review raw=27.035 blur=25.434 layout=42.274

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | pass | close | 17.964 | 16.874 | 23.771 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje-full-2024/compare/page-001-compare.png` |
| 2 | advisory | review | 20.626 | 19.433 | 28.976 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje-full-2024/compare/page-002-compare.png` |
| 3 | pass | close | 8.299 | 7.783 | 13.198 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje-full-2024/compare/page-003-compare.png` |
| 4 | pass | close | 16.606 | 16.269 | 26.414 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje-full-2024/compare/page-004-compare.png` |
| 5 | pass | close | 16.762 | 16.066 | 29.012 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje-full-2024/compare/page-005-compare.png` |
| 6 | advisory | review | 24.911 | 23.651 | 40.610 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje-full-2024/compare/page-006-compare.png` |
| 7 | advisory | review | 19.976 | 19.331 | 31.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje-full-2024/compare/page-007-compare.png` |
| 8 | advisory | review | 23.698 | 22.883 | 37.174 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje-full-2024/compare/page-008-compare.png` |
| 9 | advisory | review | 23.382 | 22.484 | 36.604 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje-full-2024/compare/page-009-compare.png` |
| 10 | advisory | review | 22.080 | 20.937 | 20.544 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje-full-2024/compare/page-010-compare.png` |
| 11 | advisory | review | 27.035 | 25.434 | 42.274 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/goyeopje-full-2024/compare/page-011-compare.png` |

## gyeolseokgye.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/gyeolseokgye.hwp`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.497 blur=18.017 layout=23.778

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.497 | 18.017 | 23.778 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/gyeolseokgye/compare/page-001-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 3}
- severity: {'advisory': 4}
- advisory pages: p1 layout-review raw=32.870 blur=28.268 layout=29.842, p2 review raw=25.125 blur=22.266 layout=26.130, p3 review raw=22.988 blur=21.034 layout=23.350, p4 review raw=25.643 blur=22.039 layout=24.784

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 32.870 | 28.268 | 29.842 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 25.125 | 22.266 | 26.130 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | advisory | review | 22.988 | 21.034 | 23.350 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 25.643 | 22.039 | 24.784 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/attachment-sale-notice/compare/page-004-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 9, 'close': 9}
- severity: {'advisory': 9, 'pass': 9}
- advisory pages: p1 review raw=24.159 blur=23.799 layout=51.640, p2 review raw=21.629 blur=20.756 layout=44.575, p3 review raw=26.484 blur=25.304 layout=45.380, p4 review raw=24.574 blur=23.051 layout=35.514, p5 review raw=25.100 blur=22.679 layout=43.275, p11 review raw=18.959 blur=18.792 layout=43.670, p15 review raw=19.149 blur=18.096 layout=42.690, p16 review raw=30.261 blur=29.004 layout=43.586, +1 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 24.159 | 23.799 | 51.640 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-001-compare.png` |
| 2 | advisory | review | 21.629 | 20.756 | 44.575 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-002-compare.png` |
| 3 | advisory | review | 26.484 | 25.304 | 45.380 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-003-compare.png` |
| 4 | advisory | review | 24.574 | 23.051 | 35.514 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-004-compare.png` |
| 5 | advisory | review | 25.100 | 22.679 | 43.275 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-005-compare.png` |
| 6 | pass | close | 15.409 | 15.250 | 36.609 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-006-compare.png` |
| 7 | pass | close | 16.344 | 15.693 | 33.682 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-007-compare.png` |
| 8 | pass | close | 17.700 | 16.713 | 33.891 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-008-compare.png` |
| 9 | pass | close | 17.806 | 17.507 | 38.175 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-009-compare.png` |
| 10 | pass | close | 16.357 | 16.091 | 40.563 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-010-compare.png` |
| 11 | advisory | review | 18.959 | 18.792 | 43.670 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-011-compare.png` |
| 12 | pass | close | 17.924 | 16.857 | 39.925 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-012-compare.png` |
| 13 | pass | close | 17.338 | 16.651 | 45.228 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-013-compare.png` |
| 14 | pass | close | 17.669 | 16.610 | 44.348 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-014-compare.png` |
| 15 | advisory | review | 19.149 | 18.096 | 42.690 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-015-compare.png` |
| 16 | advisory | review | 30.261 | 29.004 | 43.586 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-016-compare.png` |
| 17 | advisory | review | 27.018 | 24.594 | 33.730 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-017-compare.png` |
| 18 | pass | close | 15.621 | 14.970 | 23.883 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hancom-fonts-current/incheon-2a/compare/page-018-compare.png` |

