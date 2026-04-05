# HWP 레퍼런스 자산

## 공식 형식 문서

- `docs/hwp-spec/hwp-5.0-revision1.3.pdf`
  - HWP 5.0 본문 형식
- `docs/hwp-spec/hwp-chart-revision1.2.pdf`
  - 차트/OLE 관련 형식 참고
- `docs/hwp-spec/hwp-equation-revision1.3.pdf`
  - 수식(`EQEDIT`) 형식 참고
- `docs/hwp-spec/hwp-distributed-doc-revision1.2.pdf`
  - 배포용 문서/복호화 관련 참고
- `docs/hwp-spec/hwpml-3.0-revision1.2.pdf`
  - HWPML/OWPML 구조 참고

## 테스트/검증 샘플

- `output/playwright/inputs/gyeolseokgye.hwp`
  - 결석계 양식표 검증용
- `output/playwright/inputs/goyeopje.hwp`
  - 등록신청서 기본 양식 검증용
- `output/playwright/inputs/goyeopje-full-2024.hwp`
  - 고엽제 등록신청서 전체 양식 검증용
- `output/playwright/inputs/incheon-2a.hwpx`
  - HWPX/OWPML 레이아웃, 이미지, 표 검증용
- `output/playwright/inputs/attachment-sale-notice.hwp`
  - 일반 공고문/이미지/다페이지 검증용

## 권장 사용 순서

1. 규격 확인이 필요하면 먼저 `docs/hwp-spec/` PDF를 본다.
2. 뷰어 회귀 확인은 `output/playwright/inputs/` 샘플을 사용한다.
3. 현재 최소 자동 검증 기준은 `scripts/verify_samples.mjs`를 사용하되, Playwright 세션 오류는 별도 확인이 필요하다.
