import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Pawfect Quiz — 성향으로 찾는 나의 반려견";

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

const PAW_TILE =
  `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="170" viewBox="0 0 128 128">` +
  `<rect width="128" height="128" rx="30" fill="#ae6f42"/>` +
  `<g transform="translate(64,64) scale(3.3) translate(-12,-12.6)" fill="#fefcf4">` +
  `<ellipse cx="12" cy="16.5" rx="5.2" ry="4.2"/>` +
  `<ellipse cx="4.8" cy="11" rx="2.3" ry="3" transform="rotate(-22 4.8 11)"/>` +
  `<ellipse cx="9.4" cy="7.4" rx="2.3" ry="3.1" transform="rotate(-8 9.4 7.4)"/>` +
  `<ellipse cx="14.6" cy="7.4" rx="2.3" ry="3.1" transform="rotate(8 14.6 7.4)"/>` +
  `<ellipse cx="19.2" cy="11" rx="2.3" ry="3" transform="rotate(22 19.2 11)"/>` +
  `</g></svg>`;

export default async function OpengraphImage() {
  const jua = await loadFont();
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
          gap: 28,
          background: "linear-gradient(160deg, #fbf6ec 0%, #f2e5d0 100%)",
          fontFamily: "Jua",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- satori(ImageResponse)는 next/image 미지원 */}
        <img
          src={`data:image/svg+xml,${encodeURIComponent(PAW_TILE)}`}
          width={170}
          height={170}
          alt=""
        />
        <div style={{ display: "flex", fontSize: 88, color: "#5a3e28" }}>
          Pawfect Quiz
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#a9906f" }}>
          성향으로 찾는 나의 반려견
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Jua", data: jua, style: "normal", weight: 400 }] },
  );
}
