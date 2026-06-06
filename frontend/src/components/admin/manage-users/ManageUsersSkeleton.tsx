"use client";

import React from "react";
import { Skeleton } from "@/components/student/Skeleton";

export function ResidentCardSkeleton() {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
      aria-hidden
    >
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="mb-2 h-4 w-40 max-w-full" />
        <Skeleton className="mb-3 h-3 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
    </div>
  );
}

export default function ManageUsersSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="flex flex-col gap-2.5" aria-busy="true" aria-label="Loading residents">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <ResidentCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

/** Full-page skeleton for route transition and initial load. */
export function ManageUsersPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-lg animate-in fade-in duration-200 md:max-w-3xl lg:max-w-4xl"
      aria-busy="true"
      aria-label="Loading manage users"
    >
      <div className="px-4 pb-2 pt-3 md:px-6 md:pt-6">
        <Skeleton className="mb-3 h-5 w-16" />
        <Skeleton className="mb-2 h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="border-b border-gray-100/80 px-4 pb-3 pt-1 md:px-6">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="mt-3 flex gap-2 overflow-hidden">
          <Skeleton className="h-10 w-20 shrink-0 rounded-full" />
          <Skeleton className="h-10 w-16 shrink-0 rounded-full" />
          <Skeleton className="h-10 w-16 shrink-0 rounded-full" />
          <Skeleton className="h-10 w-[4.5rem] shrink-0 rounded-full" />
        </div>
      </div>

      <div className="px-4 pb-28 pt-4 md:px-6 md:pb-8">
        <ManageUsersSkeleton count={8} />
      </div>
    </div>
  );
}
