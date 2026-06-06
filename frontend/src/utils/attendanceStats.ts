import type { AttendanceRecord } from "@/types";
import type { AttendanceDayStatus } from "@/constants/attendanceStatus";

export function getDayStatus(
  record: AttendanceRecord | undefined
): AttendanceDayStatus | "none" {
  if (!record) return "none";
  const { morning, noon, night } = record.meals;
  if (!morning && !noon && !night) return "messcut";
  if (morning && noon && night) return "full";
  return "partial";
}

export type MonthAttendanceStats = {
  presentDays: number;
  messCutDays: number;
  partialDays: number;
};

export function computeMonthStats(
  records: AttendanceRecord[]
): MonthAttendanceStats {
  let presentDays = 0;
  let messCutDays = 0;
  let partialDays = 0;

  for (const record of records) {
    const status = getDayStatus(record);
    if (status === "full") presentDays++;
    else if (status === "messcut") messCutDays++;
    else if (status === "partial") partialDays++;
  }

  return { presentDays, messCutDays, partialDays };
}
