"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QUESTIONS } from "@/data/questions";
import PawPrint from "@/components/quiz/PawPrint";
import QuizResult from "@/components/quiz/QuizResult";

const AUTO_ADVANCE_MS = 350;

const variants = {
  enter: (dir: 1 | -1) => ({ x: dir * 60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: 1 | -1) => ({ x: dir * -60, opacity: 0 }),
};

/** 선택지별 발바닥 변주 — 라이트(작게) → 헤비(크게). 색은 브랜드 primary로 통일, 기울기·위치만 다르게 */
const PAW_VARIANTS = [
  { size: 28, rotate: -14, className: "right-4 text-primary" },
  { size: 32, rotate: 10, className: "right-8 text-primary" },
  { size: 36, rotate: -8, className: "right-5 text-primary" },
  { size: 40, rotate: 14, className: "right-7 text-primary" },
];

function OptionButton({
  label,
  index,
  selected,
  onSelect,
}: {
  label: string;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const paw = PAW_VARIANTS[index % PAW_VARIANTS.length];
  return (
    <motion.button
      onClick={onSelect}
      initial="rest"
      whileHover="hover"
      whileTap="hover"
      animate={selected ? "hover" : "rest"}
      className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left text-[15px] leading-snug transition-colors ${
        selected
          ? "border-primary bg-primary/10 font-semibold"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent/60"
      }`}
    >
      {label}
      {/* 오른쪽 아래에서 올라오는 발바닥 (모바일은 탭/선택 시) */}
      <motion.span
        aria-hidden
        className={`pointer-events-none absolute bottom-0 ${paw.className}`}
        variants={{
          rest: { y: "115%", opacity: 0, rotate: paw.rotate + 24 },
          hover: {
            y: "18%",
            opacity: 0.85,
            rotate: paw.rotate,
            transition: { type: "spring", stiffness: 380, damping: 22 },
          },
        }}
      >
        <PawPrint size={paw.size} />
      </motion.span>
    </motion.button>
  );
}

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
    // 선택 하이라이트(+발바닥)를 잠깐 보여준 뒤 자동으로 다음 문항
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

  if (done) return <QuizResult answers={answers as number[]} onRestart={restart} />;

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
            <h2 className="mb-8 font-heading text-balance text-2xl leading-snug sm:text-[1.7rem]">
              {q.text}
            </h2>
            <div className="flex flex-col gap-3">
              {q.options.map((opt, i) => (
                <OptionButton
                  key={i}
                  label={opt.label}
                  index={i}
                  selected={answers[step] === i}
                  onSelect={() => select(i)}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
