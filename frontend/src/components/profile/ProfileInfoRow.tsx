"use client";

import React from "react";

export default function ProfileInfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <span className="mt-0.5 text-[var(--mh-primary)]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="truncate text-base font-semibold text-gray-900">{value || "—"}</p>
      </div>
    </div>
  );
}
