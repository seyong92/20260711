# Korean Mobile Wedding Invitation

React + TypeScript + Vite 기반의 단일 페이지 청첩장 앱이다. 기본 배포 대상은 GitHub Pages 프로젝트 경로이며, 패키지 매니저는 `pnpm`을 사용한다.

## Scripts

- `pnpm dev`: 로컬 개발 서버 실행
- `pnpm build`: 타입체크 후 프로덕션 빌드 생성
- `pnpm lint`: ESLint 실행
- `pnpm preview`: 빌드 결과 미리보기

## Content Structure

- `src/data/siteContent.ts`: 메타 정보, 텍스트, 링크, 지도 좌표, 계좌, 갤러리 이미지, 푸터, 게임 설정 데이터
- `src/types/site.ts`: 사이트 데이터 스키마와 타입 정의
- `src/components/*`: 섹션별 UI 컴포넌트
- `src/game/content/*`: 미니게임의 텍스트, 스테이지, 적, 보스, 아이템 데이터
- `src/game/core/*`: Phaser 게임 로직
- `src/game/ui/*`: React 게임 페이지와 결과 오버레이 UI
- `src/index.css`: 디자인 토큰 기반 전역 스타일

## Customization

### Title / Description / Favicon

브라우저 탭 제목, 설명, 파비콘은 `src/data/siteContent.ts`의 `meta`에서 변경한다.

```ts
meta: {
  title: '용상언 & 최은진의 결혼식에 초대합니다',
  description: '용상언 · 최은진 결혼식 초대장',
  faviconSrc: '/favicon.svg',
}
```

파비콘 파일은 `public/` 아래에 두면 된다.

- 예시: `public/favicon.svg`
- 다른 파일로 바꾸려면 예시:
  - `public/favicon.png`
  - `faviconSrc: '/favicon.png'`

### Naver Map

네이버 지도 중심 좌표는 `src/data/siteContent.ts`의 `location.coordinates`에서 변경한다.

```ts
coordinates: {
  lat: 37.5046355,
  lng: 127.0488014,
}
```

네이버 지도 API 키는 환경변수로 넣는다.

```bash
VITE_NAVER_MAP_KEY_ID=YOUR_KEY_ID
```

기존 이름인 `VITE_NAVER_MAP_CLIENT_ID`도 임시 호환되지만, 새 설정은 `VITE_NAVER_MAP_KEY_ID` 사용을 권장한다.

### Footer

footer 하단 비밀 링크와 미니게임 진입 조건은 `src/data/siteContent.ts`의 `footer`에서 변경한다.

```ts
footer: {
  license: '© 2026 Sang-eon & Eun-jin. Crafted with love.',
  teaserLabel: '작은 비밀 열기',
  gamePath: '/game',
  showGameEntry: true,
  secretTriggerCount: 5,
  secretLabels: {
    default: '아직 잠겨 있어요.',
    countdown: '{remaining}번 더 눌러보세요.',
    ready: '거의 다 왔어요.',
  },
}
```

`showGameEntry`가 `true`이면 `작은 비밀 열기` 버튼이 표시된다. 버튼은 누를 때마다 카운트다운을 진행하고, `secretTriggerCount`번째 클릭에서 `gamePath`로 이동한다. `false`이면 청첩장에는 게임 진입 UI가 보이지 않으며, 직접 경로로만 접근할 수 있다.

### Game Content

게임 타이틀, 인트로 문구, 결과 화면 문구, 점수 API 설정은 `src/data/siteContent.ts`의 `gameConfig`에서 바꾼다.

```ts
gameConfig: {
  title: '용사와 용',
  subtitle: 'The Hero & The Dragon',
  introLines: ['옛날 옛적...', '...'],
  homeHrefLabel: '청첩장으로 돌아가기',
  scoreApi: {
    baseUrl: '/api',
    useMock: true,
    submissionsEnabled: true,
  },
}
```

프로덕션 빌드는 `.env.production`의 `VITE_GAME_SCORE_API_URL`과
`VITE_GAME_SCORE_API_USE_MOCK=false`를 사용해 실제 점수 API를 호출한다.

스테이지 이름, 적/보스/아이템 밸런스는 `src/game/content/*`에서 수정한다.

## GitHub Pages

프로덕션 빌드 시 `vite.config.ts`는 기본적으로 현재 저장소 디렉터리 이름을 base path로 사용한다.

- 기본 예시: `/20260711/`
- 명시적으로 바꾸려면:

```bash
PAGES_BASE_PATH=/your-repo-name pnpm build
```

GitHub Pages에서 정적 호스팅 가능한 기능만 사용한다. 네이버 지도 사용 시에는 Maps 콘솔에 GitHub Pages 도메인을 Web 서비스 URL로 등록해야 한다.

직접 경로 진입용 SPA fallback은 `public/404.html`로 처리한다. 따라서 GitHub Pages에서도 `/{repo-name}/game` 직접 접근이 가능하다.

이 저장소에는 GitHub Pages 배포용 workflow가 포함되어 있다.

- workflow 파일: `.github/workflows/deploy-pages.yml`
- 기본 배포 브랜치: `main`
- 수동 실행: GitHub Actions의 `Deploy GitHub Pages`

### Required GitHub Secret

GitHub 저장소 `Settings > Secrets and variables > Actions`에 아래 secret을 추가한다.

```bash
VITE_NAVER_MAP_KEY_ID=YOUR_DEPLOY_KEY
```

권장 운영 방식:

- 로컬 개발: `.env.local`에 개발용 키 사용
- GitHub Pages 배포: Actions secret에 배포용 키 사용

### GitHub Pages Settings

GitHub 저장소 설정에서 Pages 배포 소스를 `GitHub Actions`로 설정한다.
