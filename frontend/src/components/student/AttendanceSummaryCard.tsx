"use client";

import React from "react";
import type { MonthAttendanceStats } from "@/utils/attendanceStats";
import { Skeleton } from "@/components/student/Skeleton";

type AttendanceSummaryCardProps = {
  monthLabel: string;
  stats: MonthAttendanceStats;
  loading?: boolean;
};

const STAT_ITEMS = [
  {
    key: "presentDays" as const,
    label: "Present Days",
    dotClass: "bg-emerald-500",
    valueClass: "text-emerald-700",
  },
  {
    key: "messCutDays" as const,
    label: "Mess Cuts",
    dotClass: "bg-violet-600",
    valueClass: "text-violet-700",
  },
  {
    key: "partialDays" as const,
    label: "Partial Cuts",
    dotClass: "bg-orange-500",
    valueClass: "text-orange-700",
  },
];

export default function AttendanceSummaryCard({
  monthLabel,
  stats,
  loading = false,
}: AttendanceSummaryCardProps) {
  if (loading) {
    return (
      <div
        className="mb-5 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
        aria-busy="true"
        aria-label="Loading attendance summary"
      >
        <Skeleton className="mb-3 h-4 w-40" />
        <div className="grid grid-cols-3 gap-3">
          {STAT_ITEMS.map(({ key }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      className="mb-5 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
      aria-label={`${monthLabel} attendance summary`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">Current Month Summary</h2>
        <span className="text-xs font-medium text-gray-500">{monthLabel}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {STAT_ITEMS.map(({ key, label, dotClass, valueClass }) => (
          <div key={key} className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`}
                aria-hidden
              />
              <span className="truncate text-[11px] font-medium text-gray-500">
                {label}
              </span>
            </div>
            <p className={`text-xl font-bold tabular-nums tracking-tight ${valueClass}`}>
              {stats[key]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
