"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, Dispatch, SetStateAction } from "react";
import { useAuth } from "../context/AuthContext";
import {
  HiHome,
  HiBell,
  HiUser,
  HiClipboardDocumentList,
  HiArrowRightOnRectangle,
  HiDocumentText,
  HiUserPlus,
  HiUsers,
  HiCog6Tooth,
  HiArrowLeftOnRectangle,
  HiInformationCircle,
  HiSparkles,
} from "react-icons/hi2";
import { MdRestaurant } from "react-icons/md";
import { appConfig } from "../constants/appConfig";

const navLinks = [
  { href: "/", label: "Home", icon: HiHome },
  { href: "/login", label: "Mess Login", hideWhenLoggedIn: true, icon: HiArrowLeftOnRectangle },
  { href: "/dashboard", label: "Dashboard", showWhenLoggedIn: true, icon: MdRestaurant },
  { href: "/mess-bill", label: "Mess Bill", icon: HiDocumentText },
  { href: "/rules", label: "Rules", icon: HiClipboardDocumentList },
  { href: "/notifications", label: "Notifications", icon: HiBell },
  { href: "/whats-new", label: "What's New", icon: HiSparkles },
  { href: "/about", label: "About MH App", icon: HiInformationCircle },
];

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  /** Student desktop: slim nav aligned with bottom tabs */
  studentMode?: boolean;
  /** Admin desktop: slim nav aligned with bottom tabs */
  adminMode?: boolean;
};

const studentDesktopLinks = [
  { href: "/", label: "Home", icon: HiHome },
  { href: "/dashboard", label: "Mess", icon: MdRestaurant },
  { href: "/mess-bill", label: "Bills", icon: HiDocumentText },
  { href: "/notifications", label: "Notifications", icon: HiBell },
  { href: "/rules", label: "Rules", icon: HiClipboardDocumentList },
  { href: "/profile", label: "Profile", icon: HiUser },
  { href: "/whats-new", label: "What's New", icon: HiSparkles },
  { href: "/about", label: "About", icon: HiInformationCircle },
];

const adminDesktopLinks = [
  { href: "/", label: "Public Home", icon: HiHome },
  { href: "/dashboard", label: "Dashboard", icon: MdRestaurant },
  { href: "/dashboard/upload-mess-bill", label: "Upload Mess Bill", icon: HiDocumentText },
  { href: "/notifications", label: "Notifications", icon: HiBell },
  { href: "/profile", label: "Profile", icon: HiUser },
  { href: "/dashboard/manage-users", label: "Manage Users", icon: HiUsers },
  { href: "/dashboard/create-user", label: "Create User", icon: HiUserPlus },
  { href: "/dashboard/monthly-report", label: "Monthly Report", icon: HiDocumentText },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: HiClipboardDocumentList },
  { href: "/whats-new", label: "What's New", icon: HiSparkles },
  { href: "/about", label: "About", icon: HiInformationCircle },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen, studentMode = false, adminMode = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, loading, logout } = useAuth();

  useEffect(() => {
    // This effect can be used for other side-effects if needed,
    // but the mounted state is no longer required for visibility control.
  }, []);

  if (loading) return null; // Simplified loading state check

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      {/* Overlay and Close button for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-white/80 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] w-4/5 max-w-xs md:w-56 bg-white border-r border-gray-200 flex flex-col justify-between z-40 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${studentMode || adminMode ? "md:translate-x-0 hidden md:flex" : "md:translate-x-0"}`}
      >
        <div className="flex-1 flex flex-col gap-2 mt-6 px-3 overflow-y-auto">
          {((studentMode || adminMode) && isLoggedIn
            ? adminMode
              ? adminDesktopLinks
              : studentDesktopLinks
            : navLinks
          ).map((link, idx, arr) => {
            const navLink = link as (typeof navLinks)[number];
            if (!studentMode && !adminMode) {
              if (navLink.hideWhenLoggedIn && isLoggedIn) return null;
              if (navLink.showWhenLoggedIn && !isLoggedIn) return null;
            }
            const active =
              link.href === "/"
                ? pathname === "/"
                : link.href === "/dashboard"
                ? pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <React.Fragment key={link.href}>
                <Link
                  href={link.href}
                  className={`rounded-lg px-4 py-3 font-medium text-base transition-colors text-gray-700 hover:bg-[var(--mh-primary-soft)] hover:text-[var(--mh-primary)] flex items-center gap-3 ${active ? "bg-[var(--mh-primary-soft)] text-[var(--mh-primary)] font-semibold border-l-4 border-[var(--mh-primary)]" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-[var(--mh-primary)]" : "text-gray-400"}`} />
                  <span>{link.label}</span>
                </Link>
                {idx < arr.length - 1 && <div className="h-px bg-gray-100 my-1 mx-2" />}
              </React.Fragment>
            );
          })}
        </div>
        <div className="w-full flex flex-col items-center pb-3 pt-2 border-t border-gray-100 bg-white/90">
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="w-11/12 rounded-lg px-4 py-2 font-medium text-red-600 hover:bg-red-100 hover:text-red-700 focus:bg-red-200 focus:text-red-800 transition-colors text-left mb-3 shadow-sm border border-red-200 text-base flex items-center gap-3"
              style={{ outline: "none" }}
            >
              <HiArrowRightOnRectangle className="h-5 w-5 text-red-500" aria-hidden />
              <span>Logout</span>
            </button>
          )}
          <div className="w-full text-xs leading-normal text-center px-2 select-none pt-1 text-gray-400 font-medium">
            <div>Made by {appConfig.developedBy}</div>
            <div className="text-[10px] opacity-75">{appConfig.name} v{appConfig.version}</div>
          </div>
        </div>
      </aside>
    </>
  );
}