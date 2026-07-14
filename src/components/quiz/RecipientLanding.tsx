"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { track } from "@vercel/analytics";
import type { MatchResult } from "@/lib/matching";
import { Button } from "@/components/ui/button";
import PawPrint from "@/components/quiz/PawPrint";

const BLUR =
  "data:image/svg+xml;base64," +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#ece3d6"/></svg>',
  );


export default function RecipientLanding({ top }: { top: MatchResult }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 py-12 text-center"
    >
      <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary">
        <PawPrint size={16} /> 친구가 찾은 강아지는
      </p>

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
        <h1 className="break-keep font-heading text-4xl text-primary">{top.breed.nameKo}</h1>
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
        <Button
          size="lg"
          className="w-full"
          nativeButton={false}
          render={<Link href="/" />}
          onClick={() => track("recipient_cta", { breed: top.breed.id })}
        >
          <PawPrint /> 나도 테스트하기
        </Button>
      </div>
    </motion.main>
  );
}
