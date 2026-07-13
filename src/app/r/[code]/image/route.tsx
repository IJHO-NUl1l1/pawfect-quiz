/**
 * 공유 카드 이미지 (세로형 900×1200 PNG) — 서버 렌더링.
 * OG 미리보기(카톡·트위터 썸네일) + 다운로드 + Web Share에 공용.
 * 세로형 + 중앙 정렬이라 카톡·인스타에서 양옆 잘림 없이 들어간다.
 * 서버 렌더이므로 외부 견종 이미지의 CORS 문제가 없다.
 */
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";
import { decodeAnswers } from "@/lib/share";
import { rankBreeds, type BreedData } from "@/lib/matching";

export const runtime = "nodejs";
export const size = { width: 900, height: 1200 };
export const contentType = "image/png";

let breedsCache: BreedData[] | null = null;
function loadBreeds(): BreedData[] {
  if (!breedsCache) {
    const file = path.join(process.cwd(), "public", "data", "breeds.json");
    breedsCache = JSON.parse(readFileSync(file, "utf8")) as BreedData[];
  }
  return breedsCache;
}

let fontCache: ArrayBuffer | null = null;
async function loadFont(): Promise<ArrayBuffer> {
  if (!fontCache) {
    const res = await fetch(
      "https://raw.githubusercontent.com/google/fonts/main/ofl/jua/Jua-Regular.ttf",
    );
    fontCache = await res.arrayBuffer();
  }
  return fontCache;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const answers = decodeAnswers(code);
  if (!answers) return new Response("Bad code", { status: 400 });

  const [top] = rankBreeds(loadBreeds(), answers);
  const jua = await loadFont();

  // 이름 길이에 따라 폰트 크기를 낮춰 긴 견종명이 뱃지·푸터와 겹치거나 잘리지 않게 한다.
  const name = top.breed.nameKo;
  const nameSize = name.length > 13 ? 58 : name.length > 9 ? 72 : 96;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(160deg, #fbf6ec 0%, #f2e5d0 100%)",
          fontFamily: "Jua",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, color: "#b07a44" }}>
          🐾 나와 찰떡인 강아지는
        </div>
        <img
          src={top.breed.images.card}
          width={620}
          height={620}
          style={{ borderRadius: 48, objectFit: "cover", margin: "36px 0" }}
        />
        <div
          style={{
            display: "flex",
            maxWidth: 760,
            fontSize: nameSize,
            color: "#5a3e28",
            lineHeight: 1.15,
            // 한글은 어절(공백) 단위로만 줄바꿈 — "화이트"가 "화/이트"로 쪼개지는 것 방지
            wordBreak: "keep-all",
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 52,
            color: "#fff",
            background: "#c98a4b",
            borderRadius: 999,
            padding: "14px 44px",
            marginTop: 32,
          }}
        >
          {`매칭률 ${top.similarity}%`}
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#a9906f", marginTop: 56 }}>
          Pawfect Quiz · 나에게 맞는 강아지 찾기
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Jua", data: jua, style: "normal", weight: 400 }],
    },
  );
}
