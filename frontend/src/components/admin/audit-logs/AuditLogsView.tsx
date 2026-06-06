"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuditLogs, AuditLogEntry } from "@/hooks/useApi";
import { HiChevronDown, HiChevronUp, HiShieldCheck } from "react-icons/hi2";
import Spinner from "@/components/Spinner";

function LogDetailRow({ log }: { log: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false);

  // Format action text
  const formatAction = (act: string) => {
    return act
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Badge colors for actions
  const getBadgeClass = (act: string) => {
    if (act.includes("DELETE") || act.includes("FAILED")) {
      return "bg-red-50 text-red-700 border-red-100";
    }
    if (act.includes("REGISTER") || act.includes("PUBLISH") || act.includes("RESET")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  };

  const hasDetails = log.details && Object.keys(log.details).length > 0;

  return (
    <li className="border-b border-gray-100 last:border-0">
      <div 
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`flex items-center justify-between p-4 hover:bg-slate-50/50 transition cursor-pointer select-none ${expanded ? "bg-indigo-50/10" : ""}`}
      >
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${getBadgeClass(log.action)}`}>
              {formatAction(log.action)}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">{log.performedByName}</span>
            {log.ipAddress && (
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                IP: {log.ipAddress}
              </span>
            )}
          </div>
        </div>

        {hasDetails && (
          <div className="text-gray-400">
            {expanded ? (
              <HiChevronUp className="h-5 w-5" />
            ) : (
              <HiChevronDown className="h-5 w-5" />
            )}
          </div>
        )}
      </div>

      {expanded && hasDetails && (
        <div className="bg-gray-50/70 p-4 border-t border-gray-100 text-xs font-mono text-gray-700 overflow-x-auto">
          <pre className="whitespace-pre-wrap word-break-all">
            {JSON.stringify(log.details, null, 2)}
          </pre>
        </div>
      )}
    </li>
  );
}

export default function AuditLogsView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch, isFetching } = useAuditLogs(page, 25);

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (data?.pagination && page < data.pagination.pages) {
      setPage(page + 1);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg animate-in fade-in duration-300 md:max-w-xl">
      <div className="px-4 pb-2 pt-3 md:px-6 md:pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 flex min-h-[44px] items-center gap-1 text-sm font-semibold text-[var(--mh-primary)] transition active-press active:scale-[0.96]"
        >
          ← Back
        </button>
        
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
            <HiShieldCheck className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              System Audit Logs
            </h1>
            <p className="mt-0.5 text-xs font-medium text-gray-500">
              Audit trail of admin and system activities
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-28 pt-4 md:px-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-700">
            <p className="font-semibold">Could not load audit logs</p>
            <p className="mt-0.5 text-red-600/95">{error instanceof Error ? error.message : "Network error"}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 inline-flex min-h-[36px] items-center justify-center rounded-full bg-red-600 px-4 text-xs font-semibold text-white active:scale-95 active-press"
            >
              Try again
            </button>
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="rounded-3xl bg-white border border-gray-150 p-8 text-center text-gray-500 shadow-sm">
            <p className="text-sm font-medium">No audit logs found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {isFetching && (
              <p className="text-center text-xs text-gray-400 animate-pulse">Updating logs...</p>
            )}
            
            <div className="overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <ul>
                {data.logs.map((log) => (
                  <LogDetailRow key={log._id} log={log} />
                ))}
              </ul>
            </div>

            {/* Pagination Controls */}
            {data.pagination && data.pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-2 px-1">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={page === 1 || isFetching}
                  className="min-h-[38px] rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-gray-500">
                  Page {page} of {data.pagination.pages}
                </span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={page === data.pagination.pages || isFetching}
                  className="min-h-[38px] rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
