"use client";

import React from "react";
import type { AttendanceRecord } from "@/types";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function buildMonthRows(
  year: number,
  month: number,
  records: AttendanceRecord[]
) {
  const daysInMonth = getDaysInMonth(year, month);
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = records.find((d) => d.date === dateStr);
    const meals = record?.meals ?? { morning: true, noon: true, night: true };
    return { date: dateStr, meals };
  });
}

async function exportMonthToPdf(year: number, month: number, records: AttendanceRecord[]) {
  const [ { default: jsPDF }, { default: autoTable } ] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable")
  ]);
  const doc = new jsPDF();
  const monthLabel = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(14);
  doc.text(`Attendance — ${monthLabel}`, 14, 16);

  const rows = buildMonthRows(year, month, records).map(({ date, meals }) => ({
    date,
    morning: meals.morning
      ? { text: "Yes", styles: { textColor: [22, 163, 74] as [number, number, number] } }
      : { text: "No", styles: { textColor: [220, 38, 38] as [number, number, number] } },
    noon: meals.noon
      ? { text: "Yes", styles: { textColor: [22, 163, 74] as [number, number, number] } }
      : { text: "No", styles: { textColor: [220, 38, 38] as [number, number, number] } },
    night: meals.night
      ? { text: "Yes", styles: { textColor: [22, 163, 74] as [number, number, number] } }
      : { text: "No", styles: { textColor: [220, 38, 38] as [number, number, number] } },
  }));

  autoTable(doc, {
    startY: 22,
    head: [["Date", "Morning", "Noon", "Night"]],
    body: rows.map((r) => [r.date, r.morning, r.noon, r.night]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [68, 65, 204] },
    didParseCell(data) {
      const raw = data.cell.raw as unknown;
      if (raw && typeof raw === "object" && "styles" in raw && "text" in raw) {
        const typedRaw = raw as {
          styles: { textColor: [number, number, number] };
          text: string;
        };
        data.cell.styles.textColor = typedRaw.styles.textColor;
        data.cell.styles.fontStyle = "bold";
        data.cell.text = [typedRaw.text];
      }
    },
  });

  const filename = `attendance-${year}-${String(month + 1).padStart(2, "0")}.pdf`;
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function MealCell({ present }: { present: boolean }) {
  return (
    <span
      className={`text-sm font-semibold ${present ? "text-emerald-600" : "text-red-600"}`}
    >
      {present ? "Yes" : "No"}
    </span>
  );
}

type StudentMonthDetailsProps = {
  year: number;
  month: number;
  records: AttendanceRecord[];
  onBack: () => void;
};

export default function StudentMonthDetails({
  year,
  month,
  records,
  onBack,
}: StudentMonthDetailsProps) {
  const monthLabel = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const rows = buildMonthRows(year, month, records);

  return (
    <section className="animate-in fade-in duration-300">
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition active:scale-[0.98] hover:bg-gray-50"
        >
          Back to Calendar
        </button>
        <button
          type="button"
          onClick={() => exportMonthToPdf(year, month, records)}
          className="rounded-2xl bg-[var(--mh-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:opacity-95"
        >
          Export to PDF
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="mh-section-title">{monthLabel}</h3>
          <p className="mt-0.5 text-xs text-gray-500">Daily meal attendance</p>
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--mh-primary-soft)]">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--mh-primary)]">
                  Date
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-[var(--mh-primary)]">
                  Morning
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-[var(--mh-primary)]">
                  Noon
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-[var(--mh-primary)]">
                  Night
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ date, meals }) => (
                <tr key={date} className="border-t border-gray-50">
                  <td className="whitespace-nowrap px-3 py-2 text-gray-800">{date}</td>
                  <td className="px-3 py-2 text-center">
                    <MealCell present={meals.morning} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <MealCell present={meals.noon} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <MealCell present={meals.night} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
