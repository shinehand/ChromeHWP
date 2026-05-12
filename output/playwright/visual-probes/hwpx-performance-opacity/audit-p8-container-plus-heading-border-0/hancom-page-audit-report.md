# Hancom Page Audit

한컴 Viewer를 기준으로 테스트 문서의 모든 페이지를 페이지 단위로 캡처한 비교 결과입니다.
`review`와 `layout-review`는 자동화가 계속 진행될 수 있는 advisory일 뿐, clean visual pass가 아닙니다.

## Verdict Policy

- pass: close
- advisory: layout-review, review (raw/blur/layout 지표를 보고 사람이 확인해야 함)
- strict failure: capture-error, capture-review, mismatch
- thresholds: close raw<=18.0, review raw<=32.0, layout-review blur<=32.0 and layout<=30.0

## p8-container-plus-heading-border-0.hwpx

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 1
- verdicts: {'close': 1}
- severity: {'pass': 1}

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | pass | close | 17.750 | 16.973 | 36.108 | pass: raw pixel diff is inside the close band. | `output/playwright/visual-probes/hwpx-performance-opacity/audit-p8-container-plus-heading-border-0/p8-container-plus-heading-border-0/compare/page-001-compare.png` |

