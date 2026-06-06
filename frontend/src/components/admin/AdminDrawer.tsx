"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type AdminDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const links = [
  { href: "/dashboard/create-user", label: "Create User" },
  { href: "/dashboard/manage-users", label: "Manage Users" },
  { href: "/dashboard/monthly-report", label: "Monthly Report" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/rules", label: "Rules" },
  { href: "/", label: "Public Home" },
];

export default function AdminDrawer({ open, onClose }: AdminDrawerProps) {
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
        aria-label="Admin menu"
      >
        <div className="flex h-14 items-center border-b border-gray-100 px-4">
          <span className="font-bold text-[var(--mh-primary)]">Admin Menu</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                  active
                    ? "bg-[var(--mh-primary-soft)] text-[var(--mh-primary)]"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl px-4 py-3 text-left font-medium text-red-600 transition hover:bg-red-50 active:scale-[0.99]"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
