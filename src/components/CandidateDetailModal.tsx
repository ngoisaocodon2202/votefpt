"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  GraduationCap,
  IdCard,
  Quote,
  Share2,
  Trophy,
  UserCheck,
  UserRound,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { RankedCandidate } from "@/types/voting";
import { isUnoptimizedImageSrc } from "@/lib/image-utils";
import { AnimatedNumber } from "./motion/MotionPrimitives";
import { HyperVoteButton } from "./ui/HyperVoteButton";
import { CountdownTimer } from "./ui/CountdownTimer";

interface CandidateDetailModalProps {
  candidate: RankedCandidate | null;
  totalVotes: number;
  onClose: () => void;
  onVote: (
    candidate: RankedCandidate,
    originRect: DOMRect | null
  ) => Promise<boolean>;
  isDailyLimitReached: boolean;
  isVotingThis: boolean;
  nextResetAt?: string | null;
  onMidnightReset: () => void;
  votedCountToday: number;
}

function formatVietnameseDate(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

export function CandidateDetailModal({
  candidate,
  totalVotes,
  onClose,
  onVote,
  isDailyLimitReached,
  isVotingThis,
  nextResetAt,
  onMidnightReset,
  votedCountToday,
}: CandidateDetailModalProps) {
  const [zoomedCandidateId, setZoomedCandidateId] = useState<string | null>(
    null
  );
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 35 });
  const [copiedCandidateId, setCopiedCandidateId] = useState<string | null>(
    null
  );

  const isZoomed = Boolean(candidate && zoomedCandidateId === candidate.id);
  const copied = Boolean(candidate && copiedCandidateId === candidate.id);

  useEffect(() => {
    if (!candidate) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [candidate, onClose]);

  const handleImageMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

  const handleShare = async () => {
    if (!candidate || typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/?candidate=${candidate.studentId}#leaderboard`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      const targetId = candidate.id;
      setCopiedCandidateId(targetId);
      setTimeout(() => {
        setCopiedCandidateId((prev) => (prev === targetId ? null : prev));
      }, 2200);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <AnimatePresence>
      {candidate && (
        <motion.div
          key="candidate-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] overflow-y-auto bg-slate-900/50 backdrop-blur-md"
        >
          <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
            <motion.div
              key={`candidate-modal-${candidate.id}`}
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-[#F26F21]/30 bg-white shadow-[0_24px_64px_-16px_rgba(242,111,33,0.28)]"
            >
              {/* Soft FPT Orange Ambient Glow */}
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#F26F21]/14 blur-3xl" />

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng cửa sổ chi tiết"
                className="absolute right-3.5 top-3.5 z-30 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-sm transition-all hover:rotate-90 hover:border-[#F26F21] hover:bg-[#F26F21] hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12">
                {/* Left Column: High-Resolution Interactive Zoom Portrait */}
                <div
                  onMouseMove={handleImageMouseMove}
                  onClick={() =>
                    setZoomedCandidateId((prev) =>
                      prev === candidate.id ? null : candidate.id
                    )
                  }
                  className={`group/zoom relative md:col-span-5 h-72 sm:h-88 md:h-auto md:min-h-[520px] overflow-hidden bg-orange-50 ${
                    isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                  }`}
                >
                  <Image
                    src={candidate.avatarUrl}
                    alt={candidate.fullName}
                    fill
                    unoptimized={isUnoptimizedImageSrc(candidate.avatarUrl)}
                    sizes="(max-width: 768px) 100vw, 420px"
                    style={{
                      transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    }}
                    className={`object-cover object-top transition-transform duration-500 ease-out ${
                      isZoomed
                        ? "scale-[1.85]"
                        : "scale-100 group-hover/zoom:scale-110"
                    }`}
                  />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

                  <div className="absolute left-3.5 top-3.5 z-20 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F26F21] px-3 py-1 text-xs font-extrabold text-white shadow-lg whitespace-nowrap">
                      <Trophy className="h-3.5 w-3.5 shrink-0" />
                      <span className="whitespace-nowrap">
                        HẠNG #{candidate.rank}
                      </span>
                    </span>
                  </div>

                  <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-md whitespace-nowrap">
                      {isZoomed ? (
                        <>
                          <ZoomOut className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">Thu nhỏ ảnh</span>
                        </>
                      ) : (
                        <>
                          <ZoomIn className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">
                            Chạm để phóng to HD
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Right Column: Candidate Profile Details & Voting Action */}
                <div className="relative z-10 md:col-span-7 flex flex-col justify-between bg-white p-4 sm:p-7 lg:p-8">
                  <div className="space-y-4 sm:space-y-5">
                    <div className="flex flex-wrap items-center gap-2 md:pr-10">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F26F21]/35 bg-[#FFF4EC] px-2.5 sm:px-3 py-1 text-[11px] font-extrabold text-[#F26F21] whitespace-nowrap">
                        <UserCheck className="h-3.5 w-3.5 shrink-0" />
                        <span className="whitespace-nowrap">
                          ỨNG VIÊN CHÍNH THỨC
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 sm:px-3 py-1 font-mono text-[11px] sm:text-xs font-bold text-slate-700 whitespace-nowrap">
                        MSSV: {candidate.studentId}
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                        Họ và Tên Thí sinh
                      </p>
                      <h2 className="mt-0.5 text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        {candidate.fullName}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <div className="rounded-2xl border border-[#F26F21]/18 bg-[#FFF9F5] p-3 sm:p-3.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 whitespace-nowrap">
                          <UserRound className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">Họ và Tên</span>
                        </div>
                        <p className="mt-1 text-sm font-extrabold text-slate-900">
                          {candidate.fullName}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#F26F21]/18 bg-[#FFF9F5] p-3 sm:p-3.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 whitespace-nowrap">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">
                            Ngày tháng năm sinh
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-sm font-extrabold text-slate-900 whitespace-nowrap">
                          {formatVietnameseDate(candidate.dob)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#F26F21]/18 bg-[#FFF9F5] p-3 sm:p-3.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 whitespace-nowrap">
                          <IdCard className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">
                            Mã số sinh viên (MSSV)
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-sm font-extrabold text-[#F26F21] whitespace-nowrap">
                          {candidate.studentId}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#F26F21]/18 bg-[#FFF9F5] p-3 sm:p-3.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 whitespace-nowrap">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">Chuyên ngành</span>
                        </div>
                        <p className="mt-1 text-sm font-extrabold text-slate-900">
                          {candidate.major}
                        </p>
                      </div>
                    </div>

                    <div className="relative rounded-2xl border border-[#F26F21]/25 bg-gradient-to-br from-[#FFF5EE] to-white p-3.5 sm:p-4">
                      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#F26F21] whitespace-nowrap">
                        <Quote className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap">
                          Thông điệp &amp; Thành tựu
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-700">
                        {candidate.bio ||
                          "Thí sinh tiêu biểu đại diện thế hệ sinh viên FPT năng động, sáng tạo và giàu khát vọng cống hiến."}
                      </p>
                    </div>
                  </div>

                  {/* Footer Vote Metrics + Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                          Tổng phiếu bình chọn hiện tại
                        </span>
                        <div className="flex items-baseline gap-2 whitespace-nowrap">
                          <AnimatedNumber
                            value={candidate.voteCount}
                            className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900"
                          />
                          <span className="text-xs font-extrabold text-[#F26F21] whitespace-nowrap">
                            (
                            {totalVotes > 0
                              ? (
                                  (candidate.voteCount / totalVotes) *
                                  100
                                ).toFixed(1)
                              : "0.0"}
                            %)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:border-[#F26F21] hover:bg-[#FFF6F0] hover:text-[#F26F21] cursor-pointer whitespace-nowrap"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                            <span className="whitespace-nowrap text-[#F26F21]">
                              Đã sao chép!
                            </span>
                          </>
                        ) : (
                          <>
                            <Share2 className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                            <span className="whitespace-nowrap">
                              Chia sẻ hồ sơ
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    {isDailyLimitReached && (
                      <CountdownTimer
                        variant="compact"
                        nextResetAt={nextResetAt}
                        onReset={onMidnightReset}
                        className="w-full justify-center py-2"
                      />
                    )}

                    <HyperVoteButton
                      size="lg"
                      onVote={(rect) => onVote(candidate, rect)}
                      isDailyLimitReached={isDailyLimitReached}
                      isLoading={isVotingThis}
                      nextResetAt={nextResetAt}
                      onMidnightReset={onMidnightReset}
                      votedCountToday={votedCountToday}
                      label={
                        votedCountToday > 0
                          ? "Bình chọn thêm (+1)"
                          : "Bình chọn cho ứng viên"
                      }
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
