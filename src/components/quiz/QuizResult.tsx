"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { rankBreeds, type BreedData, type MatchResult } from "@/lib/matching";
import { GROUP_KO, getBreedBadges, getBreedStats } from "@/lib/breed-detail";
import { Button } from "@/components/ui/button";

export default function QuizResult({
  answers,
  onRestart,
}: {
  answers: number[];
  onRestart: () => void;
}) {
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState(false);
  // 상세 패널: 몇 위 견종을 펼쳐 보고 있는지 (null = 닫힘)
  const [detailIdx, setDetailIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch("/data/breeds.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((breeds: BreedData[]) => setResults(rankBreeds(breeds, answers)))
      .catch(() => setError(true));
  }, [answers]);

  if (error)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="text-5xl">🙀</span>
        <p className="text-muted-foreground">
          결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
        </p>
        <Button variant="outline" onClick={onRestart}>
          다시 해보기
        </Button>
      </div>
    );

  if (!results)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <motion.span
          className="text-6xl"
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        >
          🐾
        </motion.span>
        <p className="text-muted-foreground">나와 맞는 강아지를 찾는 중…</p>
      </div>
    );

  const [first, ...rest] = results;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-5 p-6 py-10"
    >
      <p className="font-heading text-lg text-primary">나와 찰떡인 견종 Top 3</p>

      {/* 1위 카드 */}
      <div className="flex w-full flex-col items-center gap-4 rounded-3xl border-2 border-primary/25 bg-card p-6 text-center shadow-sm">
        <span className="text-sm font-semibold text-primary">
          🥇 1위 · 매칭률 {first.similarity}%
        </span>
        <div className="relative size-48 overflow-hidden rounded-2xl bg-muted sm:size-56">
          <Image
            src={first.breed.images.card}
            alt={first.breed.nameKo}
            fill
            sizes="(max-width: 640px) 192px, 224px"
            className="object-cover"
            priority
          />
        </div>
        <div>
          <h2 className="font-heading text-3xl">{first.breed.nameKo}</h2>
          {first.breed.nameKo !== first.breed.nameEn && (
            <p className="text-sm text-muted-foreground">{first.breed.nameEn}</p>
          )}
        </div>
        {/* 한 문장 소개 (desc-ko.mts — 소스 기반 번역) */}
        <p className="max-w-md text-balance text-sm text-muted-foreground">
          “{first.breed.meta.descriptionKo ?? first.breed.meta.description}”
        </p>
        <Button
          variant={detailIdx === 0 ? "secondary" : "default"}
          onClick={() => setDetailIdx(detailIdx === 0 ? null : 0)}
        >
          🐾 이 아이에 대해 더 알아보기
        </Button>
      </div>

      {/* 2·3위 카드 (클릭하면 상세) */}
      <div className="grid w-full grid-cols-2 gap-3">
        {rest.map((r, i) => {
          const idx = i + 1;
          const open = detailIdx === idx;
          return (
            <button
              key={r.breed.id}
              onClick={() => setDetailIdx(open ? null : idx)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 bg-card p-4 text-center transition-colors ${
                open ? "border-primary/40" : "border-border hover:border-primary/25"
              }`}
            >
              <span className="text-xs font-medium text-muted-foreground">
                {idx === 1 ? "🥈 2위" : "🥉 3위"} · {r.similarity}%
              </span>
              <div className="relative size-24 overflow-hidden rounded-xl bg-muted">
                <Image
                  src={r.breed.images.cardSmall}
                  alt={r.breed.nameKo}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <p className="text-sm font-semibold leading-tight">{r.breed.nameKo}</p>
              <span className="text-[11px] text-muted-foreground">
                {open ? "상세 닫기" : "눌러서 상세 보기"}
              </span>
            </button>
          );
        })}
      </div>

      {/* 상세 패널 */}
      <AnimatePresence mode="wait">
        {detailIdx !== null && (
          <motion.div
            key={results[detailIdx].breed.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full overflow-hidden"
          >
            <BreedDetail result={results[detailIdx]} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onRestart}>
          다시 해보기
        </Button>
        <Button nativeButton={false} render={<Link href="/" />}>
          처음으로
        </Button>
      </div>
    </motion.div>
  );
}

function BreedDetail({ result }: { result: MatchResult }) {
  const { breed } = result;
  const badges = getBreedBadges(breed);
  const good = badges.filter((b) => b.kind === "good");
  const care = badges.filter((b) => b.kind === "care");
  const stats = getBreedStats(breed);

  return (
    <div className="flex flex-col gap-5 rounded-3xl border bg-card p-6">
      <p className="font-heading text-lg">
        {breed.nameKo}는 어떤 아이일까요?
      </p>

      {/* 기본 정보 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["몸무게", `${breed.meta.weightKg}kg`],
          ["기대 수명", `${breed.meta.lifespan}년`],
          ["그룹", GROUP_KO[breed.meta.group] ?? breed.meta.group],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-muted/60 px-2 py-3">
            <p className="text-[11px] text-muted-foreground">{k}</p>
            <p className="text-sm font-semibold">{v}</p>
          </div>
        ))}
      </div>

      {/* 장점 / 미리 알아둘 점 — 전부 feature 점수에서 파생 (추측 없음) */}
      {good.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">💛 이런 점이 좋아요</p>
          <div className="flex flex-wrap gap-1.5">
            {good.map((b) => (
              <span
                key={b.text}
                className="rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground"
              >
                {b.text}
              </span>
            ))}
          </div>
        </div>
      )}
      {care.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">💡 미리 알아두세요</p>
          <div className="flex flex-wrap gap-1.5">
            {care.map((b) => (
              <span
                key={b.text}
                className="rounded-full bg-accent px-3 py-1.5 text-xs text-accent-foreground"
              >
                {b.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 지표 바 */}
      <div className="flex flex-col gap-2.5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-muted-foreground">
              {s.label}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary/70"
                initial={{ width: 0 }}
                animate={{ width: `${(s.value / 50) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 일상 사진 */}
      <div className="grid grid-cols-2 gap-2">
        {[breed.images.indoors, breed.images.outdoors].map((src, i) => (
          <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            <Image
              src={src}
              alt={`${breed.nameKo} ${i === 0 ? "실내" : "실외"} 사진`}
              fill
              sizes="(max-width: 640px) 45vw, 280px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
