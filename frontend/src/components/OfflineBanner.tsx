"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiWifi } from 'react-icons/hi2';
import { MdCloudOff } from 'react-icons/md';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);
  const [showOnlineNotification, setShowOnlineNotification] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setHasBeenOffline(true);
    }

    const handleOnline = () => {
      setIsOnline(true);
      if (hasBeenOffline) {
        setShowOnlineNotification(true);
        // Hide the online notice after 3 seconds
        const timer = setTimeout(() => {
          setShowOnlineNotification(false);
          setHasBeenOffline(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasBeenOffline(true);
      setShowOnlineNotification(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasBeenOffline]);

  return (
    <AnimatePresence>
      {/* Offline banner */}
      {!isOnline && (
        <motion.div
          initial={{ y: -80, x: '-50%', opacity: 0 }}
          animate={{ y: 0, x: '-50%', opacity: 1 }}
          exit={{ y: -80, x: '-50%', opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed top-4 left-1/2 z-[150] flex items-center gap-2.5 rounded-full bg-rose-600 px-5 py-3 text-xs font-bold text-white shadow-lg border border-rose-500/20 backdrop-blur-md select-none w-[90%] max-w-sm justify-center"
        >
          <MdCloudOff className="h-5 w-5 animate-pulse text-rose-100" />
          <span>Connection Lost. You are offline.</span>
        </motion.div>
      )}

      {/* Connection Restored banner */}
      {isOnline && showOnlineNotification && (
        <motion.div
          initial={{ y: -80, x: '-50%', opacity: 0 }}
          animate={{ y: 0, x: '-50%', opacity: 1 }}
          exit={{ y: -80, x: '-50%', opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed top-4 left-1/2 z-[150] flex items-center gap-2.5 rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg border border-emerald-500/20 backdrop-blur-md select-none w-[90%] max-w-sm justify-center"
        >
          <HiWifi className="h-5 w-5 text-emerald-100" />
          <span>Back Online! Syncing changes...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
