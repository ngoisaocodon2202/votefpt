"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, TimerReset } from "lucide-react";

interface CountdownTimerProps {
  nextResetAt?: string | null;
  onReset?: () => void;
  variant?: "banner" | "inline" | "compact";
  hideIcon?: boolean;
  className?: string;
}

function calculateRemainingSeconds(nextResetAt?: string | null): number {
  const now = new Date();
  let targetMs: number;

  if (nextResetAt) {
    const parsed = Date.parse(nextResetAt);
    if (!Number.isNaN(parsed) && parsed > now.getTime()) {
      targetMs = parsed;
    } else {
      const localMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
      );
      targetMs = localMidnight.getTime();
    }
  } else {
    const localMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );
    targetMs = localMidnight.getTime();
  }

  return Math.max(0, Math.ceil((targetMs - now.getTime()) / 1000));
}

function pad2(num: number): string {
  return String(num).padStart(2, "0");
}

function AnimatedDigitPair({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-11 w-12 sm:h-14 sm:w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-[#F26F21]/30 bg-white shadow-[0_8px_20px_rgba(242,111,33,0.14)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#FFF5EE] to-transparent" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 18, opacity: 0, filter: "blur(2px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -18, opacity: 0, filter: "blur(2px)" }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="font-mono text-lg sm:text-2xl font-extrabold tracking-wider text-[#F26F21] whitespace-nowrap tabular-nums"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({
  nextResetAt,
  onReset,
  variant = "banner",
  hideIcon = false,
  className = "",
}: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    calculateRemainingSeconds(nextResetAt)
  );

  useEffect(() => {
    const tick = () => {
      const next = calculateRemainingSeconds(nextResetAt);
      setSecondsLeft((prev) => {
        if (prev > 0 && next === 0) {
          onReset?.();
        }
        return next;
      });
    };

    const syncTimeout = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);

    return () => {
      clearTimeout(syncTimeout);
      clearInterval(interval);
    };
  }, [nextResetAt, onReset]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const hh = pad2(hours);
  const mm = pad2(minutes);
  const ss = pad2(seconds);

  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono text-xs font-extrabold tracking-wider text-[#D9580F] whitespace-nowrap tabular-nums ${className}`}
      >
        {!hideIcon && (
          <Clock className="h-3.5 w-3.5 shrink-0 text-[#F26F21] animate-pulse" />
        )}
        <span className="whitespace-nowrap">
          [{hh} : {mm} : {ss}]
        </span>
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-3 py-1.5 text-xs font-bold text-[#D9580F] whitespace-nowrap ${className}`}
      >
        <Clock className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
        <span className="whitespace-nowrap">Mở lại sau</span>
        <span className="font-mono font-extrabold text-[#F26F21] whitespace-nowrap tabular-nums">
          [{hh} : {mm} : {ss}]
        </span>
      </div>
    );
  }

  const dayProgress = Math.min(
    100,
    Math.max(4, ((86400 - secondsLeft) / 86400) * 100)
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border-2 border-[#F26F21]/25 bg-gradient-to-br from-white via-[#FFF9F5] to-[#FFF2E8] p-4 sm:p-5 shadow-[0_16px_44px_-12px_rgba(242,111,33,0.2)] ${className}`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#F26F21]/12 blur-2xl" />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F26F21]/35 bg-[#FFF1E6] px-3 py-1 text-[11px] font-extrabold text-[#F26F21] whitespace-nowrap">
            <TimerReset className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">ĐÃ DÙNG 03/03 LƯỢT HÔM NAY</span>
          </div>
          <p className="text-xs sm:text-base font-bold text-slate-800">
            Cảm ơn bạn đã bình chọn! Lượt mới sẽ tự động mở lại lúc{" "}
            <span className="font-mono font-extrabold text-[#F26F21] whitespace-nowrap">
              00:00:00
            </span>
          </p>
          <div className="mx-auto lg:mx-0 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-orange-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#F26F21] to-[#D9580F]"
              style={{ width: `${dayProgress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 shrink-0">
          <span className="font-mono text-lg sm:text-xl font-bold text-[#F26F21]/70 -mt-4 whitespace-nowrap">
            [
          </span>
          <AnimatedDigitPair value={hh} label="GIỜ" />
          <span className="font-mono text-lg sm:text-xl font-extrabold text-[#F26F21] -mt-4 animate-pulse whitespace-nowrap">
            :
          </span>
          <AnimatedDigitPair value={mm} label="PHÚT" />
          <span className="font-mono text-lg sm:text-xl font-extrabold text-[#F26F21] -mt-4 animate-pulse whitespace-nowrap">
            :
          </span>
          <AnimatedDigitPair value={ss} label="GIÂY" />
          <span className="font-mono text-lg sm:text-xl font-bold text-[#F26F21]/70 -mt-4 whitespace-nowrap">
            ]
          </span>
        </div>
      </div>
    </motion.div>
  );
}
