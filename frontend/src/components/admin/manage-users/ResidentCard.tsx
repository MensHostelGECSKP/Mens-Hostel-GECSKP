"use client";

import React from "react";
import type { User } from "@/types";
import {
  getAvatarPalette,
  getDisplayUsername,
  getUserInitials,
  getUserStatus,
  formatRoomLabel,
  formatYearLabel,
} from "@/utils/userDisplay";
import { HiBuildingOffice2, HiAcademicCap } from "react-icons/hi2";
import UserActionsMenu, { type UserMenuAction } from "./UserActionsMenu";

export type { UserMenuAction as ResidentMenuAction };

type ResidentCardProps = {
  user: User;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onAction: (action: UserMenuAction, user: User) => void;
};

function StatusBadge({ status }: { status: ReturnType<typeof getUserStatus> }) {
  const styles =
    status === "active"
      ? "bg-emerald-50 text-emerald-700"
      : status === "inactive"
        ? "bg-gray-100 text-gray-600"
        : "bg-red-50 text-red-700";

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`mh-badge shrink-0 rounded-full px-2.5 py-0.5 font-semibold ${styles}`}>
      {label}
    </span>
  );
}

export default function ResidentCard({
  user,
  menuOpen,
  onMenuOpenChange,
  onAction,
}: ResidentCardProps) {
  const initials = getUserInitials(user.name);
  const palette = getAvatarPalette(user.userId || user.email);
  const username = getDisplayUsername(user);
  const room = formatRoomLabel(user.roomNumber);
  const year = formatYearLabel(user.yearOfStudy);
  const status = getUserStatus(user);

  return (
    <article className="relative flex gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ backgroundColor: palette.bg, color: palette.text }}
        aria-hidden
      >
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-bold leading-snug text-gray-900">{user.name}</h3>
            <p className="truncate text-xs text-gray-500">{username}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {room ? (
            <span className="mh-badge inline-flex items-center gap-1 rounded-full bg-[var(--mh-primary-soft)] px-2.5 py-1 font-medium text-[var(--mh-primary)]">
              <HiBuildingOffice2 className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              {room}
            </span>
          ) : (
            <span className="mh-badge rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-500">
              No room
            </span>
          )}
          {year ? (
            <span className="mh-badge inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700">
              <HiAcademicCap className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              {year}
            </span>
          ) : null}
        </div>
      </div>

      <UserActionsMenu
        user={user}
        open={menuOpen}
        onOpenChange={onMenuOpenChange}
        onAction={onAction}
      />
    </article>
  );
}
