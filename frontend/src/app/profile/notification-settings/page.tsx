"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
  HiOutlineBell,
  HiOutlineChevronLeft,
  HiOutlineDocumentText,
  HiOutlineMegaphone,
  HiOutlineCog8Tooth,
  HiOutlineShieldCheck,
  HiOutlineDevicePhoneMobile
} from "react-icons/hi2";
import {
  useVapidPublicKey,
  useSubscribePush,
  useUnsubscribePush,
  useUpdateNotificationSettings
} from "@/hooks/useApi";
import { AppHeader, PageContainer } from "@/components/ui";

// Helper to convert VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading, refreshUser } = useAuth();

  // Push Subscription State
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");
  const [subscribing, setSubscribing] = useState(false);

  // Load hooks
  const { data: vapidPublicKey } = useVapidPublicKey();
  const subscribePushMutation = useSubscribePush();
  const unsubscribePushMutation = useUnsubscribePush();
  const updateSettingsMutation = useUpdateNotificationSettings();

  // Local state for categories (syncs with user preferences)
  const [prefs, setPrefs] = useState({
    bills: true,
    announcements: true,
    system: true
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [loading, isLoggedIn, router]);

  // Set initial preferences from user model
  useEffect(() => {
    if (user?.notificationPreferences) {
      setPrefs({
        bills: user.notificationPreferences.bills !== false,
        announcements: user.notificationPreferences.announcements !== false,
        system: user.notificationPreferences.system !== false
      });
    }
  }, [user]);

  // Detect push notification support and current status
  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported = "serviceWorker" in navigator && "PushManager" in window;
      setIsPushSupported(supported);

      if (supported) {
        setPermissionState(Notification.permission);
        checkSubscription();
      } else {
        setPermissionState("unsupported");
      }
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsPushSubscribed(!!subscription);
    } catch (err) {
      console.error("Failed to check push subscription status:", err);
    }
  };

  // Toggle push subscription
  const handlePushToggle = async () => {
    if (!isPushSupported || subscribing) return;

    setSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();

      if (existingSub) {
        // Unsubscribe
        await existingSub.unsubscribe();
        await unsubscribePushMutation.mutateAsync(existingSub.endpoint);
        setIsPushSubscribed(false);
        toast.success("Successfully unsubscribed from push notifications");
      } else {
        // Request Permission
        const permission = await Notification.requestPermission();
        setPermissionState(permission);

        if (permission === "denied") {
          toast.error("Permission denied. Please enable notifications in your browser settings.");
          setSubscribing(false);
          return;
        }

        if (permission === "granted") {
          if (!vapidPublicKey) {
            toast.error("Push notification configuration is loading. Try again in a moment.");
            setSubscribing(false);
            return;
          }

          const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
          const newSub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
          });

          await subscribePushMutation.mutateAsync(JSON.parse(JSON.stringify(newSub)));
          setIsPushSubscribed(true);
          toast.success("Subscribed to push notifications successfully!");
        }
      }
    } catch (err: any) {
      console.error("Push registration error:", err);
      toast.error(err.message || "Failed to update push subscription");
    } finally {
      setSubscribing(false);
    }
  };

  // Toggle categories preferences
  const handleCategoryToggle = async (key: keyof typeof prefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);

    try {
      await updateSettingsMutation.mutateAsync(newPrefs);
      await refreshUser(); // refresh AuthContext state
      toast.success("Preferences updated successfully");
    } catch (err: any) {
      setPrefs(prefs); // Revert
      toast.error("Failed to update preferences");
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <AppHeader
        title="Notification Settings"
        subtitle="Manage how you receive alerts"
        showMenu={false}
        actions={
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm border border-gray-100 hover:bg-gray-50 transition active:scale-95 active-press cursor-pointer"
            aria-label="Back"
          >
            <HiOutlineChevronLeft className="h-5 w-5" />
          </button>
        }
      />
      <PageContainer>
        <div className="flex flex-col gap-6">
          
          {/* Push Status Information Card */}
          <div className="w-full rounded-2xl bg-white p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <HiOutlineDevicePhoneMobile className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-gray-900">Device Push Notifications</h2>
                <p className="mt-1 text-xs font-medium text-gray-500 leading-relaxed">
                  Receive real-time alerts on this browser when mess bills are uploaded or urgent hostel announcements are published.
                </p>
              </div>
            </div>

            {/* Support States */}
            <div className="mt-5 pt-4 border-t border-gray-100/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-800">
                  {!isPushSupported
                    ? "Not supported on this browser"
                    : permissionState === "denied"
                    ? "Blocked by browser settings"
                    : isPushSubscribed
                    ? "Subscribed"
                    : "Not subscribed"}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {!isPushSupported
                    ? "PWAs require modern browser support."
                    : permissionState === "denied"
                    ? "Please reset site permissions to enable."
                    : isPushSubscribed
                    ? "Receive notifications when app is closed."
                    : "Enable notifications to stay informed."}
                </p>
              </div>

              {isPushSupported && permissionState !== "denied" && (
                <button
                  onClick={handlePushToggle}
                  disabled={subscribing}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isPushSubscribed ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                  role="switch"
                  aria-checked={isPushSubscribed}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isPushSubscribed ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              )}
            </div>

            {permissionState === "denied" && (
              <div className="mt-3.5 rounded-xl bg-amber-50/60 border border-amber-100 p-3 flex gap-2">
                <span className="text-amber-500 text-sm">⚠️</span>
                <span className="text-[10px] font-medium text-amber-800 leading-normal">
                  Notifications are blocked. To enable, click the lock/settings icon next to the URL bar in your browser and toggle notifications "Allow".
                </span>
              </div>
            )}
          </div>

          {/* Preferences Categories Card */}
          <div className="w-full rounded-2xl bg-white p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4.5">
              Notification Preferences
            </h3>

            <div className="flex flex-col gap-4">
              
              {/* Bills Category */}
              <div className="flex items-center justify-between pb-3.5 border-b border-gray-50">
                <div className="flex gap-3 items-start">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 mt-0.5">
                    <HiOutlineDocumentText className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Mess Bills</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Publish alerts, 3-day and 1-day reminders.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCategoryToggle("bills")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    prefs.bills ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                  role="switch"
                  aria-checked={prefs.bills}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      prefs.bills ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Announcements Category */}
              <div className="flex items-center justify-between pb-3.5 border-b border-gray-50">
                <div className="flex gap-3 items-start">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 mt-0.5">
                    <HiOutlineMegaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Announcements</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Hostel meetings, maintenance alerts, warden notices.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCategoryToggle("announcements")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    prefs.announcements ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                  role="switch"
                  aria-checked={prefs.announcements}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      prefs.announcements ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* System alerts Category */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3 items-start">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 mt-0.5">
                    <HiOutlineCog8Tooth className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">System & General Alerts</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Account updates, security logs, general site notifications.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCategoryToggle("system")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    prefs.system ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                  role="switch"
                  aria-checked={prefs.system}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      prefs.system ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          {/* Privacy Note */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4.5 flex gap-3">
            <HiOutlineShieldCheck className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-[11px] font-medium text-slate-500 leading-normal">
              <span className="font-semibold text-slate-700">Privacy & Spam Protection:</span> We only send notifications triggered explicitly by hostel administration or for mess bill events that require your action. You can disable all push alerts and notification categories at any time.
            </div>
          </div>

        </div>
      </PageContainer>
    </>
  );
}
