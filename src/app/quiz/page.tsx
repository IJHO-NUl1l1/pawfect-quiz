import type { Metadata } from "next";
import QuizFlow from "@/components/quiz/QuizFlow";

export const metadata: Metadata = {
  title: "퀴즈 — Pawfect Quiz",
};

export default function QuizPage() {
  return <QuizFlow />;
}
