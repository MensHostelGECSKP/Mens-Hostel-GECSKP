"use client";

import React from "react";
import type { User } from "@/types";
import { HiBuildingOffice2, HiEnvelope, HiUser, HiAcademicCap } from "react-icons/hi2";
import ProfileInfoRow from "./ProfileInfoRow";

export default function StudentProfile({ user }: { user: User }) {
  const initial = user.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="mx-auto w-full max-w-lg animate-in fade-in px-4 pb-6 pt-4 duration-300 md:max-w-xl md:px-6">
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

      <p className="mt-8 text-center text-xs text-gray-400">
        Password change coming soon. Contact the office for account updates.
      </p>
    </div>
  );
}
