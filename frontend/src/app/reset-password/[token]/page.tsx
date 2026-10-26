"use client";

import React from "react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/utils/api";
import { HiEye, HiEyeSlash, HiExclamationTriangle, HiCheckCircle, HiArrowLeft } from "react-icons/hi2";

function validate(password: string, confirmPassword: string) {
  const errs: { password?: string; confirmPassword?: string } = {};
  if (!password) errs.password = "Password is required.";
  else if (password.length < 6) errs.password = "Password must be at least 6 characters.";
  if (!confirmPassword) errs.confirmPassword = "Please confirm your password.";
  else if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
  return errs;
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const errs = validate(password, confirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched(true);
    setConfirmTouched(true);
    if (errs.password || errs.confirmPassword) return;

    setErrorMsg("");
    setSubmitting(true);
    try {
      const response = await api.post(`/api/auth/reset-password/${token}`, { password });
      if (response.error) {
        setErrorMsg(response.error || "Failed to reset password. The link may have expired.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setErrorMsg("Unable to connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[var(--mh-surface)] px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border border-green-100">
              <HiCheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 mb-1">Password Reset!</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your password has been changed successfully. Redirecting you to login...
              </p>
            </div>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--mh-primary)] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(68,65,204,0.2)] hover:bg-[var(--mh-primary)]/90 transition-all active:scale-[0.98]"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form State ─────────────────────────────────────────────────────────────
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

          <div className="flex flex-col items-center mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-center text-gray-900 mb-1">
              Reset Password
            </h1>
            <p className="text-xs text-gray-400 text-center leading-relaxed max-w-[240px]">
              Choose a new password for your account.
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
                  <p className="font-bold text-red-700">Reset Failed</p>
                  <p className="mt-0.5 font-medium text-red-600/90 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="new-password" className="block text-gray-600 font-semibold mb-1.5 text-xs">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  disabled={submitting}
                  className={`w-full pl-4 pr-11 py-3 rounded-2xl border bg-gray-50/50 text-black text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--mh-primary-soft)] focus:border-[var(--mh-primary)] disabled:opacity-60 disabled:cursor-not-allowed ${
                    errs.password && passwordTouched ? "border-red-300 focus:ring-red-50" : "border-gray-200"
                  }`}
                  required
                  autoComplete="new-password"
                  aria-invalid={!!(errs.password && passwordTouched)}
                  aria-describedby="reset-password-error"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition active:scale-95 disabled:opacity-40"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <HiEyeSlash className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                </button>
              </div>
              {errs.password && passwordTouched && (
                <div id="reset-password-error" className="text-red-500 text-xs font-medium mt-1 px-1" aria-live="polite">
                  {errs.password}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-gray-600 font-semibold mb-1.5 text-xs">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                  disabled={submitting}
                  className={`w-full pl-4 pr-11 py-3 rounded-2xl border bg-gray-50/50 text-black text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--mh-primary-soft)] focus:border-[var(--mh-primary)] disabled:opacity-60 disabled:cursor-not-allowed ${
                    errs.confirmPassword && confirmTouched ? "border-red-300 focus:ring-red-50" : "border-gray-200"
                  }`}
                  required
                  autoComplete="new-password"
                  aria-invalid={!!(errs.confirmPassword && confirmTouched)}
                  aria-describedby="reset-confirm-error"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={submitting}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition active:scale-95 disabled:opacity-40"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <HiEyeSlash className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                </button>
              </div>
              {errs.confirmPassword && confirmTouched && (
                <div id="reset-confirm-error" className="text-red-500 text-xs font-medium mt-1 px-1" aria-live="polite">
                  {errs.confirmPassword}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[var(--mh-primary)] text-white py-3.5 rounded-2xl hover:bg-[var(--mh-primary)]/95 transition-all shadow-[0_4px_14px_rgba(68,65,204,0.2)] font-bold text-base tracking-wide disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
              disabled={submitting}
            >
              {submitting ? (
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
                  <span>Resetting...</span>
                </>
              ) : (
                "Reset Password"
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