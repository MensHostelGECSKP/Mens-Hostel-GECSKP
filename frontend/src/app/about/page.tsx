"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, PageContainer } from "@/components/ui";
import { appConfig } from "@/constants/appConfig";
import {
  HiClipboard,
  HiChevronDown,
  HiChevronRight,
  HiInformationCircle,
  HiUsers,
  HiDocumentText,
  HiBell,
  HiClipboardDocumentList,
  HiSparkles,
  HiShieldCheck,
  HiCog6Tooth,
  HiArrowLeft,
  HiEnvelope,
  HiPhone,
} from "react-icons/hi2";
import { MdRestaurant, MdOutlineAnalytics } from "react-icons/md";

// Icon mapping for features
const featureIcons: Record<string, React.ComponentType<any>> = {
  "Attendance Tracking": MdOutlineAnalytics,
  "Mess Cut Management": MdRestaurant,
  "Bill Management": HiDocumentText,
  "Notifications": HiBell,
  "Reports": HiClipboardDocumentList,
  "User Management": HiUsers,
  "PWA Support": HiSparkles,
};

export default function AboutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [expandedVersion, setExpandedVersion] = useState<string | null>("v" + appConfig.version);

  const isAdmin = user?.role === "admin";

  const handleCopyVersionInfo = () => {
    const environment = process.env.NODE_ENV || "development";
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "N/A";
    const infoText = `### MH App Debug Information
- App Name: ${appConfig.name}
- Version: v${appConfig.version}
- Build Number: ${appConfig.buildNumber}
- Release Date: ${appConfig.releaseDate}
- Environment: ${environment}
- User Agent: ${userAgent}
- Developed By: ${appConfig.developedBy}`;

    navigator.clipboard.writeText(infoText);
    toast.success("Version details copied to clipboard!", {
      icon: "📋",
      style: {
        borderRadius: "1rem",
        background: "#1f2937",
        color: "#ffffff",
      },
    });
  };

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
        title="About MH App"
        subtitle="Application version & release notes"
        showBack={true}
      />
      <PageContainer className="page-transition">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6"
        >
          {/* Hero Branding Section */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-indigo-50/50 via-white to-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-[var(--mh-primary)] text-white shadow-lg shadow-indigo-500/20">
              <HiSparkles className="h-8 w-8 animate-pulse" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {appConfig.name}
            </h1>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--mh-primary-soft)] px-3 py-0.5 text-xs font-bold text-[var(--mh-primary)]">
              v{appConfig.version}
            </span>
            <p className="mt-4 max-w-md text-sm text-gray-500 leading-relaxed">
              {appConfig.description}
            </p>
          </motion.div>

          {/* Development Team */}
          <motion.div variants={itemVariants} className="mh-card flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Developed By</p>
              <h2 className="text-base font-bold text-gray-900 mt-0.5">{appConfig.developedBy}</h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-[var(--mh-primary)]">
              <HiUsers className="h-5 w-5" />
            </div>
          </motion.div>

          {/* Feature Summary Section */}
          <motion.section variants={itemVariants} aria-labelledby="features-heading">
            <h3 id="features-heading" className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-gray-400">
              Core Features
            </h3>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {appConfig.features.map((feature) => {
                const IconComponent = featureIcons[feature] || HiSparkles;
                return (
                  <div
                    key={feature}
                    className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition duration-200"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-gray-500">
                      <IconComponent className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{feature}</span>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Version Info Summary */}
          <motion.div variants={itemVariants} className="mh-card">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
              Build Specifications
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Version
                </span>
                <span className="block text-sm font-bold text-gray-900 mt-0.5">
                  {appConfig.version}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Build Number
                </span>
                <span className="block text-sm font-semibold text-gray-900 mt-0.5">
                  {appConfig.buildNumber}
                </span>
              </div>
              <div className="col-span-2 border-t border-gray-50 pt-3">
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Release Date
                </span>
                <span className="block text-sm font-semibold text-gray-900 mt-0.5">
                  {appConfig.releaseDate}
                </span>
              </div>
            </div>
          </motion.div>

          {/* What's New Changelog */}
          <motion.section variants={itemVariants} aria-labelledby="changelog-heading">
            <h3 id="changelog-heading" className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-gray-400">
              What's New
            </h3>
            <div className="flex flex-col gap-2">
              {appConfig.changelog.map((log) => {
                const isExpanded = expandedVersion === log.version;
                return (
                  <div key={log.version} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedVersion(isExpanded ? null : log.version)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition text-left"
                    >
                      <div>
                        <span className="text-sm font-bold text-gray-900">{log.version}</span>
                        <span className="text-xs text-gray-400 ml-2 font-medium">{log.releaseDate}</span>
                      </div>
                      {isExpanded ? (
                        <HiChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <HiChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-gray-50/50 bg-gray-50/30">
                        <ul className="flex flex-col gap-2">
                          {log.changes.map((change, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start text-xs text-gray-600 leading-relaxed">
                              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Support & Contact Information */}
          <motion.section variants={itemVariants} aria-labelledby="support-heading">
            <h3 id="support-heading" className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-gray-400">
              Support & Contact
            </h3>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                For operational concerns, disputes regarding attendance/mess cuts, or billing issues, please contact the hostel administration or representatives.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-gray-50">
                {/* Warden Contact */}
                <div className="flex flex-col justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Mr. Jamshad Ali</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">Hostel Warden</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href="mailto:wardenmh@gecskp.ac.in?subject=MH%20App%20Support%20Request"
                      className="flex-1 flex min-h-[32px] items-center justify-center gap-1 rounded-lg bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 shadow-xs hover:bg-gray-50 active:scale-98"
                    >
                      <HiEnvelope className="h-3.5 w-3.5 text-gray-400" />
                      Email
                    </a>
                    <a
                      href="tel:+919846272290"
                      className="flex-1 flex min-h-[32px] items-center justify-center gap-1 rounded-lg bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 shadow-xs hover:bg-gray-50 active:scale-98"
                    >
                      <HiPhone className="h-3.5 w-3.5 text-gray-400" />
                      Call
                    </a>
                  </div>
                </div>

                {/* Clerk Contact */}
                <div className="flex flex-col justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Rathul</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">Hostel Clerk</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href="mailto:mh@gecskp.ac.in?subject=MH%20App%20Support%20Request"
                      className="flex-1 flex min-h-[32px] items-center justify-center gap-1 rounded-lg bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 shadow-xs hover:bg-gray-50 active:scale-98"
                    >
                      <HiEnvelope className="h-3.5 w-3.5 text-gray-400" />
                      Email
                    </a>
                    <a
                      href="tel:+919745401226"
                      className="flex-1 flex min-h-[32px] items-center justify-center gap-1 rounded-lg bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 shadow-xs hover:bg-gray-50 active:scale-98"
                    >
                      <HiPhone className="h-3.5 w-3.5 text-gray-400" />
                      Call
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-xl flex items-center justify-between gap-4 mt-1">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-indigo-950">Developer Support</h4>
                  <p className="text-[10px] text-indigo-600/90 mt-0.5 font-medium leading-normal">
                    Submit bug reports, feature suggestions, or application diagnostics directly.
                  </p>
                </div>
                <a
                  href="mailto:gecskp.menshostel@gmail.com?subject=MH%20App%20Bug%20Report/Feedback"
                  className="flex shrink-0 min-h-[36px] items-center justify-center rounded-xl bg-[var(--mh-primary)] px-3 text-xs font-bold text-white shadow-xs hover:opacity-95 active:scale-95 transition"
                >
                  Report Issue
                </a>
              </div>
            </div>
          </motion.section>

          {/* System Information (Visible to Admin Only) */}
          {isAdmin && (
            <motion.div variants={itemVariants} className="mh-card border-indigo-100 bg-indigo-50/10">
              <div className="flex items-center gap-2 mb-3">
                <HiShieldCheck className="h-4.5 w-4.5 text-[var(--mh-primary)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--mh-primary)]">
                  System Diagnostics (Admin Only)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Environment
                  </span>
                  <span className="block text-xs font-bold text-gray-900 mt-0.5 capitalize">
                    {process.env.NODE_ENV || "development"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    System Mode
                  </span>
                  <span className="block text-xs font-semibold text-gray-900 mt-0.5">
                    Production Build
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Copy version details & Back actions */}
          <motion.div variants={itemVariants} className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCopyVersionInfo}
              className="w-full flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[var(--mh-primary)] text-sm font-semibold text-white shadow-md transition active:scale-[0.96] hover:opacity-95"
            >
              <HiClipboard className="h-5 w-5" />
              Copy Version Info
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
