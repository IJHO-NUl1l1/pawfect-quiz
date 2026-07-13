/**
 * 결과 공유용 인코딩 — 답변(14문항, 각 0~3)을 URL 경로 코드로 변환.
 * 결과는 답변에서 결정론적으로 재계산되므로 DB 없이 링크만으로 공유가 성립한다.
 */
import { QUESTIONS } from "@/data/questions";

/** 답변 배열 → 코드 문자열 (예: [3,0,2,...] → "302...") */
export function encodeAnswers(answers: number[]): string {
  return answers.map((a) => String(a)).join("");
}

/** 코드 문자열 → 답변 배열. 형식이 안 맞으면 null. */
export function decodeAnswers(code: string): number[] | null {
  if (!/^[0-3]+$/.test(code) || code.length !== QUESTIONS.length) return null;
  return code.split("").map((c) => Number(c));
}

/**
 * 절대 사이트 URL.
 * 우선순위: 명시 env → 브라우저 origin → Vercel 배포 URL → 로컬 폴백.
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : undefined) ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL}`
      : "http://localhost:3000");
  // 끝 슬래시 제거 — `${siteUrl()}/r/...`가 `...//r/...`(슬래시 2개)로 생성되는 것 방지.
  return raw.replace(/\/+$/, "");
}

/** 내 결과 공유 링크 */
export function resultUrl(answers: number[]): string {
  return `${siteUrl()}/r/${encodeAnswers(answers)}`;
}
