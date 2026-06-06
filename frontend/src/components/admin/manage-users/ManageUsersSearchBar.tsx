"use client";

import React from "react";
import { HiMagnifyingGlass } from "react-icons/hi2";

type ManageUsersSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
};

export default function ManageUsersSearchBar({
  value,
  onChange,
  isSearching = false,
}: ManageUsersSearchBarProps) {
  return (
    <div className="relative">
      <HiMagnifyingGlass
        className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name, room or year..."
        className="mh-search-input w-full min-h-[48px] rounded-2xl border border-gray-200/80 bg-white py-3 pl-11 pr-10 text-[15px] text-gray-900 shadow-[0_2px_12px_rgba(0,0,0,0.04)] outline-none transition placeholder:text-gray-400 focus:border-[var(--mh-primary)]/40 focus:ring-2 focus:ring-[var(--mh-primary)]/15"
        aria-label="Search residents"
        autoComplete="off"
        enterKeyHint="search"
      />
      {isSearching && (
        <span
          className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--mh-primary)]"
          aria-hidden
        />
      )}
      {value && !isSearching && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Clear search"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
