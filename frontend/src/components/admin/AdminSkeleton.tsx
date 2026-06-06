"use client";

import React from "react";
import { Skeleton } from "@/components/student/Skeleton";

export function AdminOverviewSkeleton() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Loading overview"
    >
      <Skeleton className="mb-3 h-10 w-10 rounded-xl" />
      <Skeleton className="mb-2 h-4 w-28" />
      <Skeleton className="h-10 w-20" />
    </div>
  );
}

export function AdminActionGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Loading actions">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
        >
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export function AdminAttendanceSkeleton() {
  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Loading attendance summary"
    >
      <Skeleton className="mx-auto mb-4 h-5 w-40" />
      <Skeleton className="mb-4 h-11 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminActivitySkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading recent activity">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
        >
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-2 h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-10 shrink-0" />
        </div>
      ))}
    </div>
  );
}
