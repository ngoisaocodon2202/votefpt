"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Building2,
  CalendarRange,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  FileCheck2,
  GraduationCap,
  LockKeyhole,
  MapPin,
  Megaphone,
  Mic,
  Newspaper,
  Palette,
  Scale,
  School,
  TimerReset,
  Trophy,
  UserCheck,
  Vote,
  Wifi,
  X,
} from "lucide-react";
import {
  CAMPUS_NEWS,
  EVENT_TIMELINE,
  SPONSORS,
  VOTING_RULES,
  type NewsArticle,
  type TimelinePhase,
  type VotingRuleItem,
} from "@/data/contest-content";
import { ScrollReveal, StaggerItem } from "./motion/MotionPrimitives";
import { FptBrandMark } from "./Navbar";
import { isUnoptimizedImageSrc } from "@/lib/image-utils";

const FPOLY_DEPARTMENTS = [
  { label: "Biên Hòa • Đồng Nai", Icon: MapPin },
  { label: "Công nghệ Thông tin", Icon: Cpu },
  { label: "Thiết kế Đồ họa", Icon: Palette },
  { label: "Digital Marketing", Icon: Briefcase },
  { label: "PR & Sự kiện", Icon: Megaphone },
];

function getRuleIcon(key: VotingRuleItem["iconKey"]) {
  if (key === "auth") return UserCheck;
  if (key === "limit") return TimerReset;
  return LockKeyhole;
}

function getTimelineIcon(key: TimelinePhase["iconKey"]) {
  if (key === "file") return FileCheck2;
  if (key === "vote") return Vote;
  if (key === "mic") return Mic;
  return Trophy;
}

function getSponsorIcon(
  key: "school" | "graduation" | "briefcase" | "code" | "wifi" | "newspaper"
) {
  if (key === "school") return School;
  if (key === "graduation") return GraduationCap;
  if (key === "briefcase") return Briefcase;
  if (key === "code") return Code2;
  if (key === "wifi") return Wifi;
  return Newspaper;
}

const newsFetcher = async (url: string): Promise<{ articles: NewsArticle[] }> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch news");
  return res.json();
};

export function NewsAndEcosystemSection({
  initialArticles = CAMPUS_NEWS,
}: {
  initialArticles?: NewsArticle[];
}) {
  const hasServerArticles = initialArticles.length > 0;
  const { data: newsData } = useSWR<{ articles: NewsArticle[] }>(
    hasServerArticles ? null : "/api/news",
    newsFetcher,
    {
      fallbackData: {
        articles: hasServerArticles ? initialArticles : CAMPUS_NEWS,
      },
      revalidateOnFocus: false,
      refreshWhenHidden: false,
      dedupingInterval: 60000,
    }
  );

  const articles = newsData?.articles ?? initialArticles;

  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
    null
  );

  useEffect(() => {
    if (!selectedArticle) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedArticle(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedArticle]);

  const featuredArticle =
    articles.find((a) => a.featured) || articles[0] || null;
  const secondaryArticles = featuredArticle
    ? articles.filter((a) => a.id !== featuredArticle.id)
    : [];

  return (
    <div className="relative z-10 space-y-20 sm:space-y-24 pb-0">
      {/* 1. VOTING RULES SECTION */}
      <section
        id="rules"
        className="scroll-mt-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6"
      >
        <ScrollReveal className="mb-8 sm:mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-3.5 py-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#F26F21] whitespace-nowrap">
            <Scale className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">
              THỂ LỆ &amp; CƠ CHẾ MINH BẠCH
            </span>
          </div>
          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Quy Tắc Bình Chọn{" "}
            <span className="text-[#F26F21]">Công Bằng Tuyệt Đối</span>
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-slate-600">
            Mọi phiếu bầu đều được định danh qua Google OAuth 2.0 và bảo vệ bằng
            khóa giao dịch nguyên tử trên cơ sở dữ liệu PostgreSQL.
          </p>
        </ScrollReveal>

        <ScrollReveal
          stagger
          className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6"
        >
          {VOTING_RULES.map((rule, index) => {
            const RuleIcon = getRuleIcon(rule.iconKey);

            return (
              <StaggerItem key={rule.code} index={index}>
                <div className="group h-full rounded-3xl border border-[#F26F21]/20 bg-white p-5 sm:p-6 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-2 hover:border-[#F26F21] hover:shadow-[0_20px_48px_-14px_rgba(242,111,33,0.25)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-3 py-1 font-mono text-xs font-extrabold text-[#F26F21] whitespace-nowrap">
                      <span className="h-2 w-2 rounded-full bg-[#F26F21]" />
                      <span className="whitespace-nowrap">{rule.code}</span>
                    </span>

                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF4EC] text-[#F26F21] transition-colors group-hover:bg-[#F26F21] group-hover:text-white shrink-0">
                      <RuleIcon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg sm:text-xl font-extrabold text-slate-900">
                    {rule.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                    {rule.description}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </ScrollReveal>
      </section>

      {/* 2. EVENT TIMELINE SECTION */}
      <section
        id="timeline"
        className="scroll-mt-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <ScrollReveal className="mb-8 sm:mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-3.5 py-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#F26F21] whitespace-nowrap">
            <CalendarRange className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">LỘ TRÌNH CUỘC THI 2026</span>
          </div>
          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Hành Trình Tìm Kiếm{" "}
            <span className="text-[#F26F21]">Ngôi Sao Truyền Cảm Hứng</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal
          stagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          {EVENT_TIMELINE.map((phase, index) => {
            const isLive = phase.status === "live";
            const isDone = phase.status === "completed";
            const PhaseIcon = getTimelineIcon(phase.iconKey);

            return (
              <StaggerItem key={phase.step} index={index}>
                <div
                  className={`relative flex h-full flex-col justify-between rounded-3xl border p-5 sm:p-6 transition-all duration-300 hover:-translate-y-2 ${
                    isLive
                      ? "border-2 border-[#F26F21] bg-gradient-to-b from-[#FFF6F0] to-white shadow-[0_20px_50px_-14px_rgba(242,111,33,0.28)]"
                      : "border-slate-200 bg-white shadow-[0_8px_26px_-10px_rgba(15,23,42,0.06)] hover:border-[#F26F21]/60"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl shrink-0 ${
                          isLive
                            ? "bg-[#F26F21] text-white shadow-[0_8px_20px_rgba(242,111,33,0.4)]"
                            : "bg-[#FFF4EC] text-[#F26F21]"
                        }`}
                      >
                        <PhaseIcon className="h-5 w-5" />
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-[11px] font-extrabold whitespace-nowrap ${
                          isLive
                            ? "bg-[#F26F21] text-white shadow-[0_4px_14px_rgba(242,111,33,0.45)]"
                            : isDone
                            ? "border border-[#F26F21]/30 bg-[#FFF4EC] text-[#D9580F]"
                            : "border border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {isLive && (
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                          </span>
                        )}
                        {isDone && (
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-[#F26F21]" />
                        )}
                        <span className="whitespace-nowrap">{phase.badge}</span>
                      </span>
                    </div>

                    <p className="mt-4 font-mono text-xs font-extrabold text-[#F26F21] whitespace-nowrap">
                      {phase.dateRange}
                    </p>
                    <h3 className="mt-1.5 text-base sm:text-lg font-extrabold text-slate-900">
                      {phase.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                      {phase.description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </ScrollReveal>
      </section>

      {/* 3. CAMPUS NEWS & ARTICLES SECTION */}
      <section
        id="news"
        className="scroll-mt-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <ScrollReveal className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-3.5 py-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#F26F21] whitespace-nowrap">
              <Newspaper className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                TIN TỨC &amp; BÀI VIẾT CAMPUS
              </span>
            </div>
            <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Nhịp Đập{" "}
              <span className="text-[#F26F21]">FPT Polytechnic Đồng Nai</span>
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-slate-600">
            Cập nhật liên tục tin tức sự kiện, dự án xưởng thực hành và câu
            chuyện truyền cảm hứng của sinh viên FPT Polytechnic cơ sở Đồng Nai.
          </p>
        </ScrollReveal>

        {featuredArticle ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Featured Main Story */}
            <ScrollReveal
              className={
                secondaryArticles.length > 0 ? "lg:col-span-7" : "lg:col-span-12"
              }
            >
              <article
                onClick={() => setSelectedArticle(featuredArticle)}
                className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_36px_-12px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-2 hover:border-[#F26F21] hover:shadow-[0_24px_56px_-12px_rgba(242,111,33,0.26)]"
              >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-orange-50">
                <Image
                  src={featuredArticle.imageUrl}
                  alt={featuredArticle.title}
                  fill
                  unoptimized={isUnoptimizedImageSrc(featuredArticle.imageUrl)}
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute left-3.5 sm:left-4 top-3.5 sm:top-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F26F21] px-3 py-1 text-[11px] font-extrabold text-white shadow-md whitespace-nowrap">
                    {featuredArticle.category}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm whitespace-nowrap">
                    <MapPin className="h-3 w-3 shrink-0 text-[#F26F21]" />
                    <span className="whitespace-nowrap">
                      {featuredArticle.campus}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5 sm:p-7">
                <div>
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                    <span className="font-mono whitespace-nowrap">
                      {featuredArticle.publishedAt}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                      <span className="whitespace-nowrap">
                        {featuredArticle.readTime}
                      </span>
                    </span>
                  </div>
                  <h3 className="mt-2.5 text-lg sm:text-2xl font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#F26F21]">
                    {featuredArticle.title}
                  </h3>
                  <p className="mt-2.5 sm:mt-3 text-sm leading-relaxed text-slate-600">
                    {featuredArticle.excerpt}
                  </p>
                </div>

                <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#F26F21] whitespace-nowrap">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">
                      Đọc toàn bộ bài viết
                    </span>
                  </span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#F26F21]/25 bg-[#FFF5EE] text-[#F26F21] transition-all group-hover:border-[#F26F21] group-hover:bg-[#F26F21] group-hover:text-white shrink-0">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </article>
          </ScrollReveal>

          {/* Secondary Multi-Card Stack */}
          <ScrollReveal
            stagger
            className="lg:col-span-5 flex flex-col gap-4 sm:gap-5 justify-between"
          >
            {secondaryArticles.map((article, index) => (
              <StaggerItem key={article.id} index={index}>
                <article
                  onClick={() => setSelectedArticle(article)}
                  className="group flex cursor-pointer flex-col sm:flex-row gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_8px_26px_-10px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F26F21] hover:shadow-[0_18px_42px_-12px_rgba(242,111,33,0.22)]"
                >
                  <div className="relative h-44 sm:h-auto sm:w-36 shrink-0 overflow-hidden rounded-2xl bg-orange-50">
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      unoptimized={isUnoptimizedImageSrc(article.imageUrl)}
                      sizes="(max-width: 640px) 100vw, 150px"
                      className="object-cover transition-transform duration-500 group-hover:scale-108"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-2.5 py-0.5 text-[10px] font-extrabold text-[#F26F21] whitespace-nowrap">
                          {article.category}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {article.publishedAt}
                        </span>
                      </div>
                      <h4 className="mt-2 line-clamp-2 text-sm sm:text-base font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#F26F21]">
                        {article.title}
                      </h4>
                      <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 text-xs font-bold text-slate-500">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <MapPin className="h-3 w-3 shrink-0 text-[#F26F21]" />
                        <span className="whitespace-nowrap">
                          {article.campus}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#F26F21] whitespace-nowrap shrink-0">
                        <span className="whitespace-nowrap">Xem chi tiết</span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                      </span>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </ScrollReveal>
        </div>
        ) : (
          <div className="rounded-3xl border border-[#F26F21]/20 bg-[#FFF9F5] p-8 text-center">
            <p className="text-sm font-bold text-slate-600 whitespace-nowrap">
              Đang cập nhật bài viết mới...
            </p>
          </div>
        )}
      </section>

      {/* 4. SPONSORS & ECOSYSTEM PARTNERS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="rounded-3xl border border-[#F26F21]/20 bg-[#FFF8F3] p-5 sm:p-10">
          <div className="mb-6 sm:mb-8 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F26F21]/30 bg-white px-3 py-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#F26F21] shadow-xs whitespace-nowrap">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
              <span className="whitespace-nowrap">
                ĐƠN VỊ TỔ CHỨC &amp; ĐỐI TÁC
              </span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {SPONSORS.map((sponsor) => {
              const SponsorIcon = getSponsorIcon(sponsor.iconKey);
              return (
                <div
                  key={sponsor.name}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-[#F26F21]/18 bg-white px-3 py-4 sm:px-4 sm:py-5 text-center shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F26F21] hover:shadow-[0_12px_30px_-8px_rgba(242,111,33,0.24)]"
                >
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#F26F21] transition-colors group-hover:bg-[#F26F21] group-hover:text-white">
                    <SponsorIcon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-[#F26F21] transition-colors whitespace-nowrap">
                    {sponsor.name}
                  </span>
                  <span className="mt-1 text-[10px] sm:text-[11px] font-medium text-slate-500 whitespace-nowrap">
                    {sponsor.role}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </section>

      {/* 5. WHITE & FPT ORANGE FOOTER */}
      <footer className="border-t-2 border-[#F26F21]/20 bg-[#FFF9F5] pt-10 sm:pt-12 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#F26F21]/15">
            <div className="space-y-2.5">
              <FptBrandMark />
              <p className="max-w-md text-xs sm:text-sm text-slate-600">
                Cổng bình chọn trực tuyến chính thức tôn vinh Gương Mặt Sinh
                Viên Tiêu Biểu Cao đẳng FPT Polytechnic cơ sở Đồng Nai — Thực
                học, Thực nghiệp, Vững bước thành công.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {FPOLY_DEPARTMENTS.map((item) => {
                const TagIcon = item.Icon;
                return (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#F26F21]/30 bg-white px-3 py-1 text-xs font-bold text-[#F26F21] shadow-xs whitespace-nowrap"
                  >
                    <TagIcon className="h-3 w-3 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center text-center text-[11px] sm:text-xs text-slate-500">
            <p className="font-medium whitespace-nowrap">
              © 2026 FPT Polytechnic Đồng Nai •{" "}
              <span className="hidden sm:inline">Hệ thống Giáo dục </span>FPT
              Education.
            </p>
          </div>
        </div>
      </footer>

      {/* Interactive News Article Reader Modal (Portaled to document.body above Sticky Navbar) */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedArticle && (
              <motion.div
                key="article-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedArticle(null)}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-3.5 sm:p-6 backdrop-blur-md"
              >
                <motion.div
                  key={selectedArticle.id}
                  initial={{ opacity: 0, scale: 0.94, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 16 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative flex max-h-[88dvh] sm:max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#F26F21]/30 bg-white shadow-[0_24px_64px_-16px_rgba(242,111,33,0.32)]"
                >
                  {/* Always-Visible Pinned Close Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(null)}
                    aria-label="Đóng bài viết"
                    className="absolute right-3.5 top-3.5 z-30 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition-all hover:rotate-90 hover:border-[#F26F21] hover:bg-[#F26F21] hover:text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Scrollable Article Cover + Content */}
                  <div className="overflow-y-auto overscroll-contain">
                    <div className="relative h-52 sm:h-72 w-full shrink-0 bg-orange-50">
                      <Image
                        src={selectedArticle.imageUrl}
                        alt={selectedArticle.title}
                        fill
                        unoptimized={isUnoptimizedImageSrc(selectedArticle.imageUrl)}
                        sizes="700px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                      <div className="absolute bottom-3.5 left-4 sm:left-6 right-4 sm:right-6 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#F26F21] px-3 py-1 text-[11px] font-extrabold text-white whitespace-nowrap">
                          {selectedArticle.category}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-800 whitespace-nowrap">
                          <MapPin className="h-3 w-3 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">
                            {selectedArticle.campus}
                          </span>
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-white whitespace-nowrap">
                          {selectedArticle.publishedAt} • {selectedArticle.readTime}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-5 sm:p-8 space-y-4">
                      <h3 className="text-lg sm:text-2xl font-extrabold leading-snug text-slate-900">
                        {selectedArticle.title}
                      </h3>
                      {selectedArticle.content.map((paragraph, idx) => (
                        <p
                          key={idx}
                          className="text-sm sm:text-base leading-relaxed text-slate-700"
                        >
                          {paragraph}
                        </p>
                      ))}

                      <div className="pt-2 flex justify-end border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setSelectedArticle(null)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#F26F21]/30 bg-[#FFF4EC] px-4 py-2 text-xs sm:text-sm font-bold text-[#F26F21] transition-colors hover:bg-[#F26F21] hover:text-white cursor-pointer whitespace-nowrap"
                        >
                          <X className="h-4 w-4 shrink-0" />
                          <span className="whitespace-nowrap">Đóng bài viết</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
