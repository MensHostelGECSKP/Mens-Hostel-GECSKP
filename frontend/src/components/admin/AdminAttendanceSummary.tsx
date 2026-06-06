"use client";

import React, { useMemo } from "react";
import type { AttendanceSummaryDetail } from "@/types";
import { AdminAttendanceSkeleton } from "./AdminSkeleton";

type Summary = { morning: number; noon: number; night: number };

type AdminAttendanceSummaryProps = {
  date: string;
  onDateChange: (date: string) => void;
  onFetch: () => void;
  loading: boolean;
  error?: string | null;
  summary?: Summary | null;
  details?: AttendanceSummaryDetail[];
  onExportPdf?: () => void;
  hasFetched: boolean;
};

const MEAL_STATS = [
  { key: "morning" as const, label: "Morning", color: "text-emerald-600" },
  { key: "noon" as const, label: "Noon", color: "text-red-500" },
  { key: "night" as const, label: "Night", color: "text-[var(--mh-primary)]" },
];

function isAbsent(d: AttendanceSummaryDetail, meal: "morning" | "noon" | "night") {
  const absentKey = `${meal}Absent` as const;
  const val = d[absentKey];
  if (typeof val === "boolean") return val;
  return !!d[meal];
}

export default function AdminAttendanceSummary({
  date,
  onDateChange,
  onFetch,
  loading,
  error,
  summary,
  details,
  onExportPdf,
  hasFetched,
}: AdminAttendanceSummaryProps) {
  const absentRows = useMemo(
    () => (details ?? []).filter((d) => isAbsent(d, "morning") || isAbsent(d, "noon") || isAbsent(d, "night")),
    [details]
  );

  if (loading && !hasFetched) {
    return <AdminAttendanceSkeleton />;
  }

  return (
    <section
      className="rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]"
      aria-label="Attendance summary"
    >
      <h2 className="mh-section-title mb-4 text-center">Attendance Summary</h2>

      <div className="mb-4">
        <label htmlFor="admin-attendance-date" className="mb-1.5 block text-sm font-medium text-gray-600">
          Select Date:
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="admin-attendance-date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="min-h-[44px] w-full flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-gray-900 outline-none transition focus:border-[var(--mh-primary)] focus:ring-2 focus:ring-[var(--mh-primary)]/20"
          />
          <button
            type="button"
            onClick={onFetch}
            disabled={!date || loading}
            className="min-h-[44px] shrink-0 rounded-xl bg-[var(--mh-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading…" : "Get Details"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      <div
        className={`grid grid-cols-3 gap-2 transition-opacity duration-200 ${loading && hasFetched ? "opacity-60" : ""}`}
        aria-live="polite"
        aria-busy={loading}
      >
        {MEAL_STATS.map(({ key, label, color }) => (
          <div key={key} className="flex flex-col items-center py-2">
            <span className={`text-2xl font-bold tabular-nums tracking-tight ${color}`}>
              {summary ? summary[key] : "—"}
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {label}
            </span>
          </div>
        ))}
      </div>

      {hasFetched && summary && onExportPdf && (
        <div className="mt-4 flex justify-center border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onExportPdf}
            className="min-h-[40px] rounded-xl border border-[var(--mh-primary)]/20 bg-[var(--mh-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--mh-primary)] transition active:scale-[0.98] hover:bg-[var(--mh-primary)]/10"
          >
            Export to PDF
          </button>
        </div>
      )}

      {hasFetched && absentRows.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Name</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-600">M</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-600">N</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-600">Ni</th>
                </tr>
              </thead>
              <tbody>
                {absentRows.map((d, i) => (
                  <tr key={`${d.name}-${i}`} className="border-t border-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{d.name}</td>
                    {(["morning", "noon", "night"] as const).map((meal) => {
                      const absent = isAbsent(d, meal);
                      return (
                        <td
                          key={meal}
                          className={`px-2 py-2 text-center text-xs font-bold ${absent ? "text-red-500" : "text-emerald-600"}`}
                        >
                          {absent ? "No" : "Yes"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasFetched && summary && absentRows.length === 0 && (
        <p className="mt-4 text-center text-sm text-gray-500">No mess cuts recorded for this date.</p>
      )}
    </section>
  );
}
