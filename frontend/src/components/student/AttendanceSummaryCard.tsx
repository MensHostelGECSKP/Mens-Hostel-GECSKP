"use client";

import React from "react";
import type { MonthAttendanceStats } from "@/utils/attendanceStats";
import { Skeleton } from "@/components/student/Skeleton";
import { HiInformationCircle } from "react-icons/hi2";

type AttendanceSummaryCardProps = {
  monthLabel: string;
  stats: MonthAttendanceStats;
  loading?: boolean;
};

export default function AttendanceSummaryCard({
  monthLabel,
  stats,
  loading = false,
}: AttendanceSummaryCardProps) {
  if (loading) {
    return (
      <div
        className="mb-5 rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
        aria-busy="true"
        aria-label="Loading summary"
      >
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="mb-2 h-3 w-16" />
            <div className="flex items-baseline gap-1.5">
              <Skeleton className="h-9 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="flex flex-col gap-2 w-[140px] shrink-0 border-l border-gray-100 pl-4">
            <Skeleton className="h-7 w-full rounded-xl" />
            <Skeleton className="h-7 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      className="mb-5 rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-visible"
      aria-label={`${monthLabel} summary`}
    >
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">Current Month Summary</h2>
        <span className="text-xs font-semibold text-gray-500">{monthLabel}</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Present Days Hero */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1 relative">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Present Days
            </span>
            <div className="group relative inline-flex items-center">
              <HiInformationCircle className="h-4 w-4 text-gray-300 hover:text-gray-400 cursor-help transition-colors" aria-label="Tooltip Info" />
              <div className="absolute bottom-full left-1/2 z-30 mb-2 w-52 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-center text-[10px] font-normal leading-normal text-white shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
                Present Days are calculated as: Total Days in Month minus Mess Cuts.
                <div className="absolute top-full left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-0.5 rotate-45 bg-gray-900" />
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold text-emerald-600 tracking-tight">
              {stats.presentDays}
            </span>
            <span className="text-xs font-semibold text-gray-450">
              / {stats.totalDays} Days
            </span>
          </div>
        </div>

        {/* Right Side: Mess Cuts & Partial Cuts boxes */}
        <div className="flex flex-col gap-2 w-[140px] shrink-0 border-l border-gray-100 pl-4">
          {/* Mess Cuts */}
          <div className="flex items-center justify-between rounded-xl bg-violet-50/50 px-2.5 py-1.5 border border-violet-100/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-600 shrink-0" />
              <span className="text-[11px] font-medium text-violet-700 truncate">
                Mess Cuts
              </span>
            </div>
            <span className="text-xs font-bold text-violet-700">{stats.messCutDays}</span>
          </div>

          {/* Partial Cuts */}
          <div className="flex items-center justify-between rounded-xl bg-orange-50/50 px-2.5 py-1.5 border border-orange-100/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
              <span className="text-[11px] font-medium text-orange-700 truncate">
                Partial Cuts
              </span>
            </div>
            <span className="text-xs font-bold text-orange-700">{stats.partialDays}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
