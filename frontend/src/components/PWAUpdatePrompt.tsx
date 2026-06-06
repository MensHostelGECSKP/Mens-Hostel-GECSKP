"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiSparkles } from 'react-icons/hi2';
import { IoClose } from 'react-icons/io5';

export default function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const handleUpdateAvailable = (event: CustomEvent<ServiceWorker>) => {
      console.log('[PWA] Update available event received');
      if (event.detail) {
        setWaitingWorker(event.detail);
        setShowPrompt(true);
      }
    };

    window.addEventListener('pwaUpdateAvailable', handleUpdateAvailable as any);

    return () => {
      window.removeEventListener('pwaUpdateAvailable', handleUpdateAvailable as any);
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker && window.triggerPWAUpdate) {
      window.triggerPWAUpdate(waitingWorker);
      setShowPrompt(false);
    }
  };

  if (!showPrompt || !waitingWorker) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-20 left-1/2 z-[140] w-[92%] max-w-md -translate-x-1/2 md:bottom-6">
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 210 }}
          className="relative flex items-center justify-between gap-4 rounded-3xl bg-slate-900 p-4 pl-5 text-white shadow-2xl border border-slate-800 backdrop-blur-md select-none"
        >
          {/* Main Content */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/30 text-violet-400">
              <HiSparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold tracking-tight text-white">New Version Available</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">Reload the app to apply the latest updates.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleUpdate}
              className="rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-violet-500 active:scale-95 transition"
            >
              Update Now
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition"
              aria-label="Dismiss update notification"
            >
              <IoClose className="h-4.5 w-4.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
