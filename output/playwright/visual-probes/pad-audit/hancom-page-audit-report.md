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
- pages: 1
- verdicts: {'review': 11}
- severity: {'advisory': 11}
- advisory pages: p1 review raw=27.911 blur=25.836 layout=41.678, p2 review raw=27.831 blur=25.369 layout=40.089, p3 review raw=27.576 blur=24.903 layout=38.783, p4 review raw=27.364 blur=25.175 layout=39.470, p5 review raw=27.576 blur=24.903 layout=38.783, p6 review raw=27.364 blur=25.175 layout=39.470, p7 review raw=27.787 blur=25.563 layout=40.638, p8 review raw=27.564 blur=25.080 layout=39.304, +3 more

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 27.911 | 25.836 | 41.678 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/pad-audit/probe/compare/page-001-compare.png` |
| 2 | advisory | review | 27.831 | 25.369 | 40.089 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/pad-audit/probe/compare/page-002-compare.png` |
| 3 | advisory | review | 27.576 | 24.903 | 38.783 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/pad-audit/probe/compare/page-003-compare.png` |
| 4 | advisory | review | 27.364 | 25.175 | 39.470 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/pad-audit/probe/compare/page-004-compare.png` |
| 5 | advisory | review | 27.576 | 24.903 | 38.783 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/pad-audit/probe/compare/page-005-compare.png` |
| 6 | advisory | review | 27.364 | 25.175 | 39.470 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/pad-audit/probe/compare/page-006-compare.png` |
| 7 | advisory | review | 27.787 | 25.563 | 40.638 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/pad-audit/probe/compare/page-007-compare.png` |
| 8 | advisory | review | 27.564 | 25.080 | 39.304 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/pad-audit/probe/compare/page-008-compare.png` |
| 9 | advisory | review | 29.323 | 26.276 | 36.721 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/pad-audit/probe/compare/page-009-compare.png` |
| 10 | advisory | review | 28.026 | 25.393 | 38.613 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/pad-audit/probe/compare/page-010-compare.png` |
| 11 | advisory | review | 27.832 | 25.757 | 41.134 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/pad-audit/probe/compare/page-011-compare.png` |

