# Korean Mobile Wedding Invitation

React + TypeScript + Vite 기반의 단일 페이지 청첩장 앱이다. 기본 배포 대상은 GitHub Pages 프로젝트 경로이며, 패키지 매니저는 `pnpm`을 사용한다.

## Scripts

- `pnpm dev`: 로컬 개발 서버 실행
- `pnpm build`: 타입체크 후 프로덕션 빌드 생성
- `pnpm lint`: ESLint 실행
- `pnpm preview`: 빌드 결과 미리보기

## Content Structure

- `src/data/siteContent.ts`: 텍스트, 링크, 계좌, 갤러리 이미지, 푸터, 게임 placeholder 데이터
- `src/types/site.ts`: 사이트 데이터 스키마와 타입 정의
- `src/components/*`: 섹션별 UI 컴포넌트
- `src/index.css`: 디자인 토큰 기반 전역 스타일

## GitHub Pages

프로덕션 빌드 시 `vite.config.ts`는 기본적으로 현재 저장소 디렉터리 이름을 base path로 사용한다.

- 기본 예시: `/20260711/`
- 명시적으로 바꾸려면:

```bash
PAGES_BASE_PATH=/your-repo-name pnpm build
```

GitHub Pages에서 정적 호스팅 가능한 기능만 사용하며, 지도는 외부 `iframe`과 링크 fallback 조합으로 구성되어 있다.
