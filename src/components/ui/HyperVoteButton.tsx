"use client";

import { useRef, useState, type MouseEvent } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Loader2, LockKeyhole, Vote } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";

interface RippleItem {
  id: number;
  x: number;
  y: number;
}

interface FloatingBurst {
  id: number;
}

interface HyperVoteButtonProps {
  onVote: (originRect: DOMRect | null) => Promise<boolean> | void;
  disabled?: boolean;
  isDailyLimitReached?: boolean;
  isLoading?: boolean;
  nextResetAt?: string | null;
  onMidnightReset?: () => void;
  votedCountToday?: number;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  label?: string;
}

export function HyperVoteButton({
  onVote,
  disabled = false,
  isDailyLimitReached = false,
  isLoading = false,
  nextResetAt,
  onMidnightReset,
  votedCountToday = 0,
  size = "md",
  fullWidth = true,
  label,
}: HyperVoteButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const [bursts, setBursts] = useState<FloatingBurst[]>([]);

  // Magnetic cursor attraction motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 260, damping: 18, mass: 0.4 });
  const springY = useSpring(mouseY, { stiffness: 260, damping: 18, mass: 0.4 });

  const isBlocked = disabled || isDailyLimitReached || isLoading;

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (isBlocked || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.18;
    const deltaY = (e.clientY - centerY) * 0.24;
    mouseX.set(Math.max(-8, Math.min(8, deltaX)));
    mouseY.set(Math.max(-5, Math.min(5, deltaY)));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isBlocked) return;

    const rect = buttonRef.current?.getBoundingClientRect() ?? null;
    if (rect) {
      const rippleId = Date.now();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRipples((prev) => [...prev, { id: rippleId, x, y }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 680);
    }

    const result = await onVote(rect);
    if (result) {
      const burstId = Date.now() + Math.random();
      setBursts((prev) => [...prev, { id: burstId }]);
      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== burstId));
      }, 1050);
    }
  };

  const sizeClasses =
    size === "lg"
      ? "h-12 sm:h-13 px-6 text-sm sm:text-base rounded-2xl"
      : size === "sm"
      ? "h-9 sm:h-9.5 px-3 sm:px-3.5 text-xs rounded-xl"
      : "h-11 px-4 text-xs sm:text-sm rounded-xl";

  if (isDailyLimitReached) {
    return (
      <button
        type="button"
        disabled
        onClick={(e) => e.stopPropagation()}
        className={`${
          fullWidth ? "w-full" : "inline-flex shrink-0"
        } ${sizeClasses} relative flex items-center justify-center gap-1.5 border border-[#F26F21]/30 bg-[#FFF5EE] text-[#D9580F] cursor-not-allowed select-none whitespace-nowrap transition-all`}
      >
        <LockKeyhole className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-[#F26F21]" />
        <CountdownTimer
          variant="inline"
          hideIcon={size === "sm"}
          className={
            size === "sm" ? "!text-[10.5px] sm:!text-xs !tracking-normal" : ""
          }
          nextResetAt={nextResetAt}
          onReset={onMidnightReset}
        />
      </button>
    );
  }

  const buttonText =
    label ||
    (size === "sm"
      ? votedCountToday > 0
        ? "Vote +1"
        : "Bình chọn"
      : votedCountToday > 0
      ? "Bình chọn thêm (+1)"
      : "Bình chọn ngay");

  return (
    <div className={`relative ${fullWidth ? "w-full" : "inline-block shrink-0"}`}>
      {/* Ambient FPT Orange Pulse Ring Halo */}
      {!isBlocked && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 ${
            size === "lg" ? "rounded-2xl" : "rounded-xl"
          } border border-[#F26F21]/45 animate-pulse-halo`}
        />
      )}

      {/* Floating +1 Particle on Vote Success */}
      <AnimatePresence>
        {bursts.map((b) => (
          <motion.span
            key={b.id}
            initial={{ opacity: 1, y: 0, scale: 0.75 }}
            animate={{ opacity: 0, y: -48, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 -top-3 z-30 -translate-x-1/2 rounded-full bg-[#F26F21] px-2.5 py-0.5 font-mono text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(242,111,33,0.65)] whitespace-nowrap"
          >
            +1 PHIẾU BẦU!
          </motion.span>
        ))}
      </AnimatePresence>

      <motion.button
        ref={buttonRef}
        type="button"
        disabled={isBlocked}
        style={{ x: springX, y: springY }}
        whileTap={isBlocked ? undefined : { scale: 0.96 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`${
          fullWidth ? "w-full" : "inline-flex"
        } ${sizeClasses} shimmer-sweep group/btn relative flex items-center justify-center gap-1.5 sm:gap-2 overflow-hidden bg-[#F26F21] font-bold text-white shadow-[0_8px_24px_-4px_rgba(242,111,33,0.5)] transition-all duration-300 hover:bg-[#D9580F] hover:shadow-[0_12px_30px_-4px_rgba(242,111,33,0.68)] active:brightness-95 disabled:opacity-60 cursor-pointer whitespace-nowrap`}
      >
        {/* Click coordinate ripple waves */}
        {ripples.map((r) => (
          <span
            key={r.id}
            style={{ left: r.x, top: r.y }}
            className="pointer-events-none absolute h-14 w-14 rounded-full bg-white/45 animate-ripple"
          />
        ))}

        {isLoading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 animate-spin" />
            <span className="whitespace-nowrap">
              {size === "sm" ? "Đang gửi..." : "Đang ghi nhận..."}
            </span>
          </>
        ) : (
          <>
            <Vote className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform duration-300 group-hover/btn:scale-115" />
            <span className="whitespace-nowrap tracking-wide">{buttonText}</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
