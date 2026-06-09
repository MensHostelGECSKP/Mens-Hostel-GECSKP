"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineExternalLink, HiOutlineDocumentDownload, HiOutlineCreditCard } from "react-icons/hi";
import type { MessBill } from "@/types";
import { formatBillMonthLabel, formatDueDate, isExcelBill } from "@/utils/messBillDisplay";
import { useUpdateMessBillPayment } from "@/hooks/useApi";
import { api } from "@/utils/api";
import MarkBillPaidDialog from "./MarkBillPaidDialog";
import PayBillDialog from "./PayBillDialog";

type MessBillCardProps = {
  bill: MessBill;
};

export default function MessBillCard({ bill }: MessBillCardProps) {
  const updatePayment = useUpdateMessBillPayment();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const isPaid = bill.paymentStatus?.isPaid ?? false;
  const label = formatBillMonthLabel(bill.month, bill.year);
  const [fileLoading, setFileLoading] = useState<"view" | "download" | null>(null);

  const openBillFile = async (mode: "view" | "download") => {
    const endpoint = mode === "view" ? bill.fileUrl : bill.downloadUrl;
    const excel = isExcelBill(bill.mimeType, bill.fileName);
    setFileLoading(mode);
    try {
      const access = await api.getBillFileAccess(endpoint);
      if (access.error) {
        toast.error(access.error);
        return;
      }

      const fileUrl =
        access.url ||
        (access.blob ? URL.createObjectURL(access.blob) : null);

      if (!fileUrl) {
        toast.error("Could not open the bill. Please try again.");
        return;
      }

      if (mode === "view" && !excel) {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      } else {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = bill.fileName || "mess-bill";
        link.rel = "noopener noreferrer";
        link.click();
      }

      if (access.blob) {
        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
      }
    } catch {
      toast.error("Could not open the bill. Please try again.");
    } finally {
      setFileLoading(null);
    }
  };

  const handleMarkPaid = async () => {
    try {
      await updatePayment.mutateAsync({ billId: bill._id, isPaid: true });
      toast.success("Marked as paid");
      setConfirmOpen(false);
    } catch {
      toast.error("Could not update status. Please try again.");
    }
  };

  const handleMarkUnpaid = async () => {
    try {
      await updatePayment.mutateAsync({ billId: bill._id, isPaid: false });
      toast.success("Marked as unpaid");
    } catch {
      toast.error("Could not update status. Please try again.");
    }
  };

  return (
    <article className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-900">{label}</h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isPaid
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {isPaid ? "Paid ✓" : "Unpaid"}
        </span>
      </div>

      <dl className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Due Date</dt>
          <dd className="font-medium text-gray-900">{formatDueDate(bill.dueDate)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Status</dt>
          <dd className="font-medium text-gray-900">
            {isPaid ? "Marked as Paid" : "Unpaid"}
          </dd>
        </div>
      </dl>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => openBillFile("view")}
          disabled={fileLoading !== null}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--mh-primary)]/30 bg-[var(--mh-primary-soft)] text-sm font-semibold text-[var(--mh-primary)] disabled:opacity-50"
        >
          <HiOutlineExternalLink className="h-5 w-5" />
          {fileLoading === "view" ? "Opening…" : "View Bill"}
        </button>
        <button
          type="button"
          onClick={() => openBillFile("download")}
          disabled={fileLoading !== null}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--mh-primary)] text-sm font-semibold text-white disabled:opacity-50"
        >
          <HiOutlineDocumentDownload className="h-5 w-5" />
          {fileLoading === "download" ? "Downloading…" : "Download Bill"}
        </button>
      </div>

      {isPaid ? (
        <div className="space-y-3">
          <div className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-700">
            Paid ✓
          </div>
          <button
            type="button"
            onClick={handleMarkUnpaid}
            disabled={updatePayment.isPending}
            className="w-full text-center text-sm font-medium text-gray-500 underline-offset-2 hover:text-[var(--mh-primary)] hover:underline disabled:opacity-50"
          >
            Mark as Unpaid
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {bill.status === "unpaid" && (
            <button
              type="button"
              onClick={() => setPayOpen(true)}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--mh-primary)] text-sm font-semibold text-white active-press"
            >
              <HiOutlineCreditCard className="h-5 w-5" />
              Pay Bill
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-50 active-press"
          >
            Mark as Paid
          </button>
        </div>
      )}

      <MarkBillPaidDialog
        bill={bill}
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleMarkPaid}
        isPending={updatePayment.isPending}
      />

      <PayBillDialog
        bill={bill}
        open={payOpen}
        onClose={() => setPayOpen(false)}
      />
    </article>
  );
}
