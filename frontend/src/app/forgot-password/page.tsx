"use client";
import React from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/utils/api";
import { HiEnvelope, HiExclamationTriangle, HiArrowLeft, HiCheckCircle, HiArrowPath } from "react-icons/hi2";

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

type PageState = "form" | "sent" | "submitting";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [pageState, setPageState] = useState<PageState>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const emailError = emailTouched && !isValidEmail(email) ? "Please enter a valid email address." : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!isValidEmail(email)) return;

    setErrorMsg("");
    setPageState("submitting");

    try {
      const response = await api.post("/api/auth/forgot-password", { email });

      if (response.error) {
        // Extract the best possible error message from the API response
        setErrorMsg(response.error || "Failed to send reset email. Please try again.");
        setPageState("form");
        return;
      }

      // Success
      setSubmittedEmail(email);
      setPageState("sent");
    } catch {
      setErrorMsg("Unable to connect to the server. Please check your internet connection and try again.");
      setPageState("form");
    }
  };

  const handleRetry = () => {
    setPageState("form");
    setErrorMsg("");
    setSubmittedEmail("");
    setEmail("");
    setEmailTouched(false);
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (pageState === "sent") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[var(--mh-surface)] px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col items-center text-center gap-4">
            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border border-green-100">
              <HiCheckCircle className="h-8 w-8 text-green-500" />
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-gray-900 mb-1">Check your inbox</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                If{" "}
                <span className="font-semibold text-gray-700 break-all">{submittedEmail}</span>{" "}
                is registered, a password reset link has been sent. Check your spam folder if it doesn&apos;t arrive within a minute.
              </p>
            </div>

            <div className="w-full pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all active:scale-[0.98]"
              >
                <HiArrowPath className="h-4 w-4" />
                Try a different email
              </button>
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--mh-primary)] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(68,65,204,0.2)] hover:bg-[var(--mh-primary)]/90 transition-all active:scale-[0.98]"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form State ─────────────────────────────────────────────────────────────
  const isSubmitting = pageState === "submitting";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--mh-surface)] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col items-center">
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="MH App Logo"
            className="w-16 h-16 rounded-full border-2 border-[var(--mh-primary-soft)] shadow-md mb-4 bg-white object-cover"
            width={64}
            height={64}
            priority
          />

          {/* Icon + Heading */}
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-center text-gray-900 mb-1">
              Forgot Password?
            </h1>
            <p className="text-xs text-gray-400 text-center leading-relaxed max-w-[240px]">
              Enter your registered email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 w-full" autoComplete="on" noValidate>
            {/* Error Alert */}
            {errorMsg && (
              <div
                className="w-full rounded-2xl bg-red-50 p-4 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2.5 animate-in fade-in duration-200"
                role="alert"
              >
                <HiExclamationTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold text-red-700">Failed to send</p>
                  <p className="mt-0.5 font-medium text-red-600/90 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="forgot-email" className="block text-gray-600 font-semibold mb-1.5 text-xs">
                Email Address
              </label>
              <div className="relative">
                <HiEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="forgot-email"
                  type="email"
                  name="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border bg-gray-50/50 text-black text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--mh-primary-soft)] focus:border-[var(--mh-primary)] disabled:opacity-60 disabled:cursor-not-allowed ${
                    emailError ? "border-red-300 focus:ring-red-50" : "border-gray-200"
                  }`}
                  required
                  autoComplete="email"
                  aria-invalid={!!emailError}
                  aria-describedby="forgot-email-error"
                />
              </div>
              {emailError && (
                <div id="forgot-email-error" className="text-red-500 text-xs font-medium mt-1 px-1">
                  {emailError}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[var(--mh-primary)] text-white py-3.5 rounded-2xl hover:bg-[var(--mh-primary)]/95 transition-all shadow-[0_4px_14px_rgba(68,65,204,0.2)] font-bold text-base tracking-wide disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Sending Link...</span>
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[var(--mh-primary)] font-bold text-xs px-2 py-2 cursor-pointer transition-colors duration-150 hover:underline focus:underline active:underline rounded focus:outline-none focus:ring-2 focus:ring-[var(--mh-primary-soft)]"
          >
            <HiArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}