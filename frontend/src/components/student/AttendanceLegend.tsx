"use client";

import React from "react";
import { ATTENDANCE_LEGEND_ITEMS } from "@/constants/attendanceStatus";

export default function AttendanceLegend() {
  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="list"
      aria-label="Attendance status legend"
    >
      {ATTENDANCE_LEGEND_ITEMS.map(({ label, dotClass, chipClass }) => (
        <div
          key={label}
          role="listitem"
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 ${chipClass}`}
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ring-2 ring-white/80 ${dotClass}`}
            aria-hidden
          />
          <span className="mh-legend-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
