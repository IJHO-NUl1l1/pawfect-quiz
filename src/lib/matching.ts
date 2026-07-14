/**
 * 매칭 로직 (로드맵 2단계) — 채점 메커니즘은 CLAUDE.md 참고.
 *
 * 흐름: 응답(문항별 선택 인덱스) → 프로필 누적(중립 30 ± delta, 10~50 클램프)
 *      → 조건부 feature 활성 판별 → 견종 벡터와 평균 L1 거리 → Top N.
 *
 * 참고: node 스크립트(scripts/validate-quiz.mts)에서도 import하므로
 * 경로 별칭(@/) 대신 상대 경로 + 확장자를 사용한다.
 */
import {
  CONDITIONAL_FEATURES,
  FEATURE_KEYS,
  QUESTIONS,
  type FeatureKey,
  type FilterKey,
} from "../data/questions.ts";

export const NEUTRAL = 30;
export const FEATURE_MIN = 10;
export const FEATURE_MAX = 50;

/**
 * 거리 계산에서 제외되는 feature.
 * - filters에 등장하는 feature (절대 필터가 후보 컷을 전담)
 * - size: 크기 축은 몸무게(weightKg) 필터가 전담하므로 항상 제외
 *   (registry size 등급은 몸무게와 모순되는 견종이 있어 필터 기준으로도 쓰지 않음)
 */
export const DISTANCE_EXCLUDED_FEATURES: ReadonlySet<FeatureKey> = new Set([
  "size",
  ...QUESTIONS.flatMap((q) =>
    q.options.flatMap(
      (o) =>
        Object.keys(o.filters ?? {}).filter((k) =>
          (FEATURE_KEYS as readonly string[]).includes(k),
        ) as FeatureKey[],
    ),
  ),
]);

/** 필터 키의 견종 측 값 (feature 점수 또는 실측 몸무게) */
function filterValue(breed: BreedData, key: FilterKey): number {
  return key === "weightKg" ? breed.meta.weightKg : breed.features[key];
}

/** public/data/breeds.json 의 항목 (파이프라인 4-build.mts 산출물) */
export interface BreedData {
  id: string;
  nameEn: string;
  nameKo: string;
  features: Record<FeatureKey, number>;
  meta: {
    group: string;
    weightKg: number;
    lifespan: string;
    traits: string[];
    description: string;
    descriptionKo: string | null;
    story: string | null;
    temperament: string | null;
    popularity: number | null;
  };
  images: {
    // 표시용(small jpg) + 확대용(large png)
    card: string;
    cardLarge: string;
    indoors: string;
    indoorsLarge: string;
    outdoors: string;
    outdoorsLarge: string;
  };
}

export interface UserProfile {
  /** feature별 누적 점수 (10~50) */
  profile: Record<FeatureKey, number>;
  /** 거리 계산에 포함되는 feature (조건부 미활성은 제외됨) */
  active: FeatureKey[];
}

export interface MatchResult {
  breed: BreedData;
  /** 활성 feature 평균 L1 거리 (0 = 완벽 일치, 최대 40) */
  distance: number;
  /** 0~100 표시용 매칭률 */
  similarity: number;
}

/**
 * 표시용 매칭률 (2026-07-08 재보정): 100 − 거리 × 1.4
 * 이론상 최대 거리(40) 대신 실측 분포에 맞춘 계수. 크기 절대 필터 도입 후
 * 랜덤 응답 3,000회 재측정: 1위 거리 4.8~15(중앙값 9.6) → 1위가 보통 87~93%로 표시.
 * 순위 계산에는 영향 없음 (정렬은 distance 기준).
 */
export function toSimilarity(distance: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - distance * 1.4)));
}

/** 응답 배열(문항별 선택 인덱스)로 사용자 프로필을 만든다. */
export function buildProfile(answers: number[]): UserProfile {
  if (answers.length !== QUESTIONS.length)
    throw new Error(`응답 수 ${answers.length} ≠ 문항 수 ${QUESTIONS.length}`);

  const profile = Object.fromEntries(
    FEATURE_KEYS.map((f) => [f, NEUTRAL]),
  ) as Record<FeatureKey, number>;

  for (let qi = 0; qi < QUESTIONS.length; qi++) {
    const option = QUESTIONS[qi].options[answers[qi]];
    if (!option) throw new Error(`문항 ${QUESTIONS[qi].id}: 선택 인덱스 ${answers[qi]} 없음`);
    for (const [k, v] of Object.entries(option.scores))
      profile[k as FeatureKey] += v;
  }
  for (const f of FEATURE_KEYS)
    profile[f] = Math.max(FEATURE_MIN, Math.min(FEATURE_MAX, profile[f]));

  const active = FEATURE_KEYS.filter((f) => {
    if (DISTANCE_EXCLUDED_FEATURES.has(f)) return false;
    const cond = CONDITIONAL_FEATURES[f];
    if (!cond) return true;
    const qi = QUESTIONS.findIndex((q) => q.id === cond.questionId);
    return answers[qi] === cond.optionIndex;
  });

  return { profile, active };
}

/** 응답에서 절대 필터 범위를 수집한다 (같은 키에 여러 필터면 교집합). */
export function collectFilters(
  answers: number[],
): Partial<Record<FilterKey, [number, number]>> {
  const ranges: Partial<Record<FilterKey, [number, number]>> = {};
  for (let qi = 0; qi < QUESTIONS.length; qi++) {
    const filters = QUESTIONS[qi].options[answers[qi]]?.filters;
    if (!filters) continue;
    for (const [f, [min, max]] of Object.entries(filters) as [
      FilterKey,
      readonly [number, number],
    ][]) {
      const prev = ranges[f];
      ranges[f] = prev
        ? [Math.max(prev[0], min), Math.min(prev[1], max)]
        : [min, max];
    }
  }
  return ranges;
}

/** 전체 견종을 유사도순으로 정렬해 상위 topN을 반환한다. */
export function rankBreeds(
  breeds: BreedData[],
  answers: number[],
  topN = 3,
): MatchResult[] {
  const { profile, active } = buildProfile(answers);

  // 절대 필터: 범위 밖 견종은 후보에서 제외 (필터 결과가 비면 안전하게 전체로 폴백)
  const ranges = collectFilters(answers);
  let pool = breeds.filter((b) =>
    Object.entries(ranges).every(([f, r]) => {
      const v = filterValue(b, f as FilterKey);
      return v >= r[0] && v <= r[1];
    }),
  );
  if (pool.length === 0) pool = breeds;

  return pool
    .map((breed) => {
      const distance =
        active.reduce((s, f) => s + Math.abs(profile[f] - breed.features[f]), 0) /
        active.length;
      return { breed, distance, similarity: toSimilarity(distance) };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, topN);
}
