"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import { HiArrowUpTray, HiDocumentText } from "react-icons/hi2";

export default function ImportUsersPage() {
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

  return (
    <div className="mx-auto w-full max-w-lg animate-in fade-in px-4 pb-28 pt-3 duration-300 md:max-w-xl md:px-6 md:pb-8 md:pt-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3 flex min-h-[44px] items-center gap-1 text-sm font-semibold text-[var(--mh-primary)] transition active:scale-[0.98]"
      >
        ← Back
      </button>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--mh-primary-soft)] text-[var(--mh-primary)]">
          <HiArrowUpTray className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Import Users</h1>
          <p className="text-sm text-gray-500">Bulk onboarding for new batches</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <p className="text-sm leading-relaxed text-gray-600">
          For large imports (100+ residents), use the server-side Excel import script. Web upload
          will be added in a future release.
        </p>

        <div className="mt-4 flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3">
          <HiDocumentText className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              CLI command
            </p>
            <code className="mt-1 block break-all text-[13px] font-medium text-gray-800">
              node backend/scripts/bulkUserImport.js &lt;file.xlsx&gt;
            </code>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Ensure MongoDB is running and your Excel columns match the script template.
        </p>
      </div>

      <Link
        href="/dashboard/create-user"
        className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[var(--mh-primary)] text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
      >
        Create user instead
      </Link>
    </div>
  );
}
