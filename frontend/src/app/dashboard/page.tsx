"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth, useCurrentUser } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import { StudentDashboardSkeleton, AdminDashboardSkeleton } from "@/components/student/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { HiSparkles, HiCheckCircle, HiBell, HiDocumentText, HiBuildingOffice } from "react-icons/hi2";

const AdminDashboard = dynamic(() => import("@/components/admin/AdminDashboard"), {
  loading: () => <AdminDashboardSkeleton />,
});

const StudentDashboard = dynamic(() => import("@/components/student/StudentDashboard"), {
  loading: () => <StudentDashboardSkeleton />,
});

function DashboardContent() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();
  const user = useCurrentUser();
  const [showWelcome, setShowWelcome] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isLoggedIn && window.location.pathname === "/login") {
        event.preventDefault();
        router.replace("/dashboard");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isLoggedIn, router]);

  // Check if welcome modal needs to be shown (only once per user session/account on this device)
  useEffect(() => {
    if (!loading && isLoggedIn && user) {
      const shown = localStorage.getItem(`mhapp_welcome_shown_${user.userId}`);
      if (!shown) {
        setShowWelcome(true);
      }
    }
  }, [loading, isLoggedIn, user]);

  const handleDismissWelcome = () => {
    if (user) {
      localStorage.setItem(`mhapp_welcome_shown_${user.userId}`, "true");
    }
    setShowWelcome(false);
  };

  if (loading) {
    if (user?.role === "admin") {
      return <AdminDashboardSkeleton />;
    }
    return <StudentDashboardSkeleton />;
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  return (
    <>
      {user.role === "admin" ? <AdminDashboard /> : <StudentDashboard />}

      {/* Welcome Modal Dialog */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs" role="presentation">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="welcome-modal-title"
            >
              {/* Premium Glow Details */}
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-500/10 blur-md pointer-events-none" />
              <div className="absolute -left-6 -bottom-6 h-20 w-20 rounded-full bg-indigo-500/10 blur-md pointer-events-none" />

              {/* Sparkle Icon Badge */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-[var(--mh-primary)] text-white shadow-lg shadow-indigo-500/20">
                <HiSparkles className="h-7 w-7 animate-pulse" />
              </div>

              {/* Title */}
              <h2 id="welcome-modal-title" className="text-xl font-extrabold text-gray-900 tracking-tight">
                Welcome to MH App!
              </h2>
              <p className="mt-1 text-xs text-gray-400 font-bold uppercase tracking-wider">
                GEC Sreekrishnapuram
              </p>

              {/* Body */}
              <p className="mt-4 text-sm text-gray-500 leading-relaxed font-medium">
                Track mess cuts, view published bills, receive real-time notifications, and stay updated with your hostel activities.
              </p>

              {/* Quick Checklist Highlights */}
              <div className="mt-5 w-full flex flex-col gap-2.5 text-left text-xs bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <HiCheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span className="font-semibold">Log mess cuts in advance</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <HiCheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span className="font-semibold">Review monthly bills & download PDFs</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <HiCheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span className="font-semibold">Receive direct notices from Warden & Clerk</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleDismissWelcome}
                className="mt-6 w-full flex min-h-[48px] items-center justify-center rounded-2xl bg-[var(--mh-primary)] text-sm font-semibold text-white shadow-md transition active:scale-[0.96] hover:opacity-95"
              >
                Get Started
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  return <DashboardContent key={user?.userId || "no-user"} />;
}
