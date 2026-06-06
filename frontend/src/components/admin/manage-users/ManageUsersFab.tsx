"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { HiPlus, HiUserPlus, HiArrowUpTray } from "react-icons/hi2";

export default function ManageUsersFab() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted) {
    return null;
  }

  const fabContent = (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          aria-label="Close actions"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-3 md:bottom-8 md:right-8">
        {open && (
          <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Link
              href="/dashboard/import-users"
              onClick={() => setOpen(false)}
              className="flex min-h-[48px] items-center gap-2.5 rounded-2xl bg-white py-2.5 pl-4 pr-5 text-sm font-semibold text-gray-800 shadow-[0_4px_20px_rgba(15,23,42,0.12)] transition active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <HiArrowUpTray className="h-5 w-5" aria-hidden />
              </span>
              Import users
            </Link>
            <Link
              href="/dashboard/create-user"
              onClick={() => setOpen(false)}
              className="flex min-h-[48px] items-center gap-2.5 rounded-2xl bg-white py-2.5 pl-4 pr-5 text-sm font-semibold text-gray-800 shadow-[0_4px_20px_rgba(15,23,42,0.12)] transition active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--mh-primary-soft)] text-[var(--mh-primary)]">
                <HiUserPlus className="h-5 w-5" aria-hidden />
              </span>
              Create user
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-[var(--mh-primary)] text-white shadow-[0_6px_24px_rgba(68,65,204,0.45)] transition duration-200 active:scale-[0.96] ${
            open ? "rotate-45" : ""
          }`}
          aria-label={open ? "Close quick actions" : "Open quick actions"}
          aria-expanded={open}
        >
          <HiPlus className="h-7 w-7" aria-hidden />
        </button>
      </div>
    </>
  );

  return createPortal(fabContent, document.body);
}
