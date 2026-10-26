"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  CalendarRange,
  ChevronRight,
  LockKeyhole,
  LogIn,
  LogOut,
  Menu,
  Newspaper,
  Radio,
  Scale,
  Trophy,
  Vote,
  X,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CountdownTimer } from "./ui/CountdownTimer";

interface NavbarProps {
  sseConnected: boolean;
  isAuthenticated: boolean;
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
  remainingVotes: number;
  maxDailyVotes: number;
  isDailyLimitReached: boolean;
  nextResetAt?: string | null;
  onMidnightReset: () => void;
  onOpenSignIn: () => void;
}

export function FptBrandMark({
  compactMobile = false,
}: {
  compactMobile?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
      {/* Official 3-Leaf FPT Logo */}
      <Image
        src="/images/fpt-logo.png"
        alt="Logo FPT Polytechnic Đồng Nai"
        width={140}
        height={86}
        preload
        className="h-7 sm:h-9 w-auto object-contain shrink-0"
      />

      <span
        aria-hidden="true"
        className="h-6 sm:h-7 w-px bg-slate-200 shrink-0"
      />

      <div className="flex flex-col min-w-0">
        {compactMobile ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="sm:hidden text-xs font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                FPOLY <span className="text-[#F26F21]">ĐỒNG NAI</span>
              </span>
              <span className="hidden sm:inline text-sm lg:text-[15px] font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                FPT POLYTECHNIC{" "}
                <span className="text-[#F26F21]">ĐỒNG NAI</span>
              </span>
              <span className="hidden sm:inline-flex rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-2 py-0.5 font-mono text-[10px] font-bold text-[#F26F21] whitespace-nowrap">
                2026
              </span>
            </div>
            <span className="sm:hidden text-[9px] font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">
              BÌNH CHỌN • 2026
            </span>
            <span className="hidden sm:block text-[10px] font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">
              Cổng Bình Chọn Sinh Viên Tiêu Biểu
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                FPT POLYTECHNIC{" "}
                <span className="text-[#F26F21]">ĐỒNG NAI</span>
              </span>
              <span className="inline-flex rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-2 py-0.5 font-mono text-[10px] font-bold text-[#F26F21] whitespace-nowrap">
                2026
              </span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">
              Cao Đẳng FPT Polytechnic • Cơ Sở Đồng Nai
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function Navbar({
  sseConnected,
  isAuthenticated,
  user,
  remainingVotes,
  maxDailyVotes,
  isDailyLimitReached,
  nextResetAt,
  onMidnightReset,
  onOpenSignIn,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#podium", label: "Top Dẫn Đầu", Icon: Trophy },
    { href: "#leaderboard", label: "Bảng Xếp Hạng", Icon: BarChart3 },
    { href: "#rules", label: "Thể Lệ", Icon: Scale },
    { href: "#timeline", label: "Lịch Trình", Icon: CalendarRange },
    { href: "#news", label: "Tin Tức", Icon: Newspaper },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#F26F21]/15 bg-white/90 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-15 sm:h-18 max-w-7xl items-center justify-between gap-2 px-3.5 sm:px-6 lg:px-8">
        <a href="#" className="focus:outline-none min-w-0 shrink-0">
          <FptBrandMark compactMobile />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-0.5 rounded-full border border-[#F26F21]/20 bg-[#FFF7F2] p-1">
          {navLinks.map((item) => {
            const NavIcon = item.Icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-[#F26F21] hover:text-white whitespace-nowrap"
              >
                <NavIcon className="h-3.5 w-3.5 shrink-0 opacity-85" />
                <span className="whitespace-nowrap">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right Controls: Live Badge + Vote Quota + Google Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Live SSE Connection Indicator */}
          <div
            title={
              sseConnected
                ? "Kết nối Real-time SSE đang hoạt động"
                : "Đang đồng bộ tự động"
            }
            className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-2.5 py-1 text-[11px] font-bold text-[#F26F21] whitespace-nowrap"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F26F21] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F26F21]" />
            </span>
            <Radio className="h-3 w-3 shrink-0" />
            <span className="whitespace-nowrap">LIVE</span>
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Remaining Daily Votes Pill or Countdown */}
              {isDailyLimitReached ? (
                <>
                  <span className="inline-flex md:hidden items-center gap-1 rounded-full border border-[#F26F21]/35 bg-[#FFF4EC] px-2 py-1 font-mono text-[11px] font-bold text-[#D9580F] whitespace-nowrap">
                    <LockKeyhole className="h-3 w-3 shrink-0 text-[#F26F21]" />
                    <span className="whitespace-nowrap">0/{maxDailyVotes}</span>
                  </span>
                  <div className="hidden md:flex items-center rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-2.5 py-1">
                    <CountdownTimer
                      variant="inline"
                      nextResetAt={nextResetAt}
                      onReset={onMidnightReset}
                    />
                  </div>
                </>
              ) : (
                <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-[#F26F21]/35 bg-[#FFF4EC] px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-[#D9580F] whitespace-nowrap">
                  <Vote className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-[#F26F21]" />
                  <span className="whitespace-nowrap">
                    {remainingVotes}/{maxDailyVotes}
                  </span>
                  <span className="hidden sm:inline whitespace-nowrap">
                    lượt
                  </span>
                </div>
              )}

              {/* User Profile Pill */}
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-1.5 sm:pr-2.5 shadow-xs">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name || user.email}
                    width={26}
                    height={26}
                    unoptimized
                    className="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover ring-1 ring-[#F26F21]/60 shrink-0"
                  />
                ) : (
                  <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#F26F21] text-xs font-extrabold text-white shrink-0">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                )}

                <span className="hidden md:inline-block max-w-[115px] truncate text-xs font-bold text-slate-700 whitespace-nowrap">
                  {user.name || user.email.split("@")[0]}
                </span>

                <button
                  type="button"
                  onClick={() => signOut({ redirect: false })}
                  title="Đăng xuất"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-[#FFF4EC] hover:text-[#F26F21] cursor-pointer shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenSignIn}
              className="shimmer-sweep relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-[#F26F21] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-[0_6px_20px_rgba(242,111,33,0.4)] transition-all hover:scale-[1.03] hover:bg-[#D9580F] hover:shadow-[0_10px_26px_rgba(242,111,33,0.55)] active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden whitespace-nowrap">Đăng nhập</span>
              <span className="hidden sm:inline whitespace-nowrap">
                Đăng nhập Google
              </span>
            </button>
          )}

          {/* Mobile/Tablet Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            className={`inline-flex xl:hidden h-8.5 w-8.5 sm:h-9 sm:w-9 items-center justify-center rounded-xl border transition-colors cursor-pointer shrink-0 ${
              mobileMenuOpen
                ? "border-[#F26F21] bg-[#FFF4EC] text-[#F26F21]"
                : "border-slate-200 bg-white text-slate-700 hover:border-[#F26F21] hover:text-[#F26F21]"
            }`}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Vertical Dropdown Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-x-0 top-15 sm:top-18 bottom-0 z-30 bg-slate-900/20 backdrop-blur-[2px] xl:hidden"
            />
            <motion.div
              key="mobile-nav-panel"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-full z-40 border-b border-[#F26F21]/20 bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.16)] xl:hidden"
            >
              <div className="mx-auto max-w-7xl px-3.5 sm:px-6 py-3">
                {/* Header Row inside Vertical Menu */}
                <div className="mb-2 flex items-center justify-between px-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                    Danh mục điều hướng
                  </span>
                  <span className="inline-flex md:hidden items-center gap-1.5 rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-2.5 py-0.5 text-[10px] font-bold text-[#F26F21] whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F26F21] animate-pulse" />
                    <Radio className="h-3 w-3 shrink-0" />
                    <span className="whitespace-nowrap">
                      {sseConnected ? "LIVE REAL-TIME" : "AUTO SYNC"}
                    </span>
                  </span>
                </div>

                {/* Vertical Stack of Navigation Items */}
                <nav className="flex flex-col gap-1.5">
                  {navLinks.map((item, idx) => {
                    const NavIcon = item.Icon;
                    return (
                      <motion.a
                        key={item.href}
                        href={item.href}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.18 }}
                        onClick={() => setMobileMenuOpen(false)}
                        className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-[#FFFBF8] px-3.5 py-2.5 text-sm font-bold text-slate-800 transition-all hover:border-[#F26F21]/45 hover:bg-[#FFF2E8] hover:text-[#F26F21] active:scale-[0.99] whitespace-nowrap"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#F26F21]/25 bg-white text-[#F26F21] shadow-2xs transition-colors group-hover:border-[#F26F21] group-hover:bg-[#F26F21] group-hover:text-white">
                            <NavIcon className="h-4 w-4 shrink-0" />
                          </span>
                          <span className="whitespace-nowrap">{item.label}</span>
                        </span>

                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#F26F21]" />
                      </motion.a>
                    );
                  })}
                </nav>

                {isDailyLimitReached && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                    <CountdownTimer
                      variant="compact"
                      nextResetAt={nextResetAt}
                      onReset={onMidnightReset}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
