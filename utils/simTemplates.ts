export const TOPICS = {
  exhibitions: [
    "올해 KIAF에서 {artist} 작가 신작 너무 신선했어요. 특히 {work}에서 한국적 모더니즘이 느껴졌음",
    "대학로 전시회 ' {title} ' 분위기 좋아요. 무료 입장 가능!",
    "부산에서 열리는 '해운대 야외 미술제' 누구 가보실 분?",
  ],
  artists: [
    "{artist}의 ' {series} ' 실제로 보니 책에서 본 느낌과 달랐음…",
    "신인 작가 @{handle} 디지털 아트, 한국적 소재로 한 디지털 아트가 일품",
  ],
  issues: [
    "요즘 {artist} 작품 경매가가 급등하던데, 이유가 뭘까요?",
    "서울시 공공미술 설치 ' {work} ' 호불호 갈리는데 어떻게 생각?",
  ],
  debates: [
    "한국화를 현대적으로 재해석하는 게 진짜 예술일까?",
    "디지털 아트 vs. 수제 캔버스, 한국에서 어느 쪽이 더 인정받을까?",
  ],
} as const;

export const COMMENTS = {
  emotional: [
    "와… 색감이 한국의 가을 같아요.",
    "이 그림 보니까 어릴 적 할머니 댁 생각나네요.",
  ],
  technical: [
    "먹(墨) 사용법이 어떤가요? 전통 수묵화 느낌도 나고…",
    "한지에 채색한 건가요? 붓터치가 독특하네요.",
  ],
  casual: [
    "대박이다 ㅋㅋ",
    "이건 '한(恨)'이 느껴진다…",
  ],
} as const;

export const NAMES   = ["김환기","이우환","백남준","천경자","XX 작가","OO 작가"];
export const WORKS   = ["어디서 무엇이 되어 다시 만나랴","점 시리즈","푸른 점화","무제"];
export const HANDLES = ["newartist_","artlover123","k-artbaby","korean_artis"]; 