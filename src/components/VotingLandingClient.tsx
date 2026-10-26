"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  BellRing,
  Briefcase,
  CalendarCheck2,
  CheckCircle2,
  Cpu,
  LayoutGrid,
  Megaphone,
  Palette,
  RefreshCw,
  ScrollText,
  Search,
  Trophy,
  Users,
  Vote,
  X,
} from "lucide-react";
import type { RankedCandidate } from "@/types/voting";
import type { NewsArticle } from "@/data/contest-content";
import { useRealtimeVoting } from "@/hooks/useRealtimeVoting";
import {
  AnimatedNumber,
  ScrollReveal,
  StaggerItem,
} from "./motion/MotionPrimitives";
import { Navbar } from "./Navbar";
import { TopPodium } from "./TopPodium";
import { TiltCandidateCard } from "./ui/TiltCandidateCard";
import { CountdownTimer } from "./ui/CountdownTimer";
import { CandidateDetailModal } from "./CandidateDetailModal";
import { GoogleAuthModal } from "./GoogleAuthModal";
import { NewsAndEcosystemSection } from "./NewsAndEcosystemSection";

interface VotingLandingClientProps {
  initialCandidates: RankedCandidate[];
  initialTotalVotes: number;
  initialNews?: NewsArticle[];
}

type FilterKey = "all" | "it" | "design" | "biz" | "pr";

export function VotingLandingClient({
  initialCandidates,
  initialTotalVotes,
  initialNews,
}: VotingLandingClientProps) {
  const {
    candidates,
    totalVotes,
    sseConnected,
    liveFeed,
    toastMessage,
    dismissToast,
    isAuthenticated,
    sessionUser,
    maxDailyVotes,
    votesUsedToday,
    remainingVotes,
    isDailyLimitReached,
    votedCandidateIdsToday,
    nextResetAt,
    votingCandidateId,
    castVote,
    isAuthModalOpen,
    authModalCandidate,
    openSignInPrompt,
    closeSignInPrompt,
    handleMidnightReset,
  } = useRealtimeVoting({
    initialCandidates,
    initialTotalVotes,
  });

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedCandidateId) ?? null,
    [candidates, selectedCandidateId]
  );

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return candidates.filter((c) => {
      if (q) {
        const hay =
          `${c.fullName} ${c.studentId} ${c.major} ${c.bio ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (activeFilter === "it") {
        return /(phần mềm|lập trình|web|ai|công nghệ)/i.test(c.major);
      }
      if (activeFilter === "design") {
        return /(thiết kế|đồ họa|ui\/ux|đa phương tiện)/i.test(c.major);
      }
      if (activeFilter === "biz") {
        return /(marketing|kinh doanh|logistics|thương mại)/i.test(c.major);
      }
      if (activeFilter === "pr") {
        return /(pr|sự kiện|truyền thông|marketing)/i.test(c.major);
      }
      return true;
    });
  }, [candidates, searchQuery, activeFilter]);

  const filterChips: Array<{
    id: FilterKey;
    label: string;
    Icon: typeof LayoutGrid;
  }> = [
    { id: "all", label: `Tất cả (${candidates.length})`, Icon: LayoutGrid },
    { id: "it", label: "Công nghệ Thông tin", Icon: Cpu },
    { id: "design", label: "Thiết kế Đồ họa", Icon: Palette },
    { id: "biz", label: "Kinh tế & Marketing", Icon: Briefcase },
    { id: "pr", label: "PR & Sự kiện", Icon: Megaphone },
  ];

  const latestLiveEvent = liveFeed[0] ?? null;

  return (
    <div className="relative min-h-screen overflow-x-clip bg-white text-slate-900">
      {/* Crisp White & Soft Warm FPT Orange (#F26F21) Ambient Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-stage-grid opacity-90" />
        <div className="absolute -top-44 left-1/2 h-[540px] w-[860px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,111,33,0.14)_0%,rgba(242,111,33,0.04)_48%,transparent_72%)] blur-3xl" />
        <div className="absolute top-[34%] -left-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(242,111,33,0.08)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute top-[64%] -right-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(242,111,33,0.08)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* Sticky White & FPT Orange Navbar */}
      <Navbar
        sseConnected={sseConnected}
        isAuthenticated={isAuthenticated}
        user={sessionUser}
        remainingVotes={remainingVotes}
        maxDailyVotes={maxDailyVotes}
        isDailyLimitReached={isDailyLimitReached}
        nextResetAt={nextResetAt}
        onMidnightReset={handleMidnightReset}
        onOpenSignIn={() => openSignInPrompt(null)}
      />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key={toastMessage.id}
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.95 }}
            className="fixed inset-x-3 sm:inset-x-auto sm:right-4 top-18 sm:top-20 z-50 sm:w-full sm:max-w-sm rounded-2xl border-2 border-[#F26F21]/45 bg-white p-3.5 sm:p-4 shadow-[0_20px_50px_rgba(242,111,33,0.24)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF2E8] text-[#F26F21]">
                  {toastMessage.tone === "warning" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                    {toastMessage.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {toastMessage.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissToast}
                className="text-slate-400 hover:text-[#F26F21] cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        {/* 1. HERO STAGE SECTION */}
        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-10 sm:pb-12">
          <ScrollReveal className="mx-auto max-w-4xl text-center">
            {/* Official Event Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F26F21]/35 bg-[#FFF4EC] px-3.5 py-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#F26F21] shadow-[0_4px_16px_rgba(242,111,33,0.12)] whitespace-nowrap">
                <Trophy className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                <span className="whitespace-nowrap">
                  FPOLY ĐỒNG NAI • GALA 2026
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F26F21]/25 bg-white px-3 py-1.5 text-[11px] sm:text-xs font-bold text-[#D9580F] shadow-xs whitespace-nowrap">
                <span className="h-2 w-2 rounded-full bg-[#F26F21] animate-pulse shrink-0" />
                <span className="whitespace-nowrap">CỔNG VOTE ĐANG MỞ</span>
              </span>
            </div>

            <h1 className="mt-5 sm:mt-6 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-slate-900">
              Tôn Vinh Gương Mặt{" "}
              <span className="text-[#F26F21]">Sinh Viên Tiêu Biểu</span>{" "}
              FPT Polytechnic Đồng Nai
            </h1>

            <p className="mx-auto mt-4 sm:mt-5 max-w-2xl text-sm sm:text-lg leading-relaxed text-slate-600">
              Cổng bình chọn trực tuyến thời gian thực dành riêng cho sinh viên
              tiêu biểu{" "}
              <span className="font-bold text-[#F26F21] whitespace-nowrap">
                FPT Polytechnic Đồng Nai
              </span>
              . Mỗi lá phiếu của bạn là nguồn động lực tiếp lửa tinh thần{" "}
              <span className="font-semibold text-slate-800 whitespace-nowrap">
                &ldquo;Thực học — Thực nghiệp&rdquo;
              </span>{" "}
              cho những chú Ong Vàng tài năng!
            </p>

            {/* Primary Hero Actions */}
            <div className="mx-auto mt-7 sm:mt-8 flex w-full max-w-xs sm:max-w-none flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-3.5">
              <a
                href="#leaderboard"
                className="shimmer-sweep relative inline-flex h-12 sm:h-13 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-[#F26F21] px-7 text-sm sm:text-base font-extrabold text-white shadow-[0_12px_32px_-6px_rgba(242,111,33,0.55)] transition-all hover:-translate-y-0.5 hover:bg-[#D9580F] hover:shadow-[0_16px_40px_-4px_rgba(242,111,33,0.68)] whitespace-nowrap"
              >
                <Vote className="h-4.5 w-4.5 shrink-0" />
                <span className="whitespace-nowrap">Bình chọn ngay</span>
              </a>

              <a
                href="#rules"
                className="inline-flex h-12 sm:h-13 items-center justify-center gap-2 rounded-2xl border-2 border-[#F26F21]/30 bg-white px-6 text-sm sm:text-base font-bold text-[#F26F21] shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#F26F21] hover:bg-[#FFF6F0] whitespace-nowrap"
              >
                <ScrollText className="h-4 w-4 shrink-0 text-[#F26F21]" />
                <span className="whitespace-nowrap">
                  Xem thể lệ &amp; giải thưởng
                </span>
              </a>
            </div>
          </ScrollReveal>

          {/* Live Contest Metrics Strip (Equal Height Cards) */}
          <ScrollReveal
            stagger
            className="mx-auto mt-8 sm:mt-10 grid max-w-5xl grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <StaggerItem index={0} className="h-full">
              <div className="flex h-full flex-col items-center justify-between rounded-2xl border border-[#F26F21]/25 bg-white px-3 py-3.5 sm:p-4 text-center shadow-[0_10px_28px_-12px_rgba(242,111,33,0.18)] transition-all hover:-translate-y-0.5 hover:border-[#F26F21]">
                <div className="inline-flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  <Vote className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                  <span className="whitespace-nowrap">TỔNG PHIẾU BẦU</span>
                </div>
                <div className="mt-1.5 flex min-h-7 sm:min-h-9 items-center justify-center">
                  <AnimatedNumber
                    value={totalVotes}
                    duration={1.65}
                    showDeltaBadge
                    className="font-mono text-xl sm:text-3xl font-extrabold text-slate-900"
                  />
                </div>
              </div>
            </StaggerItem>

            <StaggerItem index={1} className="h-full">
              <div className="flex h-full flex-col items-center justify-between rounded-2xl border border-[#F26F21]/25 bg-white px-3 py-3.5 sm:p-4 text-center shadow-[0_10px_28px_-12px_rgba(242,111,33,0.18)] transition-all hover:-translate-y-0.5 hover:border-[#F26F21]">
                <div className="inline-flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  <Users className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                  <span className="whitespace-nowrap">ỨNG VIÊN TOP</span>
                </div>
                <div className="mt-1.5 flex min-h-7 sm:min-h-9 items-center justify-center">
                  <AnimatedNumber
                    value={candidates.length}
                    padStart={2}
                    duration={1.1}
                    className="font-mono text-xl sm:text-3xl font-extrabold text-slate-900"
                  />
                </div>
              </div>
            </StaggerItem>

            <StaggerItem index={2} className="h-full">
              <div className="flex h-full flex-col items-center justify-between rounded-2xl border border-[#F26F21]/25 bg-white px-3 py-3.5 sm:p-4 text-center shadow-[0_10px_28px_-12px_rgba(242,111,33,0.18)] transition-all hover:-translate-y-0.5 hover:border-[#F26F21]">
                <div className="inline-flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  <CalendarCheck2 className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                  <span className="whitespace-nowrap">LƯỢT MỖI NGÀY</span>
                </div>
                <div className="mt-1.5 flex min-h-7 sm:min-h-9 items-center justify-center">
                  <div className="inline-flex items-baseline gap-1.5 sm:gap-2 whitespace-nowrap">
                    <AnimatedNumber
                      value={3}
                      padStart={2}
                      duration={0.95}
                      className="font-mono text-xl sm:text-3xl font-extrabold text-slate-900"
                    />
                    <span className="text-xl sm:text-3xl font-extrabold text-slate-900 whitespace-nowrap">
                      lượt
                    </span>
                  </div>
                </div>
              </div>
            </StaggerItem>

            <StaggerItem index={3} className="h-full">
              <div className="flex h-full flex-col items-center justify-between rounded-2xl border border-[#F26F21]/25 bg-white px-3 py-3.5 sm:p-4 text-center shadow-[0_10px_28px_-12px_rgba(242,111,33,0.18)] transition-all hover:-translate-y-0.5 hover:border-[#F26F21]">
                <div className="inline-flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  <RefreshCw className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                  <span className="whitespace-nowrap">ĐỒNG BỘ BXH</span>
                </div>
                <p className="mt-1.5 flex min-h-7 sm:min-h-9 items-center justify-center text-sm sm:text-xl font-extrabold text-[#F26F21] whitespace-nowrap">
                  {sseConnected ? "Cập nhật tức thì" : "Tự động cập nhật"}
                </p>
              </div>
            </StaggerItem>
          </ScrollReveal>

          {/* Daily Voting Quota / Countdown Banner */}
          <div className="mx-auto mt-5 sm:mt-6 max-w-5xl">
            {isDailyLimitReached ? (
              <CountdownTimer
                variant="banner"
                nextResetAt={nextResetAt}
                onReset={handleMidnightReset}
              />
            ) : isAuthenticated ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#F26F21]/25 bg-white px-4 sm:px-5 py-3.5 text-center sm:text-left shadow-[0_10px_28px_-12px_rgba(242,111,33,0.18)]"
              >
                <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-1.5 shrink-0">
                    {[0, 1, 2].map((slot) => (
                      <span
                        key={slot}
                        className={`h-3 w-7 rounded-full transition-all ${
                          slot < remainingVotes
                            ? "bg-[#F26F21] shadow-[0_0_12px_rgba(242,111,33,0.5)]"
                            : "bg-orange-100"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">
                    Hạn mức hôm nay: Bạn còn{" "}
                    <span className="font-mono font-extrabold text-[#F26F21] whitespace-nowrap">
                      0{remainingVotes}/0{maxDailyVotes} lượt
                    </span>{" "}
                    bình chọn (reset lúc{" "}
                    <span className="font-mono text-slate-900 font-bold whitespace-nowrap">
                      00:00:00
                    </span>
                    )
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-3 py-1 text-xs font-bold text-[#F26F21] whitespace-nowrap shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">
                    Đã dùng {votesUsedToday}/{maxDailyVotes}
                  </span>
                </span>
              </motion.div>
            ) : null}

            {/* Live SSE Vote Ticker Pill */}
            <AnimatePresence mode="wait">
              {latestLiveEvent && (
                <motion.div
                  key={latestLiveEvent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 flex items-center justify-center"
                >
                  <div className="inline-flex max-w-full items-center gap-2 overflow-hidden rounded-full border border-[#F26F21]/30 bg-[#FFF5EE] px-3.5 py-1.5 text-xs text-slate-700 shadow-xs">
                    <BellRing className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                    <span className="truncate">
                      <strong className="text-slate-900">
                        {latestLiveEvent.voterHint}
                      </strong>{" "}
                      vừa bình chọn cho{" "}
                      <strong className="text-[#F26F21]">
                        {latestLiveEvent.candidateName}
                      </strong>
                    </span>
                    <span className="rounded-full bg-[#F26F21] px-2 py-0.5 font-mono text-[10px] font-extrabold text-white whitespace-nowrap shrink-0">
                      +1
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* 2. TOP 3 PODIUM SECTION */}
        <TopPodium
          topCandidates={candidates.slice(0, 3)}
          totalVotes={totalVotes}
          onSelectCandidate={(c) => setSelectedCandidateId(c.id)}
          onVote={castVote}
          isDailyLimitReached={isDailyLimitReached}
          votingCandidateId={votingCandidateId}
          nextResetAt={nextResetAt}
          onMidnightReset={handleMidnightReset}
          votedCandidateIdsToday={votedCandidateIdsToday}
        />

        {/* 3. FULL REAL-TIME CANDIDATE LEADERBOARD GRID */}
        <section
          id="leaderboard"
          className="scroll-mt-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12"
        >
          <ScrollReveal className="mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-3.5 py-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#F26F21] whitespace-nowrap">
                <BarChart3 className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">
                  BẢNG XẾP HẠNG TRỰC TUYẾN
                </span>
              </div>
              <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Danh Sách Ứng Viên{" "}
                <span className="text-[#F26F21]">Chung Kết FPoly Đồng Nai</span>
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên thí sinh, MSSV, ngành..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-colors focus:border-[#F26F21] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#F26F21] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </ScrollReveal>

          {/* Filter Chips (Strictly whitespace-nowrap with Semantic Icons) */}
          <ScrollReveal className="mb-7 sm:mb-8 flex items-center gap-2 overflow-x-auto pb-2">
            {filterChips.map((chip) => {
              const active = activeFilter === chip.id;
              const ChipIcon = chip.Icon;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveFilter(chip.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? "bg-[#F26F21] text-white shadow-[0_8px_22px_rgba(242,111,33,0.4)]"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-[#F26F21]/60 hover:bg-[#FFF6F0] hover:text-[#F26F21]"
                  }`}
                >
                  <ChipIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{chip.label}</span>
                </button>
              );
            })}
          </ScrollReveal>

          {/* Candidate Cards Grid (Horizontal Cards) */}
          {filteredCandidates.length === 0 ? (
            <div className="rounded-3xl border border-[#F26F21]/25 bg-white p-10 sm:p-12 text-center shadow-[0_10px_28px_-12px_rgba(242,111,33,0.15)]">
              <p className="text-sm sm:text-base font-bold text-slate-900">
                Không tìm thấy thí sinh phù hợp với từ khóa &ldquo;{searchQuery}
                &rdquo;
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="mt-4 inline-flex items-center rounded-xl bg-[#F26F21] px-4 py-2 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
              >
                Hiển thị tất cả ứng viên
              </button>
            </div>
          ) : (
            <ScrollReveal
              stagger
              className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-5"
            >
              {filteredCandidates.map((candidate, index) => {
                const votedCountToday = votedCandidateIdsToday.filter(
                  (id) => id === candidate.id
                ).length;

                return (
                  <StaggerItem
                    key={candidate.id}
                    index={index}
                    className="h-full"
                  >
                    <TiltCandidateCard
                      candidate={candidate}
                      totalVotes={totalVotes}
                      onSelectCandidate={(c) => setSelectedCandidateId(c.id)}
                      onVote={castVote}
                      isDailyLimitReached={isDailyLimitReached}
                      isVotingThis={votingCandidateId === candidate.id}
                      nextResetAt={nextResetAt}
                      onMidnightReset={handleMidnightReset}
                      votedCountToday={votedCountToday}
                    />
                  </StaggerItem>
                );
              })}
            </ScrollReveal>
          )}
        </section>

        {/* 4. RULES, TIMELINE, CAMPUS NEWS & SPONSORS */}
        <NewsAndEcosystemSection initialArticles={initialNews} />
      </main>

      {/* Candidate Detail Modal (Glassmorphism + Photo Zoom) */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        totalVotes={totalVotes}
        onClose={() => setSelectedCandidateId(null)}
        onVote={castVote}
        isDailyLimitReached={isDailyLimitReached}
        isVotingThis={
          Boolean(selectedCandidate) &&
          votingCandidateId === selectedCandidate?.id
        }
        nextResetAt={nextResetAt}
        onMidnightReset={handleMidnightReset}
        votedCountToday={
          selectedCandidate
            ? votedCandidateIdsToday.filter((id) => id === selectedCandidate.id)
                .length
            : 0
        }
      />

      {/* Instant Google Sign-In Prompt Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        targetCandidate={authModalCandidate}
        onClose={closeSignInPrompt}
      />
    </div>
  );
}
