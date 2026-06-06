"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheckCircle, HiArrowDownTray, HiShare, HiPlus } from 'react-icons/hi2';
import { IoClose } from 'react-icons/io5';

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptType, setPromptType] = useState<'android' | 'ios' | null>(null);

  useEffect(() => {
    // Check if user is already in standalone mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // Check if user has dismissed prompt recently
    const dismissedTime = localStorage.getItem('pwa_install_dismissed_time');
    if (dismissedTime) {
      const parsedTime = parseInt(dismissedTime, 10);
      if (Date.now() - parsedTime < COOLDOWN_MS) {
        return; // Still in cooldown
      }
    }

    // Detect iOS
    const isIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };

    // Listen for beforeinstallprompt event (dispatched as custom event by PWARegistration)
    const handleInstallable = () => {
      setPromptType('android');
      setShowPrompt(true);
    };

    window.addEventListener('pwaInstallable', handleInstallable);

    // If it is iOS, wait 3 seconds and show iOS guidance
    if (isIOS()) {
      const timer = setTimeout(() => {
        setPromptType('ios');
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('pwaInstallable', handleInstallable);
    };
  }, []);

  const handleInstallClick = async () => {
    if (window.triggerPWAInstall) {
      const installed = await window.triggerPWAInstall();
      if (installed) {
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed_time', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt || !promptType) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 md:items-center">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-transparent"
          onClick={handleDismiss}
        />

        {/* Custom Install Modal */}
        <motion.div
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col z-10"
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="Close prompt"
          >
            <IoClose className="h-5 w-5" />
          </button>

          {/* Icon Header */}
          <div className="flex items-center gap-4 mb-4 mt-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--mh-primary-soft)] text-[var(--mh-primary)] shadow-sm">
              <HiArrowDownTray className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-gray-950">Install MH App</h2>
              <p className="text-xs text-[var(--mh-primary)] font-semibold">Mens Hostel GECSKP</p>
            </div>
          </div>

          {promptType === 'android' ? (
            <>
              {/* Benefits list */}
              <div className="space-y-3 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <HiCheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-gray-600">✓ Faster Access</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <HiCheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-gray-600">✓ App-like Experience</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <HiCheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-gray-600">✓ Home Screen Access</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 min-h-[48px] rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.96] transition active-press"
                >
                  Later
                </button>
                <button
                  onClick={handleInstallClick}
                  className="flex-1 min-h-[48px] rounded-2xl bg-[var(--mh-primary)] text-sm font-semibold text-white hover:bg-[var(--mh-primary)]/90 shadow-md shadow-indigo-600/10 active:scale-[0.96] transition active-press"
                >
                  Install Now
                </button>
              </div>
            </>
          ) : (
            <>
              {/* iOS Manual Installation Guide */}
              <div className="mb-6 text-sm text-gray-600 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <p className="text-xs leading-relaxed">
                  Add MH App to your Home Screen for a native mobile experience on iOS.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-gray-700 shrink-0 mt-0.5">1</span>
                    <p className="text-xs">
                      Tap the <span className="font-semibold inline-flex items-center gap-1 bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-800"><HiShare className="inline h-3.5 w-3.5 text-blue-500" /> Share</span> button at the bottom of Safari.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-gray-700 shrink-0 mt-0.5">2</span>
                    <p className="text-xs">
                      Scroll down and select <span className="font-semibold inline-flex items-center gap-1 bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-800"><HiPlus className="inline h-3.5 w-3.5" /> Add to Home Screen</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleDismiss}
                className="w-full min-h-[48px] rounded-2xl bg-[var(--mh-primary)] text-sm font-semibold text-white hover:bg-[var(--mh-primary)]/90 shadow-md active:scale-[0.96] transition active-press"
              >
                Got It
              </button>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
