# Korean Mobile Wedding Invitation

React + TypeScript + Vite 기반의 단일 페이지 청첩장 앱이다. 기본 배포 대상은 GitHub Pages 프로젝트 경로이며, 패키지 매니저는 `pnpm`을 사용한다.

## Scripts

- `pnpm dev`: 로컬 개발 서버 실행
- `pnpm build`: 타입체크 후 프로덕션 빌드 생성
- `pnpm lint`: ESLint 실행
- `pnpm preview`: 빌드 결과 미리보기

## Content Structure

- `src/data/siteContent.ts`: 메타 정보, 텍스트, 링크, 지도 좌표, 계좌, 갤러리 이미지, 푸터, 게임 placeholder 데이터
- `src/types/site.ts`: 사이트 데이터 스키마와 타입 정의
- `src/components/*`: 섹션별 UI 컴포넌트
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

footer 하단 문구와 비밀 링크 영역은 `src/data/siteContent.ts`의 `footer`에서 변경한다.

```ts
footer: {
  license: '© 2026 Sang-eon & Eun-jin. Crafted with love.',
  teaserLabel: '작은 비밀 열기',
  panelTitle: 'Secret Arcade',
  panelDescription: '이 영역은 추후 별도 번들로 웹게임을 연결할 수 있도록 마련한 placeholder입니다.',
}
```

## GitHub Pages

프로덕션 빌드 시 `vite.config.ts`는 기본적으로 현재 저장소 디렉터리 이름을 base path로 사용한다.

- 기본 예시: `/20260711/`
- 명시적으로 바꾸려면:

```bash
PAGES_BASE_PATH=/your-repo-name pnpm build
```

GitHub Pages에서 정적 호스팅 가능한 기능만 사용한다. 네이버 지도 사용 시에는 Maps 콘솔에 GitHub Pages 도메인을 Web 서비스 URL로 등록해야 한다.
