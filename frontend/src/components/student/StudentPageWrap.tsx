"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

/** Centers and pads student sub-pages to match dashboard rhythm. */
export default function StudentPageWrap({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn || user?.role !== "student") {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto w-full max-w-lg animate-in fade-in px-4 pb-4 pt-3 duration-300 md:max-w-2xl md:px-6 md:pt-6">
      {title && (
        <h1 className="mb-4 text-xl font-bold text-gray-900 md:text-2xl">{title}</h1>
      )}
      {children}
    </div>
  );
}
