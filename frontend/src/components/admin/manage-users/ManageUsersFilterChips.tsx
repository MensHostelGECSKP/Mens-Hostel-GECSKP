"use client";

import React from "react";
import type { ManageUsersFilters } from "@/hooks/useFilteredResidents";
import { HiChevronDown } from "react-icons/hi2";

type ChipKey = "all" | "room" | "year" | "status";

type ManageUsersFilterChipsProps = {
  totalCount: number;
  filteredCount: number;
  filters: ManageUsersFilters;
  onOpenFilter: (key: Exclude<ChipKey, "all">) => void;
  onSelectAll: () => void;
};

function chipLabel(
  key: ChipKey,
  filters: ManageUsersFilters,
  totalCount: number,
  filteredCount: number
): string {
  if (key === "all") return `All (${totalCount})`;
  if (key === "room") {
    return filters.room === "all" ? "Room" : `Room ${filters.room}`;
  }
  if (key === "year") {
    return filters.year === "all" ? "Year" : `Year ${filters.year}`;
  }
  if (filters.status === "all") return "Status";
  return filters.status.charAt(0).toUpperCase() + filters.status.slice(1);
}

export default function ManageUsersFilterChips({
  totalCount,
  filteredCount,
  filters,
  onOpenFilter,
  onSelectAll,
}: ManageUsersFilterChipsProps) {
  const chips: { key: ChipKey; active: boolean; onClick: () => void }[] = [
    {
      key: "all",
      active: filters.room === "all" && filters.year === "all" && filters.status === "all",
      onClick: onSelectAll,
    },
    {
      key: "room",
      active: filters.room !== "all",
      onClick: () => onOpenFilter("room"),
    },
    {
      key: "year",
      active: filters.year !== "all",
      onClick: () => onOpenFilter("year"),
    },
    {
      key: "status",
      active: filters.status !== "all",
      onClick: () => onOpenFilter("status"),
    },
  ];

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Filter residents"
    >
      {chips.map(({ key, active, onClick }) => {
        const isAll = key === "all";
        const label = chipLabel(key, filters, totalCount, filteredCount);
        return (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className={`inline-flex shrink-0 min-h-[40px] items-center gap-1 rounded-full border px-3.5 text-[13px] font-semibold transition active:scale-[0.98] ${
              isAll
                ? active
                  ? "border-[var(--mh-primary)] bg-[var(--mh-primary-soft)] text-[var(--mh-primary)]"
                  : "border-gray-200 bg-white text-gray-600"
                : active
                  ? "border-[var(--mh-primary)] bg-white text-[var(--mh-primary)]"
                  : "border-gray-200 bg-white text-gray-600"
            }`}
            aria-pressed={isAll ? active : active}
          >
            {label}
            {!isAll && <HiChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />}
          </button>
        );
      })}
      {filteredCount !== totalCount && (
        <span className="flex shrink-0 items-center px-1 text-xs font-medium text-gray-400">
          {filteredCount} shown
        </span>
      )}
    </div>
  );
}
