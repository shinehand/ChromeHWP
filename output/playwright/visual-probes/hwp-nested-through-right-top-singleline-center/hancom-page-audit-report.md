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
- advisory pages: p1 review raw=22.838 blur=22.051 layout=32.109

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 22.838 | 22.051 | 32.109 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje/compare/page-001-compare.png` |
| 2 | pass | close | 14.674 | 14.275 | 20.568 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje/compare/page-002-compare.png` |

## goyeopje-full-2024.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/goyeopje-full-2024.hwp`
- pages: 11
- verdicts: {'close': 4, 'review': 7}
- severity: {'pass': 4, 'advisory': 7}
- advisory pages: p2 review raw=20.626 blur=19.433 layout=28.976, p6 review raw=27.072 blur=26.837 layout=43.133, p7 review raw=19.977 blur=19.332 layout=31.591, p8 review raw=23.695 blur=22.881 layout=37.174, p9 review raw=23.387 blur=22.487 layout=36.591, p10 review raw=22.079 blur=20.955 layout=20.542, p11 review raw=27.001 blur=25.706 layout=42.257

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | pass | close | 17.956 | 16.865 | 23.771 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje-full-2024/compare/page-001-compare.png` |
| 2 | advisory | review | 20.626 | 19.433 | 28.976 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje-full-2024/compare/page-002-compare.png` |
| 3 | pass | close | 8.285 | 7.781 | 13.198 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje-full-2024/compare/page-003-compare.png` |
| 4 | pass | close | 16.606 | 16.269 | 26.414 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje-full-2024/compare/page-004-compare.png` |
| 5 | pass | close | 16.841 | 16.170 | 29.007 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje-full-2024/compare/page-005-compare.png` |
| 6 | advisory | review | 27.072 | 26.837 | 43.133 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje-full-2024/compare/page-006-compare.png` |
| 7 | advisory | review | 19.977 | 19.332 | 31.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje-full-2024/compare/page-007-compare.png` |
| 8 | advisory | review | 23.695 | 22.881 | 37.174 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje-full-2024/compare/page-008-compare.png` |
| 9 | advisory | review | 23.387 | 22.487 | 36.591 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje-full-2024/compare/page-009-compare.png` |
| 10 | advisory | review | 22.079 | 20.955 | 20.542 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje-full-2024/compare/page-010-compare.png` |
| 11 | advisory | review | 27.001 | 25.706 | 42.257 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/goyeopje-full-2024/compare/page-011-compare.png` |

## gyeolseokgye.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/gyeolseokgye.hwp`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.565 blur=18.106 layout=23.980

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.565 | 18.106 | 23.980 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/gyeolseokgye/compare/page-001-compare.png` |

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'layout-review': 1, 'review': 3}
- severity: {'advisory': 4}
- advisory pages: p1 layout-review raw=32.936 blur=28.347 layout=29.761, p2 review raw=25.125 blur=22.266 layout=26.130, p3 review raw=23.031 blur=21.106 layout=23.347, p4 review raw=25.643 blur=22.054 layout=24.814

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 32.936 | 28.347 | 29.761 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/attachment-sale-notice/compare/page-001-compare.png` |
| 2 | advisory | review | 25.125 | 22.266 | 26.130 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/attachment-sale-notice/compare/page-002-compare.png` |
| 3 | advisory | review | 23.031 | 21.106 | 23.347 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/attachment-sale-notice/compare/page-003-compare.png` |
| 4 | advisory | review | 25.643 | 22.054 | 24.814 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/attachment-sale-notice/compare/page-004-compare.png` |

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 9, 'close': 9}
- severity: {'advisory': 9, 'pass': 9}
- advisory pages: p1 review raw=24.147 blur=23.793 layout=51.642, p2 review raw=21.668 blur=20.804 layout=44.585, p3 review raw=26.615 blur=25.469 layout=45.224, p4 review raw=24.616 blur=23.138 layout=35.860, p5 review raw=25.024 blur=22.731 layout=42.520, p11 review raw=18.985 blur=18.840 layout=43.663, p15 review raw=19.336 blur=18.347 layout=42.688, p16 review raw=29.836 blur=28.776 layout=43.286, +1 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 24.147 | 23.793 | 51.642 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-001-compare.png` |
| 2 | advisory | review | 21.668 | 20.804 | 44.585 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-002-compare.png` |
| 3 | advisory | review | 26.615 | 25.469 | 45.224 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-003-compare.png` |
| 4 | advisory | review | 24.616 | 23.138 | 35.860 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-004-compare.png` |
| 5 | advisory | review | 25.024 | 22.731 | 42.520 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-005-compare.png` |
| 6 | pass | close | 15.409 | 15.250 | 36.609 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-006-compare.png` |
| 7 | pass | close | 16.317 | 15.723 | 33.657 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-007-compare.png` |
| 8 | pass | close | 17.645 | 16.702 | 33.895 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-008-compare.png` |
| 9 | pass | close | 17.801 | 17.516 | 38.184 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-009-compare.png` |
| 10 | pass | close | 16.373 | 16.120 | 40.564 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-010-compare.png` |
| 11 | advisory | review | 18.985 | 18.840 | 43.663 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-011-compare.png` |
| 12 | pass | close | 17.886 | 16.849 | 39.950 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-012-compare.png` |
| 13 | pass | close | 17.278 | 16.532 | 45.228 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-013-compare.png` |
| 14 | pass | close | 17.824 | 16.828 | 44.346 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-014-compare.png` |
| 15 | advisory | review | 19.336 | 18.347 | 42.688 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-015-compare.png` |
| 16 | advisory | review | 29.836 | 28.776 | 43.286 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-016-compare.png` |
| 17 | advisory | review | 27.415 | 25.029 | 34.542 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-017-compare.png` |
| 18 | pass | close | 15.675 | 15.046 | 23.876 | pass: raw pixel diff is inside the close band. | `/Users/shinehandmac/Github/ChromeHWP/output/playwright/visual-probes/hwp-nested-through-right-top-singleline-center/incheon-2a/compare/page-018-compare.png` |

