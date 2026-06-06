"use client";

import React from "react";
import { HiUsers } from "react-icons/hi2";
import { AdminOverviewSkeleton } from "./AdminSkeleton";

type AdminOverviewCardProps = {
  count: number;
  loading?: boolean;
};

export default function AdminOverviewCard({ count, loading = false }: AdminOverviewCardProps) {
  if (loading) return <AdminOverviewSkeleton />;

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)]"
      aria-label={`Total residents: ${count}`}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gray-100/80"
        aria-hidden
      />
      <div className="relative flex flex-col gap-1">
        <div
          className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mh-primary-soft)] text-[var(--mh-primary)]"
          aria-hidden
        >
          <HiUsers className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-gray-500">Total Residents</p>
        <p className="text-4xl font-bold tabular-nums tracking-tight text-gray-900">
          {count}
        </p>
      </div>
    </section>
  );
}
