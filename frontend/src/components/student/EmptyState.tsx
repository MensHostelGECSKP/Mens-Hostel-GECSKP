"use client";

import React from "react";
import Link from "next/link";
import { IconType } from "react-icons";

type EmptyStateProps = {
  icon: IconType | React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (typeof Icon === "function") {
      const IconComp = Icon as IconType;
      return <IconComp className="h-7 w-7" aria-hidden />;
    }
    return Icon;
  };

  return (
    <div className="rounded-2xl bg-white px-6 py-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-50/50">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--mh-primary-soft)] text-[var(--mh-primary)]">
        {renderIcon()}
      </span>
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      <p className="mt-1.5 text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <div className="mt-5">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--mh-primary)] px-6 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:opacity-95"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--mh-primary)] px-6 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:opacity-95"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
