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
- advisory pages: p1 review raw=19.100 blur=19.113 layout=32.478

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 19.100 | 19.113 | 32.478 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/goyeopje-profile-probe/b200/goyeopje/compare/page-001-compare.png` |
| 2 | pass | close | 13.160 | 11.995 | 20.568 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/goyeopje-profile-probe/b200/goyeopje/compare/page-002-compare.png` |

