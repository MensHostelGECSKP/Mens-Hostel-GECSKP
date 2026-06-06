"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import type { MessBill } from "@/types";
import { useDeleteMessBill } from "@/hooks/useApi";
import { formatBillMonthLabel } from "@/utils/messBillDisplay";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useModalLayer } from "@/components/admin/manage-users/useModalLayer";

type DeleteMessBillDialogProps = {
  bill: MessBill | null;
  onClose: () => void;
};

export default function DeleteMessBillDialog({ bill, onClose }: DeleteMessBillDialogProps) {
  const mounted = useModalLayer(!!bill);
  const trapRef = useFocusTrap(!!bill);
  const deleteBill = useDeleteMessBill();

  useEffect(() => {
    if (!bill) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteBill.isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bill, onClose, deleteBill.isPending]);

  if (!bill || !mounted) return null;

  const label = formatBillMonthLabel(bill.month, bill.year);

  const handleDelete = async () => {
    try {
      await deleteBill.mutateAsync(bill._id);
      toast.success("Mess bill deleted");
      onClose();
    } catch {
      toast.error("Unable to delete bill. Please try again.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={() => !deleteBill.isPending && onClose()}
      />
      <div
        ref={trapRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-bill-title"
        className="relative z-10 w-full max-w-sm animate-in fade-in rounded-2xl bg-white p-5 shadow-[0_12px_48px_rgba(15,23,42,0.18)]"
      >
        <h2 id="delete-bill-title" className="text-lg font-bold text-gray-900">
          Delete mess bill?
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          This will remove the {label} bill and its file from storage. Students will no longer see it.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteBill.isPending}
            className="min-h-[48px] flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteBill.isPending}
            className="min-h-[48px] flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-60"
          >
            {deleteBill.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
