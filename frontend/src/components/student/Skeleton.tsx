"use client";

import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200/80 ${className}`}
      aria-hidden
    />
  );
}

export function CalendarSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="mb-5 flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="mb-3 grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="mx-auto h-3 w-3" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-x-1 gap-y-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="mx-auto h-9 w-9 max-w-9 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
