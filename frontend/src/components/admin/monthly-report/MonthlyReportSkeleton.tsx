"use client";

import React from "react";
import { Skeleton } from "@/components/student/Skeleton";

export function MonthlyReportPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-lg animate-in fade-in duration-200 md:max-w-xl"
      aria-busy="true"
      aria-label="Loading monthly cut report"
    >
      <div className="px-4 pb-2 pt-3 md:px-6 md:pt-6">
        <Skeleton className="mb-3 h-5 w-16" />
        <Skeleton className="mb-2 h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-52" />
      </div>

      <div className="px-4 pb-3 pt-2 md:px-6">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 shrink-0 rounded-full" />
          <Skeleton className="h-10 w-20 shrink-0 rounded-full" />
        </div>
      </div>

      <div className="px-4 pb-4 md:px-6">
        <Skeleton className="h-[320px] w-full rounded-3xl" />
      </div>

      <div className="px-4 pb-4 md:px-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>

      <div className="px-4 pb-8 md:px-6">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
