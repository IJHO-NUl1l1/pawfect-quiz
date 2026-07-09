import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    // 견종 이미지는 open-dog-registry의 외부 URL을 그대로 사용하고 (로컬 저장 안 함, CLAUDE.md 참고)
    // next/image가 리사이즈·WebP 변환·CDN 캐싱을 담당한다.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/chase-manning/open-dog-registry/**",
      },
    ],
  },
};

export default nextConfig;
