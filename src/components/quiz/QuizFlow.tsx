"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { QUESTIONS } from "@/data/questions";
import { Button } from "@/components/ui/button";

const AUTO_ADVANCE_MS = 350;

const variants = {
  enter: (dir: 1 | -1) => ({ x: dir * 60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: 1 | -1) => ({ x: dir * -60, opacity: 0 }),
};

export default function QuizFlow() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(QUESTIONS.length).fill(null),
  );
  const [direction, setDirection] = useState<1 | -1>(1);
  const [locked, setLocked] = useState(false);

  const done = step >= QUESTIONS.length;

  function select(optionIdx: number) {
    if (locked) return;
    setLocked(true);
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = optionIdx;
      return next;
    });
    // 선택 하이라이트를 잠깐 보여준 뒤 자동으로 다음 문항
    setTimeout(() => {
      setDirection(1);
      setStep((s) => s + 1);
      setLocked(false);
    }, AUTO_ADVANCE_MS);
  }

  function goBack() {
    if (locked || step === 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function restart() {
    setAnswers(Array(QUESTIONS.length).fill(null));
    setDirection(-1);
    setStep(0);
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center"
      >
        <motion.span
          className="text-6xl"
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, repeatDelay: 0.8 }}
        >
          🐾
        </motion.span>
        <h2 className="text-2xl font-bold">답변 완료!</h2>
        <p className="max-w-sm text-balance text-muted-foreground">
          12개의 답변을 모두 받았어요.
          <br />
          결과 매칭은 지금 열심히 만드는 중이에요 — 조금만 기다려주세요!
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={restart}>
            다시 해보기
          </Button>
          <Button nativeButton={false} render={<Link href="/" />}>
            처음으로
          </Button>
        </div>
      </motion.div>
    );
  }

  const q = QUESTIONS[step];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col p-6">
      {/* 상단: 이전 버튼 + 진행 표시 */}
      <div className="flex items-center gap-4">
        <button
          onClick={goBack}
          disabled={step === 0}
          className="text-sm text-muted-foreground transition-opacity hover:opacity-70 disabled:opacity-0"
          aria-label="이전 문항"
        >
          ← 이전
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">
          {step + 1} / {QUESTIONS.length}
        </span>
      </div>

      {/* 문항 */}
      <div className="flex flex-1 flex-col justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={q.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <p className="mb-2 text-sm font-medium text-primary">
              Q{step + 1}.
            </p>
            <h2 className="mb-8 text-balance text-2xl font-bold leading-snug">
              {q.text}
            </h2>
            <div className="flex flex-col gap-3">
              {q.options.map((opt, i) => {
                const selected = answers[step] === i;
                return (
                  <button
                    key={i}
                    onClick={() => select(i)}
                    className={`rounded-2xl border-2 p-4 text-left text-[15px] leading-snug transition-colors ${
                      selected
                        ? "border-primary bg-primary/10 font-semibold"
                        : "border-border bg-card hover:border-primary/40 hover:bg-accent"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
