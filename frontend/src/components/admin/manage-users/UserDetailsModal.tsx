"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import type { User } from "@/types";
import {
  getAvatarPalette,
  getDisplayUsername,
  getUserInitials,
  formatRoomLabel,
  formatYearLabel,
  getUserStatus,
} from "@/utils/userDisplay";
import { HiBuildingOffice2, HiAcademicCap, HiEnvelope, HiXMark } from "react-icons/hi2";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useModalLayer } from "./useModalLayer";

type UserDetailsModalProps = {
  user: User | null;
  onClose: () => void;
  onEdit: (user: User) => void;
};

function statusBadgeClass(status: ReturnType<typeof getUserStatus>) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "inactive") return "bg-gray-100 text-gray-600";
  return "bg-red-50 text-red-700";
}

export default function UserDetailsModal({ user, onClose, onEdit }: UserDetailsModalProps) {
  const mounted = useModalLayer(!!user);
  const trapRef = useFocusTrap(!!user);

  useEffect(() => {
    if (!user) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user, onClose]);

  if (!user || !mounted) return null;

  const initials = getUserInitials(user.name);
  const palette = getAvatarPalette(user.userId || user.email);
  const status = getUserStatus(user);

  return createPortal(
    <>
      <button
        type="button"
        className="mh-overlay-above-bottom-nav fixed inset-x-0 top-0 z-[55] bg-black/40 backdrop-blur-[2px] md:bottom-0"
        aria-label="Close user details"
        onClick={onClose}
      />

      <div
        ref={trapRef}
        className="mh-above-bottom-nav fixed inset-x-3 z-[60] mx-auto max-w-lg animate-in slide-in-from-bottom duration-200 rounded-2xl bg-white shadow-[0_8px_40px_rgba(15,23,42,0.14)] md:inset-x-0 md:bottom-0 md:max-w-md md:rounded-t-3xl md:rounded-b-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
      >
        <div className="flex items-center justify-end px-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <HiXMark className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 pb-3 pt-0 text-center">
          <div
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
            style={{ backgroundColor: palette.bg, color: palette.text }}
          >
            {initials}
          </div>
          <h2 id="user-detail-title" className="text-lg font-bold text-gray-900">
            {user.name}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{getDisplayUsername(user)}</p>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div className="mx-4 flex flex-col gap-2">
          <DetailRow icon={<HiEnvelope className="h-5 w-5" />} label="Email" value={user.email} />
          <DetailRow
            icon={<HiBuildingOffice2 className="h-5 w-5" />}
            label="Room"
            value={formatRoomLabel(user.roomNumber) ?? "Not assigned"}
          />
          <DetailRow
            icon={<HiAcademicCap className="h-5 w-5" />}
            label="Year"
            value={formatYearLabel(user.yearOfStudy) ?? "Not set"}
          />
        </div>

        <div className="mx-4 mb-4 mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(user);
            }}
            className="min-h-[48px] flex-1 rounded-xl bg-[var(--mh-primary)] text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] hover:opacity-95"
          >
            Edit user
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-gray-50/80 px-4 py-3.5">
      <span className="mt-0.5 text-[var(--mh-primary)]">{icon}</span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="truncate text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
