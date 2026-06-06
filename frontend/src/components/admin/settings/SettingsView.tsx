"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiChevronRight, HiCog6Tooth, HiExclamationTriangle } from "react-icons/hi2";

const systemLinks = [
  {
    href: "/dashboard/settings/year-end-reset",
    label: "Year-End Reset",
    description: "Clear operational data for a new academic year",
    icon: HiExclamationTriangle,
    destructive: true,
  },
] as const;

export default function SettingsView() {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-lg animate-in fade-in duration-300 md:max-w-xl md:px-6">
      <div className="px-4 pb-2 pt-3 md:pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 flex min-h-[44px] items-center gap-1 text-sm font-semibold text-[var(--mh-primary)] transition active:scale-[0.98]"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Admin configuration and system tools
        </p>
      </div>

      <section className="px-4 pb-8 md:px-0" aria-labelledby="system-management-heading">
        <h2
          id="system-management-heading"
          className="mb-2.5 flex items-center gap-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          <HiCog6Tooth className="h-4 w-4" aria-hidden />
          System Management
        </h2>
        <ul className="flex flex-col gap-2">
          {systemLinks.map(({ href, label, description, icon: Icon, destructive }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex min-h-[56px] items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition active:scale-[0.99] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] ${
                  destructive
                    ? "border border-amber-200/80 bg-amber-50/50"
                    : "bg-white"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    destructive ? "bg-red-100" : "bg-gray-100"
                  }`}
                  aria-hidden
                >
                  <Icon
                    className={`h-5 w-5 ${destructive ? "text-red-600" : "text-gray-500"}`}
                  />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span
                    className={`block text-sm font-semibold ${
                      destructive ? "text-red-700" : "text-gray-900"
                    }`}
                  >
                    {label}
                  </span>
                  <span className="block text-xs text-gray-500">{description}</span>
                </span>
                <HiChevronRight className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
