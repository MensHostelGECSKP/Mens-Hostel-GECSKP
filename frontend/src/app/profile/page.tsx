"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import StudentProfile from "@/components/profile/StudentProfile";
import AdminProfile from "@/components/profile/AdminProfile";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [loading, isLoggedIn, router]);

  if (loading) {
    return <Spinner className="min-h-[50vh]" />;
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  if (user.role === "admin") {
    return <AdminProfile user={user} />;
  }

  return <StudentProfile user={user} />;
}
