import type { SiteContent } from '../types/site';

export const siteContent: SiteContent = {
  meta: {
    title: '용상언 & 최은진의 결혼식에 초대합니다',
    description: '용상언 · 최은진 결혼식 초대장',
    faviconSrc: '/favicon.svg',
  },
  couple: {
    groom: '용상언',
    bride: '최은진',
  },
  hero: {
    eyebrow: 'Save Our Date',
    dateLabel: '2026. 07. 11',
    timeLabel: '토요일 오후 12시 30분',
    image: {
      src: '/images/wedding/hero/cover.jpeg',
      alt: '한옥 사이에 선 신랑 신부 웨딩 사진',
    },
  },
  invitation: {
    headline: [
      '연구실에서 만난 작은 인연이',
      '삶을 함께하는 약속으로 이어집니다.',
      '',
      '소중한 걸음 하시어 함께 축복해 주시면',
      '더없는 기쁨이겠습니다.',
    ],
    closingIconLabel: '초대의 마음',
  },
  family: {
    groom: {
      roleLabel: '신랑 혼주',
      parents: [{ name: '용웅순' }, { name: '손선희' }],
      relation: '의 장남',
      name: '상언',
    },
    bride: {
      roleLabel: '신부 혼주',
      parents: [{ name: '최경삼', deceased: true }, { name: '김병애' }],
      relation: '의 차녀',
      name: '은진',
    },
  },
  eventDetails: {
    cards: [
      {
        id: 'date',
        icon: 'calendar',
        label: '일시',
        value: ['2024년 11월 23일', '오후 12시 30분'],
      },
      {
        id: 'venue',
        icon: 'location',
        label: '장소',
        value: ['더휴웨딩홀'],
      },
    ],
  },
  location: {
    title: '오시는 길',
    venue: '더휴웨딩홀',
    address: '서울 강남구 테헤란로 407, 이케이타워 (EK-Tower) 2층',
    coordinates: {
      lat: 37.505387,
      lng: 127.050125,
    },
    directions: [
      '지하철 2호선/수인분당선 선릉역 10번 출구 도보 1분',
      '접수처 도장 날인시 지하 주차장 2시간 무료 이용 가능',
      '혼잡 시간대에는 대중교통 이용을 권장드립니다.',
    ],
    mapFallbackImage: {
      src: '/images/wedding/location/map-fallback.jpg',
      alt: '예식장 위치 안내 지도 이미지',
    },
    mapLinks: [
      {
        provider: 'NAVER',
        label: '네이버지도',
        href: 'https://naver.me/FSwbdsM1',
      },
      {
        provider: 'KAKAO',
        label: '카카오맵',
        href: 'https://place.map.kakao.com/18574260',
      },
      {
        provider: 'T-MAP',
        label: '티맵',
        href: 'https://tmap.life/e457e377',
      },
    ],
  },
  accounts: {
    title: '마음 전하실 곳',
    description: [
      '축하의 마음을 담아 보낼 곳을 안내드립니다.',
      '전해주시는 따뜻한 마음 잊지 않겠습니다.',
    ],
    entries: [
      {
        bank: '신한은행',
        accountNumber: '110-123-456789',
        holder: '신랑 용상언',
        side: 'groom',
        relationship: '신랑',
      },
      {
        bank: '국민은행',
        accountNumber: '123456-01-987654',
        holder: '혼주 용웅순',
        side: 'groom',
        relationship: '혼주',
      },
      {
        bank: '농협은행',
        accountNumber: '302-0000-1111-22',
        holder: '혼주 손선희',
        side: 'groom',
        relationship: '혼주',
      },
      {
        bank: '우리은행',
        accountNumber: '1002-563-202636',
        holder: '신부 최은진',
        side: 'bride',
        relationship: '신부',
      },
      {
        bank: '농협은행',
        accountNumber: '121031-56-241410',
        holder: '혼주 김병애',
        side: 'bride',
        relationship: '혼주',
      },
    ],
  },
  gallery: {
    title: '갤러리',
    subtitle: 'Gallery',
    items: [
      {
        id: 'gallery-1',
        src: '/images/wedding/gallery/gallery-1.jpg',
        alt: '웨딩 갤러리 사진 1',
        ratio: '1 / 1',
      },
      {
        id: 'gallery-2',
        src: '/images/wedding/gallery/gallery-2.jpg',
        alt: '웨딩 갤러리 사진 2',
        ratio: '1 / 1',
      },
      {
        id: 'gallery-3',
        src: '/images/wedding/gallery/gallery-3.jpg',
        alt: '웨딩 갤러리 사진 3',
        ratio: '1 / 1',
      },
      {
        id: 'gallery-4',
        src: '/images/wedding/gallery/gallery-4.jpg',
        alt: '웨딩 갤러리 사진 4',
        ratio: '4 / 3',
      },
      {
        id: 'gallery-5',
        src: '/images/wedding/gallery/gallery-5.jpg',
        alt: '웨딩 갤러리 사진 5',
        ratio: '3 / 4',
      },
      {
        id: 'gallery-6',
        src: '/images/wedding/gallery/gallery-6.jpg',
        alt: '웨딩 갤러리 사진 6',
        ratio: '1 / 1',
      },
      {
        id: 'gallery-7',
        src: '/images/wedding/gallery/gallery-7.jpg',
        alt: '웨딩 갤러리 사진 7',
        ratio: '16 / 9',
      },
    ],
  },
  footer: {
    license: '© 2026 Sangeon & Eunjin. Crafted with love.',
    teaserLabel: '작은 비밀 열기',
    panelTitle: 'Secret Arcade',
    panelDescription:
      '이 영역은 추후 별도 번들로 웹게임을 연결할 수 있도록 마련한 placeholder입니다.',
  },
  sections: [
    {
      id: 'nav-home',
      label: '홈',
      icon: 'home',
      sectionId: 'home',
    },
    {
      id: 'nav-details',
      label: '일시',
      icon: 'calendar',
      sectionId: 'details',
    },
    {
      id: 'nav-location',
      label: '장소',
      icon: 'location',
      sectionId: 'location',
    },
    {
      id: 'nav-accounts',
      label: '마음',
      icon: 'gift',
      sectionId: 'accounts',
    },
    {
      id: 'nav-gallery',
      label: '갤러리',
      icon: 'gallery',
      sectionId: 'gallery',
    },
  ],
};
