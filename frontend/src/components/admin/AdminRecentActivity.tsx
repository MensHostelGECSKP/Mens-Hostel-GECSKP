"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  HiUserPlus,
  HiExclamationTriangle,
  HiBanknotes,
} from "react-icons/hi2";
import type { MessBill, Notification, User } from "@/types";
import { formatRelativeTime, timestampFromObjectId } from "@/utils/relativeTime";
import { formatBillMonthLabel } from "@/utils/messBillDisplay";
import { AdminActivitySkeleton } from "./AdminSkeleton";

type ActivityType = "registration" | "notification" | "bill";

type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  timestamp: Date;
  href: string;
};

type AdminRecentActivityProps = {
  users: User[];
  notifications: Notification[];
  bills: MessBill[];
  loading?: boolean;
  limit?: number;
};

const ICONS: Record<
  ActivityType,
  { Icon: React.ComponentType<{ className?: string }>; bg: string; color: string }
> = {
  registration: { Icon: HiUserPlus, bg: "bg-indigo-50", color: "text-indigo-500" },
  notification: { Icon: HiExclamationTriangle, bg: "bg-rose-50", color: "text-rose-500" },
  bill: { Icon: HiBanknotes, bg: "bg-emerald-50", color: "text-emerald-500" },
};

function buildActivities(
  users: User[],
  notifications: Notification[],
  bills: MessBill[]
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const user of users) {
    if (user.role !== "student") continue;
    const ts = timestampFromObjectId(user.userId);
    if (!ts) continue;
    items.push({
      id: `user-${user.userId}`,
      type: "registration",
      title: "New User Registration",
      subtitle: `${user.name}${user.roomNumber ? ` • Room ${user.roomNumber}` : ""}`,
      timestamp: ts,
      href: "/dashboard/manage-users",
    });
  }

  for (const n of notifications) {
    items.push({
      id: `notif-${n._id}`,
      type: "notification",
      title: n.title || "Notification Published",
      subtitle: n.message?.trim() || "New announcement posted",
      timestamp: new Date(n.createdAt),
      href: "/notifications",
    });
  }

  for (const b of bills) {
    const ts = b.uploadedAt ? new Date(b.uploadedAt) : new Date(b.year, b.month - 1, 1);
    items.push({
      id: `bill-${b._id}`,
      type: "bill",
      title: "Mess Bill Published",
      subtitle: `${formatBillMonthLabel(b.month, b.year)} · ${b.fileName || "bill uploaded"}`,
      timestamp: ts,
      href: "/dashboard/upload-mess-bill",
    });
  }

  return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export default function AdminRecentActivity({
  users,
  notifications,
  bills,
  loading = false,
  limit = 5,
}: AdminRecentActivityProps) {
  const activities = useMemo(
    () => buildActivities(users, notifications, bills).slice(0, limit),
    [users, notifications, bills, limit]
  );

  return (
    <section aria-label="Recent activity">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Recent Activity
        </h2>
        <Link
          href="/notifications"
          className="text-sm font-semibold text-[var(--mh-primary)] transition hover:opacity-80"
        >
          View All
        </Link>
      </div>

      {loading ? (
        <AdminActivitySkeleton />
      ) : activities.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-gray-500">No recent activity yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {activities.map((item, index) => {
            const { Icon, bg, color } = ICONS[item.type];
            return (
              <li
                key={item.id}
                className="animate-in fade-in duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link
                  href={item.href}
                  className="flex min-h-[72px] items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] active:scale-[0.99]"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}
                    aria-hidden
                  >
                    <Icon className={`h-5 w-5 ${color}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="truncate text-xs text-gray-500">{item.subtitle}</p>
                  </div>
                  <time
                    className="shrink-0 text-[11px] font-medium text-gray-400"
                    dateTime={item.timestamp.toISOString()}
                  >
                    {formatRelativeTime(item.timestamp)}
                  </time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
