/**
 * 결과 화면용 견종 장단점·지표 파생 로직.
 *
 * ⚠️ 추측 금지 원칙: 문구는 feature 점수(소스 데이터)에서 결정적으로 파생된다.
 * 우리가 쓰는 것은 라벨 문장뿐이고, 어떤 배지가 붙는지는 전부 점수가 결정한다.
 * 기준: 40 이상(높음) / 20 이하(낮음), 극단적인 순으로 장점 최대 4개·주의 최대 3개.
 */
import type { FeatureKey } from "../data/questions.ts";
import type { BreedData } from "./matching.ts";

export interface BreedBadge {
  text: string;
  kind: "good" | "care";
}

interface Rule {
  f: FeatureKey;
  dir: "high" | "low";
  kind: "good" | "care";
  text: string;
}

const HIGH = 40;
const LOW = 20;

const RULES: Rule[] = [
  // 장점 (good)
  { f: "apartment_friendly", dir: "high", kind: "good", text: "아파트 생활에 잘 적응해요" },
  { f: "novice_friendly", dir: "high", kind: "good", text: "처음 키우는 사람에게도 좋아요" },
  { f: "trainability", dir: "high", kind: "good", text: "훈련을 빠르게 배워요" },
  { f: "tolerates_alone", dir: "high", kind: "good", text: "혼자서도 의젓하게 기다려요" },
  { f: "kid_friendly", dir: "high", kind: "good", text: "아이들과 잘 지내요" },
  { f: "dog_friendly", dir: "high", kind: "good", text: "다른 강아지와 잘 어울려요" },
  { f: "stranger_friendly", dir: "high", kind: "good", text: "처음 보는 사람도 반겨요" },
  { f: "grooming_ease", dir: "high", kind: "good", text: "털 손질이 쉬운 편이에요" },
  { f: "shedding", dir: "low", kind: "good", text: "털 빠짐이 적어요" },
  { f: "barking", dir: "low", kind: "good", text: "조용한 편이에요" },
  { f: "weight_gain", dir: "low", kind: "good", text: "살이 잘 안 찌는 체질이에요" },
  { f: "cold_tolerance", dir: "high", kind: "good", text: "추운 날씨에 강해요" },
  { f: "protective", dir: "high", kind: "good", text: "집을 든든하게 지켜줘요" },
  { f: "intensity", dir: "low", kind: "good", text: "차분하고 얌전해요" },
  { f: "independence", dir: "low", kind: "good", text: "주인 껌딱지 스타일이에요" },
  // 미리 알아둘 점 (care)
  { f: "energy_level", dir: "high", kind: "care", text: "매일 충분한 운동이 꼭 필요해요" },
  { f: "tolerates_alone", dir: "low", kind: "care", text: "오래 혼자 두면 외로워해요" },
  { f: "shedding", dir: "high", kind: "care", text: "털 빠짐 대비가 필요해요" },
  { f: "barking", dir: "high", kind: "care", text: "짖음 훈련이 필요할 수 있어요" },
  { f: "grooming_ease", dir: "low", kind: "care", text: "꾸준한 미용 관리가 필요해요" },
  { f: "trainability", dir: "low", kind: "care", text: "고집이 있어 훈련에 인내가 필요해요" },
  { f: "novice_friendly", dir: "low", kind: "care", text: "경험 있는 보호자에게 적합해요" },
  { f: "prey_drive", dir: "high", kind: "care", text: "소동물 추격 본능이 강해요" },
  { f: "weight_gain", dir: "high", kind: "care", text: "체중 관리에 신경 써주세요" },
  { f: "cold_tolerance", dir: "low", kind: "care", text: "겨울엔 방한이 필요해요" },
  { f: "stranger_friendly", dir: "low", kind: "care", text: "낯가림이 있는 편이에요" },
  { f: "independence", dir: "high", kind: "care", text: "모험심이 많아 탈출 방지가 필요해요" },
];

/** 점수가 극단적인 순으로 장점 최대 4개, 주의점 최대 3개 배지 도출 */
export function getBreedBadges(breed: BreedData): BreedBadge[] {
  const hits = RULES.filter((r) => {
    const v = breed.features[r.f];
    return r.dir === "high" ? v >= HIGH : v <= LOW;
  }).sort(
    (a, b) =>
      Math.abs(breed.features[b.f] - 30) - Math.abs(breed.features[a.f] - 30),
  );
  return [
    ...hits.filter((r) => r.kind === "good").slice(0, 4),
    ...hits.filter((r) => r.kind === "care").slice(0, 3),
  ].map(({ text, kind }) => ({ text, kind }));
}

// "상상 일상" 서사 — 배지와 같은 추측 금지 원칙: 각 문장이 feature 값에 결정적으로 대응.
// 견종에서 가장 극단적인(변별력 큰) 장면 4개를 골라 하루 순서(order)로 이어 한 문단을 만든다.
const MID = 30;

interface DayScene {
  f: FeatureKey;
  order: number;
  high: string;
  low: string;
}

const DAY_SCENES: DayScene[] = [
  { f: "energy_level", order: 0,
    high: "아침이 밝기 무섭게 침대 위로 뛰어올라 산책을 조릅니다.",
    low: "아침엔 이불 속에서 함께 늦잠을 자며 느긋하게 하루를 엽니다." },
  { f: "independence", order: 1,
    high: "호기심이 많아 새 냄새만 나면 혼자 탐험을 떠나려 해요.",
    low: "어딜 가든 당신 뒤를 졸졸 따라다니는 껌딱지예요." },
  { f: "tolerates_alone", order: 2,
    high: "당신이 없는 낮에도 의젓하게 혼자만의 시간을 보냅니다.",
    low: "집을 비우면 문 앞에서 하염없이 당신을 기다려요." },
  { f: "stranger_friendly", order: 3,
    high: "초인종이 울리면 제일 먼저 달려나가 꼬리로 손님을 반깁니다.",
    low: "낯선 손님이 오면 당신 뒤에 숨어 조심스레 살펴요." },
  { f: "barking", order: 4,
    high: "낯선 소리엔 우렁차게 짖어 온 집안에 알립니다.",
    low: "웬만해선 짖지 않아 온종일 조용합니다." },
  { f: "protective", order: 5,
    high: "누가 다가오면 당신을 등 뒤로 감싸는 든든한 보디가드가 돼요.",
    low: "경계심이 없어 누구에게나 배를 내보이며 발라당 누워요." },
  { f: "intensity", order: 6,
    high: "퇴근길 문소리에 온몸을 흔들며 폭발적으로 반겨줍니다.",
    low: "반가워도 눈빛과 살랑이는 꼬리로만 은은하게 표현해요." },
  { f: "cold_tolerance", order: 7,
    high: "한겨울 눈밭에서도 신나서 뛰노는 추위 강자예요.",
    low: "쌀쌀해지면 담요 속으로 파고드는 추위 타는 아이예요." },
];

/** 견종 feature에서 파생한 "이 아이와의 하루" 한 문단 */
export function getBreedDayStory(breed: BreedData): string {
  return DAY_SCENES.map((s) => ({ s, v: breed.features[s.f] }))
    .sort((a, b) => Math.abs(b.v - MID) - Math.abs(a.v - MID))
    .slice(0, 4)
    .sort((a, b) => a.s.order - b.s.order)
    .map(({ s, v }) => (v >= MID ? s.high : s.low))
    .join(" ");
}

/** registry group 한글 표기 (7개 고정값 — 결정적 매핑) */
export const GROUP_KO: Record<string, string> = {
  Companion: "반려견",
  Working: "사역견",
  Herding: "목양견",
  Sporting: "조렵견",
  Hound: "하운드",
  Guardian: "경비견",
  Terrier: "테리어",
};

/** 그룹별 한 줄 설명 (견종의 전통적 역할 분류 — 정보 아이콘 툴팁용) */
export const GROUP_DESC: Record<string, string> = {
  Companion: "곁에서 함께하는 반려 목적으로 길러진 품종이에요. (예: 치와와, 말티즈)",
  Working: "썰매·구조·경비 등 사람의 일을 돕도록 길러진 품종이에요. (예: 허스키, 로트와일러)",
  Herding: "양·소 등 가축을 몰도록 길러진 품종이에요. (예: 보더 콜리, 코기)",
  Sporting: "새 사냥을 돕도록 길러진 활동적인 품종이에요. (예: 리트리버, 스패니얼)",
  Hound: "뛰어난 후각·시각으로 사냥감을 쫓도록 길러진 품종이에요. (예: 비글, 닥스훈트)",
  Guardian: "가축과 집을 지키도록 길러진 든든한 품종이에요. (예: 마스티프, 그레이트 피레니즈)",
  Terrier: "쥐·여우 등 소동물을 사냥하도록 길러진 다부진 품종이에요. (예: 요크셔 테리어)",
};

/** 상세 패널의 지표 바 (0~50 값) */
export function getBreedStats(breed: BreedData) {
  return [
    { label: "에너지", value: breed.features.energy_level },
    { label: "훈련 습득력", value: breed.features.trainability },
    { label: "털 빠짐", value: breed.features.shedding },
    { label: "사교성", value: breed.features.stranger_friendly },
  ];
}
