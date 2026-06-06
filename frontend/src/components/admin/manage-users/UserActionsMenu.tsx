"use client";

import React, { useEffect, useRef } from "react";
import type { User } from "@/types";

export type UserMenuAction = "view" | "edit" | "deactivate" | "delete";

type UserActionsMenuProps = {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: UserMenuAction, user: User) => void;
};

const PRIMARY_ITEMS: { action: UserMenuAction; label: string }[] = [
  { action: "view", label: "View user" },
  { action: "edit", label: "Edit user" },
  { action: "deactivate", label: "Deactivate user" },
];

export default function UserActionsMenu({
  user,
  open,
  onOpenChange,
  onAction,
}: UserActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onOpenChange]);

  const run = (action: UserMenuAction) => {
    onOpenChange(false);
    onAction(action, user);
  };

  return (
    <div className="relative shrink-0 self-start" ref={menuRef}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 active:scale-[0.96]"
        aria-label={`Actions for ${user.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[180px] origin-top-right animate-in fade-in duration-150 rounded-xl border border-gray-100 bg-white py-1 shadow-[0_8px_30px_rgba(15,23,42,0.12)]"
        >
          {PRIMARY_ITEMS.map((item) => (
            <button
              key={item.action}
              type="button"
              role="menuitem"
              className="flex min-h-[44px] w-full items-center px-4 text-left text-sm font-medium text-gray-800 transition hover:bg-gray-50"
              onClick={() => run(item.action)}
            >
              {item.label}
            </button>
          ))}
          <div className="my-1 border-t border-gray-100" role="separator" />
          <button
            type="button"
            role="menuitem"
            className="flex min-h-[44px] w-full items-center px-4 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
            onClick={() => run("delete")}
          >
            Delete user
          </button>
        </div>
      )}
    </div>
  );
}
