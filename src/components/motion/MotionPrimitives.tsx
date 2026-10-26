"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, AnimatePresence, motion, useInView } from "framer-motion";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  delay?: number;
}

/**
 * Scroll Reveal wrapper implementing Framer Motion whileInView
 * with viewport={{ once: false, amount: 0.2 }}.
 * When `stagger` is true on multi-card grids, individual <StaggerItem> children
 * observe their own intersection so tall single-column mobile grids never fail
 * threshold checks on compact viewports.
 */
export function ScrollReveal({
  children,
  className = "",
  stagger = false,
  delay = 0,
}: ScrollRevealProps) {
  if (stagger) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{
        duration: 0.52,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  const staggerDelay = (index % 4) * 0.065;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{
        duration: 0.5,
        delay: staggerDelay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Smoothly counts up numeric metrics (0 -> target) on load / scroll-into-view,
 * and animates real-time vote increments with an FPT Orange pulse & optional +Δ badge.
 */
export function AnimatedNumber({
  value,
  className = "",
  duration = 1.25,
  showDeltaBadge = false,
  padStart = 0,
}: {
  value: number;
  className?: string;
  duration?: number;
  showDeltaBadge?: boolean;
  padStart?: number;
}) {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(spanRef, { once: false, amount: 0.2 });

  const [displayValue, setDisplayValue] = useState(0);
  const [flash, setFlash] = useState(false);
  const [deltaBadge, setDeltaBadge] = useState<number | null>(null);

  const currentValRef = useRef(0);
  const hasCompletedInViewPassRef = useRef(false);
  const prevTargetRef = useRef(value);

  useEffect(() => {
    let controls: { stop: () => void } | null = null;
    let rafId: number | null = null;
    let flashStartTimer: ReturnType<typeof setTimeout> | null = null;
    let flashEndTimer: ReturnType<typeof setTimeout> | null = null;
    let deltaEndTimer: ReturnType<typeof setTimeout> | null = null;

    if (!isInView) {
      hasCompletedInViewPassRef.current = false;
      prevTargetRef.current = value;
      rafId = window.requestAnimationFrame(() => {
        currentValRef.current = 0;
        setDisplayValue(0);
      });
      return () => {
        if (rafId !== null) window.cancelAnimationFrame(rafId);
      };
    }

    if (!hasCompletedInViewPassRef.current) {
      prevTargetRef.current = value;
      const startFrom = currentValRef.current;

      controls = animate(startFrom, value, {
        duration,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (latest) => {
          const rounded = Math.round(latest);
          currentValRef.current = rounded;
          setDisplayValue(rounded);
        },
        onComplete: () => {
          hasCompletedInViewPassRef.current = true;
          currentValRef.current = value;
          prevTargetRef.current = value;
          setDisplayValue(value);
        },
      });
    } else if (value !== prevTargetRef.current || currentValRef.current !== value) {
      const delta = value - prevTargetRef.current;
      const fromValue = currentValRef.current;
      prevTargetRef.current = value;

      controls = animate(fromValue, value, {
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (latest) => {
          const rounded = Math.round(latest);
          currentValRef.current = rounded;
          setDisplayValue(rounded);
        },
        onComplete: () => {
          currentValRef.current = value;
          setDisplayValue(value);
        },
      });

      if (delta !== 0) {
        flashStartTimer = setTimeout(() => {
          setFlash(true);
          if (showDeltaBadge && delta > 0) {
            setDeltaBadge(delta);
          }
        }, 0);

        flashEndTimer = setTimeout(() => {
          setFlash(false);
        }, 900);

        if (showDeltaBadge && delta > 0) {
          deltaEndTimer = setTimeout(() => {
            setDeltaBadge(null);
          }, 1800);
        }
      }
    }

    return () => {
      controls?.stop();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (flashStartTimer) clearTimeout(flashStartTimer);
      if (flashEndTimer) clearTimeout(flashEndTimer);
      if (deltaEndTimer) clearTimeout(deltaEndTimer);
    };
  }, [value, isInView, duration, showDeltaBadge]);

  const formattedText =
    padStart > 0 && displayValue < Math.pow(10, padStart)
      ? String(displayValue).padStart(padStart, "0")
      : displayValue.toLocaleString("vi-VN");

  return (
    <span
      ref={spanRef}
      aria-label={value.toLocaleString("vi-VN")}
      className="relative inline-flex items-center justify-center whitespace-nowrap tabular-nums"
    >
      <motion.span
        animate={
          flash
            ? { scale: [1, 1.1, 1], y: [2, -1, 0] }
            : { scale: 1, y: 0 }
        }
        transition={{ duration: 0.42, ease: "easeOut" }}
        className={`inline-block whitespace-nowrap tabular-nums transition-colors duration-300 ${className} ${
          flash
            ? "!text-[#F26F21] drop-shadow-[0_0_12px_rgba(242,111,33,0.55)]"
            : ""
        }`}
      >
        {formattedText}
      </motion.span>

      <AnimatePresence>
        {showDeltaBadge && deltaBadge !== null && deltaBadge > 0 && (
          <motion.span
            key={`delta-${value}-${deltaBadge}`}
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.85 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="pointer-events-none absolute left-full top-1/2 ml-1.5 -translate-y-1/2 rounded-full border border-[#F26F21]/35 bg-[#FFF2E8] px-1.5 py-0.5 font-mono text-[10px] sm:text-xs font-extrabold text-[#F26F21] shadow-xs whitespace-nowrap"
          >
            +{deltaBadge}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

type ConfettiFn = typeof import("canvas-confetti");
let confettiFnPromise: Promise<ConfettiFn> | null = null;

function loadConfetti(): Promise<ConfettiFn> {
  if (!confettiFnPromise) {
    confettiFnPromise = import("canvas-confetti").then((mod) => mod.default);
  }
  return confettiFnPromise;
}

/**
 * Triggers a vibrant FPT-branded multi-stage confetti & particle celebration
 * originating right from the clicked Vote button coordinates!
 * Dynamically imports `canvas-confetti` on demand to keep initial JS bundle lean.
 */
export function fireFptVoteConfetti(originRect?: DOMRect | null) {
  if (typeof window === "undefined") return;

  const x = originRect
    ? (originRect.left + originRect.width / 2) / window.innerWidth
    : 0.5;
  const y = originRect
    ? (originRect.top + originRect.height / 2) / window.innerHeight
    : 0.65;

  const fptPalette = [
    "#F26F21",
    "#D9580F",
    "#FF8C42",
    "#FFB788",
    "#FFFFFF",
    "#FFE8D6",
  ];

  void loadConfetti().then((confetti) => {
    confetti({
      particleCount: 55,
      spread: 68,
      startVelocity: 36,
      origin: { x, y },
      colors: fptPalette,
      ticks: 210,
      gravity: 0.95,
      scalar: 0.95,
      zIndex: 9999,
    });

    setTimeout(() => {
      confetti({
        particleCount: 28,
        angle: 65,
        spread: 48,
        startVelocity: 28,
        origin: { x: Math.max(0.05, x - 0.04), y },
        colors: fptPalette,
        ticks: 180,
        scalar: 0.8,
        zIndex: 9999,
      });
      confetti({
        particleCount: 28,
        angle: 115,
        spread: 48,
        startVelocity: 28,
        origin: { x: Math.min(0.95, x + 0.04), y },
        colors: fptPalette,
        ticks: 180,
        scalar: 0.8,
        zIndex: 9999,
      });
    }, 130);
  });
}
