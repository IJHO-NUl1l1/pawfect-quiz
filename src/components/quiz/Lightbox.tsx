"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

export interface LightboxImage {
  src: string;
  alt: string;
}

/**
 * 사진 확대 라이트박스.
 * - 반투명 회색 배경, 배경 클릭 시 닫힘
 * - 우측 상단 X 버튼, ESC 키로도 닫힘
 * - 모바일/데스크톱 반응형 (뷰포트에 맞춰 최대 크기 제한)
 */
export default function Lightbox({
  image,
  onClose,
}: {
  image: LightboxImage | null;
  onClose: () => void;
}) {
  // 열려 있는 동안 배경 스크롤 잠금 + ESC 닫기
  useEffect(() => {
    if (!image) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [image, onClose]);

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${image.alt} 확대 이미지`}
        >
          {/* 이미지 영역 — 배경 클릭 닫힘과 분리 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[85vh] max-w-[90vw] items-center justify-center sm:max-h-[80vh] sm:max-w-[560px]"
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={720}
              height={720}
              sizes="(max-width: 640px) 90vw, 560px"
              className="h-auto max-h-[85vh] w-auto rounded-2xl object-contain sm:max-h-[80vh]"
              priority
            />
            {/* 닫기 버튼 — 우측 상단 */}
            <button
              onClick={onClose}
              aria-label="닫기"
              className="absolute -right-2 -top-2 flex size-9 items-center justify-center rounded-full bg-white text-neutral-800 shadow-md transition-transform hover:scale-105 active:scale-95 sm:-right-3 sm:-top-3 sm:size-10"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
