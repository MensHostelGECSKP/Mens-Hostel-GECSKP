"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  HiHome,
  HiBell,
  HiUser,
  HiClipboardDocumentList,
  HiArrowRightOnRectangle,
  HiDocumentText,
  HiInformationCircle,
} from "react-icons/hi2";
import { appConfig } from "../../constants/appConfig";
import { MdRestaurant } from "react-icons/md";

type StudentDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const links = [
  { href: "/", label: "Home", icon: HiHome },
  { href: "/dashboard", label: "Mess", icon: MdRestaurant },
  { href: "/mess-bill", label: "Bills", icon: HiDocumentText },
  { href: "/notifications", label: "Notifications", icon: HiBell },
  { href: "/rules", label: "Rules", icon: HiClipboardDocumentList },
  { href: "/profile", label: "Profile", icon: HiUser },
  { href: "/about", label: "About", icon: HiInformationCircle },
];

export default function StudentDrawer({ open, onClose }: StudentDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    onClose();
    await logout();
    router.push("/login");
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] md:hidden"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed left-0 top-0 z-[70] flex h-full w-[min(280px,85vw)] flex-col bg-white shadow-xl md:hidden animate-in slide-in-from-left duration-200"
        role="dialog"
        aria-label="Menu"
      >
        <div className="flex h-14 items-center border-b border-gray-100 px-4">
          <span className="font-bold text-[var(--mh-primary)]">Menu</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const active =
              link.href === "/"
                ? pathname === "/"
                : link.href === "/dashboard"
                ? pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                  active
                    ? "bg-[var(--mh-primary-soft)] text-[var(--mh-primary)]"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    active ? "text-[var(--mh-primary)]" : "text-gray-400"
                  }`}
                  aria-hidden
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-100 p-3 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left font-medium text-red-600 transition hover:bg-red-50 active:scale-[0.99]"
          >
            <HiArrowRightOnRectangle className="h-5 w-5 text-red-500" aria-hidden />
            <span>Logout</span>
          </button>
          <div className="w-full text-xs leading-normal text-center px-2 select-none pt-1 text-gray-400 font-medium">
            <div>Made by {appConfig.developedBy}</div>
            <div className="text-[10px] opacity-75">{appConfig.name} v{appConfig.version}</div>
          </div>
        </div>
      </aside>
    </>
  );
}
