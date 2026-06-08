"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/context/AuthContext";
import {
  HiOutlineDocumentDownload,
  HiOutlineExternalLink,
  HiOutlineTrash,
  HiBell,
  HiOutlineDocumentText,
  HiOutlineSpeakerphone,
  HiOutlineCog,
  HiMailOpen
} from "react-icons/hi";
import { useForm } from "@/utils/useForm";
import {
  useNotifications,
  useCreateNotification,
  useDeleteNotification,
  useMarkNotificationRead,
  useMarkAllNotificationsRead
} from "@/hooks/useApi";
import PullToRefresh from "@/components/student/PullToRefresh";
import { NotificationsSkeleton } from "@/components/student/Skeleton";
import EmptyState from "@/components/student/EmptyState";
import { AppHeader, PageContainer } from "@/components/ui";

export default function NotificationsPage() {
  const user = useCurrentUser();
  const [deletingNotification, setDeletingNotification] = useState<string | null>(null);
  const [genericFormError, setGenericFormError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  
  // React Query hooks
  const { data: notifications = [], isLoading: loading, error, refetch } = useNotifications();
  const createNotificationMutation = useCreateNotification();
  const deleteNotificationMutation = useDeleteNotification();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const visibleNotifications = React.useMemo(() => {
    return notifications.slice(0, pageSize);
  }, [notifications, pageSize]);

  // Mark a notification as read
  const handleMarkAsRead = useCallback(async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await markReadMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, [markReadMutation]);

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
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
    initialValues: { title: "", message: "", pdfUrl: "", type: "general", sendPush: false },
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
        setValues({ title: "", message: "", pdfUrl: "", type: "general", sendPush: false });
        refetch();
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Failed to add notification";
        setGenericFormError(errMsg);
        toast.error(errMsg);
      }
    },
  });

  // Delete notification function (dismisses locally for student, deletes globally for admin)
  const handleDeleteNotification = async (notificationId: string) => {
    const confirmMsg = user?.role === "admin"
      ? "Are you sure you want to delete this notification globally? Residents will no longer see it."
      : "Dismiss this notification? It will be removed from your view.";

    if (!confirm(confirmMsg)) {
      return;
    }
    
    setDeletingNotification(notificationId);
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      toast.success(user?.role === "admin" ? "Notification deleted globally" : "Notification dismissed");
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
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Helper to resolve icon, badge styling, and label based on type
  const getCategoryDetails = (type?: string) => {
    const t = String(type || "general").toLowerCase();
    if (t.includes("bill")) {
      return {
        label: "Mess Bill",
        icon: HiOutlineDocumentText,
        classes: "bg-amber-50 text-amber-700 border-amber-100"
      };
    }
    if (t.includes("announcement") || t.includes("notice")) {
      return {
        label: "Announcement",
        icon: HiOutlineSpeakerphone,
        classes: "bg-purple-50 text-purple-700 border-purple-100"
      };
    }
    if (t.includes("system")) {
      return {
        label: "System Alert",
        icon: HiOutlineCog,
        classes: "bg-rose-50 text-rose-700 border-rose-100"
      };
    }
    return {
      label: "General",
      icon: HiBell,
      classes: "bg-slate-50 text-slate-700 border-slate-100"
    };
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={refreshing}>
      <AppHeader
        title="Hostel Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "Up to date"}
        showMenu={true}
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-xs font-bold text-indigo-600 bg-indigo-50/70 px-3.5 py-2 rounded-full hover:bg-indigo-100 transition active:scale-95 active-press cursor-pointer flex items-center gap-1.5"
            >
              <HiMailOpen className="text-sm" /> Mark all read
            </button>
          ) : undefined
        }
      />
      <PageContainer>
        <div className="w-full flex flex-col gap-6">

          {user?.role === "admin" && (
            <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">New Notification</h2>
              
              <div className="flex flex-col">
                <label htmlFor="title" className="text-gray-700 font-medium mb-1 text-xs">Title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={values.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900 ${errors.title && touched.title ? 'border-red-400' : ''}`}
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
                  className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900 min-h-[70px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900 ${errors.pdfUrl && touched.pdfUrl ? 'border-red-400' : ''}`}
                    aria-invalid={!!errors.pdfUrl}
                    aria-describedby="notif-pdf-error"
                  />
                  {errors.pdfUrl && touched.pdfUrl && <div id="notif-pdf-error" className="text-red-500 text-xs mt-1">{errors.pdfUrl}</div>}
                </div>

                <div className="flex flex-col">
                  <label htmlFor="type" className="text-gray-700 font-medium mb-1 text-xs">Category</label>
                  <select
                    id="type"
                    name="type"
                    value={values.type}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900"
                  >
                    <option value="general">General</option>
                    <option value="announcements">Announcement</option>
                    <option value="bills">Mess Bill</option>
                    <option value="system">System Alert</option>
                  </select>
                </div>
              </div>

              {/* Push Dispatch Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-b border-gray-50 mt-1">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-700">Send Push Notification</span>
                  <span className="text-[10px] text-gray-400">Dispatch alerts instantly to opted-in devices</span>
                </div>
                <button
                  type="button"
                  onClick={() => setValues((prev: any) => ({ ...prev, sendPush: !prev.sendPush }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    values.sendPush ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                  role="switch"
                  aria-checked={values.sendPush}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      values.sendPush ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {genericFormError && <div className="text-red-600 text-xs font-semibold">{genericFormError}</div>}
              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition active:scale-[0.97] active-press font-semibold mt-1 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-100" 
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add Notification"}
              </button>
            </form>
          )}

          {error ? (
            <div className="rounded-2xl bg-red-50/60 p-5 text-center border border-red-100">
              <p className="text-sm font-medium text-red-600">
                {error.message || "Unable to load notifications."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3.5 inline-flex min-h-[36px] items-center justify-center rounded-full bg-red-600 px-5 text-xs font-semibold text-white active:scale-95 active-press cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
              <EmptyState
                icon={HiBell}
                title="No notifications yet"
                description="Important announcements and updates published by the hostel warden or clerk will appear here."
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ul className="flex flex-col gap-3.5">
                {visibleNotifications.map((n) => {
                  const isRead = !!n.isRead;
                  const cat = getCategoryDetails(n.type);
                  const CategoryIcon = cat.icon;

                  return (
                    <li 
                      key={n._id} 
                      onClick={() => handleMarkAsRead(n._id, isRead)}
                      className={`relative flex flex-col items-stretch bg-white hover:bg-slate-50/30 rounded-2xl p-4.5 shadow-sm border transition-all duration-200 cursor-pointer ${
                        isRead ? "border-gray-100" : "border-indigo-100 bg-indigo-50/10"
                      }`}
                    >
                      {/* Unread indicator dot */}
                      {!isRead && (
                        <span className="absolute top-5.5 left-5.5 flex h-2 w-2 rounded-full bg-indigo-600" aria-hidden />
                      )}

                      <div className={`flex-1 text-left ${!isRead ? "pl-4.5" : ""}`}>
                        {/* Header details with Category badge */}
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border ${cat.classes}`}>
                            <CategoryIcon className="text-xs shrink-0" />
                            {cat.label}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                        </div>

                        {/* Title */}
                        <span className={`text-base font-bold tracking-tight block ${isRead ? "text-gray-900" : "text-indigo-950"}`}>
                          {n.title}
                        </span>

                        {/* Message body */}
                        {n.message && (
                          <div className="text-[13px] text-gray-600 mt-2.5 leading-relaxed whitespace-pre-line font-medium">
                            {n.message}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-3.5 border-t border-gray-100/60 justify-end">
                        {(n.type?.startsWith("mess_bill") || n.messBillId) && (
                          <Link
                            href="/mess-bill"
                            className="inline-flex min-h-[34px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100/40 hover:bg-indigo-100/50 transition active:scale-95 active-press text-xs font-semibold"
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
                              className="inline-flex min-h-[34px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100 transition active:scale-95 active-press text-xs font-semibold"
                            >
                              <HiOutlineExternalLink className="text-sm" /> Preview
                            </a>
                            <a
                              href={n.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="inline-flex min-h-[34px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition active:scale-95 active-press text-xs font-semibold"
                            >
                              <HiOutlineDocumentDownload className="text-sm" /> Download
                            </a>
                          </>
                        )}

                        {/* Dismiss (student) / Delete (admin) Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // prevent mark read triggering
                            handleDeleteNotification(n._id);
                          }}
                          disabled={deletingNotification === n._id}
                          className="inline-flex min-h-[34px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100/70 transition active:scale-95 active-press text-xs font-semibold disabled:opacity-50 cursor-pointer"
                          title={user?.role === "admin" ? "Delete globally" : "Dismiss locally"}
                        >
                          {deletingNotification === n._id ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                          ) : (
                            <>
                              <HiOutlineTrash className="text-sm" />
                              {user?.role === "admin" ? "Delete" : "Dismiss"}
                            </>
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {notifications.length > pageSize && (
                <button
                  type="button"
                  onClick={() => setPageSize((prev) => prev + 10)}
                  className="w-full py-3 mt-2 text-center text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-2xl border border-dashed border-indigo-200 transition active:scale-[0.98] active-press cursor-pointer"
                >
                  + Show More ({notifications.length - pageSize} left)
                </button>
              )}
            </div>
          )}
        </div>
      </PageContainer>
    </PullToRefresh>
  );
}