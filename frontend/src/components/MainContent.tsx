"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, loading } = useAuth();
  const pathname = usePathname();
  const isMobileShell =
    !loading && isLoggedIn && (user?.role === "student" || user?.role === "admin");

  return (
    <main
      className={
        isMobileShell
          ? "min-h-screen bg-[var(--mh-surface)] pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0 md:pt-14 md:pl-56"
          : "min-h-screen bg-white pt-14 md:pl-56"
      }
    >
      <div key={pathname} className="page-transition">
        {children}
      </div>
    </main>
  );
}

