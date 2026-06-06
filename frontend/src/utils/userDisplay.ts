import type { User, UserStatus } from "@/types";

const AVATAR_PALETTES = [
  { bg: "#EDE9FE", text: "#5B21B6" },
  { bg: "#DBEAFE", text: "#1D4ED8" },
  { bg: "#FEF3C7", text: "#B45309" },
  { bg: "#FCE7F3", text: "#BE185D" },
  { bg: "#D1FAE5", text: "#047857" },
  { bg: "#E0E7FF", text: "#4338CA" },
] as const;

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const compact = name.replace(/[^a-zA-Z]/g, "");
  if (compact.length >= 2) return compact.slice(0, 2).toUpperCase();
  return (name.charAt(0) || "?").toUpperCase();
}

export function getAvatarPalette(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

/** Display username derived from email (local part). */
export function getDisplayUsername(user: User): string {
  const local = user.email.split("@")[0] ?? user.email;
  return local;
}

export function getUserStatus(user: User): UserStatus {
  const status = user.status ?? "active";
  if (status === "inactive" || status === "blocked") return status;
  return "active";
}

export function formatRoomLabel(roomNumber?: string): string | null {
  if (!roomNumber?.trim()) return null;
  return `Room ${roomNumber.trim()}`;
}

export function formatYearLabel(yearOfStudy?: string): string | null {
  if (!yearOfStudy?.trim()) return null;
  const y = yearOfStudy.trim();
  return y.toLowerCase().startsWith("year") ? y : `Year ${y}`;
}

export function normalizeYearValue(yearOfStudy?: string): string {
  if (!yearOfStudy?.trim()) return "";
  return yearOfStudy.replace(/^year\s*/i, "").trim();
}
