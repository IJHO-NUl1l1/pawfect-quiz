/**
 * 4단계: 확정 특징 세트 적용 → public/data/breeds.json
 *
 * 특징 세트는 3-analyze의 변별력 리포트(data/analysis.md)를 근거로 확정했다:
 *  - std 높고 최빈값 집중도 낮은 것 우선
 *  - |r| ≥ 0.7 쌍은 하나만 (e3_exercise_needs는 e1과 r=0.72라 탈락)
 *  - 사용자 라이프스타일 질문으로 변환 가능한 것만
 *    (탈락 예: b1 가족 애정도 — 74%가 5점, c4 건강 — 질문 불가,
 *     c2 침 흘림 — 66%가 1점, a2 초보 적합 — a1과 r=0.61 + 질문 중복)
 *  - size는 registry 값 사용: 교차 검증 r=0.86으로 신뢰도 최고이고,
 *    푸들 크기 변형(토이/미니/스탠더드)이 DogTime에선 한 항목이라 registry가 정확
 *
 * 사용법: node scripts/4-build.mts
 */
import path from "node:path";
import { DATA_DIR, ROOT, readJson, writeJson } from "./util.mts";
import { nameKo } from "./name-ko.mts";
import { descKo } from "./desc-ko.mts";

interface MergedBreed {
  id: string;
  name: string;
  dogtime: Record<string, number | string>;
  dogapi: { temperament: string | null; description: string | null; life_span: string } | null;
  registry: {
    general: {
      name: string;
      group: string;
      personalityTraits: string[];
      shortDescription: string;
      popularity: number | null;
      weight: number;
      lifespan: number;
    };
    behavior: Record<string, number>;
    physical: { size: number; coatLength: number };
    images: {
      small: Record<"indoors" | "outdoors" | "studio", string>;
      large: Record<"indoors" | "outdoors" | "studio", string>;
    };
  };
}

/**
 * 점수 스케일: 소스의 1~5점을 ×10 해서 10~50으로 저장한다 (2026-07-08, CLAUDE.md 수행 과제).
 * 여러 문항의 증감을 누적하는 채점(선택지당 ±3~±15 수준)을 정수로 표현하기 위함.
 */
const SCALE = 10;

/** 확정 특징 세트 (소스 원값 1~5 기준, 저장 시 SCALE 적용) */
const FEATURES: Record<string, (m: MergedBreed) => number> = {
  apartment_friendly: (m) => Number(m.dogtime.a1_adapts_well_to_apartment_living),
  size: (m) => m.registry.physical.size,
  energy_level: (m) => Number(m.dogtime.e1_energy_level),
  tolerates_alone: (m) => Number(m.dogtime.a4_tolerates_being_alone),
  shedding: (m) => Number(m.dogtime.c1_amount_of_shedding),
  grooming_ease: (m) => Number(m.dogtime.c3_easy_to_groom),
  trainability: (m) => Number(m.dogtime.d1_easy_to_train),
  barking: (m) => Number(m.dogtime.d5_tendency_to_bark_or_howl),
  kid_friendly: (m) => Number(m.dogtime.b2_incredibly_kid_friendly_dogs),
  dog_friendly: (m) => Number(m.dogtime.b3_dog_friendly),
  stranger_friendly: (m) => Number(m.dogtime.b4_friendly_toward_strangers),
  prey_drive: (m) => Number(m.dogtime.d4_prey_drive),
  // 2026-07-07 확장: 후보 11개 변별력 재분석 후 5개 추가 (17문항 확정)
  novice_friendly: (m) => Number(m.dogtime.a2_good_for_novice_owners),
  protective: (m) => m.registry.behavior.protectiveInstincts,
  coat_length: (m) => Number(m.registry.physical.coatLength),
  weight_gain: (m) => Number(m.dogtime.c5_potential_for_weight_gain),
  cold_tolerance: (m) => Number(m.dogtime.a5_tolerates_cold_weather),
  // 2026-07-08 성격 축 보강: 독립성(방랑·모험 성향), 격렬함(표현 강도).
  // AKC 트레이트는 변별력 미달로 탈락, DogTime 미사용 점수 재채택 (std 1.16 / 1.07)
  independence: (m) => Number(m.dogtime.d6_wanderlust_potential),
  intensity: (m) => Number(m.dogtime.e2_intensity),
};

const merged = readJson<MergedBreed[]>(path.join(DATA_DIR, "merged.json"));

const missingKo: string[] = [];
const missingDesc: string[] = [];
const breeds = merged.map((m) => {
  const ko = nameKo[m.id];
  if (!ko) missingKo.push(m.id);
  if (!descKo[m.id]) missingDesc.push(m.id);
  const features = Object.fromEntries(
    Object.entries(FEATURES).map(([k, get]) => [k, get(m) * SCALE]),
  );
  const g = m.registry.general;
  return {
    id: m.id,
    nameEn: g.name,
    nameKo: ko ?? g.name,
    features,
    meta: {
      group: g.group,
      weightKg: Math.round(g.weight * 0.4536 * 10) / 10,
      lifespan: m.dogapi?.life_span ?? String(g.lifespan),
      traits: g.personalityTraits,
      description: g.shortDescription,
      descriptionKo: descKo[m.id] ?? null,
      temperament: m.dogapi?.temperament ?? null,
      popularity: g.popularity,
    },
    images: {
      card: m.registry.images.large.studio,
      cardSmall: m.registry.images.small.studio,
      indoors: m.registry.images.large.indoors,
      outdoors: m.registry.images.large.outdoors,
    },
  };
});

// --- 검증 ---
const bad = breeds.filter((b) =>
  Object.values(b.features).some(
    (v) => !Number.isInteger(v) || v < 1 * SCALE || v > 5 * SCALE || v % SCALE !== 0,
  ),
);
if (bad.length)
  throw new Error(`10~50 (×${SCALE}) 범위를 벗어난 특징값: ${bad.map((b) => b.id).join(", ")}`);

// 변별력 새니티 체크: 견종 쌍 간 특징 벡터 평균 L1 거리 (0에 가까우면 다 비슷하다는 뜻)
const keys = Object.keys(FEATURES);
let sum = 0, cnt = 0, identical = 0;
for (let i = 0; i < breeds.length; i++)
  for (let j = i + 1; j < breeds.length; j++) {
    const d = keys.reduce(
      (a, k) => a + Math.abs(breeds[i].features[k] - breeds[j].features[k]),
      0,
    );
    sum += d;
    cnt++;
    if (d === 0) identical++;
  }

writeJson(path.join(ROOT, "public", "data", "breeds.json"), breeds);

console.log(`breeds.json 생성: ${breeds.length}종 × 특징 ${keys.length}개`);
console.log(`특징 벡터 평균 L1 거리: ${(sum / cnt).toFixed(2)} (특징당 ${(sum / cnt / keys.length).toFixed(2)})`);
console.log(`특징 벡터가 완전히 동일한 견종 쌍: ${identical}쌍`);
if (missingKo.length) console.log(`한글명 누락 (영문 대체): ${missingKo.join(", ")}`);
if (missingDesc.length) console.log(`한국어 설명 누락 (영문 대체): ${missingDesc.join(", ")}`);
