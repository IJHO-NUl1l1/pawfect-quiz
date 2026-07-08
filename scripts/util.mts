import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const DATA_DIR = path.join(ROOT, "data");
export const RAW_DIR = path.join(DATA_DIR, "raw");

export function readJson<T = unknown>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
}

export function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/** .env.local에서 키를 읽는다 (dotenv 없이). */
export function envLocal(key: string): string | undefined {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return undefined;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && m[1] === key) return m[2];
  }
  return undefined;
}

/** 소스 간 견종 이름 매칭용 정규화 키. */
export function normName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\bdogs?\b/g, "")
    .replace(/[^a-z]/g, "");
}

/** 편집 거리 (미매칭 리포트의 유사 이름 제안용). */
export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[a.length][b.length];
}
