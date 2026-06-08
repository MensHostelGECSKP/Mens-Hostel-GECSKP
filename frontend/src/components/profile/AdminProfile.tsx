"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, PageContainer } from "@/components/ui";
import { getAvatarPalette, getUserInitials } from "@/utils/userDisplay";
import {
  HiEnvelope,
  HiUser,
  HiShieldCheck,
  HiUsers,
  HiUserPlus,
  HiArrowRightOnRectangle,
  HiChevronRight,
  HiHome,
  HiCog6Tooth,
  HiInformationCircle,
  HiBell,
} from "react-icons/hi2";
import ProfileInfoRow from "./ProfileInfoRow";

const quickLinks = [
  {
    href: "/dashboard",
    label: "Admin dashboard",
    description: "Overview & daily tools",
    icon: HiHome,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    href: "/dashboard/manage-users",
    label: "Manage users",
    description: "Residents & accounts",
    icon: HiUsers,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
  },
  {
    href: "/dashboard/create-user",
    label: "Create user",
    description: "Add a new resident",
    icon: HiUserPlus,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    href: "/profile/notification-settings",
    label: "Notification settings",
    description: "Manage pushes & alerts",
    icon: HiBell,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    description: "System management & tools",
    icon: HiCog6Tooth,
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
  },
  {
    href: "/about",
    label: "About MH App",
    description: "App info, changelogs, & features",
    icon: HiInformationCircle,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
] as const;

export default function AdminProfile({ user }: { user: User }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = getUserInitials(user.name);
  const palette = getAvatarPalette(user.userId || user.email);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <AppHeader
        title="Admin Profile"
        subtitle="Hostel administrator account details"
        showMenu={true}
      />
      <PageContainer>
        <div className="mb-6 flex flex-col items-center text-center">
        <div
          className="mb-3 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold shadow-[0_4px_20px_rgba(68,65,204,0.15)]"
          style={{ backgroundColor: palette.bg, color: palette.text }}
        >
          {initials}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
        <span className="mt-1 rounded-full bg-[var(--mh-primary-soft)] px-3 py-0.5 text-xs font-semibold text-[var(--mh-primary)]">
          Administrator
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <ProfileInfoRow icon={<HiUser className="h-5 w-5" />} label="Full name" value={user.name} />
        <ProfileInfoRow icon={<HiEnvelope className="h-5 w-5" />} label="Email" value={user.email} />
        <ProfileInfoRow icon={<HiShieldCheck className="h-5 w-5" />} label="Role" value="Admin" />
      </div>

      <section className="mt-6" aria-label="Quick links">
        <h2 className="mb-2.5 px-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Quick links
        </h2>
        <ul className="flex flex-col gap-2">
          {quickLinks.map(({ href, label, description, icon: Icon, iconBg, iconColor }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition active:scale-[0.96] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                  aria-hidden
                >
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-semibold text-gray-900">{label}</span>
                  <span className="block text-xs text-gray-500">{description}</span>
                </span>
                <HiChevronRight className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white text-sm font-semibold text-red-600 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition active:scale-[0.96] hover:bg-red-50 disabled:opacity-60"
      >
        <HiArrowRightOnRectangle className="h-5 w-5" aria-hidden />
        {loggingOut ? "Signing out…" : "Log out"}
      </button>

      <p className="mt-6 text-center text-xs text-gray-400">
        Password change coming soon. Contact the system maintainer for account updates.
      </p>
    </PageContainer>
  </>
);
}
