"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AppHeader, PageContainer } from "@/components/ui";
import { appConfig } from "@/constants/appConfig";
import {
  HiSparkles,
  HiArrowLeft,
  HiDocumentText,
  HiUsers,
  HiFolder,
  HiCloudArrowUp,
  HiDevicePhoneMobile,
} from "react-icons/hi2";
import { MdRestaurant, MdOutlineAnalytics } from "react-icons/md";

const improvements = [
  {
    title: "New Student & Admin Dashboards",
    description: "Live summary statistics, automated mess cut calendar tracking, and quick filters in a mobile-optimized interface.",
    icon: MdRestaurant,
    color: "from-indigo-500 to-blue-500",
    bg: "bg-indigo-50/50 text-indigo-600 border-indigo-100",
  },
  {
    title: "Monthly Reports & Excel Export",
    description: "Select individual dates using interactive calendars, view statistics, and generate downloadable Excel reports instantly.",
    icon: MdOutlineAnalytics,
    color: "from-purple-500 to-pink-500",
    bg: "bg-purple-50/50 text-purple-600 border-purple-100",
  },
  {
    title: "Google Drive Bill Storage",
    description: "Mess bill uploads are organized into Google Drive folders by Year and Month, with student status tracking and PDF downloads.",
    icon: HiFolder,
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50/50 text-amber-600 border-amber-100",
  },
  {
    title: "Excel Bulk User Onboarding",
    description: "Register dozens of residents at once by uploading an Excel template. Auto-validates columns and highlights duplicate errors.",
    icon: HiUsers,
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50/50 text-emerald-600 border-emerald-100",
  },
  {
    title: "Modern PWA Support & Offline Modes",
    description: "Install the app on iOS/Android, get push notifications for new bills, and access data offline with a friendly connection banner.",
    icon: HiDevicePhoneMobile,
    color: "from-sky-500 to-cyan-500",
    bg: "bg-sky-50/50 text-sky-600 border-sky-100",
  },
];

export default function WhatsNewPage() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <>
      <AppHeader
        title="What's New"
        subtitle={`Recent features & improvements in v${appConfig.version}`}
        showBack={true}
      />
      <PageContainer className="page-transition">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6"
        >
          {/* Header Hero Banner */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-[var(--mh-primary)] to-indigo-900 px-6 py-8 text-white shadow-lg shadow-indigo-500/20"
          >
            {/* Subtle decorative circles */}
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/5 blur-xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-white/5 blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md mb-3">
                <HiSparkles className="h-6 w-6 animate-pulse" />
              </span>
              <h2 className="text-2xl font-black tracking-tight">MH App v{appConfig.version}</h2>
              <p className="mt-2 text-xs font-semibold text-white/80 uppercase tracking-widest">
                Release Candidate RC-2
              </p>
              <p className="mt-3 max-w-sm text-sm text-indigo-100/90 leading-relaxed font-medium">
                We've polished the interface, secured student portals, and automated storage integration for a robust real-world hostel deployment.
              </p>
            </div>
          </motion.div>

          {/* List of Improvements */}
          <motion.section variants={containerVariants} className="flex flex-col gap-4">
            <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-gray-400">
              Key Enhancements
            </h3>
            
            <div className="flex flex-col gap-3.5">
              {improvements.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition duration-200"
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${item.bg}`}>
                      <Icon className="h-5.5 w-5.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[14px] font-bold text-gray-950 tracking-tight">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed font-medium">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Action buttons */}
          <motion.div variants={itemVariants} className="mt-4 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[var(--mh-primary)] text-sm font-semibold text-white shadow-md transition active:scale-[0.96] hover:opacity-95"
            >
              Get Started with v{appConfig.version}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm transition active:scale-[0.96] hover:bg-gray-50"
            >
              <HiArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </motion.div>
        </motion.div>
      </PageContainer>
    </>
  );
}
