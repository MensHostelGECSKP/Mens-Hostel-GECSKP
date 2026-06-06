/**
 * Shared attendance colors & legend — keep calendar and dashboard in sync.
 */
export const ATTENDANCE_STATUS = {
  present: {
    label: "Present",
    dotClass: "bg-emerald-500",
    chipClass: "border-emerald-100/80 bg-emerald-50/90 text-emerald-800",
    cellBg: "",
    dayText: "text-gray-900",
    dotOnly: true,
  },
  messcut: {
    label: "Mess Cut",
    dotClass: "bg-violet-600",
    chipClass: "border-violet-100/80 bg-violet-50/90 text-violet-800",
    cellBg: "",
    dayText: "text-gray-900",
    dotOnly: true,
  },
  partial: {
    label: "Partial",
    dotClass: "bg-orange-500",
    chipClass: "border-orange-100/80 bg-orange-50/90 text-orange-800",
    cellBg: "",
    dayText: "text-gray-900",
    dotOnly: true,
  },
  disabled: {
    label: "Disabled",
    dotClass: "bg-gray-400",
    chipClass: "border-gray-100/80 bg-gray-50 text-gray-500",
    cellBg: "",
    dayText: "text-gray-300",
    dotOnly: true,
  },
  today: {
    cellBg: "bg-[var(--mh-primary)] rounded-lg",
    dayText: "text-white",
  },
} as const;

export const ATTENDANCE_LEGEND_ITEMS = [
  ATTENDANCE_STATUS.present,
  ATTENDANCE_STATUS.messcut,
  ATTENDANCE_STATUS.partial,
  ATTENDANCE_STATUS.disabled,
] as const;

export type AttendanceDayStatus = "unmarked" | "full" | "messcut" | "partial";

export function getStudentDayAppearance(
  status: AttendanceDayStatus,
  options: { isToday: boolean; isDisabled: boolean }
) {
  const { isToday, isDisabled } = options;

  if (isToday) {
    return {
      cellBg: ATTENDANCE_STATUS.today.cellBg,
      dotClass: "",
      dayText: ATTENDANCE_STATUS.today.dayText,
    };
  }

  if (isDisabled) {
    return {
      cellBg: ATTENDANCE_STATUS.disabled.cellBg,
      dotClass: ATTENDANCE_STATUS.disabled.dotClass,
      dayText: ATTENDANCE_STATUS.disabled.dayText,
    };
  }

  if (status === "messcut") {
    const s = ATTENDANCE_STATUS.messcut;
    return { cellBg: s.cellBg, dotClass: s.dotClass, dayText: s.dayText };
  }

  if (status === "partial") {
    const s = ATTENDANCE_STATUS.partial;
    return { cellBg: s.cellBg, dotClass: s.dotClass, dayText: s.dayText };
  }

  if (status === "full") {
    const s = ATTENDANCE_STATUS.present;
    return { cellBg: s.cellBg, dotClass: s.dotClass, dayText: s.dayText };
  }

  return { cellBg: "", dotClass: "", dayText: "text-gray-900" };
}
