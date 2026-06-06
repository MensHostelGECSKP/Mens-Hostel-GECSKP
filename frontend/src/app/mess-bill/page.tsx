"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StudentPageWrap from "@/components/student/StudentPageWrap";
import PullToRefresh from "@/components/student/PullToRefresh";
import MessBillCard from "@/components/student/mess-bill/MessBillCard";
import MessBillsSkeleton from "@/components/student/mess-bill/MessBillsSkeleton";
import { useMessBills } from "@/hooks/useApi";

export default function MessBillPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const { data: bills = [], isLoading, error, refetch, isFetching } = useMessBills();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace("/login");
    }
    if (!authLoading && isLoggedIn && user?.role === "admin") {
      router.replace("/dashboard/upload-mess-bill");
    }
  }, [authLoading, isLoggedIn, user?.role, router]);

  const sortedBills = useMemo(
    () => [...bills].sort((a, b) => b.year - a.year || b.month - a.month),
    [bills]
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (authLoading || !isLoggedIn || user?.role === "admin") {
    return null;
  }

  return (
    <StudentPageWrap title="Bills">
      <PullToRefresh onRefresh={handleRefresh} disabled={isFetching}>
        {isLoading ? (
          <MessBillsSkeleton />
        ) : error ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <p className="text-sm font-medium text-red-600">
              {error.message || "Could not load bills"}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 text-sm font-semibold text-[var(--mh-primary)]"
            >
              Try again
            </button>
          </div>
        ) : sortedBills.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <p className="text-sm text-gray-500">No mess bills published yet.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {sortedBills.map((bill) => (
              <li key={bill._id}>
                <MessBillCard bill={bill} />
              </li>
            ))}
          </ul>
        )}
      </PullToRefresh>
    </StudentPageWrap>
  );
}
