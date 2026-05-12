# Hancom Page Audit

한컴 Viewer를 기준으로 테스트 문서의 모든 페이지를 페이지 단위로 캡처한 비교 결과입니다.
`review`와 `layout-review`는 자동화가 계속 진행될 수 있는 advisory일 뿐, clean visual pass가 아닙니다.

## Verdict Policy

- pass: close
- advisory: layout-review, review (raw/blur/layout 지표를 보고 사람이 확인해야 함)
- strict failure: capture-error, capture-review, mismatch
- thresholds: close raw<=18.0, review raw<=32.0, layout-review blur<=32.0 and layout<=30.0

## incheon-2a.hwpx

- source: `probe`
- pages: 16
- verdicts: {'review': 14, 'layout-review': 2}
- severity: {'advisory': 16}
- advisory pages: p1 review raw=27.911 blur=25.836 layout=41.678, p2 review raw=28.098 blur=25.854 layout=41.529, p3 review raw=27.576 blur=24.903 layout=38.783, p4 review raw=27.364 blur=25.175 layout=39.470, p5 review raw=18.574 blur=17.549 layout=34.883, p6 review raw=18.425 blur=17.354 layout=34.606, p7 review raw=18.678 blur=17.710 layout=35.397, p8 review raw=18.504 blur=17.469 layout=35.503, +8 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 27.911 | 25.836 | 41.678 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-001-compare.png` |
| 2 | advisory | review | 28.098 | 25.854 | 41.529 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-002-compare.png` |
| 3 | advisory | review | 27.576 | 24.903 | 38.783 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-003-compare.png` |
| 4 | advisory | review | 27.364 | 25.175 | 39.470 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-004-compare.png` |
| 5 | advisory | review | 18.574 | 17.549 | 34.883 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-005-compare.png` |
| 6 | advisory | review | 18.425 | 17.354 | 34.606 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-006-compare.png` |
| 7 | advisory | review | 18.678 | 17.710 | 35.397 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-007-compare.png` |
| 8 | advisory | review | 18.504 | 17.469 | 35.503 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-008-compare.png` |
| 9 | advisory | review | 31.688 | 26.943 | 19.267 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-009-compare.png` |
| 10 | advisory | layout-review | 33.061 | 27.534 | 20.346 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-010-compare.png` |
| 11 | advisory | review | 31.800 | 26.994 | 19.129 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-011-compare.png` |
| 12 | advisory | layout-review | 32.345 | 27.180 | 19.307 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-012-compare.png` |
| 13 | advisory | review | 30.502 | 28.000 | 33.683 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-013-compare.png` |
| 14 | advisory | review | 30.216 | 27.843 | 33.424 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-014-compare.png` |
| 15 | advisory | review | 31.570 | 28.692 | 33.664 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-015-compare.png` |
| 16 | advisory | review | 31.594 | 28.951 | 34.055 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/incheon-pad-pages-audit/probe/compare/page-016-compare.png` |

