"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useModalLayer } from "@/components/admin/manage-users/useModalLayer";
import { formatBillMonthLabel } from "@/utils/messBillDisplay";
import type { MessBill } from "@/types";

type MarkBillPaidDialogProps = {
  bill: MessBill | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
};

export default function MarkBillPaidDialog({
  bill,
  open,
  onClose,
  onConfirm,
  isPending = false,
}: MarkBillPaidDialogProps) {
  const mounted = useModalLayer(open);
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, isPending]);

  if (!open || !bill || !mounted) return null;

  const label = formatBillMonthLabel(bill.month, bill.year);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={() => !isPending && onClose()}
      />
      <div
        ref={trapRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="mark-paid-title"
        aria-describedby="mark-paid-desc"
        className="relative z-10 w-full max-w-sm animate-in fade-in rounded-2xl bg-white p-5 shadow-[0_12px_48px_rgba(15,23,42,0.18)]"
      >
        <h2 id="mark-paid-title" className="text-lg font-bold text-gray-900">
          Mark Bill as Paid?
        </h2>
        <p id="mark-paid-desc" className="mt-2 text-sm leading-relaxed text-gray-600">
          This will stop future bill reminder notifications for this bill.
        </p>
        <p className="mt-3 text-sm font-medium text-gray-800">{label}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="min-h-[48px] flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="min-h-[48px] flex-1 rounded-xl bg-[var(--mh-primary)] text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Mark as Paid"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
