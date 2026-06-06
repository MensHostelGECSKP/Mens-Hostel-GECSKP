"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import UploadMessBillView from "@/components/admin/mess-bill/UploadMessBillView";

export default function UploadMessBillPage() {
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

  return <UploadMessBillView />;
}
