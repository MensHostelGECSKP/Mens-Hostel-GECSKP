export interface ChangelogItem {
  version: string;
  releaseDate: string;
  changes: string[];
}

export interface AppConfig {
  name: string;
  version: string;
  buildNumber: string;
  releaseDate: string;
  description: string;
  developedBy: string;
  features: string[];
  changelog: ChangelogItem[];
}

export const appConfig: AppConfig = {
  name: "MH App",
  version: "2.0.2",
  buildNumber: "2026.0723.01",
  releaseDate: "July 2026",
  description: "Hostel Management System designed for attendance, mess cuts, notifications, reports and administration.",
  developedBy: "Sabari & Roomies",
  features: [
    "Attendance Tracking",
    "Mess Cut Management",
    "Bill Management",
    "Notifications",
    "Reports",
    "User Management",
    "PWA Support",
  ],
  changelog: [
    {
      version: "v2.0.2",
      releaseDate: "July 2026",
      changes: [
        "Fixed mess cut deadline to strictly enforce cutoff hour in Indian Standard Time (IST)",
        "Fixed attendance window boundary — no more off-by-one during 12:00 AM–5:30 AM IST",
        "Fixed input sanitization — names with apostrophes (D'Souza), URLs, and passwords no longer get corrupted",
        "Fixed Login page React Hooks ordering issue",
        "Mess bill uploads now automatically fall back to local storage if Google Drive fails",
        "Admins can now manually trigger payment reminders from the dashboard",
        "Payment records auto-sync for active students when a new bill is published",
        "MongoDB Atlas IP whitelist errors now show a clear diagnostic message at startup",
        "Dependency security updates across the full stack",
      ],
    },
    {
      version: "v2.0.1",
      releaseDate: "July 2026",
      changes: [
        "New Student Dashboard with live stats",
        "New Admin Dashboard for full oversight",
        "Bulk User Import via Excel sheets",
        "Monthly Reports with PDF export",
        "Bill Management with payment status tracking",
        "PWA Support for installing as a mobile app",
      ],
    },
    // Future versions can be added here easily
  ],
};
