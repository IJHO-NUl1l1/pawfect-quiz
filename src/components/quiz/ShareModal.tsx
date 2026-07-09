"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { AnimatePresence, motion } from "framer-motion";
import type { MatchResult } from "@/lib/matching";
import { encodeAnswers, resultUrl, siteUrl } from "@/lib/share";

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: { sendDefault: (opts: unknown) => void };
    };
  }
}

export default function ShareModal({
  open,
  onClose,
  answers,
  top,
}: {
  open: boolean;
  onClose: () => void;
  answers: number[];
  top: MatchResult;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const code = encodeAnswers(answers);
  const url = resultUrl(answers);
  const imageUrl = `${siteUrl()}/r/${code}/image`;
  const title = `나랑 찰떡인 강아지는 ${top.breed.nameKo}! (${top.similarity}%)`;
  const desc = "Pawfect Quiz로 나에게 맞는 강아지를 찾아보세요 🐶";

  // Kakao SDK 초기화 (키 있을 때만)
  useEffect(() => {
    if (KAKAO_KEY && window.Kakao && !window.Kakao.isInitialized())
      window.Kakao.init(KAKAO_KEY);
  }, []);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function shareKakao() {
    if (!window.Kakao?.isInitialized()) return;
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description: desc,
        imageUrl,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        {
          title: "나도 테스트하기",
          link: { mobileWebUrl: siteUrl(), webUrl: siteUrl() },
        },
      ],
    });
  }

  // 이미지 파일 확보 (다운로드·Web Share 공용)
  async function getImageFile(): Promise<File | null> {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      return new File([blob], `pawfect-${top.breed.id}.png`, { type: "image/png" });
    } catch {
      return null;
    }
  }

  async function shareImage() {
    setBusy(true);
    const file = await getImageFile();
    setBusy(false);
    // 모바일: 파일 공유 시트(인스타 스토리 등 선택 가능)
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: `${title}\n${url}` });
        return;
      } catch {
        /* 취소 시 폴백 없음 */
        return;
      }
    }
    // 데스크톱 등: 이미지 다운로드
    if (file) downloadFile(file);
  }

  function downloadFile(file: File) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function saveImage() {
    setBusy(true);
    const file = await getImageFile();
    setBusy(false);
    if (file) downloadFile(file);
  }

  return (
    <>
      {KAKAO_KEY && (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          crossOrigin="anonymous"
          onLoad={() => {
            if (window.Kakao && !window.Kakao.isInitialized())
              window.Kakao.init(KAKAO_KEY);
          }}
        />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label="공유하기"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-8 shadow-xl sm:rounded-3xl"
            >
              <div className="mb-5 text-center">
                <p className="font-heading text-lg">결과 공유하기</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {top.breed.nameKo} · 매칭률 {top.similarity}%
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ShareButton emoji="🔗" label={copied ? "복사됐어요!" : "링크 복사"} onClick={copyLink} />
                <ShareButton
                  emoji="💬"
                  label="카카오톡"
                  disabled={!KAKAO_KEY}
                  hint={!KAKAO_KEY ? "준비 중" : undefined}
                  onClick={shareKakao}
                />
                <ShareButton emoji="📷" label="인스타·기타" busy={busy} onClick={shareImage} />
                <ShareButton emoji="⬇️" label="이미지 저장" busy={busy} onClick={saveImage} />
              </div>

              <button
                onClick={onClose}
                className="mt-5 w-full rounded-2xl py-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ShareButton({
  emoji,
  label,
  onClick,
  disabled,
  busy,
  hint,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  hint?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm font-medium">{busy ? "처리 중…" : label}</span>
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </button>
  );
}
