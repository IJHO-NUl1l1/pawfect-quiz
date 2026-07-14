"use client";

import { MotionConfig } from "framer-motion";

// reducedMotion="user" → OS의 "동작 줄이기" 설정 시 transform 애니메이션을 자동 억제
export default function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
