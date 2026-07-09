/**
 * 공유 카드 이미지 (1200×630 PNG) — 서버 렌더링.
 * OG 미리보기(카톡·트위터 썸네일) + 다운로드 + Web Share에 공용으로 쓰인다.
 * 서버에서 그리므로 외부 견종 이미지의 CORS 문제가 없다.
 */
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";
import { decodeAnswers } from "@/lib/share";
import { rankBreeds, type BreedData } from "@/lib/matching";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: 72,
          background: "linear-gradient(135deg, #fbf6ec 0%, #f3e7d3 100%)",
          fontFamily: "Jua",
        }}
      >
        <img
          src={top.breed.images.card}
          width={420}
          height={420}
          style={{ borderRadius: 40, objectFit: "cover" }}
        />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 34, color: "#b07a44" }}>🐾 나와 찰떡인 강아지는</div>
          <div style={{ fontSize: 96, color: "#5a3e28", lineHeight: 1.1, marginTop: 8 }}>
            {top.breed.nameKo}
          </div>
          <div style={{ fontSize: 44, color: "#8a6a4a", marginTop: 20 }}>
            {`매칭률 ${top.similarity}%`}
          </div>
          <div style={{ fontSize: 30, color: "#a9906f", marginTop: 40 }}>
            Pawfect Quiz · 나에게 맞는 강아지 찾기
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Jua", data: jua, style: "normal", weight: 400 }],
    },
  );
}
