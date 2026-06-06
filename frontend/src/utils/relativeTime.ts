/** Format a date as a compact relative time string (e.g. "2m ago"). */
export function formatRelativeTime(date: Date | string): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - then.getTime();

  if (Number.isNaN(then.getTime()) || diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Extract creation timestamp embedded in a MongoDB ObjectId. */
export function timestampFromObjectId(id: string): Date | null {
  if (!id || id.length < 8) return null;
  try {
    return new Date(parseInt(id.substring(0, 8), 16) * 1000);
  } catch {
    return null;
  }
}
