/**
 * 퀴즈 delta 검증 (CLAUDE.md 채점 메커니즘 5번 — 도달 가능성 불변식)
 *
 * 1) 취향형 feature: Σ(문항별 최대 delta) = +20, Σ(문항별 최소 delta) = −20
 *    → 프로필(중립 30)이 질문만으로 feature 범위 [10, 50] 양끝에 정확히 도달.
 * 2) 조건부 feature: 요구 방향 끝(+20 또는 −20)만 검사.
 * 3) 랜덤 응답 시뮬레이션: 특정 견종 쏠림·상반 응답의 결과 분리 확인.
 *
 * 채점·랭킹 로직은 앱과 동일한 src/lib/matching.ts 를 사용한다 (중복 구현 금지).
 *
 * 사용법: npm run quiz:validate
 */
import path from "node:path";
import { ROOT, readJson } from "./util.mts";
import {
  CONDITIONAL_FEATURES,
  FEATURE_KEYS,
  QUESTIONS,
  type FeatureKey,
} from "../src/data/questions.ts";
import {
  FEATURE_MAX,
  FEATURE_MIN,
  FILTER_FEATURES,
  NEUTRAL,
  rankBreeds,
  type BreedData,
} from "../src/lib/matching.ts";

let failed = false;
const fail = (msg: string) => {
  failed = true;
  console.error(`  ❌ ${msg}`);
};

// ── 1) 도달 가능성 불변식 ──
console.log("== 도달 가능성 불변식 검사 ==");
for (const f of FEATURE_KEYS) {
  if (FILTER_FEATURES.has(f)) {
    console.log(`  ⏭ ${f} (필터형 — 거리 계산 제외, 아래 필터 검사에서 확인)`);
    continue;
  }
  let sumMax = 0;
  let sumMin = 0;
  for (const q of QUESTIONS) {
    const deltas = q.options.map((o) => o.scores[f] ?? 0);
    sumMax += Math.max(...deltas);
    sumMin += Math.min(...deltas);
  }
  const cond = CONDITIONAL_FEATURES[f];
  if (cond) {
    const need = sumMax > 0 ? sumMax : sumMin;
    const target = sumMax > 0 ? FEATURE_MAX - NEUTRAL : FEATURE_MIN - NEUTRAL;
    if (need !== target) fail(`${f} (조건부): 요구 방향 도달값 ${need} ≠ ${target}`);
    else console.log(`  ✓ ${f} (조건부, ${target > 0 ? "+20" : "−20"} 도달)`);
  } else {
    if (sumMax !== FEATURE_MAX - NEUTRAL) fail(`${f}: Σmax = ${sumMax} ≠ +20`);
    if (sumMin !== FEATURE_MIN - NEUTRAL) fail(`${f}: Σmin = ${sumMin} ≠ −20`);
    if (sumMax === FEATURE_MAX - NEUTRAL && sumMin === FEATURE_MIN - NEUTRAL)
      console.log(`  ✓ ${f} (Σmax +20 / Σmin −20)`);
  }
}

// delta에 정의된 키가 FEATURE_KEYS에 있는지 + 정수인지
for (const q of QUESTIONS)
  for (const [i, o] of q.options.entries())
    for (const [k, v] of Object.entries(o.scores)) {
      if (!FEATURE_KEYS.includes(k as FeatureKey))
        fail(`${q.id} 선택지${i + 1}: 알 수 없는 feature "${k}"`);
      if (!Number.isInteger(v)) fail(`${q.id} 선택지${i + 1}: ${k}=${v} 정수 아님`);
    }

// ── 2) 절대 필터 검사: 어떤 선택을 해도 후보 풀이 충분한지 ──
const breeds = readJson<BreedData[]>(path.join(ROOT, "public", "data", "breeds.json"));
console.log("\n== 절대 필터 검사 ==");
for (const q of QUESTIONS)
  for (const [i, o] of q.options.entries()) {
    if (!o.filters) continue;
    for (const [f, [min, max]] of Object.entries(o.filters) as [
      FeatureKey,
      [number, number],
    ][]) {
      const count = breeds.filter(
        (b) => b.features[f] >= min && b.features[f] <= max,
      ).length;
      if (count < 3) fail(`${q.id} 선택지${i + 1}: ${f} [${min},${max}] 후보 ${count}종 — 너무 적음`);
      else console.log(`  ✓ ${q.id} 선택지${i + 1}: ${f} [${min},${max}] → 후보 ${count}종`);
    }
  }
const N = 20000;
const top1Count = new Map<string, number>();
for (let n = 0; n < N; n++) {
  const answers = QUESTIONS.map(() => Math.floor(Math.random() * 4));
  const [first] = rankBreeds(breeds, answers, 1);
  top1Count.set(first.breed.nameKo, (top1Count.get(first.breed.nameKo) ?? 0) + 1);
}

console.log(`\n== 랜덤 응답 ${N.toLocaleString()}회 시뮬레이션 ==`);
const ranked = [...top1Count.entries()].sort((a, b) => b[1] - a[1]);
console.log(`1위를 한 번이라도 차지한 견종 수: ${ranked.length} / ${breeds.length}`);
console.log(`최다 1위 견종의 점유율: ${((ranked[0][1] / N) * 100).toFixed(1)}%`);
console.log("상위 10:");
for (const [name, cnt] of ranked.slice(0, 10))
  console.log(`  ${name}: ${((cnt / N) * 100).toFixed(1)}%`);

// 상반 응답 스모크 테스트: 전부 1번 vs 전부 4번
for (const [label, idx] of [
  ["전부 라이트(1번)", 0],
  ["전부 헤비(4번)", 3],
] as const) {
  const t = rankBreeds(breeds, Array(QUESTIONS.length).fill(idx));
  console.log(
    `\n${label} 응답 Top 3: ${t.map((x) => `${x.breed.nameKo}(${x.similarity}%)`).join(", ")}`,
  );
}

if (failed) {
  console.error("\n검증 실패 — delta 테이블을 수정하세요.");
  process.exit(1);
}
console.log("\n모든 불변식 통과 ✅");
