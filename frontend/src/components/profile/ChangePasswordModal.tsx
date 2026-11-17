"use client";

import React, { useState } from "react";
import { HiLockClosed, HiEye, HiEyeSlash } from "react-icons/hi2";
import { useChangePassword } from "@/hooks/useApi";
import toast from "react-hot-toast";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const changePasswordMutation = useChangePassword();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mh-primary-soft)] text-[var(--mh-primary)]">
            <HiLockClosed className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-500">Update your account login password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[var(--mh-primary)] focus:bg-white focus:ring-1 focus:ring-[var(--mh-primary)] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showCurrent ? <HiEyeSlash className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[var(--mh-primary)] focus:bg-white focus:ring-1 focus:ring-[var(--mh-primary)] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNew ? <HiEyeSlash className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[var(--mh-primary)] focus:bg-white focus:ring-1 focus:ring-[var(--mh-primary)] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirm ? <HiEyeSlash className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={changePasswordMutation.isPending}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition active:scale-[0.98] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="flex-1 rounded-xl bg-[var(--mh-primary)] py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50 hover:opacity-95"
            >
              {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
