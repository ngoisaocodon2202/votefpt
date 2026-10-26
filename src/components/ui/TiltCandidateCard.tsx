"use client";

import { useRef, type MouseEvent } from "react";
import Image from "next/image";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Award, CheckCircle2, Crown, IdCard, Medal } from "lucide-react";
import type { RankedCandidate } from "@/types/voting";
import { isUnoptimizedImageSrc } from "@/lib/image-utils";
import { AnimatedNumber } from "@/components/motion/MotionPrimitives";
import { HyperVoteButton } from "./HyperVoteButton";

interface TiltCandidateCardProps {
  candidate: RankedCandidate;
  totalVotes: number;
  onSelectCandidate: (candidate: RankedCandidate) => void;
  onVote: (
    candidate: RankedCandidate,
    originRect: DOMRect | null
  ) => Promise<boolean>;
  isDailyLimitReached: boolean;
  isVotingThis: boolean;
  nextResetAt?: string | null;
  onMidnightReset?: () => void;
  votedCountToday: number;
}

function getRankBadgeConfig(rank: number) {
  if (rank === 1) {
    return {
      shortLabel: "#1",
      bg: "bg-[#F26F21] text-white shadow-[0_4px_14px_rgba(242,111,33,0.55)]",
      border: "border-[#F26F21]/60",
      Icon: Crown,
    };
  }
  if (rank === 2) {
    return {
      shortLabel: "#2",
      bg: "bg-white text-[#D9580F] border border-[#F26F21]/50 shadow-xs",
      border: "border-[#F26F21]/35",
      Icon: Medal,
    };
  }
  if (rank === 3) {
    return {
      shortLabel: "#3",
      bg: "bg-[#FFF3EB] text-[#F26F21] border border-[#F26F21]/45 shadow-xs",
      border: "border-[#F26F21]/25",
      Icon: Award,
    };
  }
  return {
    shortLabel: `#${rank}`,
    bg: "bg-white/95 text-slate-800 border border-slate-200 shadow-xs",
    border: "border-slate-200/90",
    Icon: null,
  };
}

export function TiltCandidateCard({
  candidate,
  totalVotes,
  onSelectCandidate,
  onVote,
  isDailyLimitReached,
  isVotingThis,
  nextResetAt,
  onMidnightReset,
  votedCountToday,
}: TiltCandidateCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Smooth 3D Tilt & Cursor Spotlight Motion Values
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const smoothRotateX = useSpring(rotateX, {
    stiffness: 230,
    damping: 24,
    mass: 0.5,
  });
  const smoothRotateY = useSpring(rotateY, {
    stiffness: 230,
    damping: 24,
    mass: 0.5,
  });

  const spotlightBg = useMotionTemplate`radial-gradient(340px circle at ${glareX}% ${glareY}%, rgba(242, 111, 33, 0.11), transparent 75%)`;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    rotateX.set((0.5 - py) * 6);
    rotateY.set((px - 0.5) * 6);
    glareX.set(px * 100);
    glareY.set(py * 100);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const rankCfg = getRankBadgeConfig(candidate.rank);
  const RankIcon = rankCfg.Icon;
  const sharePercent =
    totalVotes > 0 ? Math.min(100, (candidate.voteCount / totalVotes) * 100) : 0;

  // Compact major label for badge (strictly whitespace-nowrap)
  const shortMajor = candidate.major.split("(")[0].split("—")[0].trim();

  return (
    <motion.article
      layout
      layoutId={`candidate-card-${candidate.id}`}
      transition={{ layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
      style={{ perspective: 1100 }}
      className="h-full"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => onSelectCandidate(candidate)}
        style={{
          rotateX: smoothRotateX,
          rotateY: smoothRotateY,
          transformStyle: "preserve-3d",
        }}
        className={`group relative flex h-full cursor-pointer items-center gap-3 lg:gap-4 overflow-hidden rounded-2xl border ${rankCfg.border} bg-white p-3 lg:p-4 shadow-[0_8px_28px_-10px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-2 hover:border-[#F26F21] hover:shadow-[0_20px_46px_-12px_rgba(242,111,33,0.28)]`}
      >
        {/* Dynamic FPT Orange Cursor Spotlight Glare */}
        <motion.div
          aria-hidden="true"
          style={{ background: spotlightBg }}
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Left Candidate Portrait Thumbnail */}
        <div className="relative z-20 h-[108px] w-[84px] lg:h-[122px] lg:w-[98px] shrink-0 overflow-hidden rounded-xl bg-orange-50 ring-1 ring-[#F26F21]/20">
          <Image
            src={candidate.avatarUrl}
            alt={candidate.fullName}
            fill
            unoptimized={isUnoptimizedImageSrc(candidate.avatarUrl)}
            sizes="120px"
            className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
          />

          <div className="absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-black/65 to-transparent" />

          {/* Floating Rank Pill (Medal Icon for Top 3, Clean Number for #4+) */}
          <span
            className={`absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] lg:text-[11px] font-extrabold tracking-wide whitespace-nowrap ${rankCfg.bg}`}
          >
            {RankIcon && (
              <RankIcon className="h-2.5 w-2.5 lg:h-3 lg:w-3 shrink-0" />
            )}
            <span className="whitespace-nowrap">{rankCfg.shortLabel}</span>
          </span>

          {/* Profile View Hint */}
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[9.5px] font-bold text-slate-800 shadow-xs transition-colors group-hover:bg-[#F26F21] group-hover:text-white whitespace-nowrap">
            <IdCard className="h-2.5 w-2.5 shrink-0" />
            <span className="whitespace-nowrap">Hồ sơ</span>
          </span>
        </div>

        {/* Right Horizontal Candidate Details & Vote Action */}
        <div className="relative z-20 flex min-w-0 flex-1 flex-col justify-between self-stretch">
          <div>
            {/* Row 1: Major Tag + MSSV */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="inline-block max-w-[126px] lg:max-w-[210px] truncate rounded-full border border-[#F26F21]/25 bg-[#FFF4EC] px-2 py-0.5 text-[10px] lg:text-[11px] font-semibold text-[#D9580F] whitespace-nowrap">
                {shortMajor}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                {votedCountToday > 0 && (
                  <span className="hidden lg:inline-flex items-center gap-1 rounded-full border border-[#F26F21]/35 bg-[#FFF2E8] px-2 py-0.5 text-[10px] font-bold text-[#F26F21] whitespace-nowrap">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span className="whitespace-nowrap">+{votedCountToday}</span>
                  </span>
                )}
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] lg:text-[11px] font-bold tracking-wider text-slate-700 whitespace-nowrap">
                  {candidate.studentId}
                </span>
              </div>
            </div>

            {/* Row 2: Full Name & 1-Line Bio */}
            <h3 className="mt-1 truncate text-[15px] lg:text-lg font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-[#F26F21]">
              {candidate.fullName}
            </h3>

            {candidate.bio && (
              <p className="mt-0.5 line-clamp-1 text-[11px] lg:text-xs text-slate-600">
                {candidate.bio}
              </p>
            )}
          </div>

          {/* Row 3: Vote Progress Bar + Count & HyperVoteButton */}
          <div className="mt-2 space-y-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-orange-100/90">
              <motion.div
                initial={false}
                animate={{ width: `${Math.max(5, sharePercent)}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-[#F26F21] to-[#D9580F]"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <AnimatedNumber
                  value={candidate.voteCount}
                  className="font-mono text-sm lg:text-lg font-extrabold text-slate-900"
                />
                <span className="text-[10px] lg:text-xs font-semibold text-slate-500 whitespace-nowrap">
                  phiếu
                </span>
                <span className="hidden lg:inline font-mono text-xs font-bold text-[#F26F21] whitespace-nowrap">
                  • {sharePercent.toFixed(1)}%
                </span>
              </div>

              <HyperVoteButton
                size="sm"
                fullWidth={false}
                onVote={(rect) => onVote(candidate, rect)}
                isDailyLimitReached={isDailyLimitReached}
                isLoading={isVotingThis}
                nextResetAt={nextResetAt}
                onMidnightReset={onMidnightReset}
                votedCountToday={votedCountToday}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}
