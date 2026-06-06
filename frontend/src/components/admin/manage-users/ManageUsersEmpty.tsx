"use client";

import React from "react";
import Link from "next/link";
import { HiOutlineUsers } from "react-icons/hi2";

type ManageUsersEmptyProps = {
  variant: "no-residents" | "no-results";
  onClearFilters?: () => void;
};

export default function ManageUsersEmpty({
  variant,
  onClearFilters,
}: ManageUsersEmptyProps) {
  if (variant === "no-residents") {
    return (
      <div className="rounded-2xl bg-white px-6 py-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--mh-primary-soft)] text-[var(--mh-primary)]">
          <HiOutlineUsers className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="text-base font-bold text-gray-900">No residents yet</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Add your first resident or import users in bulk to get started.
        </p>
        <Link
          href="/dashboard/create-user"
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--mh-primary)] px-5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
        >
          Create first user
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white px-6 py-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
        <HiOutlineUsers className="h-7 w-7" aria-hidden />
      </span>
      <h2 className="text-base font-bold text-gray-900">No users found</h2>
      <p className="mt-1.5 text-sm text-gray-500">
        Try a different search term or adjust your filters.
      </p>
      {onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--mh-primary)] transition active:scale-[0.98]"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
