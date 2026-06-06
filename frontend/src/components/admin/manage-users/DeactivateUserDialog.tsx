"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import type { User } from "@/types";
import { useUpdateUser } from "@/hooks/useApi";
import { normalizeYearValue } from "@/utils/userDisplay";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useModalLayer } from "./useModalLayer";

type DeactivateUserDialogProps = {
  user: User | null;
  onClose: () => void;
  onDeactivated?: (user: User) => void;
};

export default function DeactivateUserDialog({
  user,
  onClose,
  onDeactivated,
}: DeactivateUserDialogProps) {
  const mounted = useModalLayer(!!user);
  const trapRef = useFocusTrap(!!user);
  const updateUser = useUpdateUser();

  useEffect(() => {
    if (!user) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !updateUser.isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user, onClose, updateUser.isPending]);

  if (!user || !mounted) return null;

  const handleDeactivate = async () => {
    const year = normalizeYearValue(user.yearOfStudy) || "1";
    try {
      const updated = await updateUser.mutateAsync({
        userId: user.userId,
        name: user.name,
        email: user.email,
        roomNumber: user.roomNumber ?? "",
        yearOfStudy: year,
        status: "inactive",
      });
      toast.success("User deactivated successfully");
      onDeactivated?.(updated);
      onClose();
    } catch {
      toast.error("Unable to deactivate user. Please try again.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close deactivate dialog"
        onClick={() => !updateUser.isPending && onClose()}
      />
      <div
        ref={trapRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="deactivate-user-title"
        aria-describedby="deactivate-user-desc"
        className="relative z-10 w-full max-w-sm animate-in fade-in duration-200 rounded-2xl bg-white p-5 shadow-[0_12px_48px_rgba(15,23,42,0.18)]"
      >
        <h2 id="deactivate-user-title" className="text-lg font-bold text-gray-900">
          Deactivate user?
        </h2>
        <p id="deactivate-user-desc" className="mt-2 text-sm leading-relaxed text-gray-600">
          The user will no longer be able to access the system until reactivated.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={updateUser.isPending}
            className="min-h-[48px] flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={updateUser.isPending}
            className="min-h-[48px] flex-1 rounded-xl bg-[var(--mh-primary)] text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {updateUser.isPending ? "Deactivating…" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
