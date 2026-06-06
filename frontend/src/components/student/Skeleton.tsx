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

export function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-lg animate-in fade-in px-4 pb-6 pt-4 duration-300 md:max-w-xl md:px-6">
      <div className="mb-6 flex flex-col items-center text-center">
        <Skeleton className="mb-3 h-20 w-20 rounded-full" />
        <Skeleton className="h-6 w-40 rounded-lg" />
        <Skeleton className="mt-2 h-5 w-16 rounded-full" />
      </div>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-12 w-full rounded-2xl" />
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-lg animate-in fade-in px-4 pb-6 pt-6 duration-300 md:max-w-2xl md:px-6">
      <div className="mb-6 flex flex-col items-center">
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-2/3 rounded-md" />
              <Skeleton className="h-3 w-1/3 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md mt-2" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RulesSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--mh-surface)] font-sans antialiased text-gray-900 pb-16">
      <header className="bg-white border-b border-gray-100 py-5 px-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="mx-auto w-full max-w-lg md:max-w-3xl lg:max-w-4xl flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-64 rounded-md" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg px-4 pt-6 md:max-w-3xl md:px-6 lg:max-w-4xl">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full shrink-0" />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2 px-1">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <div className="grid gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 rounded-2xl bg-white p-4 border border-gray-100">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  <div className="w-full flex flex-col gap-2">
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-5/6 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function UploadMessBillSkeleton() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-8 pt-4 md:max-w-xl md:px-6 animate-in fade-in duration-300">
      <Skeleton className="mb-3 h-10 w-20 rounded-xl" />
      <Skeleton className="h-8 w-64 rounded-lg mb-2" />
      <Skeleton className="h-4 w-48 rounded-md mb-6" />
      
      {/* Upload card skeleton */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-12 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-12 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl mt-2" />
      </div>

      {/* Published bills list skeleton */}
      <Skeleton className="h-4 w-36 rounded-md mb-4" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}


