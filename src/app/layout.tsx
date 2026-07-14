import type { Metadata } from "next";
import { Geist, Geist_Mono, Jua } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { siteUrl } from "@/lib/share";
import Providers from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 제목용 둥근 한글 폰트 (한글 서브셋은 preload 미지원 → false)
const jua = Jua({
  weight: "400",
  variable: "--font-jua",
  preload: false,
});

const title = "Pawfect Quiz — 성향으로 찾는 나의 반려견";
const description = "재미있는 퀴즈로 내 라이프스타일에 딱 맞는 견종 Top 3를 찾아보세요!";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title,
  description,
  openGraph: { title, description, type: "website", siteName: "Pawfect Quiz" },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${jua.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
