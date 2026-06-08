"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ManageUsersView from "@/components/admin/manage-users/ManageUsersView";
import { ManageUsersPageSkeleton } from "@/components/admin/manage-users/ManageUsersSkeleton";

export default function ManageUsersPage() {
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
    return <ManageUsersPageSkeleton />;
  }

  if (!isLoggedIn || user?.role !== "admin") {
    return null;
  }

  return <ManageUsersView />;
}
