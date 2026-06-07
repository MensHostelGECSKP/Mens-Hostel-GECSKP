"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLayout } from "@/context/LayoutContext";
import { HiChevronLeft } from "react-icons/hi2";
import { Skeleton } from "@/components/student/Skeleton";

// ==========================================
// 1. PAGE CONTAINER COMPONENT
// ==========================================
type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-lg px-4 pb-6 pt-4 duration-300 md:max-w-3xl md:px-6 md:pt-6 lg:max-w-4xl ${className}`}
    >
      {children}
    </div>
  );
}

// ==========================================
// 2. APP HEADER COMPONENT
// ==========================================
type AppHeaderProps = {
  title: string;
  subtitle?: string;
  showMenu?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
};

export function AppHeader({
  title,
  subtitle,
  showMenu = false,
  showBack = false,
  onBack,
  actions,
}: AppHeaderProps) {
  const router = useRouter();
  const { setDrawerOpen } = useLayout();

  const handleBack = onBack || (() => router.back());

  return (
    <header className="sticky top-0 md:top-14 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          {showMenu && (
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-700 active:bg-gray-100 md:hidden active-press"
              onClick={() => setDrawerOpen((o) => !o)}
              aria-label="Open menu"
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition active:scale-95 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--mh-primary)]/20"
              aria-label="Go back"
            >
              <HiChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-[15px] sm:text-base font-bold tracking-tight text-gray-900 truncate leading-snug">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 truncate leading-none mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

// ==========================================
// 3. PAGE SKELETON COMPONENT
// ==========================================
type PageSkeletonProps = {
  variant?: "list" | "profile" | "grid" | "calendar";
};

export function PageSkeleton({ variant = "list" }: PageSkeletonProps) {
  if (variant === "profile") {
    return (
      <div className="w-full flex flex-col items-center py-6 gap-6">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <div className="w-full flex flex-col gap-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (variant === "calendar") {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="mx-auto h-3 w-6" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="mx-auto h-10 w-10 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-5 border border-gray-100 flex flex-col gap-3 shadow-sm">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // default: list of cards
  return (
    <div className="w-full flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 border border-gray-100 flex flex-col gap-3 shadow-sm">
          <Skeleton className="h-5 w-1/3 rounded-md" />
          <Skeleton className="h-4 w-1/4 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md mt-2" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
        </div>
      ))}
    </div>
  );
}
