"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type FilterSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function FilterSheet({ open, title, onClose, children }: FilterSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="md:hidden" role="presentation">
      <button
        type="button"
        className="mh-overlay-above-bottom-nav fixed inset-x-0 top-0 z-[55] bg-black/40 backdrop-blur-[2px]"
        aria-label="Close filter"
        onClick={onClose}
      />
      <div
        className="mh-above-bottom-nav fixed inset-x-3 z-[60] mx-auto max-h-[min(70vh,calc(100dvh-8rem-var(--mh-bottom-nav-offset,4.75rem)))] max-w-lg animate-in slide-in-from-bottom duration-200 overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(15,23,42,0.14)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
      >
        <div className="mx-auto mb-3 mt-2 h-1 w-10 rounded-full bg-gray-200" aria-hidden />
        <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3">
          <h2 id="filter-sheet-title" className="text-base font-bold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-2 text-sm font-semibold text-[var(--mh-primary)]"
          >
            Done
          </button>
        </div>
        <div className="max-h-[calc(70vh-5rem)] overflow-y-auto overscroll-contain px-2 py-2 pb-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

type FilterOptionProps = {
  label: string;
  selected: boolean;
  onSelect: () => void;
};

export function FilterOption({ label, selected, onSelect }: FilterOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-h-[48px] w-full items-center justify-between rounded-xl px-4 text-left text-[15px] transition active:scale-[0.99] ${
        selected
          ? "bg-[var(--mh-primary-soft)] font-semibold text-[var(--mh-primary)]"
          : "font-medium text-gray-800 hover:bg-gray-50"
      }`}
      aria-pressed={selected}
    >
      {label}
      {selected && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}
