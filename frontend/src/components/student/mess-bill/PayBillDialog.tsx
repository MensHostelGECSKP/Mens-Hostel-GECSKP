"use client";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useModalLayer } from "@/components/admin/manage-users/useModalLayer";
import { formatBillMonthLabel } from "@/utils/messBillDisplay";
import type { MessBill } from "@/types";

type PayBillDialogProps = {
  bill: MessBill | null;
  open: boolean;
  onClose: () => void;
};

export default function PayBillDialog({
  bill,
  open,
  onClose,
}: PayBillDialogProps) {
  const mounted = useModalLayer(open);
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !bill || !mounted) return null;

  const label = formatBillMonthLabel(bill.month, bill.year);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={trapRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pay-bill-title"
        aria-describedby="pay-bill-desc"
        className="relative z-10 w-full max-w-sm animate-in fade-in rounded-2xl bg-white p-5 shadow-[0_12px_48px_rgba(15,23,42,0.18)]"
      >
        <h2 id="pay-bill-title" className="text-lg font-bold text-gray-900">
          Pay Mess Bill
        </h2>
        <p id="pay-bill-desc" className="mt-2 text-sm leading-relaxed text-gray-600">
          You will be redirected to SBI Collect to complete your mess bill payment.
        </p>

        <p className="mt-3 text-sm font-semibold text-[var(--mh-primary)]">{label}</p>

        <div className="mt-4 rounded-xl bg-gray-50 p-3.5 border border-gray-100/80 text-sm">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payee</span>
          <span className="block mt-1 font-bold text-gray-800 leading-tight">Staff Hostel</span>
          <span className="block text-xs text-gray-600 mt-1 leading-normal">
            Government Engineering College Sreekrishnapuram
          </span>
        </div>

        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
          💡 After completing payment on SBI Collect, return here and mark your bill as paid to stop reminder notifications.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 active-press hover:bg-gray-50"
          >
            Cancel
          </button>
          <a
            href="https://onlinesbi.sbi.bank.in/sbicollect/icollecthome.htm?saralID=-918004880"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="min-h-[44px] flex-1 flex items-center justify-center rounded-xl bg-[var(--mh-primary)] text-sm font-semibold text-white active-press hover:opacity-95 text-center px-3"
          >
            Go to SBI Collect
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
