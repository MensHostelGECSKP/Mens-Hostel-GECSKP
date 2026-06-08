"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import YearEndResetView from "@/components/admin/year-end-reset/YearEndResetView";

export default function YearEndResetPage() {
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
    return <Spinner className="min-h-[50vh]" />;
  }

  if (!isLoggedIn || user?.role !== "admin") {
    return null;
  }

  return <YearEndResetView />;
}
