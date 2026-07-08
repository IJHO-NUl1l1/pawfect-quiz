/**
 * 2단계: 3개 소스 병합 → data/merged.json
 *
 * - 기준 풀: registry.dog (이미지 완비) ∩ DogTime (매칭 평점)
 * - The Dog API는 있으면 description/temperament 보강, 없어도 통과
 * - 미매칭 견종은 유사 이름 제안과 함께 리포트 → aliases.mts에 추가 후 재실행
 *
 * 사용법: node scripts/2-merge.mts
 */
import path from "node:path";
import { DATA_DIR, RAW_DIR, levenshtein, normName, readJson, writeJson } from "./util.mts";
import { toDogapi, toDogtime } from "./aliases.mts";

type DogtimeRaw = Record<string, Record<string, string | number>>;

interface RegistryBreed {
  id: string;
  general: {
    name: string;
    group: string;
    personalityTraits: string[];
    shortDescription: string;
    longDescription: string;
    popularity: number | null;
    height: number;
    weight: number;
    lifespan: number;
    rare: boolean;
  };
  physical: Record<string, unknown> & { size: number };
  behavior: Record<string, number>;
  care: Record<string, number>;
  images: {
    small: Record<"indoors" | "outdoors" | "studio", string>;
    large: Record<"indoors" | "outdoors" | "studio", string>;
  };
}

interface DogapiBreed {
  id: string;
  name: string;
  temperament: string | null;
  description: string | null;
  life_span: string;
  breed_group: string | null;
  weight: { metric: string };
  height: { metric: string };
}

// --- 로드 ---
const dtRaw = readJson<DogtimeRaw>(path.join(RAW_DIR, "dogtime.json"));
const registry = readJson<{ data: RegistryBreed[] }>(path.join(RAW_DIR, "registry.json")).data;
const dogapi = readJson<DogapiBreed[]>(path.join(RAW_DIR, "dogapi.json"));

// DogTime 컬럼 지향 → 행 배열
const dtCols = Object.keys(dtRaw);
const dtRows = Object.keys(dtRaw[dtCols[0]]).map((i) =>
  Object.fromEntries(dtCols.map((c) => [c, dtRaw[c][i]])),
);
const dtByNorm = new Map(dtRows.map((r) => [normName(String(r.breed)), r]));
const apiByNorm = new Map(dogapi.map((b) => [normName(b.name), b]));

function resolve<T>(
  regName: string,
  byNorm: Map<string, T>,
  alias: Record<string, string>,
): T | undefined {
  if (alias[regName]) return byNorm.get(normName(alias[regName]));
  return byNorm.get(normName(regName));
}

// --- 병합 ---
const merged = [];
const unmatched: { name: string; suggestions: string[] }[] = [];

for (const reg of registry) {
  const name = reg.general.name;
  const dt = resolve(name, dtByNorm, toDogtime);
  if (!dt) {
    const key = normName(name);
    const suggestions = [...dtByNorm.keys()]
      .map((k) => ({ k, d: levenshtein(key, k) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map(({ k }) => String(dtByNorm.get(k)!.breed));
    unmatched.push({ name, suggestions });
    continue;
  }
  const api = resolve(name, apiByNorm, toDogapi);
  merged.push({
    id: reg.id,
    name,
    registry: reg,
    dogtime: dt,
    dogapi: api
      ? {
          temperament: api.temperament,
          description: api.description,
          life_span: api.life_span,
          weight_metric: api.weight.metric,
        }
      : null,
  });
}

writeJson(path.join(DATA_DIR, "merged.json"), merged);

// --- 리포트 ---
console.log(`registry ${registry.length}종 중 병합 성공: ${merged.length}종`);
console.log(`The Dog API 보강된 종: ${merged.filter((m) => m.dogapi).length}종`);
console.log(`\n미매칭 ${unmatched.length}종 (aliases.mts에 추가하거나 풀에서 제외):`);
for (const { name, suggestions } of unmatched)
  console.log(`  - ${name}  (유사: ${suggestions.join(" / ")})`);
