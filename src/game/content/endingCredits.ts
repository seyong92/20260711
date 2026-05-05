export interface EndingCreditEntry {
  fileName: string
  caption: string
  alt: string
}

export const ENDING_CREDITS: EndingCreditEntry[] = [
  {
    fileName: 'credit-01.jpg',
    caption: '처음의 설렘이 그대로 남아 있는, 푸른 계절의 한 장면.',
    alt: '꽃이 핀 야외에서 함께 찍은 신랑과 신부의 셀카',
  },
  {
    fileName: 'credit-02.jpg',
    caption: '긴 여정을 하나 마친 날, 서로가 가장 먼저 축하해 준 순간.',
    alt: '졸업복을 입고 꽃다발을 든 신랑과 곁에 선 신부',
  },
  {
    fileName: 'credit-03.jpg',
    caption: '용사님의 중요한 발표를 지켜보며 쌓아 간 든든한 응원.',
    alt: '학술 발표 무대에서 발표하는 신부',
  },
  {
    fileName: 'credit-04.jpg',
    caption: '낯선 곳에서도 둘이 함께라면 금세 추억이 되는 시간.',
    alt: '학회 포토월 앞에 함께 선 신랑과 신부',
  },
  {
    fileName: 'credit-05.jpg',
    caption: '꽃다발처럼 환하게 남은 축하와 감사의 하루.',
    alt: '꽃다발을 들고 웃는 신부',
  },
  {
    fileName: 'credit-06.jpg',
    caption: '맛있는 음식과 웃음으로 채워진 평범해서 더 소중한 저녁.',
    alt: '식당에서 지인들과 함께 식사하는 신랑과 신부',
  },
  {
    fileName: 'credit-07.jpg',
    caption: '장난스러운 표정까지 닮아 가던, 둘만의 가벼운 모험.',
    alt: '거울 앞에서 함께 찍은 신랑과 신부의 사진',
  },
  {
    fileName: 'credit-08.jpg',
    caption: '바람이 좋은 풍경 속에서 잠시 쉬어 간 두 사람.',
    alt: '풍력발전기가 보이는 초원에서 함께 선 신랑과 신부',
  },
  {
    fileName: 'credit-09.jpg',
    caption: '노래처럼 오래 남을, 밝고 다정한 용사님의 순간.',
    alt: '음악 공간에서 마이크를 든 신부',
  },
  {
    fileName: 'credit-10.jpg',
    caption: '일상 속 작은 장난도 둘에게는 특별한 이벤트가 되었어요.',
    alt: '해바라기 탈을 쓴 신랑',
  },
  {
    fileName: 'credit-11.jpg',
    caption: '멀리 있어도 함께 응원하던 마음은 같은 화면 위에 있었습니다.',
    alt: '화상 화면이 보이는 발표장',
  },
  {
    fileName: 'credit-12.jpg',
    caption: '마지막 관문 앞에서도 서로를 떠올리며 단단히 서 있던 날.',
    alt: '졸업복을 입고 피아노 옆에 선 신랑',
  },
  {
    fileName: 'credit-13.jpg',
    caption: '끝난 뒤에야 웃을 수 있었던 긴장과 안도의 기록.',
    alt: '졸업복을 입은 신랑과 함께 찍은 신부의 셀카',
  },
  {
    fileName: 'credit-14.jpg',
    caption: '그리고 다시, 새로운 시작을 향해 함께 걸어갑니다.',
    alt: '문화기술대학원 앞에서 졸업복을 입고 꽃다발을 든 신랑',
  },
]

export function getEndingCreditImageKey(index: number) {
  return `ending-credit-${index}`
}

export function getEndingCreditImageUrl(fileName: string) {
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${baseUrl}images/game/ending-credits/${fileName}`
}
