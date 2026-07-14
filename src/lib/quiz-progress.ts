import { QUESTIONS } from "@/data/questions";

// 진행 중·완료 상태를 세션에 저장 → 새로고침해도 유지 (탭 닫으면 사라짐)
const PROGRESS_KEY = "pawfect-quiz-progress";

export type QuizProgress = { step: number; answers: (number | null)[] };

export function loadProgress(): QuizProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const p = JSON.parse(sessionStorage.getItem(PROGRESS_KEY) ?? "null") as QuizProgress | null;
    if (
      !p ||
      typeof p.step !== "number" ||
      p.step < 0 ||
      p.step > QUESTIONS.length ||
      !Array.isArray(p.answers) ||
      p.answers.length !== QUESTIONS.length
    )
      return null;
    return p;
  } catch {
    return null;
  }
}

export function saveProgress(p: QuizProgress) {
  try {
    sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {}
}

export function clearProgress() {
  try {
    sessionStorage.removeItem(PROGRESS_KEY);
  } catch {}
}
