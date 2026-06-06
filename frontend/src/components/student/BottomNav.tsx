"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiHome, HiBell, HiUser } from "react-icons/hi2";
import { MdRestaurant } from "react-icons/md";
import { getActiveBottomNavTab } from "@/utils/bottomNav";
import { motion } from "framer-motion";

const tabs = [
  { href: "/dashboard", label: "Home", icon: HiHome, key: "home" },
  { href: "/mess-bill", label: "Mess", icon: MdRestaurant, key: "mess" },
  { href: "/notifications", label: "Notifications", icon: HiBell, key: "notifications" },
  { href: "/profile", label: "Profile", icon: HiUser, key: "profile" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const activeTab = getActiveBottomNavTab(pathname);
  const [optimisticTab, setOptimisticTab] = useState<string | null>(activeTab);

  // Sync state with router pathname changes (e.g. back button navigations)
  useEffect(() => {
    setOptimisticTab(activeTab);
  }, [activeTab]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(15,23,42,0.06)] backdrop-blur-md md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pt-1.5 pb-1">
        {tabs.map(({ href, label, icon: Icon, key }) => {
          const active = optimisticTab === key;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOptimisticTab(key)}
              className={`relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 transition-all duration-150 ease-out active:scale-[0.95] ${
                active ? "text-[var(--mh-primary)]" : "text-gray-400"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-x-0.5 inset-y-0.5 rounded-2xl bg-[var(--mh-primary-soft)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  aria-hidden
                />
              )}
              <motion.div
                animate={{ scale: active ? 1.12 : 1 }}
                transition={{ duration: 0.15 }}
                className="relative z-10"
              >
                <Icon
                  className={`h-[22px] w-[22px] transition-colors duration-150 ${
                    active ? "text-[var(--mh-primary)]" : "text-gray-400"
                  }`}
                  aria-hidden
                />
              </motion.div>
              <span
                className={`relative z-10 mh-nav-label transition-colors duration-150 ${
                  active ? "mh-nav-label-active font-semibold text-[var(--mh-primary)]" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

