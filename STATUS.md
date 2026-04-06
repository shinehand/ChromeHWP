# ChromeHWP 현재 상태 요약

기준 시각: 2026-04-06

## 지금까지 진행한 작업

- HWP 5.0 공식 PDF, HWPML/OWPML 문서, 한컴 배포 자료를 기준으로 파서와 렌더러를 계속 보강했다.
- `.hwpx`와 `.owpml`을 같은 메인 파서 경로로 처리하도록 맞췄고, 파일 열기/저장/UI/링크 감지도 함께 정리했다.
- HWP/HWPX 문단 서식 해석을 확장했다.
  - 줄 간격 종류(`percent`, `fixed`, `space-only`, `minimum`)
  - 글자 모양(`장평`, `자간`, `상대 크기`, `글자 위치`)
  - 표 `cellSpacing`
- HWP 개체 공통 속성 해석을 확장했다.
  - `VertRelTo`, `HorzRelTo`
  - `TextWrap`, `TextFlow`
  - `WidthRelTo`, `HeightRelTo`
  - `offset`, `outMargin`, `allowOverlap`, `flowWithText`
- 수식(`EQEDIT`)과 OLE/차트 placeholder 복원을 넣었고, HWPX 비인라인 그림이 잘못 인라인으로 섞이는 문제를 줄였다.
- 배포용 문서용 복호화 기반 로직(`DISTRIBUTE_DOC_DATA`, AES-128 ECB helper, distributed 시도 경로)을 메인/워커에 반영했다.
- 양식표 보정을 계속 진행했다.
  - `결석계.hwp` 상단 제목/결재란 조합 레이아웃 보정
  - 병합 셀 때문에 열폭이 퍼지던 계산 보정
  - `인 적 사 항`, `결 석 일 수`, `결 석 종 류` 같은 세로 라벨을 2글자씩 줄바꿈해 렌더
- HWP/HWPX 레이아웃 메트릭 정밀화 (이번 세션)
  - `_parseHwpParaShape`: 우측 여백(`marginRight`) 파싱 추가 (오프셋 8)
  - `_createHwpParagraphBlock` / `createHwpParagraphBlock` (worker): `marginRight` 전달
  - `appendParagraphBlock`: `para.marginRight > 0`이면 `padding-right` 적용
  - HWPX 표 행 높이 상한 180px → 280px 확대 (키 큰 행 잘림 방지)
  - HWPX 셀 높이·본문 높이 상한 140px → 200px 확대
  - HWPX 셀 가중치 추정 상한 14 → 20 확대 (다단락 셀 누락 개선)
  - `_summarizeHwpLineSegs` `lineHeightPx` 상한 42px → 56px (대형 폰트 단락 높이 개선)
  - `parser.worker.js` 동기화
- HWPX/HWP 단락 서식 파싱 버그 수정 (이번 세션)
  - HWPX paraPr `'intent'` → `'indent'` 타이포 수정 (textIndent가 HWPX 파일에서 전혀 적용 안 되던 심각한 버그)
  - HWPX paraPr `marginRight` 파싱 추가 (`<right>` 요소)
  - 단락 여백·들여쓰기 단위 스케일 수정: `1/106` → `1/75` (HWPUNIT = 1/7200inch, 96DPI 기준 정확한 변환)
    - `appendParagraphBlock`: marginLeft (−34~310px), marginRight, textIndent (−170~226px), spacingBefore/After (0~80px)
    - `resolveParagraphLineHeight`: fixed/minimum/space-only lineSpacing (0~200/112px)

## 확인된 대표 결과

- `incheon-2a.hwpx`
  - 비인라인 LH 로고 배치가 제목과 심하게 겹치지 않도록 복원됨
  - 표/개체 offset이 이전보다 공식 값에 가깝게 반영됨
- `attachment-sale-notice.hwp`
  - 15페이지, 이미지 3개, 상단 배너와 본문 텍스트 유지 확인
- `gyeolseokgye.hwp`
  - 상단 표의 병합 셀 왜곡이 줄었고, 첫 열 라벨의 세로 배치가 이전보다 자연스러워짐
  - 우측 여백 파싱 추가로 단락 텍스트 배치 정밀화
  - HWPX `indent` 타이포 수정 및 단위 스케일 1/75 전환으로 들여쓰기/간격이 원본에 훨씬 더 가까워짐

## 저장소에 함께 둔 레퍼런스

- 공식 형식 문서: `docs/hwp-spec/`
- 테스트 샘플: `output/playwright/inputs/`
- 자산 목록: `docs/hwp-assets.md`

## 아직 남은 큰 작업

- 표 레이아웃 정밀화
  - 행 높이, 세로 정렬, 중첩 표 비율을 원본과 더 가깝게 맞추기
  - `결석계.hwp` 하단 `결석 종류` 표와 승인란 비례 계속 보정
- 개체 절대배치 실문서 검증
  - `page/paper` 기준 개체가 실제로 들어 있는 샘플 확보 후 end-to-end 검증
  - `behind/in-front`, `textFlow` 케이스를 실샘플로 더 확인
- OLE/차트 실렌더링
  - 현재는 placeholder 중심이므로 실제 payload 렌더 경로가 더 필요함
- 배포용 HWP 실문서 검증
  - 복호화 helper는 반영됐지만 실제 암호화 샘플로 end-to-end 확인이 더 필요함
- 줄바꿈/폰트 폭 정밀화
  - 한글 앱과 같은 줄바꿈 폭, 폰트 대체, 장평 영향까지 더 맞춰야 함
- 자동 회귀 검증 안정화
  - `scripts/verify_samples.mjs`는 현재 Playwright CLI 세션 연결 오류(`verify-current`) 때문에 안정적으로 돌지 않음

## 다음 우선순위

1. HWP 5.0 단락 스타일ID(styleId) 기반 기본 스타일 적용 — 헤딩/목록 등이 StyleID로 표시되는 경우 올바른 폰트/크기 적용
2. `결석계.hwp` 하단 중첩 표 행높이와 세로 정렬 재확인 (이전 세션 상한 확대 + 이번 스케일 수정 반영 후)
3. 차트/OLE placeholder를 실제 렌더 경로로 확장
4. 실샘플 기준 `page/paper` 절대배치 검증
