"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 64;
const MAX_PULL = 96;

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
};

function RefreshIndicator({
  pull,
  refreshing,
}: {
  pull: number;
  refreshing: boolean;
}) {
  const progress = Math.min(pull / PULL_THRESHOLD, 1);
  const visible = refreshing || pull > 8;

  return (
    <div
      className={`pointer-events-none flex justify-center transition-opacity duration-200 md:hidden ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${
          refreshing ? "animate-spin" : ""
        }`}
        style={{
          transform: refreshing ? undefined : `rotate(${progress * 180}deg) scale(${0.85 + progress * 0.15})`,
        }}
      >
        <svg
          className="h-4 w-4 text-[var(--mh-primary)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0014-7 9 9 0 00-14-7"
          />
        </svg>
      </div>
    </div>
  );
}

export default function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: PullToRefreshProps) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const enabled = useRef(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => {
      enabled.current = !mq.matches && !disabled;
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [disabled]);

  const isAtTop = () =>
    typeof window !== "undefined" &&
    window.scrollY <= 0 &&
    document.documentElement.scrollTop <= 0;

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled.current || refreshing || !isAtTop()) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    },
    [refreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || !enabled.current || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setPull(0);
        return;
      }
      if (!isAtTop()) {
        pulling.current = false;
        setPull(0);
        return;
      }
      if (delta > 10) e.preventDefault();
      setPull(Math.min(delta * 0.45, MAX_PULL));
    },
    [refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || !enabled.current) return;
    pulling.current = false;

    if (pull >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPull(PULL_THRESHOLD * 0.5);
      try {
        await onRefresh();
      } catch {
        // Parent handles error display
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }, [onRefresh, pull, refreshing]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const offset = refreshing ? 36 : Math.min(pull * 0.35, 32);

  return (
    <div className="relative">
      <div
        className="fixed left-0 right-0 z-40 flex justify-center transition-transform duration-200 ease-out md:hidden"
        style={{
          top: "calc(3.25rem + env(safe-area-inset-top, 0px))",
          transform: `translateY(${offset}px)`,
        }}
      >
        <RefreshIndicator pull={pull} refreshing={refreshing} />
      </div>
      <div
        className="transition-transform duration-200 ease-out will-change-transform"
        style={{ transform: offset > 0 ? `translateY(${offset}px)` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}
