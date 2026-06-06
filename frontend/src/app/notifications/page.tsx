"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/context/AuthContext";
import { HiOutlineDocumentDownload, HiOutlineExternalLink, HiOutlineTrash, HiBell } from "react-icons/hi";
import { useForm } from "@/utils/useForm";
import { useNotifications, useCreateNotification, useDeleteNotification } from "@/hooks/useApi";
import PullToRefresh from "@/components/student/PullToRefresh";
import { NotificationsSkeleton } from "@/components/student/Skeleton";
import EmptyState from "@/components/student/EmptyState";

export default function NotificationsPage() {
  const user = useCurrentUser();
  const [deletingNotification, setDeletingNotification] = useState<string | null>(null);
  const [genericFormError, setGenericFormError] = useState("");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use React Query hooks
  const { data: notifications = [], isLoading: loading, error, refetch } = useNotifications();
  const createNotificationMutation = useCreateNotification();
  const deleteNotificationMutation = useDeleteNotification();

  // Load read notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mhapp_read_notifications");
      if (saved) {
        try {
          setReadIds(JSON.parse(saved));
        } catch {
          setReadIds([]);
        }
      }
    }
  }, []);

  // Mark a notification as read
  const handleMarkAsRead = useCallback((id: string) => {
    if (readIds.includes(id)) return;
    const updated = [...readIds, id];
    setReadIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("mhapp_read_notifications", JSON.stringify(updated));
    }
  }, [readIds]);

  // Mark all as read
  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n._id);
    setReadIds(allIds);
    if (typeof window !== "undefined") {
      localStorage.setItem("mhapp_read_notifications", JSON.stringify(allIds));
    }
    toast.success("All notifications marked as read");
  };

  // Pull to refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch {
      toast.error("Failed to refresh notifications");
    } finally {
      setRefreshing(false);
    }
  };

  // useForm for admin notification form
  const {
    values,
    errors,
    touched,
    submitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setErrors,
    setValues,
  } = useForm({
    initialValues: { title: "", message: "", pdfUrl: "", type: "" },
    validate: (vals) => {
      const errs: { [key: string]: string } = {};
      if (!vals.title) errs.title = "Title is required.";
      return errs;
    },
    onSubmit: async (vals) => {
      setErrors({});
      setGenericFormError("");
      try {
        await createNotificationMutation.mutateAsync(vals);
        toast.success("Notification published successfully!");
        setValues({ title: "", message: "", pdfUrl: "", type: "" });
        refetch();
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Failed to add notification";
        setGenericFormError(errMsg);
        toast.error(errMsg);
      }
    },
  });

  // Delete notification function
  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }
    
    setDeletingNotification(notificationId);
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      toast.success("Notification deleted");
      refetch();
    } catch (err: unknown) {
      console.error('Failed to delete notification:', err);
      toast.error("Failed to delete notification");
    } finally {
      setDeletingNotification(null);
    }
  };

  if (loading) {
    return <NotificationsSkeleton />;
  }

  // Determine if there are unread notifications
  const unreadCount = notifications.filter(n => !readIds.includes(n._id)).length;

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={refreshing}>
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-2 py-4 pb-20">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 mt-2">
          
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-indigo-700">Hostel Notifications</h1>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition active:scale-95 active-press"
              >
                Mark all read
              </button>
            )}
          </div>

          {user?.role === "admin" && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-3.5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">New Notification</h2>
              <div className="flex flex-col">
                <label htmlFor="title" className="text-gray-700 font-medium mb-1 text-xs">Title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={values.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900 ${errors.title && touched.title ? 'border-red-400' : ''}`}
                  required
                  aria-invalid={!!errors.title}
                  aria-describedby="notif-title-error"
                />
                {errors.title && touched.title && <div id="notif-title-error" className="text-red-500 text-xs mt-1">{errors.title}</div>}
              </div>
              <div className="flex flex-col">
                <label htmlFor="message" className="text-gray-700 font-medium mb-1 text-xs">Message (optional)</label>
                <textarea
                  id="message"
                  name="message"
                  value={values.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900 min-h-[60px]"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="pdfUrl" className="text-gray-700 font-medium mb-1 text-xs">PDF Link (optional)</label>
                <input
                  id="pdfUrl"
                  name="pdfUrl"
                  type="url"
                  value={values.pdfUrl}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Paste PDF link here"
                  className={`rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900 ${errors.pdfUrl && touched.pdfUrl ? 'border-red-400' : ''}`}
                  aria-invalid={!!errors.pdfUrl}
                  aria-describedby="notif-pdf-error"
                />
                {errors.pdfUrl && touched.pdfUrl && <div id="notif-pdf-error" className="text-red-500 text-xs mt-1">{errors.pdfUrl}</div>}
              </div>
              <div className="flex flex-col">
                <label htmlFor="type" className="text-gray-700 font-medium mb-1 text-xs">Type (optional)</label>
                <input
                  id="type"
                  name="type"
                  type="text"
                  value={values.type}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. due, closure, mess-cut"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900"
                />
              </div>
              {genericFormError && <div className="text-red-600 text-xs font-semibold">{genericFormError}</div>}
              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition active:scale-[0.97] active-press font-semibold mt-1 flex items-center justify-center gap-2" 
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Adding...
                  </span>
                ) : "Add Notification"}
              </button>
            </form>
          )}

          {error ? (
            <div className="rounded-xl bg-red-50 p-4 text-center">
              <p className="text-sm font-medium text-red-600">
                {error.message || "Unable to load notifications."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 inline-flex min-h-[36px] items-center justify-center rounded-full bg-red-600 px-4 text-xs font-semibold text-white active:scale-95 active-press"
              >
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={HiBell}
              title="No notifications yet"
              description="Important announcements and updates published by the hostel warden or clerk will appear here."
            />
          ) : (
            <ul className="flex flex-col gap-3.5">
              {notifications.map((n) => {
                const isRead = readIds.includes(n._id);
                return (
                  <li 
                    key={n._id} 
                    onClick={() => handleMarkAsRead(n._id)}
                    className={`relative flex flex-col items-stretch bg-white hover:bg-slate-50/50 rounded-2xl p-4 shadow-sm border transition-all duration-200 cursor-pointer ${
                      isRead ? "border-gray-100" : "border-indigo-100 bg-indigo-50/15"
                    }`}
                  >
                    {!isRead && (
                      <span className="absolute top-4.5 left-4.5 flex h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden />
                    )}
                    <div className={`flex-1 text-left ${!isRead ? "pl-5" : ""}`}>
                      <span className={`text-base font-bold ${isRead ? "text-gray-900" : "text-indigo-950"}`}>{n.title}</span>
                      <div className="text-[11px] font-medium text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</div>
                      {n.type && (
                        <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-1.5">
                          {n.type}
                        </span>
                      )}
                      {n.message && <div className="text-[13px] text-gray-600 mt-2.5 leading-relaxed whitespace-pre-line font-medium">{n.message}</div>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 pt-3.5 border-t border-gray-100/60 justify-end">
                      {(n.type?.startsWith("mess_bill") || n.messBillId) && (
                        <Link
                          href="/mess-bill"
                          className="inline-flex min-h-[36px] items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100/50 transition active:scale-95 active-press text-xs font-semibold"
                        >
                          View Bills
                        </Link>
                      )}
                      {n.pdfUrl && (
                        <>
                          <a
                            href={n.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[36px] items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100 transition active:scale-95 active-press text-xs font-semibold"
                          >
                            <HiOutlineExternalLink className="text-sm" /> Preview
                          </a>
                          <a
                            href={n.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex min-h-[36px] items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition active:scale-95 active-press text-xs font-semibold"
                          >
                            <HiOutlineDocumentDownload className="text-sm" /> Download
                          </a>
                        </>
                      )}
                      {user?.role === "admin" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // prevent mark read triggering
                            handleDeleteNotification(n._id);
                          }}
                          disabled={deletingNotification === n._id}
                          className="inline-flex min-h-[36px] items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100/70 transition active:scale-95 active-press text-xs font-semibold disabled:opacity-50"
                          title="Delete notification"
                        >
                          {deletingNotification === n._id ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                          ) : (
                            <>
                              <HiOutlineTrash className="text-sm" /> Delete
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}
 