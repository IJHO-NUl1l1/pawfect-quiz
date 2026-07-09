import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readFileSync } from "node:fs";
import path from "node:path";
import { decodeAnswers, siteUrl } from "@/lib/share";
import { rankBreeds, type BreedData } from "@/lib/matching";
import RecipientLanding from "@/components/quiz/RecipientLanding";

function loadBreeds(): BreedData[] {
  const file = path.join(process.cwd(), "public", "data", "breeds.json");
  return JSON.parse(readFileSync(file, "utf8"));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const answers = decodeAnswers(code);
  if (!answers) return { title: "Pawfect Quiz" };

  const [top] = rankBreeds(loadBreeds(), answers);
  const title = `나랑 찰떡인 강아지는 ${top.breed.nameKo}! (${top.similarity}%)`;
  const description = "Pawfect Quiz로 나에게 맞는 강아지를 찾아보세요 🐶";
  const image = `${siteUrl()}/r/${code}/image`;

  return {
    metadataBase: new URL(siteUrl()),
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 900, height: 1200 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const answers = decodeAnswers(code);
  if (!answers) notFound();

  // 공유받기용 티저 — 전체 결과가 아니라 1위 미리보기 + "나도 해보기" 유도
  const [top] = rankBreeds(loadBreeds(), answers);
  return <RecipientLanding top={top} />;
}
