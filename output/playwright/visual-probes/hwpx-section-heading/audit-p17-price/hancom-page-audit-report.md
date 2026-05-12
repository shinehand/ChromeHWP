# Hancom Page Audit

한컴 Viewer를 기준으로 테스트 문서의 모든 페이지를 페이지 단위로 캡처한 비교 결과입니다.
`review`와 `layout-review`는 자동화가 계속 진행될 수 있는 advisory일 뿐, clean visual pass가 아닙니다.

## Verdict Policy

- pass: close
- advisory: layout-review, review (raw/blur/layout 지표를 보고 사람이 확인해야 함)
- strict failure: capture-error, capture-review, mismatch
- thresholds: close raw<=18.0, review raw<=32.0, layout-review blur<=32.0 and layout<=30.0

## incheon-2a.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 18
- verdicts: {'review': 5}
- severity: {'advisory': 5}
- advisory pages: p17 review raw=26.435 blur=25.446 layout=41.586, p17 review raw=26.417 blur=25.267 layout=41.579, p17 review raw=26.503 blur=25.063 layout=41.417, p17 review raw=26.208 blur=24.900 layout=43.929, p17 review raw=25.946 blur=25.188 layout=44.428

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 17 | advisory | review | 26.435 | 25.446 | 41.586 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-p17-price/incheon-2a/compare/page-017-compare.png` |
| 17 | advisory | review | 26.417 | 25.267 | 41.579 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-p17-price/incheon-2a/compare/page-017-compare.png` |
| 17 | advisory | review | 26.503 | 25.063 | 41.417 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-p17-price/incheon-2a/compare/page-017-compare.png` |
| 17 | advisory | review | 26.208 | 24.900 | 43.929 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-p17-price/incheon-2a/compare/page-017-compare.png` |
| 17 | advisory | review | 25.946 | 25.188 | 44.428 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/hwpx-section-heading/audit-p17-price/incheon-2a/compare/page-017-compare.png` |

