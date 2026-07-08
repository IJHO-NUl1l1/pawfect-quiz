/**
 * 1단계: 소스별 원본 데이터 다운로드 → data/raw/*.json
 *
 * 사용법: node scripts/1-fetch.mts [--force]
 * 이미 받은 파일은 건너뛴다. --force로 강제 갱신.
 */
import fs from "node:fs";
import path from "node:path";
import { RAW_DIR, envLocal, writeJson } from "./util.mts";

const force = process.argv.includes("--force");

async function fetchJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function save(name: string, loader: () => Promise<unknown>) {
  const file = path.join(RAW_DIR, `${name}.json`);
  if (!force && fs.existsSync(file)) {
    console.log(`[skip] ${name}.json 이미 있음 (--force로 갱신)`);
    return;
  }
  console.log(`[fetch] ${name} ...`);
  writeJson(file, await loader());
  console.log(`[done] ${name}.json 저장`);
}

// DogTime 평점 (VildMedPap/dogbreeds) — 컬럼 지향 JSON, 349종 × 26개 세부 평점
await save("dogtime", () =>
  fetchJson("https://github.com/VildMedPap/dogbreeds/raw/master/breeds.json"),
);

// open-dog-registry — 209종, 1~5 점수 + 이미지 6장/종
await save("registry", () => fetchJson("https://registry.dog/api/v1"));

// The Dog API — 628종, description/temperament/history (이미지는 별도 엔드포인트, 현재 미사용)
await save("dogapi", async () => {
  const key = envLocal("DOG_API_KEY");
  if (!key) throw new Error("DOG_API_KEY가 .env.local에 없습니다");
  const all: unknown[] = [];
  for (let page = 0; ; page++) {
    const batch = (await fetchJson(
      `https://api.thedogapi.com/v1/breeds?limit=100&page=${page}`,
      { "x-api-key": key },
    )) as unknown[];
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
});

console.log("fetch 완료");
