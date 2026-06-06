"use client";

import React, { useMemo, useState } from "react";
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
  hasRecords?: boolean;
};

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
  hasRecords = false,
}: AdminAttendanceSummaryProps) {
  const [groupByRoom, setGroupByRoom] = useState(false);

  // Filter out users who have at least one cut (absent for morning, noon, or night)
  const absentRows = useMemo(() => {
    return (details ?? []).filter(
      (d) => isAbsent(d, "morning") || isAbsent(d, "noon") || isAbsent(d, "night")
    );
  }, [details]);

  // Default sorting: Room Number (natural order), then Name
  const sortedAbsentRows = useMemo(() => {
    return [...absentRows].sort((a, b) => {
      const roomA = a.roomNumber || "";
      const roomB = b.roomNumber || "";
      const roomCompare = roomA.localeCompare(roomB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      if (roomCompare !== 0) return roomCompare;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [absentRows]);

  // Grouped by room if toggled
  const groupedAbsentRows = useMemo(() => {
    if (!groupByRoom) return [];
    const groups: { room: string; residents: AttendanceSummaryDetail[] }[] = [];
    const roomMap: Record<string, AttendanceSummaryDetail[]> = {};
    sortedAbsentRows.forEach((d) => {
      const room = d.roomNumber || "No Room";
      if (!roomMap[room]) {
        roomMap[room] = [];
        groups.push({ room, residents: roomMap[room] });
      }
      roomMap[room].push(d);
    });
    return groups;
  }, [sortedAbsentRows, groupByRoom]);

  // Count summaries
  const totalResidents = details?.length || 0;
  const morningCuts = summary?.morning || 0;
  const noonCuts = summary?.noon || 0;
  const nightCuts = summary?.night || 0;

  const morningPresent = Math.max(0, totalResidents - morningCuts);
  const noonPresent = Math.max(0, totalResidents - noonCuts);
  const nightPresent = Math.max(0, totalResidents - nightCuts);

  if (loading && !hasFetched) {
    return <AdminAttendanceSkeleton />;
  }

  return (
    <section
      className="rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]"
      aria-label="Attendance summary"
    >
      <h2 className="mh-section-title mb-4 text-center font-bold text-gray-900 text-lg">Attendance Summary</h2>

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

      {hasFetched && !hasRecords && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-6 text-center">
          <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-sm font-medium text-gray-600">No attendance records found for selected date.</p>
        </div>
      )}

      {hasFetched && hasRecords && (
        <>
          {/* Summary Cards Grid */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-3.5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Residents</span>
              <p className="mt-1 text-2xl font-extrabold text-indigo-600">{totalResidents}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-3.5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Morning</span>
              <p className="mt-1 text-2xl font-extrabold text-emerald-600">{morningPresent}</p>
              <p className="text-[10px] font-semibold text-gray-500 mt-0.5">{morningCuts} cuts</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-3.5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Noon</span>
              <p className="mt-1 text-2xl font-extrabold text-amber-500">{noonPresent}</p>
              <p className="text-[10px] font-semibold text-gray-500 mt-0.5">{noonCuts} cuts</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-3.5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Night</span>
              <p className="mt-1 text-2xl font-extrabold text-indigo-500">{nightPresent}</p>
              <p className="text-[10px] font-semibold text-gray-500 mt-0.5">{nightCuts} cuts</p>
            </div>
          </div>

          {/* Export Actions & Room Grouping Toggle */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-100 pt-4">
            {onExportPdf && (
              <button
                type="button"
                onClick={onExportPdf}
                className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-[var(--mh-primary)]/20 bg-[var(--mh-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--mh-primary)] transition active:scale-[0.98] hover:bg-[var(--mh-primary)]/10"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            )}

            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={groupByRoom}
                onChange={(e) => setGroupByRoom(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              Group by Room Number
            </label>
          </div>

          {/* Future Filter Architecture (Placeholder) */}
          <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/35 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Future Filters</span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500">Coming Soon</span>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              <div className="opacity-50">
                <label className="block text-[9px] font-medium text-gray-500">Room Number</label>
                <input type="text" disabled placeholder="e.g. 313" className="mt-0.5 h-8 w-full rounded-lg border border-gray-200 bg-gray-100 px-2 text-xs outline-none cursor-not-allowed" />
              </div>
              <div className="opacity-50">
                <label className="block text-[9px] font-medium text-gray-500">Year</label>
                <input type="text" disabled placeholder="e.g. 3" className="mt-0.5 h-8 w-full rounded-lg border border-gray-200 bg-gray-100 px-2 text-xs outline-none cursor-not-allowed" />
              </div>
              <div className="opacity-50">
                <label className="block text-[9px] font-medium text-gray-500">Student Name</label>
                <input type="text" disabled placeholder="e.g. Sobhraj" className="mt-0.5 h-8 w-full rounded-lg border border-gray-200 bg-gray-100 px-2 text-xs outline-none cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Cuts Table */}
          {absentRows.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-150 shadow-sm">
              <div className="max-h-72 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-150 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">Sl No</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">Room</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">Year</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600 text-xs">Morning</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600 text-xs">Noon</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600 text-xs">Night</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupByRoom ? (
                      (() => {
                        let globalIdx = 0;
                        return groupedAbsentRows.map((group) => (
                          <React.Fragment key={group.room}>
                            <tr className="bg-indigo-50/40 font-bold text-gray-700">
                              <td colSpan={7} className="px-3 py-1.5 border-y border-gray-100 text-[11px] uppercase tracking-wider text-indigo-700 font-bold">
                                Room {group.room}
                              </td>
                            </tr>
                            {group.residents.map((d) => {
                              globalIdx++;
                              return (
                                <tr key={d.name} className="border-t border-gray-100 hover:bg-gray-50/50 transition">
                                  <td className="px-3 py-2 text-xs text-gray-400">{globalIdx}</td>
                                  <td className="px-3 py-2 font-medium text-gray-900 text-xs">{d.name}</td>
                                  <td className="px-3 py-2 text-xs text-gray-555">{d.roomNumber || "—"}</td>
                                  <td className="px-3 py-2 text-xs text-gray-555">{d.yearOfStudy || "—"}</td>
                                  {(["morning", "noon", "night"] as const).map((meal) => {
                                    const absent = isAbsent(d, meal);
                                    return (
                                      <td
                                        key={meal}
                                        className={`px-2 py-2 text-center text-xs font-semibold ${absent ? "text-red-500" : "text-emerald-600"}`}
                                      >
                                        {absent ? "No" : "Yes"}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ));
                      })()
                    ) : (
                      sortedAbsentRows.map((d, i) => (
                        <tr key={`${d.name}-${i}`} className="border-t border-gray-100 hover:bg-gray-50/50 transition">
                          <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-900 text-xs">{d.name}</td>
                          <td className="px-3 py-2 text-xs text-gray-555">{d.roomNumber || "—"}</td>
                          <td className="px-3 py-2 text-xs text-gray-555">{d.yearOfStudy || "—"}</td>
                          {(["morning", "noon", "night"] as const).map((meal) => {
                            const absent = isAbsent(d, meal);
                            return (
                              <td
                                key={meal}
                                className={`px-2 py-2 text-center text-xs font-semibold ${absent ? "text-red-500" : "text-emerald-600"}`}
                              >
                                {absent ? "No" : "Yes"}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-center text-sm text-gray-500 bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">No mess cuts recorded for this date.</p>
          )}
        </>
      )}
    </section>
  );
}
