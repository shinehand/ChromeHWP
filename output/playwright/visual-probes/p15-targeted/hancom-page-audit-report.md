# Hancom Page Audit

한컴 Viewer를 기준으로 테스트 문서의 모든 페이지를 페이지 단위로 캡처한 비교 결과입니다.
`review`와 `layout-review`는 자동화가 계속 진행될 수 있는 advisory일 뿐, clean visual pass가 아닙니다.

## Verdict Policy

- pass: close
- advisory: layout-review, review (raw/blur/layout 지표를 보고 사람이 확인해야 함)
- strict failure: capture-error, capture-review, mismatch
- thresholds: close raw<=18.0, review raw<=32.0, layout-review blur<=32.0 and layout<=30.0

## base.png

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=19.473 blur=18.244 layout=41.866

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 19.473 | 18.244 | 41.866 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/p15-targeted/base/compare/page-001-compare.png` |

## school-border-none.png

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.890 blur=18.025 layout=43.643

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.890 | 18.025 | 43.643 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/p15-targeted/school-border-none/compare/page-001-compare.png` |

## school-hide.png

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.393 blur=18.210 layout=43.663

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.393 | 18.210 | 43.663 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/p15-targeted/school-hide/compare/page-001-compare.png` |

## heading-border-none.png

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.890 blur=18.025 layout=43.643

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.890 | 18.025 | 43.643 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/p15-targeted/heading-border-none/compare/page-001-compare.png` |

## nested-border-none.png

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=19.111 blur=18.140 layout=42.814

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 19.111 | 18.140 | 42.814 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/p15-targeted/nested-border-none/compare/page-001-compare.png` |

## top-border-none.png

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.890 blur=18.025 layout=43.643

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.890 | 18.025 | 43.643 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/p15-targeted/top-border-none/compare/page-001-compare.png` |

## top-opacity-0p2.png

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.469 blur=18.041 layout=43.663

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.469 | 18.041 | 43.663 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/p15-targeted/top-opacity-0p2/compare/page-001-compare.png` |

## top-opacity-0p05.png

- source: `/Users/shinehandmac/Github/ChromeHWP/output/playwright/inputs/incheon-2a.hwpx`
- pages: 1
- verdicts: {'review': 1}
- severity: {'advisory': 1}
- advisory pages: p1 review raw=18.390 blur=18.147 layout=43.663

| page | severity | verdict | raw diff | blur diff | layout diff | note | compare |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | advisory | review | 18.390 | 18.147 | 43.663 | advisory: raw pixel diff requires human visual review; this is not a clean pass. | `output/playwright/visual-probes/p15-targeted/top-opacity-0p05/compare/page-001-compare.png` |

