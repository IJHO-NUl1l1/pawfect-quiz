"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, animate, motion, type Variants } from "framer-motion";
import { track } from "@vercel/analytics";
import { Trophy, Medal, Lightbulb, Heart, Frown, ChevronDown, ChevronUp } from "lucide-react";
import { rankBreeds, type BreedData, type MatchResult } from "@/lib/matching";
import PawPrint from "@/components/quiz/PawPrint";
import {
  GROUP_DESC,
  GROUP_KO,
  getBreedBadges,
  getBreedDayStory,
  getBreedStats,
} from "@/lib/breed-detail";
import { Button } from "@/components/ui/button";
import Lightbox, { type LightboxImage } from "@/components/quiz/Lightbox";
import InfoTip from "@/components/quiz/InfoTip";
import ShareModal from "@/components/quiz/ShareModal";

// 이미지 로딩 전 표시할 따뜻한 톤 blur 자리표시 (외부 URL은 blurDataURL 직접 지정 필요)
const BLUR =
  "data:image/svg+xml;base64," +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#ece3d6"/></svg>',
  );

// 스캔 구간(문구 순환 + 진행바) 뒤 결과 확정 문구를 FOUND_MS만큼 띄우고 결과 공개.
const ANALYZE_MS = 3500;
const FOUND_MS = 1000;
const ANALYZE_MESSAGES = [
  "응답을 꼼꼼히 뜯어보는 중",
  "라이프스타일을 견종과 맞춰보는 중",
  "성향·환경 궁합을 계산하는 중",
];
const FOUND_MESSAGE = "딱 맞는 아이를 찾았어요!";

const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.06 } },
};
const revealItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const detailContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const detailItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// 결과 이미지를 미리 받아둬 결과·확대가 즉시 뜨게 한다.
function preloadImages(results: MatchResult[]) {
  if (typeof window === "undefined") return;
  const urls: string[] = [];
  results.forEach((r, i) => {
    urls.push(r.breed.images.card, r.breed.images.cardLarge);
    if (i === 0)
      urls.push(
        r.breed.images.indoors,
        r.breed.images.indoorsLarge,
        r.breed.images.outdoors,
        r.breed.images.outdoorsLarge,
      );
  });
  for (const u of urls) {
    const img = new window.Image();
    img.src = u;
  }
}

function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);
  return <>{n}</>;
}

function Analyzing({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [found, setFound] = useState(false);

  useEffect(() => {
    const interval = setInterval(
      () => setI((v) => Math.min(v + 1, ANALYZE_MESSAGES.length - 1)),
      ANALYZE_MS / ANALYZE_MESSAGES.length,
    );
    const toFound = setTimeout(() => {
      clearInterval(interval);
      setFound(true);
    }, ANALYZE_MS);
    const done = setTimeout(onDone, ANALYZE_MS + FOUND_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(toFound);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center"
    >
      <div className="relative flex size-28 items-center justify-center">
        <motion.span
          className={`absolute inset-0 rounded-full border-4 ${
            found ? "border-primary" : "border-primary/15 border-t-primary"
          }`}
          animate={found ? undefined : { rotate: 360 }}
          transition={found ? undefined : { repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <motion.span
          className="text-primary"
          animate={found ? { scale: [1, 1.3, 1] } : { scale: [1, 1.14, 1] }}
          transition={
            found
              ? { duration: 0.5, ease: "easeOut" }
              : { repeat: Infinity, duration: 1.1, ease: "easeInOut" }
          }
        >
          <PawPrint size={44} />
        </motion.span>
      </div>

      <div className="flex h-8 items-center">
        <AnimatePresence mode="wait">
          {found ? (
            <motion.p
              key="found"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 16 }}
              className="text-xl font-bold text-primary"
            >
              {FOUND_MESSAGE}
            </motion.p>
          ) : (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="font-medium text-muted-foreground"
            >
              {ANALYZE_MESSAGES[i]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: ANALYZE_MS / 1000, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

export default function QuizResult({
  answers,
  onRestart,
}: {
  answers: number[];
  onRestart: () => void;
}) {
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [analyzeDone, setAnalyzeDone] = useState(false);
  const [detailIdx, setDetailIdx] = useState<number | null>(null);
  const [zoom, setZoom] = useState<LightboxImage | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/breeds.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((breeds: BreedData[]) => {
        if (cancelled) return;
        const ranked = rankBreeds(breeds, answers);
        preloadImages(ranked);
        setResults(ranked);
        track("quiz_complete", { breed: ranked[0].breed.id });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [answers, reloadKey]);

  function retry() {
    setError(false);
    setReloadKey((k) => k + 1);
  }

  const handleAnalyzeDone = useCallback(() => setAnalyzeDone(true), []);

  if (error)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <Frown className="size-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
        </p>
        <div className="flex gap-3">
          <Button onClick={retry}>다시 시도</Button>
          <Button variant="outline" onClick={onRestart}>
            처음부터
          </Button>
        </div>
      </div>
    );

  if (!results || !analyzeDone) return <Analyzing onDone={handleAnalyzeDone} />;

  const [first, ...rest] = results;

  return (
    <motion.div
      variants={revealContainer}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-5 p-6 py-10"
    >
      <motion.p variants={revealItem} className="font-heading text-lg text-primary">
        나와 찰떡인 견종 Top 3
      </motion.p>

      <motion.div
        variants={revealItem}
        className="flex w-full flex-col items-center gap-4 rounded-3xl border-2 border-primary/25 bg-card p-6 text-center shadow-sm"
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          <motion.span
            animate={{ rotate: [0, -12, 12, -8, 0] }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <Trophy className="size-4 text-amber-400" />
          </motion.span>{" "}
          1위 · 매칭률 <CountUp value={first.similarity} />%
        </span>
        <button
          onClick={() =>
            setZoom({ src: first.breed.images.cardLarge, alt: first.breed.nameKo })
          }
          aria-label={`${first.breed.nameKo} 사진 확대`}
          className="group relative size-48 overflow-hidden rounded-2xl bg-muted sm:size-56"
        >
          <Image
            src={first.breed.images.card}
            alt={first.breed.nameKo}
            fill
            sizes="(max-width: 640px) 192px, 224px"
            className="object-cover transition-transform group-hover:scale-105"
            placeholder="blur"
            blurDataURL={BLUR}
            priority
          />
        </button>
        <div>
          <h2 className="break-keep font-heading text-3xl">{first.breed.nameKo}</h2>
          {first.breed.nameKo !== first.breed.nameEn && (
            <p className="text-sm text-muted-foreground">{first.breed.nameEn}</p>
          )}
        </div>
        <p className="max-w-md text-balance text-sm text-muted-foreground">
          “{first.breed.meta.descriptionKo ?? first.breed.meta.description}”
        </p>
        <Button
          variant={detailIdx === 0 ? "secondary" : "default"}
          onClick={() => setDetailIdx(detailIdx === 0 ? null : 0)}
        >
          <PawPrint /> 이 아이에 대해 더 알아보기
        </Button>
      </motion.div>

      <motion.div
        variants={revealItem}
        className="w-full rounded-3xl border-2 border-primary/15 bg-accent/40 p-6"
      >
        <p className="mb-3 flex items-center gap-1.5 font-heading text-base text-primary">
          <PawPrint size={18} /> {first.breed.nameKo}와의 하루
        </p>
        <p className="text-[15px] leading-relaxed text-foreground/80">
          {first.breed.meta.story ?? getBreedDayStory(first.breed)}
        </p>
      </motion.div>

      <motion.div variants={revealItem} className="grid w-full grid-cols-2 gap-3">
        {rest.map((r, i) => {
          const idx = i + 1;
          const open = detailIdx === idx;
          return (
            <div
              key={r.breed.id}
              onClick={() => setDetailIdx(open ? null : idx)}
              className={`group/card flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 bg-card p-4 text-center transition-colors ${
                open ? "border-primary/40" : "border-border hover:border-primary/25"
              }`}
            >
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Medal className={`size-3.5 ${idx === 1 ? "text-zinc-400" : "text-amber-700"}`} />
                {idx === 1 ? "2위" : "3위"} · {r.similarity}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom({ src: r.breed.images.cardLarge, alt: r.breed.nameKo });
                }}
                aria-label={`${r.breed.nameKo} 사진 확대`}
                className="group relative size-24 overflow-hidden rounded-xl bg-muted"
              >
                <Image
                  src={r.breed.images.card}
                  alt={r.breed.nameKo}
                  fill
                  sizes="96px"
                  className="object-cover transition-transform group-hover:scale-105"
                  placeholder="blur"
                  blurDataURL={BLUR}
                  priority
                />
              </button>
              <p className="break-keep text-sm font-semibold leading-tight">{r.breed.nameKo}</p>
              <span className="mt-0.5 inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary transition-colors group-hover/card:bg-primary/20">
                {open ? "닫기" : "자세히 보기"}
                {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </span>
            </div>
          );
        })}
      </motion.div>

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
            <BreedDetail
              result={results[detailIdx]}
              onZoom={setZoom}
              story={detailIdx !== 0}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={revealItem} className="w-full">
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            track("share_click", { breed: first.breed.id });
            setShareOpen(true);
          }}
        >
          <PawPrint /> 결과 공유하기
        </Button>
      </motion.div>

      <motion.div variants={revealItem} className="flex gap-3">
        <Button variant="outline" onClick={onRestart}>
          다시 해보기
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          처음으로
        </Button>
      </motion.div>

      <Lightbox image={zoom} onClose={() => setZoom(null)} />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        answers={answers}
        top={first}
      />
    </motion.div>
  );
}

function BreedDetail({
  result,
  onZoom,
  story,
}: {
  result: MatchResult;
  onZoom: (img: LightboxImage) => void;
  story?: boolean;
}) {
  const { breed } = result;
  const badges = getBreedBadges(breed);
  const good = badges.filter((b) => b.kind === "good");
  const care = badges.filter((b) => b.kind === "care");
  const stats = getBreedStats(breed);

  return (
    <motion.div
      variants={detailContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-5 rounded-3xl border bg-card p-6"
    >
      <motion.p variants={detailItem} className="font-heading text-lg">
        <span className="text-primary">{breed.nameKo}</span>는 어떤 아이일까요?
      </motion.p>

      {story && (
        <motion.p
          variants={detailItem}
          className="text-[15px] leading-relaxed text-foreground/80"
        >
          {breed.meta.story ?? getBreedDayStory(breed)}
        </motion.p>
      )}

      {/* 기본 정보 — 세 칸 라벨 줄 높이를 h-5로 통일해 값 정렬 맞춤 */}
      <motion.div variants={detailItem} className="grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 px-2 py-3">
          <p className="flex h-5 items-center text-xs text-muted-foreground">몸무게</p>
          <p className="text-base font-semibold">{breed.meta.weightKg}kg</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 px-2 py-3">
          <p className="flex h-5 items-center text-xs text-muted-foreground">기대 수명</p>
          <p className="text-base font-semibold">{breed.meta.lifespan}년</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 px-2 py-3">
          <p className="flex h-5 items-center gap-1 text-xs text-muted-foreground">
            그룹
            {GROUP_DESC[breed.meta.group] && (
              <InfoTip label="그룹" text={GROUP_DESC[breed.meta.group]} />
            )}
          </p>
          <p className="text-base font-semibold">
            {GROUP_KO[breed.meta.group] ?? breed.meta.group}
          </p>
        </div>
      </motion.div>

      {/* 장점 / 미리 알아둘 점 — 전부 feature 점수에서 파생 (추측 없음) */}
      {good.length > 0 && (
        <motion.div variants={detailItem}>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Heart className="size-4 fill-rose-400 text-rose-400" /> 이런 점이 좋아요
          </p>
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
        </motion.div>
      )}
      {care.length > 0 && (
        <motion.div variants={detailItem}>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Lightbulb className="size-4 text-amber-500" /> 미리 알아두세요
          </p>
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
        </motion.div>
      )}

      <motion.div variants={detailItem} className="flex flex-col gap-2.5">
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
      </motion.div>

      <motion.div variants={detailItem} className="grid grid-cols-2 gap-2">
        {[
          { src: breed.images.indoors, large: breed.images.indoorsLarge, ko: "실내" },
          { src: breed.images.outdoors, large: breed.images.outdoorsLarge, ko: "실외" },
        ].map(({ src, large, ko }) => {
          const alt = `${breed.nameKo} ${ko} 사진`;
          return (
            <button
              key={src}
              onClick={() => onZoom({ src: large, alt })}
              aria-label={`${alt} 확대`}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
            >
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 640px) 45vw, 280px"
                className="object-cover transition-transform group-hover:scale-105"
                placeholder="blur"
                blurDataURL={BLUR}
                priority
              />
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
