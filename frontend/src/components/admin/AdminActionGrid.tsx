"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HiUserMinus,
  HiDocumentText,
  HiBellAlert,
  HiArrowUpTray,
} from "react-icons/hi2";
import { Skeleton } from "@/components/student/Skeleton";

type ActionItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
};

const actions: ActionItem[] = [
  {
    key: "manageUser",
    label: "Manage User",
    href: "/dashboard/manage-users",
    icon: HiUserMinus,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
  },
  {
    key: "monthlyReport",
    label: "Monthly Cut Report",
    href: "/dashboard/monthly-report",
    icon: HiDocumentText,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
  },
  {
    key: "addNotification",
    label: "Add Notifications",
    href: "/notifications",
    icon: HiBellAlert,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
  {
    key: "uploadBill",
    label: "Upload Mess Bill",
    href: "/dashboard/upload-mess-bill",
    icon: HiArrowUpTray,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
  },
];

export default function AdminActionGrid() {
  const router = useRouter();
  const [loadingKey, setLoadingKey] = React.useState<string | null>(null);

  useEffect(() => {
    router.prefetch("/dashboard/manage-users");
    router.prefetch("/dashboard/monthly-report");
    router.prefetch("/notifications");
    router.prefetch("/dashboard/upload-mess-bill");
  }, [router]);

  const handleAction = (action: ActionItem) => {
    setLoadingKey(action.key);
    router.push(action.href);
  };

  return (
    <section aria-label="Quick actions">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isLoading = loadingKey === action.key;
          return (
            <button
              key={action.key}
              type="button"
              onClick={() => handleAction(action)}
              disabled={loadingKey !== null}
              className="group relative flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] active:scale-[0.98] disabled:opacity-90 md:min-h-[108px]"
              aria-label={action.label}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-12 rounded-2xl" aria-hidden />
                  <Skeleton className="h-4 w-24 rounded-lg" aria-hidden />
                  <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60">
                    <span
                      className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--mh-primary)]"
                      aria-hidden
                    />
                  </span>
                </>
              ) : (
                <>
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl transition group-hover:scale-105 ${action.iconBg}`}
                    aria-hidden
                  >
                    <Icon className={`h-6 w-6 ${action.iconColor}`} />
                  </span>
                  <span className="text-center text-[13px] font-semibold leading-snug text-gray-800">
                    {action.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      {/* Reserved slot for future "Latest Uploaded Bill" widget below Upload Mess Bill */}
      <div className="mt-3 hidden" data-slot="latest-bill-widget" aria-hidden />
    </section>
  );
}
