"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import type { User } from "@/types";
import { useUpdateUser, type UpdateUserInput } from "@/hooks/useApi";
import { validateEmail } from "@/utils/validation";
import { normalizeYearValue } from "@/utils/userDisplay";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useModalLayer } from "./useModalLayer";
import { HiXMark } from "react-icons/hi2";

const YEAR_OPTIONS = [
  { value: "1", label: "Year 1" },
  { value: "2", label: "Year 2" },
  { value: "3", label: "Year 3" },
  { value: "4", label: "Year 4" },
] as const;

type EditUserModalProps = {
  user: User | null;
  onClose: () => void;
  onSaved?: (user: User) => void;
};

type FormState = {
  name: string;
  email: string;
  roomNumber: string;
  yearOfStudy: string;
  status: "active" | "inactive";
};

function buildForm(user: User): FormState {
  const year = normalizeYearValue(user.yearOfStudy) || "1";
  const status = user.status === "inactive" ? "inactive" : "active";
  return {
    name: user.name,
    email: user.email,
    roomNumber: user.roomNumber ?? "",
    yearOfStudy: ["1", "2", "3", "4"].includes(year) ? year : "1",
    status,
  };
}

function validateForm(values: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!values.name.trim()) errors.name = "Name is required";
  if (!validateEmail(values.email)) errors.email = "Enter a valid email";
  if (!values.roomNumber.trim()) errors.roomNumber = "Room number is required";
  if (!values.yearOfStudy) errors.yearOfStudy = "Year is required";
  return errors;
}

export default function EditUserModal({ user, onClose, onSaved }: EditUserModalProps) {
  const mounted = useModalLayer(!!user);
  const trapRef = useFocusTrap(!!user);
  const updateUser = useUpdateUser();

  const [values, setValues] = useState<FormState | null>(user ? buildForm(user) : null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (user) {
      setValues(buildForm(user));
      setErrors({});
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !updateUser.isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user, onClose, updateUser.isPending]);

  if (!user || !values || !mounted) return null;

  const set = (field: keyof FormState, value: string) => {
    setValues((v) => (v ? { ...v, [field]: value } : v));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: UpdateUserInput = {
      userId: user.userId,
      name: values.name.trim(),
      email: values.email.trim(),
      roomNumber: values.roomNumber.trim(),
      yearOfStudy: values.yearOfStudy,
      status: values.status,
    };

    try {
      const updated = await updateUser.mutateAsync(payload);
      toast.success("User updated successfully");
      onSaved?.(updated);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const inputClass = (field: keyof FormState) =>
    `w-full min-h-[48px] rounded-xl border bg-white px-3.5 text-[15px] text-gray-900 outline-none transition focus:ring-2 focus:ring-[var(--mh-primary)]/15 ${
      errors[field]
        ? "border-red-300 focus:border-red-400"
        : "border-gray-200 focus:border-[var(--mh-primary)]/40"
    }`;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close edit user"
        onClick={() => !updateUser.isPending && onClose()}
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
        className="relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_48px_rgba(15,23,42,0.18)] animate-in fade-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 id="edit-user-title" className="text-lg font-bold text-gray-900">
            Edit user
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={updateUser.isPending}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close"
          >
            <HiXMark className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
            <Field label="Full name" error={errors.name}>
              <input
                id="edit-name"
                type="text"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass("name")}
                autoComplete="name"
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <input
                id="edit-email"
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass("email")}
                autoComplete="email"
              />
            </Field>
            <Field label="Room number" error={errors.roomNumber}>
              <input
                id="edit-room"
                type="text"
                value={values.roomNumber}
                onChange={(e) => set("roomNumber", e.target.value)}
                className={inputClass("roomNumber")}
                placeholder="e.g. 313"
              />
            </Field>
            <Field label="Year" error={errors.yearOfStudy}>
              <select
                id="edit-year"
                value={values.yearOfStudy}
                onChange={(e) => set("yearOfStudy", e.target.value)}
                className={inputClass("yearOfStudy")}
              >
                {YEAR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" error={errors.status}>
              <select
                id="edit-status"
                value={values.status}
                onChange={(e) => set("status", e.target.value as "active" | "inactive")}
                className={inputClass("status")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <div className="flex gap-2 border-t border-gray-100 p-4">
            <button
              type="button"
              onClick={onClose}
              disabled={updateUser.isPending}
              className="min-h-[48px] flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateUser.isPending}
              className="min-h-[48px] flex-1 rounded-xl bg-[var(--mh-primary)] text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
            >
              {updateUser.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
