"use client";

import React, { useMemo } from "react";

const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekday(year: number, month: number, day: number) {
  return new Date(year, month, day).getDay();
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type MonthlyReportCalendarProps = {
  year: number;
  month: number;
  selectedKeys: Set<string>;
  onToggleDate: (key: string) => void;
};

export default function MonthlyReportCalendar({
  year,
  month,
  selectedKeys,
  onToggleDate,
}: MonthlyReportCalendarProps) {
  const today = new Date();
  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekday = getWeekday(year, month, 1);
  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const monthLabel = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-3xl bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-5">
      <h2 className="mh-calendar-month mb-4 text-center">{monthLabel}</h2>

      <div className="mb-2 grid grid-cols-7 gap-x-1">
        {WEEKDAYS_SHORT.map((d, i) => (
          <div key={`${d}-${i}`} className="mh-calendar-weekday py-1 text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-x-1 gap-y-2">
        {Array(firstWeekday)
          .fill(null)
          .map((_, i) => (
            <div key={`empty-${i}`} aria-hidden />
          ))}
        {daysArray.map((day) => {
          const dateKey = toDateKey(year, month, day);
          const isSelected = selectedKeys.has(dateKey);
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onToggleDate(dateKey)}
              className={`mh-calendar-day relative mx-auto flex aspect-square max-h-9 w-full max-w-9 flex-col items-center justify-center rounded-lg transition-transform active:scale-95 ${
                isSelected
                  ? "bg-[var(--mh-primary-soft)] font-semibold text-[var(--mh-primary)] ring-1 ring-[var(--mh-primary)]/30"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              } ${isToday && !isSelected ? "ring-2 ring-[var(--mh-primary)]/40" : ""}`}
              aria-label={`${dateKey}${isSelected ? ", selected" : ", not selected"}`}
              aria-pressed={isSelected}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { toDateKey, getDaysInMonth };
