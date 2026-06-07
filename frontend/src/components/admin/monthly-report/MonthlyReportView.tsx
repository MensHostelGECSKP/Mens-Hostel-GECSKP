"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader, PageContainer } from "@/components/ui";
import { HiChevronDown } from "react-icons/hi2";
import { useUsers } from "@/hooks/useApi";
import FilterSheet, { FilterOption } from "@/components/admin/manage-users/FilterSheet";
import MonthlyReportCalendar, {
  getDaysInMonth,
  toDateKey,
} from "./MonthlyReportCalendar";
import { MonthlyReportPageSkeleton } from "./MonthlyReportSkeleton";
import toast from "react-hot-toast";

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(0, i).toLocaleString("default", { month: "long" })
);

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => 2024 + i);

function getAllDateKeysInMonth(year: number, month: number) {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, i) => toDateKey(year, month, i + 1));
}

export default function MonthlyReportView() {
  const router = useRouter();
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [filterSheet, setFilterSheet] = useState<"month" | "year" | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: users = [], isPending, isLoading } = useUsers(true);
  const showSkeleton = isPending || (isLoading && users.length === 0);
  const totalResidents = useMemo(
    () => users.filter((u) => u.role === "student").length,
    [users]
  );

  const allDateKeys = useMemo(
    () => getAllDateKeysInMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(getAllDateKeysInMonth(today.getFullYear(), today.getMonth()))
  );

  useEffect(() => {
    setSelectedKeys(new Set(allDateKeys));
  }, [allDateKeys]);

  const selectedCount = selectedKeys.size;
  const exportMonthLabel = new Date(selectedYear, selectedMonth).toLocaleString(
    "default",
    { month: "long", year: "numeric" }
  );

  const handleToggleDate = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleSelectAll = () => setSelectedKeys(new Set(allDateKeys));
  const handleClearAll = () => setSelectedKeys(new Set());

  const handleExport = async () => {
    if (selectedCount === 0 || generating) return;
    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const dateStrings = Array.from(selectedKeys).sort();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/attendance/admin/monthly-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ dates: dateStrings }),
        }
      );
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            "Report endpoint not found. Please ensure the backend is running."
          );
        }
        throw new Error("Failed to generate report.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mess-cut-report-${dateStrings[0]}_to_${dateStrings[dateStrings.length - 1]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to download report. Please try again.";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  if (showSkeleton) {
    return <MonthlyReportPageSkeleton />;
  }

  const monthLabel = MONTHS[selectedMonth];
  const yearLabel = String(selectedYear);

  return (
    <>
      <AppHeader
        title="Monthly Cut Report"
        subtitle="Generate and export monthly attendance reports"
        showBack={true}
      />
      <PageContainer>

      <div className="px-4 pb-3 md:px-6">
        {/* Mobile: chip + bottom sheet (matches Manage Users) */}
        <div
          className="flex gap-2 overflow-x-auto pb-0.5 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Report period"
        >
          <button
            type="button"
            onClick={() => setFilterSheet("month")}
            className="inline-flex shrink-0 min-h-[40px] items-center gap-1 rounded-full border border-[var(--mh-primary)] bg-white px-3.5 text-[13px] font-semibold text-[var(--mh-primary)] transition active:scale-[0.98]"
          >
            {monthLabel}
            <HiChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setFilterSheet("year")}
            className="inline-flex shrink-0 min-h-[40px] items-center gap-1 rounded-full border border-[var(--mh-primary)] bg-white px-3.5 text-[13px] font-semibold text-[var(--mh-primary)] transition active:scale-[0.98]"
          >
            Year {yearLabel}
            <HiChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </button>
        </div>

        {/* Desktop: styled dropdowns */}
        <div className="hidden gap-3 md:flex" role="group" aria-label="Report period">
          <label className="flex min-h-[40px] items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 text-[13px] font-semibold text-gray-700">
            <span className="text-gray-500">Month</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="cursor-pointer bg-transparent pr-1 text-[var(--mh-primary)] outline-none"
              aria-label="Select month"
            >
              {MONTHS.map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-[40px] items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 text-[13px] font-semibold text-gray-700">
            <span className="text-gray-500">Year</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="cursor-pointer bg-transparent pr-1 text-[var(--mh-primary)] outline-none"
              aria-label="Select year"
            >
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="px-4 pb-4 md:px-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-800">Select dates</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={selectedCount === allDateKeys.length}
              className="min-h-[36px] rounded-full border border-[var(--mh-primary)]/20 bg-[var(--mh-primary-soft)] px-3 text-xs font-semibold text-[var(--mh-primary)] transition active:scale-[0.98] disabled:opacity-40"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={selectedCount === 0}
              className="min-h-[36px] rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition active:scale-[0.98] disabled:opacity-40"
            >
              Clear All
            </button>
          </div>
        </div>

        <MonthlyReportCalendar
          year={selectedYear}
          month={selectedMonth}
          selectedKeys={selectedKeys}
          onToggleDate={handleToggleDate}
        />

        {selectedCount === 0 && (
          <p className="mt-2 text-center text-sm font-medium text-red-600" role="alert">
            Select at least one date to generate a report.
          </p>
        )}
      </div>

      <div className="px-4 pb-4 md:px-6">
        <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Report summary
          </h2>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="px-2 text-center">
              <p className="text-base font-bold text-gray-900">
                {selectedCount} {selectedCount === 1 ? "Day" : "Days"}
              </p>
              <p className="mt-0.5 text-xs font-medium text-gray-500">Selected</p>
            </div>
            <div className="px-2 text-center">
              <p className="text-base font-bold text-gray-900">
                {totalResidents} {totalResidents === 1 ? "Resident" : "Residents"}
              </p>
              <p className="mt-0.5 text-xs font-medium text-gray-500">Total</p>
            </div>
            <div className="px-2 text-center">
              <p className="text-base font-bold text-gray-900">{exportMonthLabel}</p>
              <p className="mt-0.5 text-xs font-medium text-gray-500">Export month</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 md:px-6">
        <button
          type="button"
          onClick={handleExport}
          disabled={generating || selectedCount === 0}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--mh-primary)] px-4 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating && (
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden
            />
          )}
          {generating ? "Generating Report..." : "Generate Excel Report"}
        </button>
      </div>

      <FilterSheet
        open={filterSheet === "month"}
        title="Select month"
        onClose={() => setFilterSheet(null)}
      >
        {MONTHS.map((label, i) => (
          <FilterOption
            key={label}
            label={label}
            selected={selectedMonth === i}
            onSelect={() => {
              setSelectedMonth(i);
              setFilterSheet(null);
            }}
          />
        ))}
      </FilterSheet>

      <FilterSheet
        open={filterSheet === "year"}
        title="Select year"
        onClose={() => setFilterSheet(null)}
      >
        {YEAR_OPTIONS.map((year) => (
          <FilterOption
            key={year}
            label={String(year)}
            selected={selectedYear === year}
            onSelect={() => {
              setSelectedYear(year);
              setFilterSheet(null);
            }}
          />
        ))}
      </FilterSheet>
    </PageContainer>
  </>
);
}
