"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { MatchResult } from "@/lib/matching";
import { Button } from "@/components/ui/button";

const BLUR =
  "data:image/svg+xml;base64," +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#ece3d6"/></svg>',
  );

/**
 * 공유 링크(/r/[code])로 들어온 사람이 보는 티저 랜딩.
 * 공유한 사람의 1위 견종만 미리보기로 보여주고, 전체 결과·상세·재공유는 노출하지 않는다.
 * 핵심 CTA는 "나도 해보기" → 첫 화면(/)으로 유도.
 */
export default function RecipientLanding({ top }: { top: MatchResult }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 py-12 text-center"
    >
      <p className="text-sm font-medium text-primary">🐾 친구가 찾은 강아지는</p>

      <div className="relative size-56 overflow-hidden rounded-3xl bg-muted shadow-sm sm:size-64">
        <Image
          src={top.breed.images.card}
          alt={top.breed.nameKo}
          fill
          sizes="(max-width: 640px) 224px, 256px"
          className="object-cover"
          placeholder="blur"
          blurDataURL={BLUR}
          priority
        />
      </div>

      <div>
        <h1 className="font-heading text-4xl text-primary">{top.breed.nameKo}</h1>
        {top.breed.nameKo !== top.breed.nameEn && (
          <p className="mt-1 text-sm text-muted-foreground">{top.breed.nameEn}</p>
        )}
      </div>

      <span className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
        매칭률 {top.similarity}%
      </span>

      <p className="max-w-sm text-balance text-sm text-muted-foreground">
        “{top.breed.meta.descriptionKo ?? top.breed.meta.description}”
      </p>

      <div className="mt-2 flex w-full flex-col items-center gap-3">
        <p className="font-heading text-lg">나랑 찰떡인 강아지는 누구일까?</p>
        <Button size="lg" className="w-full" nativeButton={false} render={<Link href="/" />}>
          🐶 나도 테스트하기
        </Button>
      </div>
    </motion.main>
  );
}
