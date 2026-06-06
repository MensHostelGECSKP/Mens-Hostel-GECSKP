"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import type { User } from "@/types";
import { useDeleteUser } from "@/hooks/useApi";
import {
  getAvatarPalette,
  getDisplayUsername,
  getUserInitials,
} from "@/utils/userDisplay";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useModalLayer } from "./useModalLayer";

type DeleteUserDialogProps = {
  user: User | null;
  onClose: () => void;
  onDeleted?: () => void;
};

export default function DeleteUserDialog({ user, onClose, onDeleted }: DeleteUserDialogProps) {
  const mounted = useModalLayer(!!user);
  const trapRef = useFocusTrap(!!user);
  const deleteUser = useDeleteUser();

  useEffect(() => {
    if (!user) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteUser.isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user, onClose, deleteUser.isPending]);

  if (!user || !mounted) return null;

  const initials = getUserInitials(user.name);
  const palette = getAvatarPalette(user.userId || user.email);
  const username = getDisplayUsername(user);

  const handleDelete = async () => {
    try {
      await deleteUser.mutateAsync(user.userId);
      toast.success("User deleted successfully");
      onDeleted?.();
      onClose();
    } catch {
      toast.error("Unable to delete user. Please try again.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close delete dialog"
        onClick={() => !deleteUser.isPending && onClose()}
      />
      <div
        ref={trapRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        aria-describedby="delete-user-desc"
        className="relative z-10 w-full max-w-sm animate-in fade-in duration-200 rounded-2xl bg-white p-5 shadow-[0_12px_48px_rgba(15,23,42,0.18)]"
      >
        <h2 id="delete-user-title" className="text-lg font-bold text-gray-900">
          Delete user?
        </h2>
        <p id="delete-user-desc" className="mt-2 text-sm leading-relaxed text-gray-600">
          Are you sure you want to permanently delete this user? This action cannot be undone.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: palette.bg, color: palette.text }}
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{username}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteUser.isPending}
            className="min-h-[48px] flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteUser.isPending}
            className="min-h-[48px] flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleteUser.isPending ? "Deleting…" : "Delete user"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
