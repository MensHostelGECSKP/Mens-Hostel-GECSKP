"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import StudentMonthDetails from "@/components/student/StudentMonthDetails";
import AttendanceLegend from "@/components/student/AttendanceLegend";
import AttendanceSummaryCard from "@/components/student/AttendanceSummaryCard";
import PullToRefresh from "@/components/student/PullToRefresh";
import { useAttendance } from "@/hooks/useApi";
import { computeMonthStats } from "@/utils/attendanceStats";
import { HiBuildingOffice2 } from "react-icons/hi2";

function formatRoom(room?: string) {
  if (!room?.trim()) return "—";
  const n = room.trim();
  return n.length === 3 ? `Room ${n}` : `Room ${n}`;
}

function formatYear(year?: string) {
  if (!year?.trim()) return "—";
  return `Year ${year.trim()}`;
}

export default function StudentDashboard() {
  const { user, isLoggedIn, refreshUser } = useAuth();
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [view, setView] = useState<"calendar" | "details">("calendar");
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const monthStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}`;
  const {
    data: attendance = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAttendance(isLoggedIn ? monthStr : "");

  const monthLabel = new Date(calendarYear, calendarMonth).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const monthStats = useMemo(
    () => computeMonthStats(attendance),
    [attendance]
  );

  const handleMonthChange = useCallback((year: number, month: number) => {
    setCalendarYear(year);
    setCalendarMonth(month);
    setDetailsError(null);
    setRefreshError(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshError(null);
    setDetailsError(null);
    try {
      await Promise.all([refreshUser(), refetch()]);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not refresh. Pull down to try again.";
      setRefreshError(msg);
    }
  }, [refreshUser, refetch]);

  const handleGetDetails = async () => {
    setDetailsError(null);
    try {
      const result = await refetch();
      if (result.isError) {
        const msg =
          result.error instanceof Error
            ? result.error.message
            : "Failed to load attendance details";
        setDetailsError(msg);
        return;
      }
      setView("details");
    } catch {
      setDetailsError("Failed to load attendance details");
    }
  };

  if (!user) return null;

  const displayName = user.name?.trim() || "Student";
  const fetchError =
    refreshError ||
    detailsError ||
    (error instanceof Error ? error.message : null);

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={view === "details"}>
      <div className="mx-auto w-full max-w-lg px-4 pb-6 pt-3 md:max-w-2xl md:px-6 md:pt-6">
        {/* Welcome */}
        <section className="mb-5 animate-in fade-in duration-300">
          <p className="mh-welcome">Welcome back,</p>
          <p className="mh-display-name mt-1 text-[var(--mh-primary)]">
            {displayName}!
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="mh-badge inline-flex items-center gap-1.5 rounded-full bg-[var(--mh-primary-soft)] px-3.5 py-2 text-[var(--mh-primary)]">
              <HiBuildingOffice2 className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {formatRoom(user.roomNumber)}
            </span>
            <span className="mh-badge inline-flex items-center rounded-full bg-gray-100 px-3.5 py-2 text-gray-600">
              {formatYear(user.yearOfStudy)}
            </span>
          </div>
        </section>

        <AttendanceSummaryCard
          monthLabel={monthLabel}
          stats={monthStats}
          loading={isLoading && attendance.length === 0}
        />

        {/* Legend */}
        <section className="mb-4">
          <h2 className="mh-section-title mb-2.5">Attendance Overview</h2>
          <AttendanceLegend />
        </section>

        {fetchError && (
          <p
            className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600"
            role="alert"
          >
            {fetchError}
          </p>
        )}

        {view === "calendar" ? (
          <>
            <AttendanceCalendar
              variant="student"
              showLegend={false}
              onMonthChange={handleMonthChange}
            />
            <div className="mt-4 flex flex-col items-center">
              <button
                type="button"
                onClick={handleGetDetails}
                disabled={isFetching}
                className="w-full max-w-sm rounded-2xl bg-[var(--mh-primary)] py-3.5 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] hover:opacity-95 disabled:opacity-60"
              >
                {isFetching ? "Loading…" : "Get My Details"}
              </button>
            </div>
          </>
        ) : (
          <StudentMonthDetails
            year={calendarYear}
            month={calendarMonth}
            records={attendance}
            onBack={() => setView("calendar")}
          />
        )}
      </div>
    </PullToRefresh>
  );
}
