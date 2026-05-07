import { buildAppPath } from "../lib/routes";
import type { SiteContent } from "../types/site";

const publicAssetPath = buildAppPath;

export const siteContent: SiteContent = {
  meta: {
    title: "용상언 & 최은진의 결혼식에 초대합니다",
    description:
      "소중한 걸음 하시어 함께 축복해 주세요. 2026년 7월 11일 토요일 오후 12시 30분 · 더휴웨딩홀",
    faviconSrc: publicAssetPath("/favicon.png"),
    faviconType: "image/png",
    image: {
      src: publicAssetPath("/og-photo.jpg"),
      alt: "용상언 최은진 결혼식 청첩장 대표 사진",
      width: 1200,
      height: 630,
      type: "image/jpeg",
    },
  },
  couple: {
    groom: "용상언",
    bride: "최은진",
  },
  hero: {
    eyebrow: "Save Our Date",
    dateLabel: "2026. 07. 11",
    timeLabel: "토요일 오후 12시 30분",
    image: {
      src: publicAssetPath("/images/wedding/hero/cover.jpeg"),
      alt: "한옥 사이에 선 신랑 신부 웨딩 사진",
    },
  },
  invitation: {
    headline: [
      "연구실에서 만난 작은 인연이",
      "삶을 함께하는 약속으로 이어집니다.",
      "",
      "소중한 걸음 하시어 함께 축복해 주시면",
      "더없는 기쁨이겠습니다.",
    ],
    closingIconLabel: "초대의 마음",
  },
  family: {
    groom: {
      roleLabel: "신랑 혼주",
      parents: [{ name: "용웅순" }, { name: "손선희" }],
      relation: "의 장남",
      name: "상언",
    },
    bride: {
      roleLabel: "신부 혼주",
      parents: [{ name: "최경삼", deceased: true }, { name: "김병애" }],
      relation: "의 차녀",
      name: "은진",
    },
  },
  eventDetails: {
    cards: [
      {
        id: "date",
        icon: "calendar",
        label: "일시",
        value: ["2026년 07월 11일", "토요일 오후 12시 30분"],
      },
      {
        id: "venue",
        icon: "location",
        label: "장소",
        value: ["더휴웨딩홀"],
      },
    ],
  },
  location: {
    title: "오시는 길",
    venue: "더휴웨딩홀",
    address: "서울 강남구 테헤란로 407, 이케이타워 (EK-Tower) 2층",
    coordinates: {
      lat: 37.505387,
      lng: 127.050125,
    },
    directions: [
      "지하철 2호선/수인분당선 선릉역 10번 출구 도보 1분",
      "접수처 도장 날인시 지하 주차장 2시간 무료 이용 가능",
      "혼잡 시간대에는 대중교통 이용을 권장드립니다.",
    ],
    mapFallbackImage: {
      src: publicAssetPath("/images/wedding/location/map-fallback.jpg"),
      alt: "예식장 위치 안내 지도 이미지",
    },
    mapLinks: [
      {
        provider: "NAVER",
        label: "네이버지도",
        href: "https://naver.me/FSwbdsM1",
      },
      {
        provider: "KAKAO",
        label: "카카오맵",
        href: "https://place.map.kakao.com/18574260",
      },
      {
        provider: "T-MAP",
        label: "티맵",
        href: "https://tmap.life/e457e377",
      },
    ],
  },
  accounts: {
    title: "마음 전하실 곳",
    description: [
      "축하의 마음을 담아 보낼 곳을 안내드립니다.",
      "전해주시는 따뜻한 마음 잊지 않겠습니다.",
    ],
    entries: [
      {
        bank: "국민은행",
        accountNumber: "270102-04-084694",
        holder: "신랑 용상언",
        side: "groom",
        relationship: "신랑",
      },
      {
        bank: "국민은행",
        accountNumber: "827-21-0432-671",
        holder: "혼주 용웅순",
        side: "groom",
        relationship: "혼주",
      },
      {
        bank: "우리은행",
        accountNumber: "1002-563-202636",
        holder: "신부 최은진",
        side: "bride",
        relationship: "신부",
      },
      {
        bank: "농협은행",
        accountNumber: "121031-56-241410",
        holder: "혼주 김병애",
        side: "bride",
        relationship: "혼주",
      },
    ],
  },
  gallery: {
    title: "갤러리",
    subtitle: "Gallery",
    items: [
      {
        id: "gallery-1",
        src: publicAssetPath("/images/wedding/gallery/gallery-1.jpg"),
        alt: "웨딩 갤러리 사진 1",
        ratio: "1 / 1",
      },
      {
        id: "gallery-2",
        src: publicAssetPath("/images/wedding/gallery/gallery-2.jpg"),
        alt: "웨딩 갤러리 사진 2",
        ratio: "1 / 1",
      },
      {
        id: "gallery-3",
        src: publicAssetPath("/images/wedding/gallery/gallery-3.jpg"),
        alt: "웨딩 갤러리 사진 3",
        ratio: "1 / 1",
      },
      {
        id: "gallery-4",
        src: publicAssetPath("/images/wedding/gallery/gallery-4.jpg"),
        alt: "웨딩 갤러리 사진 4",
        ratio: "4 / 3",
      },
      {
        id: "gallery-5",
        src: publicAssetPath("/images/wedding/gallery/gallery-5.jpg"),
        alt: "웨딩 갤러리 사진 5",
        ratio: "3 / 4",
      },
      {
        id: "gallery-6",
        src: publicAssetPath("/images/wedding/gallery/gallery-6.jpg"),
        alt: "웨딩 갤러리 사진 6",
        ratio: "1 / 1",
      },
      {
        id: "gallery-7",
        src: publicAssetPath("/images/wedding/gallery/gallery-7.jpg"),
        alt: "웨딩 갤러리 사진 7",
        ratio: "16 / 9",
      },
    ],
  },
  footer: {
    license: "© 2026 Sangeon & Eunjin. Crafted with love.",
    teaserLabel: "작은 비밀 열기",
    gamePath: "/game",
    showGameEntry: true,
    secretTriggerCount: 5,
    secretLabels: {
      default: "아직 잠겨 있어요.",
      countdown: "{remaining}번 더 눌러보세요.",
      ready: "거의 다 왔어요.",
    },
  },
  gameConfig: {
    controlsHint:
      "PC: Z=점프  X=발사(꾹=차지)  ←→=이동\nMobile: 좌측=이동  우측=점프  공격=자동",
    homeHrefLabel: "청첩장으로 돌아가기",
    scoreForm: {
      nicknamePlaceholder: "닉네임 (최대 10자)",
      messagePlaceholder: "축하 메시지를 남겨주세요! (최대 100자)",
      submitLabel: "메시지 남기기",
      leaderboardTitle: "Leaderboard",
      restartLabel: "다시 플레이",
      skipSubmitLabel: "건너뛰기",
      disabledNotice:
        "메시지 저장 기능은 준비 중이에요. 점수만 확인하고 다시 플레이할 수 있습니다.",
    },
    scoreApi: {
      baseUrl: "/api",
      useMock: true,
      submissionsEnabled: true,
    },
    modes: {
      bride: {
        title: "용사와 용",
        subtitle: "The Hero & The Dragon",
        startLabel: "시작하기",
        titleStory: ["용사(신부)가 용(신랑)을 구하는", "사랑의 대모험!"],
        storySequences: {
          intro: [
            {
              fileName: "intro-01.png",
              caption:
                "용사는 용을 오랫동안 좋아해 왔습니다. 하지만 머나먼 거리에 떨어진 용을 만나는 일은 쉽지 않았죠.",
              alt: "자취방에서 스마트폰 속 용의 사진을 보며 슬퍼하는 용사의 뒷모습",
            },
            {
              fileName: "intro-02.png",
              caption:
                "현대의 기술은 멀리 떨어져 있는 용과도 대화를 나눌 수 있을 정도로 발전했지만, 그것만으로는 용사님은 만족할 수 없었어요.",
              alt: "용과 나누는 WhatsApp 대화가 보이는 스마트폰 화면",
            },
            {
              fileName: "intro-03.png",
              caption:
                "결국 용사님은 수많은 어려움을 이겨내고 용을 직접 찾으러 나서기로 결심했습니다!",
              alt: "방 뒤편에 있던 키타를 어깨에 메며 결심하는 용사",
            },
          ],
          afterStage1: [
            {
              fileName: "after-stage-1-01.png",
              caption:
                "마침내 용과 만나게 된 용사님. 용사님은 그리웠던 용의 온기를 느끼며 그간 못했던 이야기들을 나누기 시작했어요.",
              alt: "역에서 감격의 눈물을 흘리며 용을 끌어안는 용사",
            },
            {
              fileName: "after-stage-1-02.png",
              caption:
                "하지만 기쁨도 잠시, 어려움을 뚫고 만났음에도 곧 헤어질 시간이 다가온다는 생각에 두 사람은 서로 더 오래 함께 할 방법에 대해 고민하기 시작했어요.",
              alt: "진지한 표정으로 대화를 나누는 용사와 용",
            },
            {
              fileName: "after-stage-1-03.png",
              caption:
                "우선은 용사의 가장 큰 과업이었던 졸업부터 해결하기로 한 두 사람!",
              alt: "결연한 미소를 짓는 용사와 용",
            },
            {
              fileName: "after-stage-1-04.png",
              caption:
                "더 오래 함께 하기 위해, 용사는 졸업을 향해 달려가기 시작합니다!",
              alt: "카페에서 노트북으로 열심히 일하는 용사와 뒤에서 응원하는 용",
            },
          ],
          afterStage2: [
            {
              fileName: "after-stage-2-01.png",
              caption: "마침내 무사히 디펜스를 마치고 졸업에 성공한 용사님!",
              alt: "캠퍼스 앞에서 감동의 눈물을 흘리며 용을 껴안는 용사",
            },
            {
              fileName: "after-stage-2-02.png",
              caption:
                "이제 행복한 미래만 남았다고 생각하고 있던 용사와 용이었지만, 아직 함께 하기에는 많은 난관이 남아있었습니다.",
              alt: "계약서를 함께 쳐다보며 심각한 표정을 짓는 용과 용사",
            },
            {
              fileName: "after-stage-2-03.png",
              caption:
                "영원히 함께 하기 위해, 두 사람은 마침내 결혼 준비를 본격적으로 시작했습니다!",
              alt: "비장한 뒷모습으로 결혼식장 앞에 선 용과 용사",
            },
          ],
          ending: [
            {
              fileName: "ending-01.png",
              caption:
                "모든 어려움을 이겨내고 마침내 성공적인 결혼을 한 두 사람!",
              alt: "결혼식장에서 손을 잡고 하객에게 손인사를 건네는 용사와 용",
            },
            {
              fileName: "shared/ending-final-pixel.png",
              revealFileName: "shared/ending-final-photo.jpg",
              variant: "mosaicReveal",
              caption: "이제 두 사람의 앞에는 꽃길만 남아있겠죠?",
              alt: "웨딩 촬영장에서 나란히 선 용사와 용",
            },
            {
              variant: "blackout",
              caption: "...아마도요...",
              alt: "검은 화면",
            },
          ],
        },
        victoryMessages: {
          title: "축하합니다!",
          rescued: "용사가 용을 구했습니다!",
          submitSuccess: "축하 메시지 완료!",
        },
        retry: {
          title: "▶  다시 도전하기",
          subtitle: "용사님은 무너지지 않아요! 포기하지 마세요!",
          backToTitle: "타이틀로 돌아가기",
        },
        uiLabels: {
          gameOverTitle: "GAME OVER",
          introAdvanceHint: "읽은 뒤 Z/X/ENTER/TAP",
          startHint: "Z / X / ENTER / SPACE 로 시작",
          finalScoreLabel: "최종 점수",
          playTimeLabel: "플레이 타임",
        },
      },
      dragon: {
        title: "용과 용사",
        subtitle: "The Dragon & The Hero",
        startLabel: "시작하기",
        titleStory: ["용(신랑)이 용사(신부)를 찾아가는", "푸른 불꽃의 대모험!"],
        storySequences: {
          intro: [
            {
              fileName: "intro-01.png",
              caption:
                "용은 언제나 좋아하는 용사님과 시간을 보내고 싶었지만, 많은 시간을 보내기엔 현실의 벽이 녹록지 않았어요.",
              alt: "회사에서 노트북으로 정신없이 일하는 용의 뒷모습",
            },
            {
              fileName: "intro-02.png",
              caption:
                "용사님과 연락할 수단이 없는 건 아니었지만, 메시지를 주고받는 것만으로는 공허함이 채워지지 않았죠.",
              alt: "용사와 나누는 WhatsApp Web 대화가 보이는 노트북 화면",
            },
            {
              fileName: "intro-03.png",
              caption: "결국 용은 용사를 직접 만나러 떠나기로 결심했어요!",
              alt: "책상을 내리치며 일어나는 용",
            },
          ],
          afterStage1: [
            {
              fileName: "after-stage-1-01.png",
              caption:
                "마침내 용은 용사님을 만났어요. 두 사람은 마치 이전에는 연락 수단이 없었던 것마냥 수많은 이야기들을 나누기 시작했어요.",
              alt: "역에서 안심하는 표정으로 용사를 껴안는 용",
            },
            {
              fileName: "after-stage-1-02.png",
              caption:
                "이어서 용과 용사님은 행복한 시간을 보내고 있었어요. 하지만 용의 표정에서는 평소와 다르게 긴장감이 감돌았습니다.",
              alt: "흰 파인다이닝 레스토랑의 프라이빗 룸에서 식사하는 용과 용사",
            },
            {
              fileName: "after-stage-1-03.png",
              caption:
                "두 사람이 평생 함께 행복하게 살 수 있게 프로포즈를 준비했던 용이었어요!",
              alt: "MARRY ME 케이크 앞에서 반지를 건네는 용과 감동한 용사",
            },
            {
              fileName: "after-stage-1-04.png",
              caption:
                "프로포즈를 승낙한 용사님이지만, 결혼을 준비하기 전 먼저 해결해야 할 일이 있었어요.",
              alt: "카페에서 심각한 표정으로 노트북을 쳐다보는 용사와 걱정스럽게 지켜보는 용",
            },
            {
              fileName: "after-stage-1-05.png",
              caption:
                "더 오래 함께 하기 위해, 용사는 졸업을 향해 달려가고, 용은 본인이 도울 수 있는 일을 돕기 시작했습니다!",
              alt: "카페에서 노트북으로 열심히 일하는 용사와 뒤에서 응원하는 용",
            },
          ],
          afterStage2: [
            {
              fileName: "after-stage-2-01.png",
              caption: "마침내 무사히 디펜스를 마치고 졸업에 성공한 용사님!",
              alt: "캠퍼스 앞에서 감동의 눈물을 흘리며 용을 껴안는 용사",
            },
            {
              fileName: "after-stage-2-02.png",
              caption:
                "이제 행복한 미래만 남았다고 생각하고 있던 용사와 용이었지만, 아직 함께 하기에는 많은 난관이 남아있었습니다.",
              alt: "계약서를 함께 쳐다보며 심각한 표정을 짓는 용과 용사",
            },
            {
              fileName: "after-stage-2-03.png",
              caption:
                "영원히 함께 하기 위해, 두 사람은 마침내 결혼 준비를 본격적으로 시작했습니다!",
              alt: "비장한 뒷모습으로 결혼식장 앞에 선 용과 용사",
            },
          ],
          ending: [
            {
              fileName: "ending-01.png",
              caption:
                "모든 어려움을 이겨내고 마침내 성공적인 결혼을 한 두 사람!",
              alt: "결혼식장에서 손을 잡고 하객에게 손인사를 건네는 용사와 용",
            },
            {
              fileName: "shared/ending-final-pixel.png",
              revealFileName: "shared/ending-final-photo.jpg",
              variant: "mosaicReveal",
              caption: "이제 두 사람의 앞에는 꽃길만 남아있겠죠?",
              alt: "웨딩 촬영장에서 나란히 선 용과 용사",
            },
            {
              variant: "blackout",
              caption: "...아마도요...",
              alt: "검은 화면",
            },
          ],
        },
        victoryMessages: {
          title: "푸른 불꽃 승리!",
          rescued: "용이 용사를 찾아냈습니다!",
          submitSuccess: "용의 축하 메시지 완료!",
        },
        retry: {
          title: "▶  다시 도전하기",
          subtitle: "용은 쉽게 물러서지 않아요. 다시 한 번!",
          backToTitle: "타이틀로 돌아가기",
        },
        uiLabels: {
          gameOverTitle: "GAME OVER",
          introAdvanceHint: "읽은 뒤 Z/X/ENTER/TAP",
          startHint: "Z / X / ENTER / SPACE 로 출발",
          finalScoreLabel: "용의 점수",
          playTimeLabel: "비행 시간",
        },
      },
    },
  },
  sections: [
    {
      id: "nav-home",
      label: "홈",
      icon: "home",
      sectionId: "home",
    },
    {
      id: "nav-details",
      label: "일시",
      icon: "calendar",
      sectionId: "details",
    },
    {
      id: "nav-location",
      label: "장소",
      icon: "location",
      sectionId: "location",
    },
    {
      id: "nav-accounts",
      label: "마음",
      icon: "gift",
      sectionId: "accounts",
    },
    {
      id: "nav-gallery",
      label: "갤러리",
      icon: "gallery",
      sectionId: "gallery",
    },
  ],
};
