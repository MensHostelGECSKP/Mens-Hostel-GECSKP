"use client";

import React, { useState } from "react";
import type { User } from "@/types";
import { HiBuildingOffice2, HiEnvelope, HiUser, HiAcademicCap, HiArrowRightOnRectangle } from "react-icons/hi2";
import ProfileInfoRow from "./ProfileInfoRow";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, PageContainer } from "@/components/ui";

export default function StudentProfile({ user }: { user: User }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const initial = user.name?.charAt(0).toUpperCase() ?? "?";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <AppHeader
        title="My Profile"
        subtitle="Hostel resident account details"
        showMenu={true}
      />
      <PageContainer>
        <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--mh-primary-soft)] text-3xl font-bold text-[var(--mh-primary)] shadow-[0_4px_20px_rgba(93,95,239,0.15)]">
          {initial}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
        <span className="mt-1 rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-600">
          Student
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <ProfileInfoRow icon={<HiUser className="h-5 w-5" />} label="Full name" value={user.name} />
        <ProfileInfoRow icon={<HiEnvelope className="h-5 w-5" />} label="Email" value={user.email} />
        <ProfileInfoRow
          icon={<HiBuildingOffice2 className="h-5 w-5" />}
          label="Room"
          value={user.roomNumber ? `Room ${user.roomNumber}` : ""}
        />
        <ProfileInfoRow
          icon={<HiAcademicCap className="h-5 w-5" />}
          label="Year of study"
          value={user.yearOfStudy ? `Year ${user.yearOfStudy}` : ""}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowLogoutConfirm(true)}
        className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white text-sm font-semibold text-red-600 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition active:scale-[0.96] hover:bg-red-50 disabled:opacity-60"
      >
        <HiArrowRightOnRectangle className="h-5 w-5" aria-hidden />
        Log out
      </button>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="presentation">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => !loggingOut && setShowLogoutConfirm(false)}
            aria-hidden
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="relative z-10 w-full max-w-sm animate-in fade-in rounded-2xl bg-white p-5 shadow-[0_12px_48px_rgba(15,23,42,0.18)]"
          >
            <h2 id="logout-title" className="text-lg font-bold text-gray-900">
              Confirm Logout
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to log out of your account?
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="min-h-[48px] flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="min-h-[48px] flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-gray-400">
        Password change coming soon. Contact the office for account updates.
      </p>
    </PageContainer>
  </>
);
}
