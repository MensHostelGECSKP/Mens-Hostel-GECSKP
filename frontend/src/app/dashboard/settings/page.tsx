"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import FullPageLoader from "@/components/FullPageLoader";
import SettingsView from "@/components/admin/settings/SettingsView";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        router.replace("/login");
      } else if (user?.role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [loading, isLoggedIn, user?.role, router]);

  if (loading) {
    return <FullPageLoader text="Loading settings..." />;
  }

  if (!isLoggedIn || user?.role !== "admin") {
    return null;
  }

  return <SettingsView />;
}
