"use client";

import { useEffect, useState, type ReactNode } from "react";
import Script from "next/script";
import { AnimatePresence, motion } from "framer-motion";
import { track } from "@vercel/analytics";
import { Share2, Link2, Download, Check } from "lucide-react";
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
  // 이미지를 미리 받아둔다 → 클릭 시 await 없이 navigator.share를 제스처 안에서 즉시 호출
  // (안드로이드/삼성은 share 앞에 await가 끼면 사용자 제스처가 소실돼 NotAllowedError)
  const [imageFile, setImageFile] = useState<File | null>(null);

  const code = encodeAnswers(answers);
  const url = resultUrl(answers);
  const imageUrl = `${siteUrl()}/r/${code}/image`;
  const localImageUrl =
    typeof window !== "undefined" ? `${window.location.origin}/r/${code}/image` : imageUrl;
  const title = `나랑 찰떡인 강아지는 ${top.breed.nameKo}! (${top.similarity}%)`;
  const desc = "Pawfect Quiz로 나에게 맞는 강아지를 찾아보세요 🐶";

  useEffect(() => {
    if (KAKAO_KEY && window.Kakao && !window.Kakao.isInitialized())
      window.Kakao.init(KAKAO_KEY);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(localImageUrl);
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (!cancelled)
          setImageFile(new File([blob], `pawfect-${top.breed.id}.png`, { type: "image/png" }));
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [open, localImageUrl, top.breed.id]);

  async function copyLink() {
    track("share_channel", { channel: "copy" });
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // 클립보드 API 불가(일부 인앱 브라우저) → execCommand 폴백
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function shareKakao() {
    if (!window.Kakao?.isInitialized()) return;
    track("share_channel", { channel: "kakao" });
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description: desc,
        imageUrl,
        imageWidth: 900,
        imageHeight: 1200,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        {
          title: "나도 테스트 하기",
          link: { mobileWebUrl: url, webUrl: url },
        },
      ],
    });
  }

  function anchorDownload() {
    const a = document.createElement("a");
    a.href = localImageUrl;
    a.download = `pawfect-${top.breed.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // 공유하기: 미리 받아둔 파일이 있으면 await 없이 즉시 파일 공유(캡션 포함) → 제스처 유지.
  // 아직 파일이 없거나 파일 공유 미지원이면 링크 공유, 그마저 없으면 이미지 다운로드로 폴백.
  async function shareSheet() {
    track("share_channel", { channel: "sheet" });
    if (imageFile && navigator.canShare?.({ files: [imageFile] })) {
      try {
        await navigator.share({ files: [imageFile], text: `${title}\n${url}` });
      } catch {
        /* 사용자가 시트에서 취소 */
      }
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title, text: desc, url });
      } catch {}
      return;
    }
    anchorDownload();
  }

  // 이미지 저장: 파일 공유 가능하면(모바일) 시트로 '사진에 저장', 아니면 same-origin 앵커 다운로드.
  async function saveImage() {
    track("share_channel", { channel: "save" });
    if (imageFile && navigator.canShare?.({ files: [imageFile] })) {
      try {
        await navigator.share({ files: [imageFile] });
      } catch {
        /* 사용자가 시트에서 취소 */
      }
      return;
    }
    anchorDownload();
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

              <div className="flex flex-col gap-3">
                {/* 카톡은 SDK 피드 카드 품질이 시트 공유보다 높아 별도 버튼으로 둔다 */}
                <KakaoButton disabled={!KAKAO_KEY} onClick={shareKakao} />

                <button
                  onClick={shareSheet}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Share2 className="size-5" />
                  공유하기
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <ShareButton
                    icon={copied ? <Check className="size-5" /> : <Link2 className="size-5" />}
                    label={copied ? "복사됐어요!" : "링크 복사"}
                    onClick={copyLink}
                  />
                  <ShareButton
                    icon={<Download className="size-5" />}
                    label="이미지 저장"
                    onClick={saveImage}
                  />
                </div>
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

function KakaoLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3.4c-4.97 0-9 3.18-9 7.11 0 2.54 1.68 4.77 4.2 6.03-.14.5-.9 3.1-.93 3.31 0 0-.02.16.08.22.1.06.22.01.22.01.29-.04 3.36-2.2 3.9-2.57.48.07.98.1 1.53.1 4.97 0 9-3.18 9-7.11 0-3.93-4.03-7.11-9-7.11z" />
    </svg>
  );
}

function KakaoButton({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-3.5 font-medium text-[#191919] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <KakaoLogo />
      카카오톡{disabled && <span className="text-xs opacity-60">(준비 중)</span>}
    </button>
  );
}

function ShareButton({
  icon,
  label,
  onClick,
  disabled,
  busy,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-border bg-background p-4 text-primary transition-colors hover:border-primary/40 hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      <span className="text-sm font-medium text-foreground">{busy ? "처리 중…" : label}</span>
    </button>
  );
}
