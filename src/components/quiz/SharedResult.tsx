"use client";

import { useRouter } from "next/navigation";
import QuizResult from "@/components/quiz/QuizResult";

/** 공유 링크(/r/[code])로 열린 결과 뷰 — QuizResult를 공유 모드로 재사용. */
export default function SharedResult({ answers }: { answers: number[] }) {
  const router = useRouter();
  return (
    <QuizResult answers={answers} shared onRestart={() => router.push("/quiz")} />
  );
}
