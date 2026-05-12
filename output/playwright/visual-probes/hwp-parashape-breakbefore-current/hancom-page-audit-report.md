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
- advisory pages: p1 review raw=20.715 blur=18.220 layout=32.109

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 20.715 | 18.220 | 32.109 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje/compare/page-001-compare.png` |
| 2 | pass | close | 13.160 | 11.995 | 20.568 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje/compare/page-002-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'close': 5, 'review': 6}
- severity: {'pass': 5, 'advisory': 6}
- advisory pages: p2 review raw=20.151 blur=16.465 layout=28.976, p6 review raw=23.483 blur=20.770 layout=40.610, p8 review raw=22.519 blur=20.140 layout=37.174, p9 review raw=22.060 blur=19.496 layout=36.591, p10 review raw=21.282 blur=19.076 layout=20.542, p11 review raw=25.742 blur=22.652 layout=42.257

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | pass | close | 16.625 | 13.360 | 23.771 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje-full-2024/compare/page-001-compare.png` |
| 2 | advisory | review | 20.151 | 16.465 | 28.976 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje-full-2024/compare/page-002-compare.png` |
| 3 | pass | close | 7.890 | 6.193 | 13.198 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje-full-2024/compare/page-003-compare.png` |
| 4 | pass | close | 15.661 | 14.572 | 26.414 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje-full-2024/compare/page-004-compare.png` |
| 5 | pass | close | 15.877 | 13.985 | 29.012 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje-full-2024/compare/page-005-compare.png` |
| 6 | advisory | review | 23.483 | 20.770 | 40.610 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje-full-2024/compare/page-006-compare.png` |
| 7 | pass | close | 17.829 | 17.510 | 31.711 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje-full-2024/compare/page-007-compare.png` |
| 8 | advisory | review | 22.519 | 20.140 | 37.174 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje-full-2024/compare/page-008-compare.png` |
| 9 | advisory | review | 22.060 | 19.496 | 36.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje-full-2024/compare/page-009-compare.png` |
| 10 | advisory | review | 21.282 | 19.076 | 20.542 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje-full-2024/compare/page-010-compare.png` |
| 11 | advisory | review | 25.742 | 22.652 | 42.257 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/goyeopje-full-2024/compare/page-011-compare.png` |

## gyeolseokgye.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/gyeolseokgye.hwp`
- pages: 1
- verdicts: {'close': 1}
- severity: {'pass': 1}

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | pass | close | 16.907 | 15.870 | 23.960 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/gyeolseokgye/compare/page-001-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'review': 4}
- severity: {'advisory': 4}
- advisory pages: p1 review raw=30.392 blur=20.810 layout=28.033, p2 review raw=30.611 blur=21.123 layout=42.667, p3 review raw=21.922 blur=18.043 layout=23.107, p4 review raw=24.218 blur=18.605 layout=25.148

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 30.392 | 20.810 | 28.033 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 30.611 | 21.123 | 42.667 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | advisory | review | 21.922 | 18.043 | 23.107 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 24.218 | 18.605 | 25.148 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/attachment-sale-notice/compare/page-004-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 7, 'close': 11}
- severity: {'advisory': 7, 'pass': 11}
- advisory pages: p1 review raw=22.615 blur=22.059 layout=51.719, p2 review raw=19.860 blur=18.320 layout=44.713, p3 review raw=24.551 blur=22.405 layout=45.541, p4 review raw=22.713 blur=19.371 layout=35.730, p5 review raw=23.433 blur=18.609 layout=42.801, p16 review raw=26.554 blur=24.051 layout=43.098, p17 review raw=24.632 blur=19.815 layout=33.818

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 22.615 | 22.059 | 51.719 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-001-compare.png` |
| 2 | advisory | review | 19.860 | 18.320 | 44.713 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-002-compare.png` |
| 3 | advisory | review | 24.551 | 22.405 | 45.541 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-003-compare.png` |
| 4 | advisory | review | 22.713 | 19.371 | 35.730 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-004-compare.png` |
| 5 | advisory | review | 23.433 | 18.609 | 42.801 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-005-compare.png` |
| 6 | pass | close | 14.278 | 13.999 | 36.501 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-006-compare.png` |
| 7 | pass | close | 14.911 | 13.576 | 33.579 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-007-compare.png` |
| 8 | pass | close | 16.166 | 14.480 | 34.208 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-008-compare.png` |
| 9 | pass | close | 16.333 | 15.725 | 38.177 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-009-compare.png` |
| 10 | pass | close | 14.991 | 14.416 | 40.391 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-010-compare.png` |
| 11 | pass | close | 17.483 | 17.197 | 43.700 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-011-compare.png` |
| 12 | pass | close | 16.753 | 13.880 | 38.441 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-012-compare.png` |
| 13 | pass | close | 16.205 | 15.234 | 45.251 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-013-compare.png` |
| 14 | pass | close | 16.675 | 14.785 | 44.387 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-014-compare.png` |
| 15 | pass | close | 16.437 | 15.832 | 43.241 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-015-compare.png` |
| 16 | advisory | review | 26.554 | 24.051 | 43.098 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-016-compare.png` |
| 17 | advisory | review | 24.632 | 19.815 | 33.818 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-017-compare.png` |
| 18 | pass | close | 14.060 | 12.889 | 24.029 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-parashape-breakbefore-current/incheon-2a/compare/page-018-compare.png` |

