"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiExclamationTriangle } from "react-icons/hi2";
import Spinner from "@/components/Spinner";
import {
  useYearEndReset,
  useYearEndResetStats,
} from "@/hooks/useApi";
import YearEndResetConfirmDialog from "./YearEndResetConfirmDialog";

function formatCount(value: number | undefined) {
  if (value === undefined) return "—";
  return value.toLocaleString();
}

export default function YearEndResetView() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const { data: stats, isLoading, error, refetch } = useYearEndResetStats();
  const yearEndReset = useYearEndReset();

  const handleConfirmReset = async () => {
    setResetError(null);
    try {
      await yearEndReset.mutateAsync();
      setDialogOpen(false);
      setResetComplete(true);
    } catch (err) {
      setResetError(
        err instanceof Error
          ? err.message
          : "Unable to complete reset. Please try again or contact the administrator."
      );
    }
  };

  if (resetComplete) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 py-10 text-center animate-in fade-in md:max-w-xl">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
          aria-hidden
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
          Academic Year Reset Complete
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
          Database cleared successfully. The system is ready for a new academic year.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-2xl bg-[var(--mh-primary)] px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99]"
        >
          Go To Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg animate-in fade-in duration-300 md:max-w-xl md:px-6">
      <div className="px-4 pb-2 pt-3 md:pt-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/settings")}
          className="mb-3 flex min-h-[44px] items-center gap-1 text-sm font-semibold text-[var(--mh-primary)] transition active:scale-[0.98]"
        >
          ← Settings
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Year-End Reset
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Reset academic year · System Management
        </p>
      </div>

      <div className="px-4 pb-8 md:px-0">
        {isLoading ? (
          <Spinner className="min-h-[200px]" />
        ) : error ? (
          <div
            className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700"
            role="alert"
          >
            <p className="font-semibold">Could not load system statistics</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 min-h-[44px] font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <StatCard label="Current Academic Year" value={stats?.academicYear ?? "—"} />
              <StatCard label="Total Residents" value={formatCount(stats?.residentCount)} />
              <StatCard
                label="Attendance Records"
                value={formatCount(stats?.attendanceCount)}
              />
              <StatCard
                label="Notifications"
                value={formatCount(stats?.notificationCount)}
              />
              <StatCard
                label="Mess Bills"
                value={formatCount(stats?.messBillCount)}
              />
              <StatCard
                label="Bill Payment Records"
                value={formatCount(stats?.messBillPaymentCount)}
              />
            </dl>

            <section
              className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4"
              aria-labelledby="year-end-warning-heading"
            >
              <div className="flex gap-3">
                <HiExclamationTriangle
                  className="mt-0.5 h-6 w-6 shrink-0 text-amber-600"
                  aria-hidden
                />
                <div>
                  <h2
                    id="year-end-warning-heading"
                    className="text-sm font-bold text-amber-900"
                  >
                    Warning — permanent operation
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-amber-950/90">
                    This operation will permanently remove all hostel operational data and
                    prepare the application for a fresh academic year.
                  </p>
                  <p className="mt-2 text-sm font-semibold text-red-700">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </section>

            {resetError ? (
              <div
                className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {resetError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              disabled={yearEndReset.isPending}
              className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 border-red-600 bg-red-600 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset Academic Year
            </button>
          </>
        )}
      </div>

      <YearEndResetConfirmDialog
        open={dialogOpen}
        onClose={() => !yearEndReset.isPending && setDialogOpen(false)}
        onConfirm={handleConfirmReset}
        isResetting={yearEndReset.isPending}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-gray-900">{value}</dd>
    </div>
  );
}
