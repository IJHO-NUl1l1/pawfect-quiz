"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { clearProgress } from "@/lib/quiz-progress";

// 홈에서 시작할 땐 이전 진행상황을 지워 항상 새 퀴즈로 시작한다.
export default function StartQuizButton() {
  return (
    <Button
      size="lg"
      nativeButton={false}
      render={<Link href="/quiz" />}
      onClick={clearProgress}
    >
      퀴즈 시작하기
    </Button>
  );
}
