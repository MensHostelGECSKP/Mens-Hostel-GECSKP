"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  HiEnvelope,
  HiPhone,
  HiClipboardDocumentList,
  HiUser,
  HiSparkles,
  HiShieldCheck,
  HiBuildingOffice2,
  HiArrowRight,
  HiDocumentText,
} from "react-icons/hi2";
import {
  MdRestaurant,
  MdOutlineNotificationsActive,
  MdOutlineAnalytics,
  MdPeople,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Only show splash on first visit in the current session
    const splashShown = typeof window !== "undefined" && sessionStorage.getItem("mhapp_splash_shown");
    if (splashShown) {
      setShowSplash(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowSplash(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("mhapp_splash_shown", "1");
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--mh-surface)] font-sans antialiased text-gray-900 pb-16">
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-[var(--mh-primary)] to-indigo-900"
          >
            <motion.img
              src="/logo.png"
              alt="MH App Logo"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/20 shadow-2xl bg-white object-cover mb-4"
            />
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-white text-2xl font-bold tracking-tight text-center"
            >
              Mens Hostel
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-white/80 text-sm mt-1"
            >
              GEC Sreekrishnapuram
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? 15 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto w-full max-w-lg px-4 pt-6 md:max-w-3xl md:px-6 md:pt-10 lg:max-w-4xl"
      >
        {/* Hero Section */}
        <header className="text-center mb-10 flex flex-col items-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--mh-primary-soft)] text-[var(--mh-primary)] shadow-sm">
            <HiSparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Mens Hostel
          </h1>
          <p className="mt-1.5 text-base font-semibold text-[var(--mh-primary)]">
            Digital Hostel Management System
          </p>
          <p className="mt-3 max-w-md text-sm text-gray-500 leading-relaxed">
            Track attendance, mess cuts, notifications, and bills in one place. A modern interface built for GECSKP hostel residents.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 w-full max-w-xs sm:max-w-sm">
            <button
              type="button"
              onClick={() => router.push(isLoggedIn ? "/dashboard" : "/login")}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--mh-primary)] text-sm font-semibold text-white shadow-md transition hover:bg-[var(--mh-primary)]/90 active:scale-[0.96] active-press"
            >
              <span>{isLoggedIn ? "Go to Dashboard" : "Login"}</span>
              <HiArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => router.push("/rules")}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.96] active-press"
            >
              View Rules
            </button>
          </div>
        </header>

        {/* Quick Badges Info */}
        <section className="mb-10 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-3.5 text-center border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <p className="text-xl font-bold text-[var(--mh-primary)]">130+</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Residents</p>
          </div>
          <div className="rounded-2xl bg-white p-3.5 text-center border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <p className="text-xl font-bold text-emerald-600">4+</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Batches</p>
          </div>
          <div className="rounded-2xl bg-white p-3.5 text-center border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <p className="text-xl font-bold text-indigo-500">24/7</p>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Support</p>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="mb-10" aria-label="Feature Highlights">
          <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
            <span className="h-1.5 w-4 rounded-full bg-[var(--mh-primary)]" /> App Features
          </h2>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <div className="flex gap-3.5 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <MdOutlineAnalytics className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-gray-950">Attendance Tracking</h3>
                <p className="text-xs text-gray-400 mt-0.5">Real-time attendance logs & summary stats.</p>
              </div>
            </div>
            <div className="flex gap-3.5 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <MdRestaurant className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-gray-950">Mess Cut Management</h3>
                <p className="text-xs text-gray-400 mt-0.5">Log and modify mess cuts beforehand.</p>
              </div>
            </div>
            <div className="flex gap-3.5 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <HiClipboardDocumentList className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-gray-950">Monthly Reports</h3>
                <p className="text-xs text-gray-400 mt-0.5">Visual charts and monthly bill breakdowns.</p>
              </div>
            </div>
            <div className="flex gap-3.5 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <MdOutlineNotificationsActive className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-gray-950">Notifications</h3>
                <p className="text-xs text-gray-400 mt-0.5">Get immediate updates regarding hostel decisions.</p>
              </div>
            </div>
            <div className="flex gap-3.5 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <HiDocumentText className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-gray-950">Bill Management</h3>
                <p className="text-xs text-gray-400 mt-0.5">Access recent bills and mark payment status.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Hostel Information */}
        <section className="mb-10" aria-label="Hostel Information">
          <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
            <span className="h-1.5 w-4 rounded-full bg-[var(--mh-primary)]" /> Hostel Administration
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Warden Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mh-primary-soft)] text-[var(--mh-primary)]">
                    <HiUser className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">Mr. Jamshad Ali</h3>
                    <p className="text-xs text-gray-400 font-medium">Hostel Warden (HOD of Physics)</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  Responsible for the general administration, allotment of rooms, and resident welfare in the hostel.
                </p>
              </div>
              <div className="mt-4 pt-3.5 border-t border-gray-50 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <HiEnvelope className="h-4 w-4 shrink-0 text-gray-400" />
                  <a href="mailto:wardenmh@gecskp.ac.in" className="hover:text-[var(--mh-primary)] transition truncate">
                    wardenmh@gecskp.ac.in
                  </a>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <HiPhone className="h-4 w-4 shrink-0 text-gray-400" />
                  <a href="tel:+919846272290" className="hover:text-[var(--mh-primary)] transition">
                    +91 98462 72290
                  </a>
                </div>
              </div>
            </div>

            {/* Clerk Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                    <HiUser className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">Rathul</h3>
                    <p className="text-xs text-gray-400 font-medium">Hostel Clerk</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  Manages clerical duties, billing processes, and maintains daily office records of hostel boarders.
                </p>
              </div>
              <div className="mt-4 pt-3.5 border-t border-gray-50 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <HiEnvelope className="h-4 w-4 shrink-0 text-gray-400" />
                  <a href="mailto:mh@gecskp.ac.in" className="hover:text-[var(--mh-primary)] transition truncate">
                    mh@gecskp.ac.in
                  </a>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <HiPhone className="h-4 w-4 shrink-0 text-gray-400" />
                  <a href="tel:+919745401226" className="hover:text-[var(--mh-primary)] transition">
                    +91 97454 01226
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mess Committee Section */}
        <section className="mb-10" aria-label="Mess Committee">
          <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
            <span className="h-1.5 w-4 rounded-full bg-[var(--mh-primary)]" /> Mess Committee
          </h2>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Formed annually to oversee catering logistics, design the dining menu, verify billing data, and coordinate with hostel staff.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Hostel Secretary Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600 font-bold text-sm">
                    A
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold text-gray-950 truncate">Adithyan S R</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Hostel Secretary</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href="tel:+917736631572"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition active:scale-95"
                  aria-label="Call Adithyan S R"
                >
                  <HiPhone className="h-4.5 w-4.5" />
                </a>
              </div>
            </div>

            {/* Mess Secretary Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 font-bold text-sm">
                    H
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold text-gray-950 truncate">Hashir</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Mess Secretary</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href="tel:+918304038860"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition active:scale-95"
                  aria-label="Call Hashir"
                >
                  <HiPhone className="h-4.5 w-4.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* elegant clean footer */}
        <footer className="mt-12 text-center select-none pt-4 border-t border-gray-250">
          <div className="text-xs text-gray-500">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 via-indigo-600 to-pink-500 font-semibold">Made by </span>
            <span className="text-black font-semibold">Sabari</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 via-indigo-600 to-pink-500 font-semibold"> &amp; </span>
            <span className="text-black font-semibold">Roomies 2.0</span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
