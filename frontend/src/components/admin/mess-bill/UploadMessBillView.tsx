"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { HiArrowUpTray, HiTrash, HiDocumentText, HiBell } from "react-icons/hi2";
import { monthNames } from "@/constants/months";
import { useMessBills, usePublishMessBill, useTriggerMessBillReminders } from "@/hooks/useApi";
import type { MessBill } from "@/types";
import { formatBillMonthLabel, formatDueDate } from "@/utils/messBillDisplay";
import { Skeleton } from "@/components/student/Skeleton";
import DeleteMessBillDialog from "./DeleteMessBillDialog";
import EmptyState from "@/components/student/EmptyState";
import { AppHeader, PageContainer } from "@/components/ui";

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear + 1, currentYear - 1];

const ACCEPT = ".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

export default function UploadMessBillView() {
  const router = useRouter();
  const { data: bills = [], isLoading, refetch } = useMessBills();
  const publishBill = usePublishMessBill();
  const triggerReminders = useTriggerMessBillReminders();

  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(currentYear));
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MessBill | null>(null);

  const sortedBills = useMemo(
    () => [...bills].sort((a, b) => b.year - a.year || b.month - a.month),
    [bills]
  );

  const handleTriggerReminders = async () => {
    try {
      const res = await triggerReminders.mutateAsync();
      toast.success(res?.message || "Reminders triggered successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to trigger reminders";
      toast.error(msg);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setFormError("");
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!file) {
      setFormError("Please select a bill file (PDF or Excel).");
      return;
    }
    if (!dueDate) {
      setFormError("Please enter a due date.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("month", month);
    formData.append("year", year);
    formData.append("dueDate", dueDate);

    try {
      const result = await publishBill.mutateAsync(formData);
      if (result?.warnings?.includes("google_drive_failed_saved_locally")) {
        toast.success("Bill published (saved locally; Google Drive token expired)");
      } else if (result?.warnings?.includes("notification_failed")) {
        toast.success("Bill published, but some notifications could not be sent.");
      } else {
        toast.success("Mess bill published");
      }
      setFile(null);
      setDueDate("");
      const input = document.getElementById("bill-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to publish bill";
      if (msg === "A bill for this month already exists" || msg.includes("exists")) {
        const confirmReplace = window.confirm("A bill already exists for this month and year. Do you want to replace it?");
        if (confirmReplace) {
          formData.append("replace", "true");
          try {
            const result = await publishBill.mutateAsync(formData);
            if (result?.warnings?.includes("google_drive_failed_saved_locally")) {
              toast.success("Bill replaced (saved locally; Google Drive token expired)");
            } else if (result?.warnings?.includes("notification_failed")) {
              toast.success("Bill replaced, but some notifications could not be sent.");
            } else {
              toast.success("Mess bill replaced successfully");
            }
            setFile(null);
            setDueDate("");
            const input = document.getElementById("bill-file") as HTMLInputElement | null;
            if (input) input.value = "";
            await refetch();
          } catch (retryErr) {
            const retryMsg = retryErr instanceof Error ? retryErr.message : "Failed to replace bill";
            setFormError(retryMsg);
            toast.error(retryMsg);
          }
          return;
        }
      }
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <>
      <AppHeader
        title="Upload Mess Bill"
        subtitle="Publish the official bill file for all residents"
        showBack={true}
      />
      <PageContainer>

      <form onSubmit={handlePublish} className="mx-4 mb-6 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] md:mx-0">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
          Bill file
        </label>
        <input
          id="bill-file"
          type="file"
          accept={ACCEPT}
          onChange={handleFileChange}
          className="mb-4 w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--mh-primary-soft)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--mh-primary)] file:active-press"
        />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="bill-month" className="mb-1 block text-xs font-semibold text-gray-500">
              Month
            </label>
            <select
              id="bill-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white"
            >
              {monthNames.map((name, i) => (
                <option key={name} value={String(i + 1)}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bill-year" className="mb-1 block text-xs font-semibold text-gray-500">
              Year
            </label>
            <select
              id="bill-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white"
            >
              {years.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="bill-due" className="mb-1 block text-xs font-semibold text-gray-500">
            Due date
          </label>
          <input
            id="bill-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white"
            required
          />
        </div>

        {formError && (
          <p className="mb-3 text-sm font-medium text-red-600" role="alert">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={publishBill.isPending}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--mh-primary)] text-sm font-semibold text-white disabled:opacity-60 active-press active:scale-[0.96]"
        >
          <HiArrowUpTray className="h-5 w-5" />
          {publishBill.isPending ? "Uploading..." : "Publish"}
        </button>
      </form>

      <div className="mx-4 mb-6 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] md:mx-0 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Mess Bill Reminders</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manually dispatch due date push and in-app reminders to students.</p>
        </div>
        <button
          type="button"
          onClick={handleTriggerReminders}
          disabled={triggerReminders.isPending}
          className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--mh-primary)]/30 bg-[var(--mh-primary-soft)] px-4 text-xs font-semibold text-[var(--mh-primary)] disabled:opacity-50 active-press"
        >
          <HiBell className="h-4 w-4" />
          {triggerReminders.isPending ? "Sending..." : "Send Reminders Now"}
        </button>
      </div>

      <section className="px-4 pb-8 md:px-0" aria-label="Published bills">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
          Published bills
        </h2>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : sortedBills.length === 0 ? (
          <EmptyState
            icon={HiDocumentText}
            title="No bills published yet"
            description="Upload a new PDF or Excel mess bill file above to publish it to all hostel residents."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {sortedBills.map((bill) => (
              <li
                key={bill._id}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">
                    {formatBillMonthLabel(bill.month, bill.year)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Due {formatDueDate(bill.dueDate)} · {bill.fileName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(bill)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-red-500 hover:bg-red-50"
                  aria-label={`Delete ${formatBillMonthLabel(bill.month, bill.year)} bill`}
                >
                  <HiTrash className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DeleteMessBillDialog bill={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </PageContainer>
  </>
);
}
