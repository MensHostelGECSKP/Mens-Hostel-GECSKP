"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProfileSkeleton } from "@/components/student/Skeleton";
import PullToRefresh from "@/components/student/PullToRefresh";
import StudentProfile from "@/components/profile/StudentProfile";
import AdminProfile from "@/components/profile/AdminProfile";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, loading, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [loading, isLoggedIn, router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  const profileContent = user.role === "admin" ? (
    <AdminProfile user={user} />
  ) : (
    <StudentProfile user={user} />
  );

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={refreshing}>
      {profileContent}
    </PullToRefresh>
  );
}

