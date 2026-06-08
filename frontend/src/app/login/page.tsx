"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import toast from "react-hot-toast";
import { validateEmail, validatePassword } from "@/utils/validation";
import { useForm } from "@/utils/useForm";
import { api } from "@/utils/api";
import Image from "next/image";
import { HiExclamationTriangle, HiEye, HiEyeSlash } from "react-icons/hi2";
import FullPageLoader from "@/components/FullPageLoader";

export default function LoginPage() {
  const router = useRouter();
  const { setIsLoggedIn, updateUserFromToken, isLoggedIn, loading } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [loading, isLoggedIn, router]);

  if (loading) {
    return <FullPageLoader text="Authenticating..." />;
  }

  const {
    values,
    errors,
    touched,
    submitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setErrors,
  } = useForm({
    initialValues: { email: "", password: "" },
    validate: (vals) => {
      const errs: Record<string, unknown> = {};
      if (!validateEmail(vals.email)) errs.email = "Please enter a valid email address.";
      if (!validatePassword(vals.password)) errs.password = "Password must be at least 6 characters.";
      return errs;
    },
    onSubmit: async (vals) => {
      setSubmitError(null);
      setErrors({});
      try {
        const response = await api.post("/api/auth/login", vals);
        if (response.error) {
          // Display a friendly error message for unauthorized/invalid credentials
          const isInvalidCreds =
            response.error === "Unauthorized" ||
            response.error.toLowerCase().includes("invalid") ||
            response.error.toLowerCase().includes("not found");
          throw new Error(
            isInvalidCreds
              ? "Invalid username or password. Please try again."
              : response.error
          );
        }

        const token = (response.data as { token?: string } | undefined)?.token;
        if (token) {
          localStorage.setItem("token", token);
          setIsLoggedIn(true);
          updateUserFromToken();
          // Dispatch custom event to notify AuthContext of state change
          window.dispatchEvent(new Event("authStateChanged"));
          router.replace("/dashboard"); // Use replace instead of push to prevent back button issues
          toast.success("Login successful!");
        } else {
          throw new Error("Login failed");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An error occurred";
        setSubmitError(msg);
        toast.error(msg);
      }
    },
  });

  // Don't render login form if already authenticated
  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--mh-surface)] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="MH App Logo"
            className="w-16 h-16 rounded-full border-2 border-[var(--mh-primary-soft)] shadow-md mb-4 bg-white object-cover"
            width={64}
            height={64}
            priority
          />
          <h1 className="text-xl sm:text-2xl font-extrabold text-center text-gray-900">
            Mess Login
          </h1>
          <p className="text-xs text-gray-400 font-bold mb-6 mt-1 tracking-wide uppercase select-none">
            GEC Palakkad
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 w-full"
            autoComplete="on"
            action="javascript:void(0)"
          >
            {/* Server Error Alert Box */}
            {submitError && (
              <div
                className="w-full rounded-2xl bg-red-50 p-4 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2.5 animate-in fade-in duration-200"
                role="alert"
              >
                <HiExclamationTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold text-red-700">Login Failed</p>
                  <p className="mt-0.5 font-medium text-red-600/90 leading-relaxed">
                    {submitError}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-gray-600 font-semibold mb-1.5 text-xs">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={submitting}
                className={`w-full px-4 py-3 rounded-2xl border bg-gray-50/50 text-black text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--mh-primary-soft)] focus:border-[var(--mh-primary)] disabled:opacity-60 disabled:cursor-not-allowed ${
                  errors.email && touched.email
                    ? "border-red-300 focus:ring-red-50"
                    : "border-gray-200"
                }`}
                required
                autoComplete="username email"
                aria-invalid={!!errors.email}
                aria-describedby="login-email-error"
              />
              {errors.email && touched.email && (
                <div id="login-email-error" className="text-red-500 text-xs font-medium mt-1 px-1">
                  {errors.email}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-gray-600 font-semibold mb-1.5 text-xs"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={submitting}
                  className={`w-full pl-4 pr-11 py-3 rounded-2xl border bg-gray-50/50 text-black text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--mh-primary-soft)] focus:border-[var(--mh-primary)] disabled:opacity-60 disabled:cursor-not-allowed ${
                    errors.password && touched.password
                      ? "border-red-300 focus:ring-red-50"
                      : "border-gray-200"
                  }`}
                  required
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby="login-password-error"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={submitting}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition active:scale-95 disabled:opacity-40"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <HiEyeSlash className="h-5 w-5" />
                  ) : (
                    <HiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && touched.password && (
                <div
                  id="login-password-error"
                  className="text-red-500 text-xs font-medium mt-1 px-1"
                >
                  {errors.password}
                </div>
              )}
            </div>

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
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
        <div className="mt-6 text-center">
          <Link href="/forgot-password">
            <span className="inline-block text-[var(--mh-primary)] font-bold text-xs px-2 py-2 cursor-pointer transition-colors duration-150 hover:underline focus:underline active:underline rounded focus:outline-none focus:ring-2 focus:ring-[var(--mh-primary-soft)]">
              Forgot Password?
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}