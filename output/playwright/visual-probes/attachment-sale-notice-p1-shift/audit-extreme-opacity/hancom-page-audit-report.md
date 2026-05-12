# Hancom Page Audit

한컴 Viewer를 기준으로 테스트 문서의 모든 페이지를 페이지 단위로 캡처한 비교 결과입니다.
`review`와 `layout-review`는 자동화가 계속 진행될 수 있는 advisory일 뿐, clean visual pass가 아닙니다.

## Verdict Policy

- pass: close
- advisory: layout-review, review (raw/blur/layout 지표를 보고 사람이 확인해야 함)
- strict failure: capture-error, capture-review, mismatch
- thresholds: close raw<=18.0, review raw<=32.0, layout-review blur<=32.0 and layout<=30.0

## attachment-sale-notice.hwp

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/attachment-sale-notice.hwp`
- pages: 4
- verdicts: {'review': 3}
- severity: {'advisory': 3}
- advisory pages: p1 review raw=27.867 blur=25.744 layout=54.640, p1 review raw=27.347 blur=26.107 layout=56.940, p1 review raw=27.317 blur=26.860 layout=57.139

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 27.867 | 25.744 | 54.640 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-extreme-opacity/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | review | 27.347 | 26.107 | 56.940 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-extreme-opacity/attachment-sale-notice/compare/page-001-compare.png` |
| 1 | advisory | review | 27.317 | 26.860 | 57.139 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/attachment-sale-notice-p1-shift/audit-extreme-opacity/attachment-sale-notice/compare/page-001-compare.png` |

