# Hancom Page Audit

한컴 Viewer를 기준으로 테스트 문서의 모든 페이지를 페이지 단위로 캡처한 비교 결과입니다.
`review`와 `layout-review`는 자동화가 계속 진행될 수 있는 advisory일 뿐, clean visual pass가 아닙니다.

## Verdict Policy

- pass: close
- advisory: layout-review, review (raw/blur/layout 지표를 보고 사람이 확인해야 함)
- strict failure: capture-error, capture-review, mismatch
- thresholds: close raw<=18.0, review raw<=32.0, layout-review blur<=32.0 and layout<=30.0

## goyeopje.hwp

- source: `probe`
- pages: 2
- verdicts: {'review': 2}
- severity: {'advisory': 2}
- advisory pages: p1 review raw=29.279 blur=26.747 layout=18.145, p2 review raw=26.778 blur=25.406 layout=23.893

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 29.279 | 26.747 | 18.145 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/noborder-audit/goyeopje/compare/page-001-compare.png` |
| 2 | advisory | review | 26.778 | 25.406 | 23.893 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/noborder-audit/goyeopje/compare/page-002-compare.png` |

## attachment-sale-notice.hwp

- source: `probe`
- pages: 1
- verdicts: {'layout-review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 layout-review raw=35.639 blur=30.296 layout=28.387

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | layout-review | 35.639 | 30.296 | 28.387 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `output/playwright/visual-probes/noborder-audit/attachment-sale-notice/compare/page-001-compare.png` |

## incheon-2a.hwpx

- source: `probe`
- pages: 16
- verdicts: {'review': 3, 'layout-review': 1}
- severity: {'advisory': 4}
- advisory pages: p1 review raw=28.098 blur=25.854 layout=41.529, p3 review raw=30.216 blur=27.843 layout=33.424, p10 review raw=18.425 blur=17.354 layout=34.606, p16 layout-review raw=33.061 blur=27.534 layout=20.346

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 28.098 | 25.854 | 41.529 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/noborder-audit/incheon-2a/compare/page-001-compare.png` |
| 3 | advisory | review | 30.216 | 27.843 | 33.424 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/noborder-audit/incheon-2a/compare/page-003-compare.png` |
| 10 | advisory | review | 18.425 | 17.354 | 34.606 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/noborder-audit/incheon-2a/compare/page-010-compare.png` |
| 16 | advisory | layout-review | 33.061 | 27.534 | 20.346 | advisory: raw pixel diff is above the review band, but blur/layout metrics are within the relaxed layout-review band; this is not a clean pass. | `output/playwright/visual-probes/noborder-audit/incheon-2a/compare/page-016-compare.png` |

