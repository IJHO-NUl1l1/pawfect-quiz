/**
 * 퀴즈 문항 데이터 — 원문: docs/quiz-draft.md (v4, 2026-07-08, 14문항)
 *
 * 문항 순서 규칙 (CLAUDE.md): 변별 weight 오름차순 — 앞은 가벼운 소프트 신호,
 * 뒤로 갈수록 견종 구분이 강하게 나뉘는 문항 (피날레 = 크기).
 * 선택지 배열 규칙 (CLAUDE.md): 1번 = 가장 라이트 → 마지막 = 가장 헤비.
 *
 * scores = 선택지의 feature delta (채점 메커니즘은 CLAUDE.md 참고):
 * - 프로필은 전 feature 중립값 30에서 시작, 응답마다 delta 누적, [10, 50] 클램프.
 * - 도달 가능성 불변식: 취향형 feature는 문항별 최대 delta 합 = +20, 최소 합 = −20
 *   (즉 질문만으로 10과 50 양끝에 정확히 도달 가능). 조건부 feature는 요구 방향만.
 * - 검증: npm run quiz:validate (scripts/validate-quiz.mts)
 */

export const FEATURE_KEYS = [
  "apartment_friendly",
  "size",
  "energy_level",
  "tolerates_alone",
  "shedding",
  "grooming_ease",
  "trainability",
  "barking",
  "kid_friendly",
  "dog_friendly",
  "stranger_friendly",
  "prey_drive",
  "novice_friendly",
  "protective",
  "coat_length",
  "weight_gain",
  "cold_tolerance",
  "independence",
  "intensity",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

/** 절대 필터가 참조할 수 있는 값: feature 점수 또는 실측 몸무게(kg) */
export type FilterKey = FeatureKey | "weightKg";

export interface QuizOption {
  label: string;
  scores: Partial<Record<FeatureKey, number>>;
  /**
   * 절대 필터 (2026-07-08): 이 선택지를 고르면 해당 값이 범위 안인
   * 견종만 후보로 남긴다. 확실한 수치로 갈리는 요구조건(크기 등)에만 사용.
   * 크기는 registry의 size 등급이 부정확한 견종이 있어(스탠더드 푸들 24.9kg=2등급 등)
   * 실측 몸무게(weightKg) 기준으로 필터한다.
   */
  filters?: Partial<Record<FilterKey, readonly [number, number]>>;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

/**
 * 조건부(요구조건형) feature: 아래 선택지를 골랐을 때만 채점(거리 계산)에 포함한다.
 * 예: 고양이와 살지 않는 사용자에게 prey_drive 차이는 무의미하므로 제외.
 */
export const CONDITIONAL_FEATURES: Record<
  string,
  { questionId: string; optionIndex: number }
> = {
  prey_drive: { questionId: "family", optionIndex: 1 }, // 고양이·소동물 동거
  dog_friendly: { questionId: "family", optionIndex: 2 }, // 둘째 강아지
  kid_friendly: { questionId: "family", optionIndex: 3 }, // 아이 있는 집
};

export const QUESTIONS: QuizQuestion[] = [
  // ── 전반부: 소프트 신호 (성격·라이프스타일 취향) ──
  {
    id: "personality",
    text: "어떤 성격의 강아지와 함께하고 싶나요?",
    options: [
      {
        label: "겁이 많고 소심해도 주인만 바라보는 조용한 껌딱지 강아지",
        scores: {
          stranger_friendly: -10,
          protective: -8,
          independence: -5,
          intensity: -5,
          energy_level: -3,
        },
      },
      {
        label: "모든 사람들의 사랑을 독차지 하고 싶어하는 사람 좋아 강아지",
        scores: { stranger_friendly: 10, protective: -4 },
      },
      {
        label: "용맹하고 든든한 경찰견 or 보디가드 강아지",
        scores: {
          protective: 12,
          stranger_friendly: -6,
          trainability: 4,
          intensity: 2,
        },
      },
      {
        label: "하루 10km 달리기도 거뜬한 어질리티 천재 운동 천재 강아지",
        scores: {
          energy_level: 3,
          trainability: 4,
          independence: 5,
          intensity: 5,
        },
      },
    ],
  },
  {
    id: "bond",
    text: "강아지와 나, 어떤 사이였으면 좋겠어요?",
    options: [
      {
        label: "24시간 껌딱지 — 화장실까지 따라와도 행복해요",
        scores: { independence: -15, tolerates_alone: -6 },
      },
      {
        label: "껌딱지까진 아니어도 늘 같은 방에 붙어 있는 사이",
        scores: { independence: -6, tolerates_alone: -2 },
      },
      {
        label: "각자 할 일 하다가 만나는 쿨한 룸메이트",
        scores: { independence: 8, tolerates_alone: 2 },
      },
      {
        label: "호기심 넘치는 모험가 — 새 냄새만 나면 탐험 출발!",
        scores: { independence: 15, tolerates_alone: 6 },
      },
    ],
  },
  {
    id: "expression",
    text: "강아지의 텐션은 어느 정도가 좋아요?",
    options: [
      {
        label: "고요하고 잔잔하게 — 눈빛으로 교감하는 스타일",
        scores: { intensity: -15, energy_level: -3 },
      },
      {
        label: "꼬리 살랑살랑 — 은은하게 표현하는 정도",
        scores: { intensity: -6, energy_level: -1 },
      },
      {
        label: "퇴근하면 신나서 뱅글뱅글 환영 파티",
        scores: { intensity: 6, energy_level: 1 },
      },
      {
        label: "온몸으로 돌진하는 저세상 텐션도 다 받아줄게요",
        scores: { intensity: 15, energy_level: 3 },
      },
    ],
  },
  {
    id: "weekend",
    text: "주말 아침, 눈 뜨자마자 하고 싶은 건?",
    options: [
      {
        label: "이불 속에서 밀린 드라마 정주행 — 주말은 쉬는 날이죠",
        scores: { energy_level: -6 },
      },
      {
        label: "동네 카페까지 슬렁슬렁 산책 정도?",
        scores: { energy_level: -2 },
      },
      {
        label: "공원에서 가볍게 러닝이나 자전거 타기",
        scores: { energy_level: 2 },
      },
      {
        label: "등산이든 한강 10km든 — 몸을 써야 진짜 주말이죠",
        scores: { energy_level: 6 },
      },
    ],
  },
  {
    id: "weekday",
    text: "평일 낮, 우리 집 풍경은?",
    options: [
      {
        label: "야근에 약속에… 집을 자주, 오래 비워요",
        scores: { tolerates_alone: 10 },
      },
      {
        label: "아침에 나가면 저녁에야 돌아와요",
        scores: { tolerates_alone: 4 },
      },
      {
        label: "반나절 정도만 비우고 금방 돌아와요",
        scores: { tolerates_alone: -4 },
      },
      {
        label: "재택근무라 거의 항상 함께 있어줄 수 있어요",
        scores: { tolerates_alone: -10 },
      },
    ],
  },
  {
    id: "experience",
    text: "강아지와 살아본 적 있나요?",
    options: [
      {
        label: "완전 처음이라 설렘 반 걱정 반이에요",
        scores: { novice_friendly: 15 },
      },
      {
        label: "처음이지만 영상 보면서 공부 많이 했어요",
        scores: { novice_friendly: 8 },
      },
      {
        label: "한 번 키워봐서 어느 정도는 알아요",
        scores: { novice_friendly: -4 },
      },
      {
        label: "어릴 때부터 쭉 — 강아지 없는 집을 상상 못 해요",
        scores: { novice_friendly: -15 },
      },
    ],
  },
  {
    id: "training",
    text: "강아지 교육, 어떻게 시킬 생각이에요?",
    options: [
      {
        label: "순한 아이 만나서 자연스럽게 지내고 싶어요",
        scores: { trainability: -14, novice_friendly: 5 },
      },
      {
        label: "배변이랑 기본 예절만 되면 충분해요",
        scores: { trainability: -5, novice_friendly: 2 },
      },
      {
        label: "'앉아'부터 하이파이브까지 — 같이 배우는 게 재밌을 것 같아요",
        scores: { trainability: 6, novice_friendly: -2 },
      },
      {
        label: "훈련사님 수업까지 들으면서 제대로 가르쳐볼 거예요",
        scores: { trainability: 12, novice_friendly: -5 },
      },
    ],
  },
  {
    id: "treats",
    text: "간식 달라고 눈망울 공격이 들어왔다!",
    options: [
      {
        label: "그 눈빛을 어떻게 이겨요… 달라는 대로 주게 될 것 같아요",
        scores: { weight_gain: -20, trainability: -6 },
      },
      {
        label: "그때그때 기분 따라 유연하게 간식 타임",
        scores: { weight_gain: -8, trainability: -2 },
      },
      {
        label: "간식은 훈련 성공했을 때 보상으로만",
        scores: { weight_gain: 8, trainability: 3 },
      },
      {
        label: "정량 급여에 수제 간식까지 — 식단 관리 제대로 할 거예요",
        scores: { weight_gain: 20, trainability: 4 },
      },
    ],
  },
  // ── 후반부: 변별 weight 큰 문항 (견종 구분 강함) ──
  {
    id: "doorbell",
    text: "현관 벨이 울렸어요. 강아지가 어떻게 반응하면 좋겠어요?",
    options: [
      {
        label: "짖는 건 곤란해요 — 우리 집은 방음이 약하거든요",
        scores: { barking: -15, protective: -8, stranger_friendly: -6 },
      },
      {
        label: "무심하게 내 옆에 딱 붙어 있기 — 세상 조용하게",
        scores: { barking: -10, protective: -12, stranger_friendly: -10 },
      },
      {
        label: "꼬리 흔들며 손님을 제일 먼저 반기는 인싸견이었으면",
        scores: { stranger_friendly: 10, barking: 0 },
      },
      {
        label: "누가 왔는지 우렁차게 알려주는 믿음직한 경비 알람이 됐으면",
        scores: { barking: 15, protective: 8, stranger_friendly: -4 },
      },
    ],
  },
  {
    id: "walk",
    text: "산책은 어떤 스타일이 될 것 같아요?",
    options: [
      {
        label: "솔직히 자주는 못 해줄 것 같아요 — 실내 놀이 위주로",
        scores: { energy_level: -8, cold_tolerance: -20 },
      },
      {
        label: "날씨 좋은 날 골라서 가볍게 다녀올게요",
        scores: { energy_level: -3, cold_tolerance: -6 },
      },
      {
        label: "아침저녁으로 꼬박꼬박, 루틴대로 나가요",
        scores: { energy_level: 3, cold_tolerance: 6 },
      },
      {
        label: "어질리티든 등산이든 — 눈밭이든 빗속이든 뭐든 같이해요",
        scores: { energy_level: 8, cold_tolerance: 20 },
      },
    ],
  },
  {
    id: "coat",
    text: "강아지 털에 대한 솔직한 마음은?",
    options: [
      {
        label: "짧고 털빠짐 적은 깔끔한 스타일이 좋아요 — 청소는 최소로",
        scores: { coat_length: -20, shedding: -20, grooming_ease: 20 },
      },
      {
        label: "어떤 털이든 좋은데, 옷에 붙는 건 좀 곤란해요",
        scores: { coat_length: -6, shedding: -10, grooming_ease: 8 },
      },
      {
        label: "복슬복슬 장모도 환영 — 빗질쯤이야 힐링이죠",
        scores: { coat_length: 12, shedding: 6, grooming_ease: -8 },
      },
      {
        label: "길든 많이 빠지든 상관없어요 — 미용실 비용도 아낌없이 쓸게요",
        scores: { coat_length: 20, shedding: 20, grooming_ease: -20 },
      },
    ],
  },
  {
    id: "family",
    text: "지금 집에는 누구누구 살아요?",
    options: [
      {
        label: "나 혼자 — 강아지가 첫 식구가 될 거예요",
        scores: { tolerates_alone: 4 },
      },
      {
        label: "고양이(또는 햄스터·새)가 먼저 자리 잡고 있어요",
        scores: { prey_drive: -20, tolerates_alone: 2 },
      },
      {
        label: "이미 강아지가 한 마리 — 둘째 계획 중이에요",
        scores: { dog_friendly: 20, tolerates_alone: 0 },
      },
      {
        label: "아이까지 있는 북적북적 대가족이에요",
        scores: { kid_friendly: 20, tolerates_alone: -4 },
      },
    ],
  },
  {
    id: "housing",
    text: "지금 살고 있는 집은 어떤 곳인가요?",
    options: [
      {
        label: "벽이 얇아서 층간소음이 걱정되는 집이에요 — 조용해야 해요",
        scores: { apartment_friendly: 20, barking: -5 },
      },
      {
        label: "나 하나로도 꽉 차는 아늑한 원룸이에요",
        scores: { apartment_friendly: 10, barking: -2 },
      },
      {
        label: "방이 여러 개인 널찍한 아파트예요",
        scores: { apartment_friendly: -8, barking: 0 },
      },
      {
        label: "마당 있는 단독주택 — 대형견도 마음껏 뛰놀 수 있어요",
        scores: { apartment_friendly: -20, barking: 5 },
      },
    ],
  },
  {
    // 크기는 델타가 아닌 절대 필터 — 선택한 범위 밖의 견종은 후보에서 제외.
    // 실측 몸무게 기준. 밴드별 견종 수가 고르도록 4분위 근사(7/18/28kg)로 잡아
    // 밴드 간 1위 쏠림을 완화 (밴드별 후보 47/40/55/51, 기존 24/41/58/70).
    id: "size",
    text: "강아지를 품에 안는 상상을 해보세요. 어떤 느낌이 좋아요?",
    options: [
      {
        label: "한 손에 쏙 들어오는 소형견 (~7kg)",
        scores: {},
        filters: { weightKg: [0, 7] },
      },
      {
        label: "무릎 위에 딱 맞는 아담한 중형견 (7~18kg)",
        scores: {},
        filters: { weightKg: [7, 18] },
      },
      {
        label: "안으면 팔이 꽉 차는 든든한 대형견 (18~28kg)",
        scores: {},
        filters: { weightKg: [18, 28] },
      },
      {
        label: "오히려 걔가 날 안아줄 것 같은 초대형견 (28kg~)",
        scores: {},
        filters: { weightKg: [28, 999] },
      },
    ],
  },
];
