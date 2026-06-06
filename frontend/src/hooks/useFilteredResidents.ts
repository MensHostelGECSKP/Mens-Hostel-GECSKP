"use client";

import { useDeferredValue, useMemo } from "react";
import type { User } from "@/types";
import { getUserStatus, normalizeYearValue } from "@/utils/userDisplay";

export type RoomFilter = "all" | string;
export type YearFilter = "all" | string;
export type StatusFilter = "all" | "active" | "inactive" | "blocked";

export type ManageUsersFilters = {
  room: RoomFilter;
  year: YearFilter;
  status: StatusFilter;
};

const DEFAULT_FILTERS: ManageUsersFilters = {
  room: "all",
  year: "all",
  status: "all",
};

function matchesSearch(user: User, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const emailLocal = user.email.split("@")[0]?.toLowerCase() ?? "";
  const room = user.roomNumber?.toLowerCase() ?? "";
  const year = user.yearOfStudy?.toLowerCase() ?? "";
  return (
    user.name.toLowerCase().includes(q) ||
    emailLocal.includes(q) ||
    user.email.toLowerCase().includes(q) ||
    room.includes(q) ||
    year.includes(q) ||
    `year ${year}`.includes(q) ||
    `room ${room}`.includes(q)
  );
}

export function useFilteredResidents(
  users: User[],
  search: string,
  filters: ManageUsersFilters = DEFAULT_FILTERS
) {
  const deferredSearch = useDeferredValue(search);

  const students = useMemo(
    () => users.filter((u) => u.role === "student"),
    [users]
  );

  const roomOptions = useMemo(() => {
    const rooms = new Set<string>();
    for (const u of students) {
      const r = u.roomNumber?.trim();
      if (r) rooms.add(r);
    }
    return Array.from(rooms).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    for (const u of students) {
      const y = normalizeYearValue(u.yearOfStudy);
      if (y) years.add(y);
    }
    return Array.from(years).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
  }, [students]);

  const filtered = useMemo(() => {
    return students.filter((user) => {
      if (!matchesSearch(user, deferredSearch)) return false;
      if (filters.room !== "all" && (user.roomNumber?.trim() ?? "") !== filters.room) {
        return false;
      }
      if (filters.year !== "all" && normalizeYearValue(user.yearOfStudy) !== filters.year) {
        return false;
      }
      if (filters.status !== "all" && getUserStatus(user) !== filters.status) {
        return false;
      }
      return true;
    });
  }, [students, deferredSearch, filters]);

  const isSearchPending = search !== deferredSearch;

  return {
    students,
    filtered,
    roomOptions,
    yearOptions,
    isSearchPending,
    totalCount: students.length,
    filteredCount: filtered.length,
  };
}
