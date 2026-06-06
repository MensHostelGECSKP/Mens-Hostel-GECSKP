"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { HiExclamationTriangle, HiArrowPath, HiHome } from "react-icons/hi2";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--mh-surface)] px-4 text-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 p-8 flex flex-col items-center">
        
        {/* Error Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-sm border border-red-100 mb-6">
          <HiExclamationTriangle className="h-8 w-8" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
          Something went wrong
        </h1>
        
        {/* Subtitle */}
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          An unexpected application error occurred. We have logged this issue and are working to resolve it.
        </p>

        {/* Technical Info (Collapsible / muted) */}
        {error && (
          <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left mb-8 max-h-32 overflow-y-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Error details
            </span>
            <span className="text-xs font-mono text-gray-600 break-words leading-normal block">
              {error.message || "Unknown error"}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            onClick={reset}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--mh-primary)] px-4 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:opacity-95"
          >
            <HiArrowPath className="h-4.5 w-4.5" />
            <span>Try Again</span>
          </button>
          
          <Link
            href="/dashboard"
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition active:scale-[0.98] hover:bg-gray-50"
          >
            <HiHome className="h-4.5 w-4.5 text-gray-400" />
            <span>Return Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
