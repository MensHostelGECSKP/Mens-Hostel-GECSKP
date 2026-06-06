"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import StudentDashboard from "@/components/student/StudentDashboard";
import { useAuth, useCurrentUser } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";

function DashboardContent() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();
  const user = useCurrentUser();

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isLoggedIn && window.location.pathname === "/login") {
        event.preventDefault();
        router.replace("/dashboard");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isLoggedIn, router]);

  if (loading) {
    return <Spinner className="min-h-[50vh]" />;
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  return <StudentDashboard />;
}

export default function DashboardPage() {
  const { user } = useAuth();
  return <DashboardContent key={user?.userId || "no-user"} />;
}
