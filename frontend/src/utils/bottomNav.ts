export type BottomNavTab = "home" | "mess" | "notifications" | "profile";

const MESS_ROUTE_PREFIXES = [
  "/mess-bill",
  "/mess",
  "/monthly-report",
  "/dashboard/upload-mess-bill",
  "/dashboard/monthly-report",
] as const;

function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isMessRoute(pathname: string): boolean {
  return MESS_ROUTE_PREFIXES.some((prefix) => matchesRoutePrefix(pathname, prefix));
}

/** Resolve which bottom tab should appear active for the current pathname. */
export function getActiveBottomNavTab(pathname: string): BottomNavTab | null {
  if (matchesRoutePrefix(pathname, "/profile")) return "profile";
  if (matchesRoutePrefix(pathname, "/notifications")) return "notifications";
  if (isMessRoute(pathname)) return "mess";
  if (pathname === "/dashboard") return "home";
  if (pathname.startsWith("/dashboard/")) return "home";
  return null;
}
