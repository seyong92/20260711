import type { SiteContent } from '../types/site'

export const siteContent: SiteContent = {
  couple: {
    groom: '김지훈',
    bride: '이민아',
  },
  hero: {
    eyebrow: 'Save Our Date',
    dateLabel: '2024. 11. 23',
    timeLabel: '토요일 오후 12시 30분',
    image: {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCbnAcJpx-xJ2UV8NcSGAGWZ8Ntdemro9rtOatDiyGJg_B1KAUfbKJHg95KnbLoFrYbipDby0e8YH4KlK0_T1qB5a9LkeNDhyfHtq7aT4-q2kvDhmURrYG5DBxzXBmpHcTVLejpVYUsHSZlSYfe_tFf8X19955mjUtx3OrQiQP6TL3OBjQiYrqJrfb5ODYacGS0eFTVgyXs6vt3iEU-CagJYosT2z_QTfETuEXbM3DCwMVbAEafokLkINBfCuGKNaaOAkfSOpEJWk',
      alt: '한옥 사이에 선 신랑 신부 웨딩 사진',
    },
  },
  invitation: {
    headline: [
      '계절의 문턱에서',
      '우리의 가장 찬란한 순간을',
      '함께하고 싶습니다.',
      '',
      '두 사람이 하나 되어 걷는',
      '첫 걸음을 축복해 주세요.',
    ],
    closingIconLabel: '초대의 마음',
  },
  family: {
    groom: {
      roleLabel: '신랑 혼주',
      parents: ['김철수', '박영희'],
      relation: '의 아들',
      name: '지훈',
    },
    bride: {
      roleLabel: '신부 혼주',
      parents: ['이상혁', '최윤서'],
      relation: '의 딸',
      name: '민아',
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
        value: ['서울 호텔, 2층', '그랜드 볼룸'],
      },
    ],
  },
  location: {
    title: '오시는 길',
    venue: '서울 호텔 그랜드 볼룸',
    address: '서울 중구 을지로 30, 2층 그랜드 볼룸',
    directions: [
      '지하철 2호선 을지로입구역 5번 출구에서 도보 7분',
      '예식장 지하 주차장 2시간 무료 이용 가능',
      '혼잡 시간대에는 대중교통 이용을 권장드립니다.',
    ],
    mapEmbedUrl:
      'https://www.openstreetmap.org/export/embed.html?bbox=126.9752%2C37.5654%2C126.9838%2C37.5708&layer=mapnik&marker=37.5681%2C126.9795',
    mapFallbackImage: {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAklogvz84IOL3UQJTGtyjFp2MyMTqV1jArqtPFGPmhG9pTtDDYG1EkHSqJnEOfaQ8VWx0G-idfdjiklW4TcHevsHut1ug3TlBVA2oiyvqm_AovuEHXFXpbl3Tl2UPmxcy25tzYDVz1KGih5Zgp0Z--q0a00Z2MmsQF2oz21cAHh2m7co5OAqTtlzcPOh9GbGixfpS2l3dloiTSpyoliF85YJi0RCZT3B3-DBRjPlW3uE6DgpPt3WOxod1td0IuzLjo3CYyZ-aCykw',
      alt: '예식장 위치 안내 지도 이미지',
    },
    mapLinks: [
      {
        provider: 'NAVER',
        label: '네이버지도',
        href: 'https://map.naver.com/p/search/%EC%84%9C%EC%9A%B8%20%ED%98%B8%ED%85%94',
      },
      {
        provider: 'KAKAO',
        label: '카카오맵',
        href: 'https://map.kakao.com/link/search/%EC%84%9C%EC%9A%B8%20%ED%98%B8%ED%85%94',
      },
      {
        provider: 'T-MAP',
        label: '티맵',
        href: 'tmap://search?name=%EC%84%9C%EC%9A%B8%20%ED%98%B8%ED%85%94',
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
        holder: '신랑 김지훈',
        side: 'groom',
        relationship: '신랑',
      },
      {
        bank: '국민은행',
        accountNumber: '123456-01-987654',
        holder: '혼주 김철수',
        side: 'groom',
        relationship: '혼주',
      },
      {
        bank: '농협은행',
        accountNumber: '302-0000-1111-22',
        holder: '혼주 박영희',
        side: 'groom',
        relationship: '혼주',
      },
      {
        bank: '우리은행',
        accountNumber: '1002-987-654321',
        holder: '신부 이민아',
        side: 'bride',
        relationship: '신부',
      },
      {
        bank: '기업은행',
        accountNumber: '010-1234-5678-90',
        holder: '혼주 이상혁',
        side: 'bride',
        relationship: '혼주',
      },
      {
        bank: '하나은행',
        accountNumber: '123-456789-00107',
        holder: '혼주 최윤서',
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
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCY58malGOCe_NKfBQVuDhLndqOh7lUkKE80yNC_3mb5uZ-ihzwNGqQq8Y_r73G1JrlPE8AY9hIHBPRelyjj4trSzEqv-Dxru901QrggAF4rF0jj7r4plBWB7IftJkJasQVOA0OJeLDxVHdi0S8EtgsFi0RmNLtt4NIYCUl6nnaqkUtvLCU8jFzM_G35BGEfJ2BFyVlZt18-uhqVYbqrn25pSXyMn5AR097lwWh5mYqBKrtUNT1p8EGg89pIhQSXoNOouZb395yz2U',
        alt: '웨딩 갤러리 사진 1',
        ratio: '1 / 1',
      },
      {
        id: 'gallery-2',
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPLmhNKrMmcsrnFfT-uv0CCAkFspkrpyRYywT4siMmU92LPYhFfFLY3jF4bQy6aBsY2rcEXb-U1Q8Fj2jiMqMolFBybaog4267bJeSr2pZKE_5xlh76Gpdy_KLHrmPdzNe9TfXewk_MwiM1Y7uVlt9-dwsBDvduEq1JXze2dPpX-gVjc2D6CoKTuLV5qhaLTUmVSSvCXI0kLxf4aQvMp-MKX_7zOwmDWQmPoVc4HvzKKxTpoVw4Y3LIVsd_B4dMiLn8_e_5-NoeGo',
        alt: '웨딩 갤러리 사진 2',
        ratio: '1 / 1',
      },
      {
        id: 'gallery-3',
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcR2CLzv6to3ZnXrNAxKnbiNcJZGfRYj80gtEuNPxOj9ncP2R914LCI4keKhcbsVEVJ_l0XabY5agCJHABxf-XUAb_2i-nAwbkkEwcAP4w1IqQkfoAaY1NwRA51QYGI3vGNTjNe-ZY_vouXfLkOSgxgJsBboYqUxYh8D5VrGmgLsvH5mt2tLPAqbDYWwcTchKmtCYf2RoNhB5wQfhCCAH2jGVrYxZIkXvzXyPQSrMSKR4K0QL_DRAhjgnYmnGF2oyjUQKpJRnafWc',
        alt: '웨딩 갤러리 사진 3',
        ratio: '1 / 1',
      },
      {
        id: 'gallery-4',
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMAzGPHeJVROqu5BsuPaabYnsxCjoJt-PssZRsQiZr2JLwCWL8TymFAjybGRNJKgD-LTpN5M5JgvOs49GXyqAt5PpYg2-V4naWKCYr-s9egd41FKXcNUGDc-HaWAKRG7RX4ADDuW8n0MiFmc2lGA7X-K2zhZ7KXIO9-V56UJWIkh4_NKTMy48cjWlyWX2b-RuOQ3RSm9nf0jEiJcxvNtZrWgbuUBQBmLqhZ78RoSqPC1CRzXNyyv_ykQtk5NH2Lh1JebIZwP4bLHg',
        alt: '웨딩 갤러리 사진 4',
        ratio: '4 / 3',
      },
      {
        id: 'gallery-5',
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBO44hLvmVKDsufXU1H9sGHc7MvbvIWCkb2755si83LVLo7D_EK9hlYam8qQ2RT-IdZJZf_jjOWTAhNy_XTJDqnp9ch3OBwJJFx0yJMjupXnt8pNLiUxBOToPpniQDaAuXNghjkESPy0WyRxvfP8eL6xmUgnvpYgHg4LgmEGxm5p7zAUTUZnkyTBRJq_AXdaVGPQPQg9XD5oh8X5YbW9F0ES7Z_7CmVMRAlWssNhgh3ydci0lMAJmD0bOLmJRzbeX2o-HvEcek0tI',
        alt: '웨딩 갤러리 사진 5',
        ratio: '3 / 4',
      },
      {
        id: 'gallery-6',
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeB7o8tmGT7LqoWsI71tExIGQIuL6GgORiCMncdDC8gPT0gb-kWWWJwX3kaUcMAyZ7CVrO4b_eN4JgSEZGAtbMACLLbrOguRCJnKlzW2QVlL7oVn_GMEs4wdZ_Ezq9fR377MIqp6MuG-N2Ql6F3eim5sn6IcqkE2fIiHofzTxIdtJLxewE2a_zS0YSVG1GYzjWTgTg--dXpTxJSxoo7loeB3NWwvZPFi3TzgsDEWt52k19BNLqJqDA6b8n5wLSBH2EyIxwkiNCyrE',
        alt: '웨딩 갤러리 사진 6',
        ratio: '1 / 1',
      },
      {
        id: 'gallery-7',
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhBLO2QY4VZXtFcw2C13Fj47GLN4Uwi3IysoUTN8X7xJrW5Ak_qgJbDjKgbnsYdSOb7JA0BUmcC1N1k4uuOjBIt8Z9fmvmuDKChDYkcqj79Y4MebP2hJnRoEb079sTAGWLSY_VXFX7okUcGa6nYuhf0m9t92b-82EDF4gFoEDqDnjxP-PYjSM9v96z2KZOMQB6af6w6kvq39Nn1Fz3cXMLyHnHkftx01pGHOPp29Pb4eVdv7BFFM7EIdNmBTo4-pIy0sBr9Ok8Qeg',
        alt: '웨딩 갤러리 사진 7',
        ratio: '16 / 9',
      },
    ],
  },
  footer: {
    license: '© 2024 Ji-hoon & Min-ah. Crafted with love.',
  },
  gameEntry: {
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
}
