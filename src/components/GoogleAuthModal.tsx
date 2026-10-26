"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Loader2, ShieldCheck, X } from "lucide-react";
import type { RankedCandidate } from "@/types/voting";
import { isUnoptimizedImageSrc } from "@/lib/image-utils";

interface GoogleAuthModalProps {
  isOpen: boolean;
  targetCandidate: RankedCandidate | null;
  onClose: () => void;
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.33-2.04 3.05l3.3 2.56c1.92-1.77 3.04-4.38 3.04-7.47 0-.72-.06-1.41-.19-2.04H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.75 0 5.06-.91 6.75-2.47l-3.3-2.56c-.91.61-2.08.98-3.45.98-2.65 0-4.9-1.79-5.7-4.2H2.89v2.64A9.997 9.997 0 0012 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.3 13.75A5.996 5.996 0 016 12c0-.61.11-1.2.3-1.75V7.61H2.89A9.997 9.997 0 002 12c0 1.61.39 3.14 1.08 4.39l3.22-2.64z"
      />
      <path
        fill="#4285F4"
        d="M12 6.05c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 3.02 14.75 2 12 2 8.09 2 4.71 4.24 2.89 7.61l3.41 2.64c.8-2.41 3.05-4.2 5.7-4.2z"
      />
    </svg>
  );
}

export function GoogleAuthModal({
  isOpen,
  targetCandidate,
  onClose,
}: GoogleAuthModalProps) {
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    await signIn("google", { callbackUrl: window.location.href });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="auth-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-md"
        >
          <div className="flex min-h-full items-center justify-center p-3.5 sm:p-6">
            <motion.div
              key="auth-modal-card"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[460px] overflow-hidden rounded-3xl border border-[#F26F21]/30 bg-white p-4.5 sm:p-7 shadow-[0_24px_64px_-16px_rgba(242,111,33,0.28)]"
            >
              <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-[#F26F21]/14 blur-3xl" />

              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng cửa sổ đăng nhập"
                className="absolute right-3.5 top-3.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-[#F26F21] hover:bg-[#F26F21] hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-center gap-2.5 pr-10">
                  <Image
                    src="/images/fpt-logo.png"
                    alt="Logo FPT Polytechnic Đồng Nai"
                    width={96}
                    height={59}
                    className="h-7 w-auto object-contain shrink-0"
                  />
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F26F21]/35 bg-[#FFF4EC] px-3 py-1 text-[11px] font-extrabold text-[#F26F21] whitespace-nowrap">
                    <KeyRound className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">FPOLY ĐỒNG NAI</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-[clamp(1rem,4.35vw,1.35rem)] font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                    Đăng nhập để bình chọn thí sinh
                  </h3>
                  <p className="text-[clamp(0.7rem,3.1vw,0.85rem)] text-slate-600 whitespace-nowrap">
                    Hỗ trợ Google{" "}
                    <span className="font-semibold text-slate-800">
                      @fpt.edu.vn
                    </span>{" "}
                    hoặc{" "}
                    <span className="font-semibold text-slate-800">
                      @gmail.com
                    </span>
                  </p>
                  <p className="text-[clamp(0.7rem,3.05vw,0.85rem)] text-slate-600 whitespace-nowrap">
                    Tối đa{" "}
                    <span className="font-bold text-[#F26F21]">
                      03 lượt vote/ngày
                    </span>{" "}
                    • Reset lúc{" "}
                    <span className="font-mono font-semibold text-slate-800">
                      00:00:00
                    </span>
                  </p>
                </div>

                {targetCandidate && (
                  <div className="flex items-center gap-3 rounded-2xl border border-[#F26F21]/30 bg-[#FFF7F2] p-3">
                    <div className="relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[#F26F21]">
                      <Image
                        src={targetCandidate.avatarUrl}
                        alt={targetCandidate.fullName}
                        fill
                        unoptimized={isUnoptimizedImageSrc(targetCandidate.avatarUrl)}
                        sizes="48px"
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#F26F21] whitespace-nowrap">
                        Đang chọn bình chọn cho:
                      </p>
                      <p className="truncate text-sm font-extrabold text-slate-900">
                        {targetCandidate.fullName}
                      </p>
                      <p className="font-mono text-xs text-slate-500 whitespace-nowrap">
                        MSSV: {targetCandidate.studentId}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={loadingGoogle}
                  onClick={handleGoogleSignIn}
                  className="shimmer-sweep relative flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl border-2 border-[#F26F21]/35 bg-white px-4 text-xs sm:text-sm font-extrabold text-slate-900 shadow-[0_10px_28px_-10px_rgba(242,111,33,0.3)] transition-all hover:scale-[1.01] hover:border-[#F26F21] hover:bg-[#FFF9F5] active:scale-98 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  {loadingGoogle ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#F26F21]" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span className="whitespace-nowrap">
                    Tiếp tục với Google
                  </span>
                </button>

                <div className="flex items-center justify-center gap-2 pt-1 text-center text-[11px] font-medium text-slate-500">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#F26F21]" />
                  <span className="whitespace-nowrap">
                    Xác thực chính thức qua Google OAuth 2.0
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
