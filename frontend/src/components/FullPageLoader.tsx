"use client";

import React from "react";
import { motion } from "framer-motion";

type FullPageLoaderProps = {
  text?: string;
};

export default function FullPageLoader({ text = "Preparing your dashboard..." }: FullPageLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--mh-surface)] px-4"
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Sleek Modern Spinner Container */}
        <div className="relative h-12 w-12 flex items-center justify-center">
          {/* Inner pulse halo effect */}
          <div className="absolute inset-1.5 animate-ping rounded-full bg-[var(--mh-primary)]/15" />
          
          {/* Outer rotating ring */}
          <svg
            className="animate-spin h-12 w-12 text-[var(--mh-primary)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-10"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3.5"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* Pulsing Modern typography label */}
        <p className="text-sm font-semibold tracking-tight text-gray-500 animate-pulse select-none">
          {text}
        </p>
      </div>
    </motion.div>
  );
}
