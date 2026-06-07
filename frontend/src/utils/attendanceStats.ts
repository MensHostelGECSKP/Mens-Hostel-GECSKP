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
  totalDays: number;
};

export function computeMonthStats(
  records: AttendanceRecord[],
  year?: number,
  month?: number
): MonthAttendanceStats {
  let messCutDays = 0;
  let partialDays = 0;

  for (const record of records) {
    const status = getDayStatus(record);
    if (status === "messcut") {
      messCutDays++;
    } else if (status === "partial") {
      partialDays++;
    }
  }

  // Determine year and month to get total days in the month
  let y = year;
  let m = month;
  if (y === undefined || m === undefined) {
    const firstRecord = records[0];
    if (firstRecord && firstRecord.date) {
      const parts = firstRecord.date.split("-");
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1; // Convert 1-indexed to 0-indexed
    } else {
      const d = new Date();
      y = d.getFullYear();
      m = d.getMonth();
    }
  }

  const totalDays = new Date(y, m + 1, 0).getDate();
  const presentDays = totalDays - messCutDays;

  return { presentDays, messCutDays, partialDays, totalDays };
}
