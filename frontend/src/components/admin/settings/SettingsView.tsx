"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiChevronRight, HiCog6Tooth, HiExclamationTriangle, HiInformationCircle, HiClipboardDocumentList } from "react-icons/hi2";
import { AppHeader, PageContainer } from "@/components/ui";

const systemLinks = [
  {
    href: "/dashboard/settings/checklist",
    label: "Release Checklist",
    description: "Verify operational modules and check integration statuses",
    icon: HiClipboardDocumentList,
    destructive: false,
  },
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
    <>
      <AppHeader
        title="Settings"
        subtitle="Admin configuration and system tools"
        showBack={true}
      />
      <PageContainer>

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

      <section className="px-4 pb-8 md:px-0 mt-6" aria-labelledby="app-info-heading">
        <h2
          id="app-info-heading"
          className="mb-2.5 flex items-center gap-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          <HiInformationCircle className="h-4 w-4" aria-hidden />
          Application Information
        </h2>
        <ul className="flex flex-col gap-2">
          <li>
            <Link
              href="/about"
              className="flex min-h-[56px] items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white transition active:scale-[0.99] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50"
                aria-hidden
              >
                <HiInformationCircle className="h-5 w-5 text-blue-600" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-semibold text-gray-900">About MH App</span>
                <span className="block text-xs text-gray-500">View app version, features, and release history</span>
              </span>
              <HiChevronRight className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
            </Link>
          </li>
        </ul>
      </section>
    </PageContainer>
  </>
);
}
