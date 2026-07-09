"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

/**
 * 정보 아이콘(ⓘ) + 툴팁.
 * - 데스크톱: 호버로 열림/닫힘, 모바일: 탭 토글 + 바깥 탭 시 닫힘
 * - 툴팁은 portal로 body에 렌더 → 조상의 overflow-hidden에 잘리지 않고,
 *   뷰포트 가장자리를 벗어나지 않도록 위치를 보정한다.
 */
export default function InfoTip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const TIP_W = 232; // 툴팁 너비(px)와 동기화
  const MARGIN = 8;

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const b = btnRef.current.getBoundingClientRect();
    const center = b.left + b.width / 2;
    // 아이콘 중앙 정렬을 기본으로 하되, 좌우 끝이 화면(±MARGIN)을 넘지 않게 클램프.
    // left는 툴팁의 왼쪽 끝이므로 상한은 innerWidth - TIP_W - MARGIN.
    const left = Math.min(
      Math.max(center - TIP_W / 2, MARGIN),
      window.innerWidth - TIP_W - MARGIN,
    );
    setPos({ top: b.top - MARGIN, left });
  }, [open]);

  // 바깥 클릭/터치·스크롤 시 닫기
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        tipRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("scroll", () => setOpen(false), true);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", () => setOpen(false), true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={`${label} 설명`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex size-4 items-center justify-center rounded-full border border-muted-foreground/50 align-middle text-[10px] font-bold leading-none text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        i
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={tipRef}
                role="tooltip"
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.14 }}
                style={{ top: pos.top, left: pos.left, width: TIP_W }}
                className="pointer-events-none fixed z-[60] -translate-y-full rounded-xl bg-neutral-800 px-3 py-2 text-left text-[11px] font-normal leading-relaxed text-white shadow-lg"
              >
                {text}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
