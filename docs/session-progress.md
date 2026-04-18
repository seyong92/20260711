# Korean Mobile Wedding Invitation Progress

## Summary

이 저장소는 정적 초안(`DESIGN.md`, `code.html`, `screen.png`)을 기반으로 `pnpm + Vite + React + TypeScript` 구조의 단일 페이지 청첩장 앱으로 전환했다. 배포 대상은 GitHub Pages 프로젝트 경로를 기본값으로 가정한다.

## Implemented

- `Vite + React + TypeScript` 앱 초기 구성
- `pnpm` 기반 의존성/스크립트 정리
- GitHub Pages 하위 경로 대응 `base` 설정
- `ngrok` 확인을 위한 Vite dev/preview host 허용
- 데이터 모듈 분리
  - `src/data/siteContent.ts`
  - 텍스트, 날짜, 장소, 계좌, 링크, 갤러리, 푸터, 게임 placeholder 포함
- 타입 모듈 분리
  - `src/types/site.ts`
- 섹션/기능 컴포넌트 분리
  - `Hero`
  - `InvitationMessage`
  - `FamilyInfo`
  - `EventDetails`
  - `LocationSection`
  - `AccountSection`
  - `GallerySection`
  - `LightboxModal`
  - `ResponsiveNav`
  - `Footer`
  - `GameSlot`
- 반응형 내비게이션 구현
  - 모바일: 하단 메뉴
  - 태블릿: 햄버거 + 드로어
  - 데스크톱: 좌측 고정 메뉴
- 갤러리 라이트박스 구현
  - 이전/다음 이동
  - ESC 닫기
  - 배경 스크롤 잠금
- 계좌번호 복사 버튼 구현
- 푸터 하단 게임 placeholder 공간 확보

## Design / UX Adjustments Applied

- 데스크톱 좌측 메뉴를 화면 왼쪽에 완전히 붙는 패널 형태로 수정
- 모바일에서 햄버거 메뉴 비노출 처리
- 푸터의 불필요한 링크 제거
- 히어로 날짜 줄바꿈 방지
- 스크롤 내비게이션을 `scrollIntoView`에서 수동 오프셋 계산 방식으로 변경
- 활성 섹션 판정을 `IntersectionObserver` 대신 스크롤 위치 기반으로 변경
- `갤러리` 섹션 상단 여백 조정
- `일시` 섹션은 보이지 않는 anchor 기준으로 스크롤되도록 조정

## Config Fixes

- `tsconfig.node.json`
  - `tsBuildInfoFile` 제거
  - `target`/`lib`를 `ES2022`로 조정
  - `erasableSyntaxOnly` 제거
- `tsconfig.app.json`
  - 동일한 호환성 정리 적용

## Validation

아래 명령 기준으로 반복 검증했다.

```bash
pnpm build
pnpm lint
```

두 명령 모두 마지막 작업 시점 기준 통과 상태다.

## Important Paths

- 앱 진입점: `src/App.tsx`
- 전역 스타일: `src/index.css`
- 데이터 소스: `src/data/siteContent.ts`
- 반응형 내비게이션: `src/components/ResponsiveNav.tsx`
- 활성 섹션 판정: `src/hooks/useActiveSection.ts`
- GitHub Pages / dev server 설정: `vite.config.ts`

## Remaining Work Candidates

- 모바일 실기기 기준 간격/타이포 미세 조정
- `일시` 섹션의 스크롤 기준점 추가 튜닝
- 실제 운영용 이미지/문구/링크 교체
- 게임 placeholder에 실제 별도 번들 연결
- GitHub Pages 배포 워크플로 또는 `gh-pages` 배포 스크립트 추가 여부 결정
