"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import SettingsView from "@/components/admin/settings/SettingsView";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!isLoggedIn || user?.role !== "admin")) {
      router.replace("/login");
    }
  }, [loading, isLoggedIn, user?.role, router]);

  if (loading) {
    return <Spinner className="min-h-[50vh]" />;
  }

  if (!isLoggedIn || user?.role !== "admin") {
    return null;
  }

  return <SettingsView />;
}
