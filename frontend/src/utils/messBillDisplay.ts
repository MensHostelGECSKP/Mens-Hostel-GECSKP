import { monthNames } from "@/constants/months";

export function formatBillMonthLabel(month: number, year: number): string {
  const name = monthNames[month - 1] ?? String(month);
  return `${name} ${year}`;
}

export function formatDueDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function isExcelBill(mimeType?: string, fileName?: string): boolean {
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel")) return true;
  return /\.(xlsx|xls)$/i.test(fileName ?? "");
}
