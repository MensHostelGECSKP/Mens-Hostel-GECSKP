"use client";

import React, { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useModalLayer } from "@/components/admin/manage-users/useModalLayer";

const CONFIRM_PHRASE = "RESET_DATABASE";

type YearEndResetConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isResetting: boolean;
};

const removedItems = [
  "All residents",
  "Attendance records",
  "Mess cut records",
  "Room assignments",
  "Notifications",
  "Mess bills and payment records",
] as const;

export default function YearEndResetConfirmDialog({
  open,
  onClose,
  onConfirm,
  isResetting,
}: YearEndResetConfirmDialogProps) {
  const mounted = useModalLayer(open);
  const trapRef = useFocusTrap(open);
  const inputId = useId();
  const [phrase, setPhrase] = useState("");

  const phraseMatches = phrase === CONFIRM_PHRASE;
  const canSubmit = phraseMatches && !isResetting;

  useEffect(() => {
    if (!open) {
      setPhrase("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isResetting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, isResetting]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close reset confirmation"
        onClick={() => !isResetting && onClose()}
        disabled={isResetting}
      />
      <div
        ref={trapRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="year-end-reset-dialog-title"
        aria-describedby="year-end-reset-dialog-desc"
        className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-[0_12px_48px_rgba(15,23,42,0.2)] sm:max-w-md sm:rounded-2xl"
      >
        <h2 id="year-end-reset-dialog-title" className="text-lg font-bold text-gray-900">
          Reset Academic Year?
        </h2>
        <p id="year-end-reset-dialog-desc" className="mt-2 text-sm leading-relaxed text-gray-600">
          This will permanently remove:
        </p>

        <ul className="mt-3 space-y-1.5 text-sm text-gray-700" aria-label="Data to be removed">
          {removedItems.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 font-bold text-red-600" aria-hidden>
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-sm text-gray-600">
          The system will return to a fresh state ready for new admissions.
          <strong className="mt-1 block font-semibold text-red-700">
            This action cannot be undone.
          </strong>
        </p>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
          <label htmlFor={inputId} className="text-sm font-medium text-gray-800">
            To continue, type:{" "}
            <span className="font-mono font-semibold text-red-700">{CONFIRM_PHRASE}</span>
          </label>
          <input
            id={inputId}
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={isResetting}
            className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 font-mono text-sm text-gray-900 outline-none ring-red-500/30 focus:border-red-400 focus:ring-2 disabled:opacity-60"
            placeholder={CONFIRM_PHRASE}
            aria-required="true"
          />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="min-h-[48px] flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canSubmit}
            className="min-h-[48px] flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResetting ? "Resetting…" : "Reset Academic Year"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
