"use client";

import { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type AdminTopBarProps = {
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
};

export default function AdminTopBar({ setDrawerOpen }: AdminTopBarProps) {
  const { user } = useAuth();
  const initial = user?.name?.charAt(0).toUpperCase() ?? "A";

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-[var(--mh-surface)] px-4 md:hidden">
      <button
        type="button"
        className="-ml-1 flex h-11 w-11 items-center justify-center rounded-xl text-gray-700 transition active:scale-[0.96] active:bg-gray-100"
        onClick={() => setDrawerOpen((o) => !o)}
        aria-label="Open menu"
        aria-expanded={undefined}
      >
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex flex-col items-center leading-tight">
        <span className="text-[15px] font-bold tracking-tight text-[var(--mh-primary)]">
          Mens Hostel
        </span>
        <span className="text-[13px] font-semibold text-[var(--mh-primary)]/80">Admin</span>
      </div>

      <Link
        href="/profile"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--mh-primary-soft)] text-sm font-bold text-[var(--mh-primary)] ring-2 ring-white shadow-sm transition active:scale-[0.96]"
        aria-label="Profile"
      >
        {initial}
      </Link>
    </header>
  );
}
