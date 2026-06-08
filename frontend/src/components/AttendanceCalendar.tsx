"use client";
import React from 'react';
import { useEffect, useState } from "react";
import { useAttendance, useMarkAttendance } from '@/hooks/useApi';
import type { AttendanceRecord } from '@/types';
import { CalendarSkeleton } from '@/components/student/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { getStudentDayAppearance, type AttendanceDayStatus } from '@/constants/attendanceStatus';
import toast from 'react-hot-toast';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekday(year: number, month: number, day: number) {
  return new Date(year, month, day).getDay();
}

interface AttendanceCalendarProps {
  onMonthChange?: (year: number, month: number) => void;
  variant?: 'default' | 'student';
  showLegend?: boolean;
}

const ATTENDANCE_WINDOW_DAYS = parseInt(process.env.NEXT_PUBLIC_ATTENDANCE_WINDOW_DAYS || "7", 10);
const ATTENDANCE_DEADLINE_HOUR = parseInt(process.env.NEXT_PUBLIC_ATTENDANCE_DEADLINE_HOUR || "19", 10);

const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AttendanceCalendar({
  onMonthChange,
  variant = 'default',
  showLegend = true,
}: AttendanceCalendarProps) {
  const isStudent = variant === 'student';
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalMeals, setModalMeals] = useState({ morning: true, noon: true, night: true });

  const { isLoggedIn, loading: authLoading } = useAuth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const queryMonth = isLoggedIn ? monthStr : '';
  const { data: attendance = [] as AttendanceRecord[], isLoading, error, refetch } = useAttendance(queryMonth);
  const markAttendanceMutation = useMarkAttendance();

  const current = new Date();
  const minMonth = new Date(current.getFullYear(), current.getMonth() - 2, 1);
  const maxMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  const viewing = new Date(year, month, 1);
  const isPrevDisabled = viewing <= minMonth;
  const isNextDisabled = viewing >= maxMonth;

  useEffect(() => {
    if (onMonthChange) onMonthChange(year, month);
  }, [year, month, onMonthChange]);

  const openModal = (date: string) => {
    const record = attendance.find((a: AttendanceRecord) => a.date === date);
    setModalMeals(record ? record.meals : { morning: true, noon: true, night: true });
    setSelectedDate(date);
  };

  const handleMark = async () => {
    if (!selectedDate) return;
    try {
      await markAttendanceMutation.mutateAsync({
        date: selectedDate,
        meals: modalMeals,
      });
      toast.success("Attendance saved successfully");
      setSelectedDate(null);
    } catch (err) {
      console.error('Failed to mark attendance:', err);
      toast.error("Failed to save attendance. Please try again.");
    }
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekday = getWeekday(year, month, 1);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getStatus = (date: string): AttendanceDayStatus => {
    const record = attendance.find((a: AttendanceRecord) => a.date === date);
    if (!record) return "unmarked";
    const { morning, noon, night } = record.meals;
    if (!morning && !noon && !night) return "messcut";
    if (morning && noon && night) return "full";
    return "partial";
  };

  const isMarkable = (dateStr: string) => {
    const now = new Date();
    
    // Parse target dateStr as UTC midnight (matching the backend's parseISO("YYYY-MM-DDT00:00:00Z"))
    const [y, m, d] = dateStr.split("-").map(Number);
    const requestedDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    
    // Calculate deadline matching backend (19:00 UTC of previous day)
    const deadline = new Date(requestedDate);
    deadline.setUTCDate(deadline.getUTCDate() - 1);
    deadline.setUTCHours(ATTENDANCE_DEADLINE_HOUR, 0, 0, 0);
    
    // Calculate window matching backend (todayUTC - 1 day to todayUTC + windowDays)
    const todayUTC = new Date(now);
    todayUTC.setUTCHours(0, 0, 0, 0);
    
    const minDate = new Date(todayUTC);
    minDate.setUTCDate(minDate.getUTCDate() - 1);
    
    const maxDate = new Date(todayUTC);
    maxDate.setUTCDate(maxDate.getUTCDate() + ATTENDANCE_WINDOW_DAYS);
    
    const isBeforeDeadline = now <= deadline;
    const isWithinWindow = requestedDate >= minDate && requestedDate <= maxDate;
    
    return isBeforeDeadline && isWithinWindow;
  };

  const loading = isLoading || markAttendanceMutation.isPending;

  if (authLoading) {
    return isStudent ? <CalendarSkeleton /> : null;
  }

  if (!isLoggedIn) return null;

  if (error) {
    const errorBoxClass = isStudent
      ? "rounded-3xl bg-white p-6 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
      : "w-full max-w-3xl mx-auto p-2 sm:p-6 bg-white/95 rounded-2xl shadow-xl border border-gray-100";
    return (
      <div className={errorBoxClass}>
        <p className="text-red-600">Failed to load attendance. Please try again.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-2xl bg-[var(--mh-primary)] px-5 py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isStudent && isLoading && attendance.length === 0) {
    return <CalendarSkeleton />;
  }

  const statusStyles: Record<string, string> = {
    partial: "bg-yellow-300 border-yellow-400 text-yellow-800",
    messcut: "bg-gray-400 border-gray-500 text-white",
    unmarked: "bg-white border-gray-300 text-gray-800",
    disabled: "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed",
  };

  const renderStudentDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const status = getStatus(dateStr);
    const canBeMarked = isMarkable(dateStr);
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;

    const isDisabled = !canBeMarked && status === "unmarked";
    const { cellBg, dotClass, dayText } = getStudentDayAppearance(status, {
      isToday,
      isDisabled,
    });

    return (
      <button
        key={day}
        type="button"
        className={`mh-calendar-day relative flex aspect-square max-h-9 w-full max-w-9 mx-auto flex-col items-center justify-center rounded-lg transition-transform active:scale-95 ${
          canBeMarked ? "cursor-pointer hover:bg-gray-50/80" : "cursor-default"
        } ${dayText} ${cellBg}`}
        onClick={() => canBeMarked && openModal(dateStr)}
        disabled={loading || !canBeMarked}
        aria-label={`${dateStr}${status !== "unmarked" ? `, ${status}` : ""}`}
        tabIndex={canBeMarked ? 0 : -1}
      >
        <span>{day}</span>
        {dotClass && (
          <span
            className={`absolute bottom-0.5 h-1.5 w-1.5 rounded-full ${dotClass}`}
            aria-hidden
          />
        )}
      </button>
    );
  };

  const monthLabel = new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" });

  const navButtonClass = isStudent
    ? "flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30"
    : `p-2 sm:p-3 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-150`;

  const chevron = (dir: "prev" | "next") => (
    <svg width={isStudent ? 20 : 28} height={isStudent ? 20 : 28} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d={dir === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
    </svg>
  );

  if (isStudent) {
    return (
      <div className="relative rounded-3xl bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (isPrevDisabled) return;
              const d = new Date(year, month - 1, 1);
              setMonth(d.getMonth());
              setYear(d.getFullYear());
            }}
            className={navButtonClass}
            disabled={isPrevDisabled}
            aria-label="Previous month"
          >
            {chevron("prev")}
          </button>
          <h2 className="mh-calendar-month">{monthLabel}</h2>
          <button
            type="button"
            onClick={() => {
              if (isNextDisabled) return;
              const d = new Date(year, month + 1, 1);
              setMonth(d.getMonth());
              setYear(d.getFullYear());
            }}
            className={navButtonClass}
            disabled={isNextDisabled}
            aria-label="Next month"
          >
            {chevron("next")}
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-x-1">
          {WEEKDAYS_SHORT.map((d, i) => (
            <div key={`${d}-${i}`} className="mh-calendar-weekday py-1 text-center">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-x-1 gap-y-2">
          {Array(firstWeekday).fill(null).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {daysArray.map((day) => renderStudentDay(day))}
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/60 backdrop-blur-[1px]">
            <svg className="h-8 w-8 animate-spin text-[var(--mh-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}

        {selectedDate && (
          <StudentMarkModal
            selectedDate={selectedDate}
            modalMeals={modalMeals}
            setModalMeals={setModalMeals}
            onClose={() => setSelectedDate(null)}
            onSave={handleMark}
            loading={loading}
          />
        )}
      </div>
    );
  }

  // Default variant (admin / legacy)
  return (
    <div className="w-full max-w-3xl mx-auto p-2 sm:p-6 bg-white/95 rounded-2xl shadow-xl border border-gray-100 relative">
      <div className="flex justify-between items-center mb-4 px-0">
        <button
          onClick={() => {
            if (isPrevDisabled) return;
            const newDate = new Date(year, month - 1, 1);
            setMonth(newDate.getMonth());
            setYear(newDate.getFullYear());
          }}
          className={`${navButtonClass} ${isPrevDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          disabled={isPrevDisabled}
          aria-label="Previous Month"
        >
          {chevron("prev")}
        </button>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-900 text-center flex-1 select-none">
          {monthLabel}
        </h2>
        <button
          onClick={() => {
            if (isNextDisabled) return;
            const newDate = new Date(year, month + 1, 1);
            setMonth(newDate.getMonth());
            setYear(newDate.getFullYear());
          }}
          className={`${navButtonClass} ${isNextDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          disabled={isNextDisabled}
          aria-label="Next Month"
        >
          {chevron("next")}
        </button>
      </div>
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 text-xs sm:text-sm px-0 py-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300"><span className="w-2 h-2 rounded-full bg-yellow-300 border border-yellow-400"></span>Partial</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-200 text-gray-700 border border-gray-400"><span className="w-2 h-2 rounded-full bg-gray-400 border border-gray-500"></span>Mess Cut</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200"><span className="w-2 h-2 rounded-full bg-gray-50 border border-gray-200"></span>Unmarked</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200"><span className="w-2 h-2 rounded-full bg-gray-100 border border-gray-100"></span>Disabled</span>
        </div>
      )}
      <div className="flex justify-center">
        <div className="grid grid-cols-7 gap-1 sm:gap-4 p-1 sm:p-4 min-h-[320px] w-full max-w-2xl border-t border-l border-gray-200 bg-white rounded-xl">
          {WEEKDAYS_LONG.map(d => (
            <div key={d} className="text-center font-bold text-indigo-700 text-xs sm:text-base select-none py-2 tracking-wide sticky top-0 bg-white z-10">
              {d}
            </div>
          ))}
          {Array(firstWeekday).fill(null).map((_, i) => (
            <div key={"empty-" + i}></div>
          ))}
          {daysArray.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const status = getStatus(dateStr);
            const canBeMarked = isMarkable(dateStr);
            let style = statusStyles[status];
            if (!canBeMarked && status === "unmarked") {
              style = statusStyles["disabled"];
            }
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            return (
              <button
                key={day}
                className={`aspect-square w-9 h-9 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border transition-all duration-150 focus:ring-2 focus:ring-indigo-400 text-base sm:text-lg m-0.5 font-semibold select-none ${
                  canBeMarked ? "cursor-pointer hover:bg-indigo-50 hover:shadow-md" : "cursor-not-allowed"
                } ${style} ${isToday ? 'ring-2 ring-pink-500 shadow-lg border-pink-400' : ''}`}
                onClick={() => canBeMarked && openModal(dateStr)}
                disabled={loading || !canBeMarked}
                aria-label={`Mark attendance for ${dateStr}`}
                tabIndex={canBeMarked ? 0 : -1}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20 rounded-2xl">
          <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
        </div>
      )}
      {selectedDate && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 px-2">
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-2xl w-full max-w-xs flex flex-col gap-6 border border-indigo-100 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-indigo-600 text-xl font-bold" onClick={() => setSelectedDate(null)} aria-label="Close" disabled={loading}>&times;</button>
            <div className="mb-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 text-center mb-1">
                {(() => {
                  const d = new Date(selectedDate);
                  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) +
                    ' - ' + d.toLocaleDateString(undefined, { weekday: 'long' });
                })()}
              </h3>
            </div>
            <MealToggles modalMeals={modalMeals} setModalMeals={setModalMeals} variant="default" />
            <button
              className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition text-lg font-semibold shadow mt-2 mb-1 active:scale-95"
              onClick={handleMark}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Attendance"}
            </button>
            <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition text-base font-medium shadow border border-gray-200 active:scale-95" onClick={() => setSelectedDate(null)} disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MealToggles({
  modalMeals,
  setModalMeals,
  variant,
}: {
  modalMeals: { morning: boolean; noon: boolean; night: boolean };
  setModalMeals: React.Dispatch<React.SetStateAction<{ morning: boolean; noon: boolean; night: boolean }>>;
  variant: 'default' | 'student';
}) {
  const meals = [
    { label: variant === 'student' ? 'Morning' : 'MORNING', value: 'morning' as const },
    { label: variant === 'student' ? 'Noon' : 'NOON', value: 'noon' as const },
    { label: variant === 'student' ? 'Night' : 'NIGHT', value: 'night' as const },
  ];

  return (
    <div className={`flex flex-col divide-y divide-gray-100 ${variant === 'student' ? 'rounded-2xl bg-gray-50' : 'bg-white rounded-xl shadow'}`}>
      {meals.map((meal) => (
        <div key={meal.value} className="flex items-center justify-between px-4 py-4">
          <span className={`font-semibold ${variant === 'student' ? 'text-gray-800 text-base' : 'uppercase font-bold text-lg tracking-wide text-fuchsia-600'}`}>
            {meal.label}
          </span>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={modalMeals[meal.value]}
              onChange={(e) => setModalMeals((m) => ({ ...m, [meal.value]: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="h-7 w-12 rounded-full bg-gray-200 transition peer-checked:bg-[var(--mh-primary)]" />
            <div className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </label>
        </div>
      ))}
    </div>
  );
}

function StudentMarkModal({
  selectedDate,
  modalMeals,
  setModalMeals,
  onClose,
  onSave,
  loading,
}: {
  selectedDate: string;
  modalMeals: { morning: boolean; noon: boolean; night: boolean };
  setModalMeals: React.Dispatch<React.SetStateAction<{ morning: boolean; noon: boolean; night: boolean }>>;
  onClose: () => void;
  onSave: () => void;
  loading: boolean;
}) {
  const d = new Date(selectedDate + "T12:00:00");
  const title = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/25 px-0 backdrop-blur-sm sm:items-center sm:px-4">
      <div
        className="w-full max-w-lg animate-in slide-in-from-bottom duration-200 rounded-t-3xl bg-white p-5 pb-8 shadow-2xl sm:rounded-3xl"
        role="dialog"
        aria-labelledby="mark-title"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />
        <button
          type="button"
          className="absolute right-4 top-4 text-2xl text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h3 id="mark-title" className="mb-4 text-center text-lg font-bold text-gray-900">
          {title}
        </h3>
        <MealToggles modalMeals={modalMeals} setModalMeals={setModalMeals} variant="student" />
        <button
          type="button"
          className="mt-4 w-full rounded-2xl bg-[var(--mh-primary)] py-3.5 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          onClick={onSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
