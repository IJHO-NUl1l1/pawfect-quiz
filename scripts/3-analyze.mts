/**
 * 3단계: 변별력 분석 → 콘솔 리포트 + data/analysis.md
 *
 * CLAUDE.md의 변별력 원칙에 따라 특징(퀴즈 문항) 후보를 평가한다:
 *  1) 분포 퍼짐 — 1~5점 히스토그램, 표준편차, 최빈값 집중도(한 값에 몰리면 탈락)
 *  2) 특징 간 상관관계 — 중복 특징 제거용 (|r| 높은 쌍은 하나만 채택)
 *  3) registry.dog 대응 점수와 교차 검증 — 두 소스가 어긋나면 신뢰도 의심
 *
 * 사용법: node scripts/3-analyze.mts
 */
import path from "node:path";
import { DATA_DIR, readJson } from "./util.mts";

interface MergedBreed {
  id: string;
  name: string;
  dogtime: Record<string, number | string>;
  registry: {
    physical: Record<string, unknown>;
    behavior: Record<string, number>;
    care: Record<string, number>;
  };
}

const merged = readJson<MergedBreed[]>(path.join(DATA_DIR, "merged.json"));

// DogTime 세부 평점 컬럼 (카테고리 평균 a_, b_ 등은 중복 정보라 제외)
const COLS = Object.keys(merged[0].dogtime).filter((c) => /^[a-e]\d_/.test(c));

const values = (col: string) => merged.map((m) => Number(m.dogtime[col]));

function stats(xs: number[]) {
  const n = xs.length;
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const hist = [1, 2, 3, 4, 5].map((v) => xs.filter((x) => x === v).length);
  const modeShare = Math.max(...hist) / n;
  return { mean, std, hist, modeShare };
}

function pearson(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}

const lines: string[] = [];
const out = (s = "") => {
  console.log(s);
  lines.push(s);
};

// --- 1) 분포 퍼짐 ---
out(`# 변별력 분석 리포트 (${merged.length}종 기준)\n`);
out("## 1. 특징별 분포 — std 높고 modeShare 낮을수록 변별력 좋음\n");
out("| 특징 | 평균 | std | 히스토그램(1→5) | 최빈값 집중도 |");
out("|---|---|---|---|---|");
const rows = COLS.map((c) => ({ col: c, ...stats(values(c)) })).sort(
  (a, b) => b.std - a.std,
);
for (const r of rows)
  out(
    `| ${r.col} | ${r.mean.toFixed(2)} | ${r.std.toFixed(2)} | ${r.hist.join(" / ")} | ${(r.modeShare * 100).toFixed(0)}% |`,
  );

// --- 2) 특징 간 상관관계 (|r| >= 0.6) ---
out("\n## 2. 특징 쌍 상관관계 |r| ≥ 0.6 — 중복 후보, 하나만 채택\n");
out("| 특징 A | 특징 B | r |");
out("|---|---|---|");
const pairs: { a: string; b: string; r: number }[] = [];
for (let i = 0; i < COLS.length; i++)
  for (let j = i + 1; j < COLS.length; j++) {
    const r = pearson(values(COLS[i]), values(COLS[j]));
    if (Math.abs(r) >= 0.6) pairs.push({ a: COLS[i], b: COLS[j], r });
  }
pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
for (const p of pairs) out(`| ${p.a} | ${p.b} | ${p.r.toFixed(2)} |`);

// --- 3) registry 교차 검증 ---
out("\n## 3. DogTime ↔ registry 교차 검증 (같은 개념 점수의 상관)\n");
const CROSS: [string, (m: MergedBreed) => number][] = [
  ["c1_amount_of_shedding", (m) => m.registry.care.sheddingAmount],
  ["c2_drooling_potential", (m) => Number(m.registry.physical.droolingFrequency)],
  ["c6_size", (m) => Number(m.registry.physical.size)],
  ["d5_tendency_to_bark_or_howl", (m) => m.registry.behavior.barkingFrequency],
  ["e1_energy_level", (m) => m.registry.care.exerciseNeeds],
  ["e3_exercise_needs", (m) => m.registry.care.exerciseNeeds],
  ["b2_incredibly_kid_friendly_dogs", (m) => m.registry.behavior.childFriendly],
  ["b3_dog_friendly", (m) => m.registry.behavior.dogSociability],
  ["b4_friendly_toward_strangers", (m) => m.registry.behavior.friendlinessToStrangers],
  ["e4_potential_for_playfulness", (m) => m.registry.behavior.playfulness],
  ["d1_easy_to_train", (m) => 6 - m.registry.care.trainingDifficulty],
];
out("| DogTime | registry 대응 | r |");
out("|---|---|---|");
for (const [col, getter] of CROSS) {
  const r = pearson(values(col), merged.map(getter));
  out(`| ${col} | (위 매핑) | ${r.toFixed(2)} |`);
}

import("node:fs").then((fs) =>
  fs.writeFileSync(path.join(DATA_DIR, "analysis.md"), lines.join("\n") + "\n", "utf8"),
);
