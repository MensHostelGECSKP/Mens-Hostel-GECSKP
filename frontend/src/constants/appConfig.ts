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
  version: "2.0.1",
  buildNumber: "2026.0607.01",
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
