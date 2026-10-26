"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Award, Crown, IdCard, Medal, Trophy } from "lucide-react";
import type { RankedCandidate } from "@/types/voting";
import { isUnoptimizedImageSrc } from "@/lib/image-utils";
import {
  AnimatedNumber,
  ScrollReveal,
  StaggerItem,
} from "@/components/motion/MotionPrimitives";
import { HyperVoteButton } from "./ui/HyperVoteButton";

interface TopPodiumProps {
  topCandidates: RankedCandidate[];
  totalVotes: number;
  onSelectCandidate: (candidate: RankedCandidate) => void;
  onVote: (
    candidate: RankedCandidate,
    originRect: DOMRect | null
  ) => Promise<boolean>;
  isDailyLimitReached: boolean;
  votingCandidateId: string | null;
  nextResetAt?: string | null;
  onMidnightReset: () => void;
  votedCandidateIdsToday: string[];
}

export function TopPodium({
  topCandidates,
  totalVotes,
  onSelectCandidate,
  onVote,
  isDailyLimitReached,
  votingCandidateId,
  nextResetAt,
  onMidnightReset,
  votedCandidateIdsToday,
}: TopPodiumProps) {
  if (topCandidates.length === 0) return null;

  const first = topCandidates[0];
  const second = topCandidates[1];
  const third = topCandidates[2];

  // Clean White & Official FPT Orange (#F26F21) Horizontal Podium Cards
  const podiumSlots = [
    second && {
      candidate: second,
      orderClass: "order-2 xl:order-1 xl:mt-3",
      cardClass:
        "border border-[#F26F21]/30 bg-white hover:border-[#F26F21] shadow-[0_12px_34px_-12px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_44px_-12px_rgba(242,111,33,0.22)]",
      glowClass: "from-[#FFF4EC] via-transparent to-transparent",
      frameClass: "bg-[#F26F21]/85",
      badgeClass:
        "border border-[#F26F21]/40 bg-[#FFF2E8] text-[#D9580F]",
      badgeText: "TOP 2 • Á QUÂN 1",
      Icon: Medal,
      isChampion: false,
    },
    first && {
      candidate: first,
      orderClass:
        "order-1 md:col-span-2 xl:col-span-1 xl:order-2 xl:-mt-1.5",
      cardClass:
        "border-2 border-[#F26F21] bg-gradient-to-br from-[#FFF9F5] via-white to-[#FFF2E8] shadow-[0_18px_46px_-12px_rgba(242,111,33,0.28)] hover:shadow-[0_24px_56px_-12px_rgba(242,111,33,0.38)]",
      glowClass: "from-[#FFE9D9]/70 via-[#FFF6F0]/40 to-transparent",
      frameClass: "bg-[#F26F21]",
      badgeClass:
        "bg-[#F26F21] text-white shadow-[0_6px_18px_rgba(242,111,33,0.45)]",
      badgeText: "TOP 1 • DẪN ĐẦU",
      Icon: Crown,
      isChampion: true,
    },
    third && {
      candidate: third,
      orderClass: "order-3 xl:order-3 xl:mt-3",
      cardClass:
        "border border-[#F26F21]/25 bg-white hover:border-[#F26F21] shadow-[0_12px_34px_-12px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_44px_-12px_rgba(242,111,33,0.22)]",
      glowClass: "from-[#FFF6F0] via-transparent to-transparent",
      frameClass: "bg-[#F26F21]/70",
      badgeClass:
        "border border-[#F26F21]/35 bg-white text-[#F26F21]",
      badgeText: "TOP 3 • Á QUÂN 2",
      Icon: Award,
      isChampion: false,
    },
  ].filter(Boolean) as Array<{
    candidate: RankedCandidate;
    orderClass: string;
    cardClass: string;
    glowClass: string;
    frameClass: string;
    badgeClass: string;
    badgeText: string;
    Icon: typeof Crown;
    isChampion: boolean;
  }>;

  return (
    <section
      id="podium"
      className="scroll-mt-20 relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-10 sm:pb-14"
    >
      <ScrollReveal className="mb-6 sm:mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-3.5 py-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#F26F21] whitespace-nowrap">
          <Trophy className="h-3.5 w-3.5 shrink-0" />
          <span className="whitespace-nowrap">BỤC VINH DANH</span>
        </div>
        <h2 className="mt-2.5 text-[clamp(1.15rem,5.1vw,2.25rem)] font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
          Top 3 Gương Mặt{" "}
          <span className="text-[#F26F21] whitespace-nowrap">Đang Dẫn Đầu</span>
        </h2>
        <p className="mx-auto mt-1.5 max-w-2xl text-xs sm:text-base text-slate-600 text-balance">
          Thứ hạng cập nhật tự động theo từng lượt bình chọn. Chạm vào thẻ thí
          sinh để xem hồ sơ chi tiết và phóng to ảnh chân dung.
        </p>
      </ScrollReveal>

      <ScrollReveal
        stagger
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 xl:gap-5 items-stretch"
      >
        {podiumSlots.map((slot, index) => {
          const { candidate, Icon } = slot;
          const votedCountToday = votedCandidateIdsToday.filter(
            (id) => id === candidate.id
          ).length;
          const share =
            totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0;
          const shortMajor = candidate.major.split("(")[0].split("—")[0].trim();

          return (
            <StaggerItem
              key={candidate.id}
              index={index}
              className={slot.orderClass}
            >
              <motion.div
                layout
                onClick={() => onSelectCandidate(candidate)}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative flex h-full cursor-pointer items-center gap-3 sm:gap-3.5 overflow-hidden rounded-2xl p-3 sm:p-4 transition-all duration-300 ${slot.cardClass}`}
              >
                {/* Soft Warm Orange Spotlight */}
                <div
                  className={`pointer-events-none absolute inset-y-0 left-0 w-44 bg-gradient-to-r ${slot.glowClass}`}
                />

                {/* Left Portrait Frame */}
                <div className="relative z-10 shrink-0">
                  <div
                    className={`relative h-[108px] w-[84px] sm:h-[118px] sm:w-[94px] rounded-xl ${slot.frameClass} p-[2px] shadow-[0_8px_20px_rgba(242,111,33,0.2)]`}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-orange-50">
                      <Image
                        src={candidate.avatarUrl}
                        alt={candidate.fullName}
                        fill
                        preload={slot.isChampion}
                        unoptimized={isUnoptimizedImageSrc(candidate.avatarUrl)}
                        sizes="110px"
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-108"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/65 to-transparent" />
                      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[9.5px] font-bold text-slate-800 shadow-xs transition-colors group-hover:bg-[#F26F21] group-hover:text-white whitespace-nowrap">
                        <IdCard className="h-2.5 w-2.5 shrink-0" />
                        <span className="whitespace-nowrap">Hồ sơ</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Horizontal Content */}
                <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between self-stretch">
                  {/* Top Row: Medal Rank Badge + MSSV */}
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold tracking-wide whitespace-nowrap ${slot.badgeClass}`}
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="whitespace-nowrap">
                          {slot.badgeText}
                        </span>
                      </span>

                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-slate-700 whitespace-nowrap shrink-0">
                        {candidate.studentId}
                      </span>
                    </div>

                    {/* Name & Major + Share */}
                    <h3 className="mt-1.5 truncate text-[15px] sm:text-lg font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-[#F26F21]">
                      {candidate.fullName}
                    </h3>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-block max-w-[136px] sm:max-w-[190px] truncate rounded-full border border-[#F26F21]/25 bg-[#FFF4EC] px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-[#D9580F] whitespace-nowrap">
                        {shortMajor}
                      </span>
                      <span className="rounded-full border border-[#F26F21]/30 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#F26F21] whitespace-nowrap shrink-0">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Vote Counter + Compact HyperVoteButton */}
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#F26F21]/15 pt-2">
                    <div className="flex items-baseline gap-1 whitespace-nowrap">
                      <AnimatedNumber
                        value={candidate.voteCount}
                        className="font-mono text-base sm:text-xl font-extrabold text-slate-900"
                      />
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-500 whitespace-nowrap">
                        phiếu
                      </span>
                    </div>

                    <HyperVoteButton
                      size="sm"
                      fullWidth={false}
                      onVote={(rect) => onVote(candidate, rect)}
                      isDailyLimitReached={isDailyLimitReached}
                      isLoading={votingCandidateId === candidate.id}
                      nextResetAt={nextResetAt}
                      onMidnightReset={onMidnightReset}
                      votedCountToday={votedCountToday}
                    />
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          );
        })}
      </ScrollReveal>
    </section>
  );
}
