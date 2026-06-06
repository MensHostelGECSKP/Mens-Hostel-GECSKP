"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AdminOverviewCard from "@/components/admin/AdminOverviewCard";
import AdminActionGrid from "@/components/admin/AdminActionGrid";
import AdminAttendanceSummary from "@/components/admin/AdminAttendanceSummary";
import AdminRecentActivity from "@/components/admin/AdminRecentActivity";
import PullToRefresh from "@/components/student/PullToRefresh";
import {
  useAttendanceSummary,
  useMessBills,
  useNotifications,
  useUsers,
} from "@/hooks/useApi";
import type { AttendanceSummaryDetail } from "@/types";

function formatTodayLabel() {
  const now = new Date();
  return `Today, ${now.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function handlePDFExport(doc: jsPDF, filename: string) {
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    const downloadLink = document.createElement("a");
    downloadLink.href = pdfUrl;
    downloadLink.download = filename;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } else {
    window.open(pdfUrl, "_blank");
    const downloadLink = document.createElement("a");
    downloadLink.href = pdfUrl;
    downloadLink.download = filename;
    downloadLink.click();
  }

  setTimeout(() => URL.revokeObjectURL(pdfUrl), 2000);
}

export default function AdminDashboard() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [fetchDate, setFetchDate] = useState("");
  const [navLoading, setNavLoading] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const {
    data: attendanceSummary,
    isLoading: loadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useAttendanceSummary(fetchDate);

  const {
    data: users = [],
    isLoading: loadingUsers,
    refetch: refetchUsers,
  } = useUsers(true);

  const {
    data: notifications = [],
    isLoading: loadingNotifications,
    refetch: refetchNotifications,
  } = useNotifications();

  const {
    data: bills = [],
    isLoading: loadingBills,
    refetch: refetchBills,
  } = useMessBills();

  const studentCount = users.filter((u) => u.role === "student").length;
  const activityLoading = loadingUsers || loadingNotifications || loadingBills;
  const hasFetched = !!fetchDate && !!attendanceSummary;

  const handleFetchDetails = useCallback(() => {
    if (!date) return;
    setFetchDate(date);
  }, [date]);

  const handleRefresh = useCallback(async () => {
    setRefreshError(null);
    try {
      await Promise.all([
        refetchUsers(),
        refetchNotifications(),
        refetchBills(),
        fetchDate ? refetchSummary() : Promise.resolve(),
      ]);
    } catch {
      setRefreshError("Could not refresh. Pull down to try again.");
    }
  }, [refetchUsers, refetchNotifications, refetchBills, refetchSummary, fetchDate]);

  const exportSummaryToPDF = () => {
    if (!attendanceSummary?.summary || !fetchDate) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Mess Cut Summary", 14, 18);
    doc.setFontSize(12);
    doc.text(`Date: ${fetchDate}`, 14, 30);
    doc.text(`Morning: ${attendanceSummary.summary.morning}`, 14, 40);
    doc.text(`Noon: ${attendanceSummary.summary.noon}`, 14, 50);
    doc.text(`Night: ${attendanceSummary.summary.night}`, 14, 60);

    if (attendanceSummary.details?.length) {
      const columns = [
        { header: "Sl No", dataKey: "slno" },
        { header: "Name", dataKey: "name" },
        { header: "Morning", dataKey: "morning" },
        { header: "Noon", dataKey: "noon" },
        { header: "Night", dataKey: "night" },
      ];
      const rows = attendanceSummary.details.map((d: AttendanceSummaryDetail, i: number) => {
        const morningAbsent =
          typeof d.morningAbsent === "boolean" ? d.morningAbsent : !!d.morning;
        const noonAbsent = typeof d.noonAbsent === "boolean" ? d.noonAbsent : !!d.noon;
        const nightAbsent = typeof d.nightAbsent === "boolean" ? d.nightAbsent : !!d.night;
        return {
          slno: i + 1,
          name: d.name,
          morning: morningAbsent
            ? { text: "No", styles: { textColor: [220, 38, 38] as [number, number, number] } }
            : { text: "Yes", styles: { textColor: [34, 197, 94] as [number, number, number] } },
          noon: noonAbsent
            ? { text: "No", styles: { textColor: [220, 38, 38] as [number, number, number] } }
            : { text: "Yes", styles: { textColor: [34, 197, 94] as [number, number, number] } },
          night: nightAbsent
            ? { text: "No", styles: { textColor: [220, 38, 38] as [number, number, number] } }
            : { text: "Yes", styles: { textColor: [34, 197, 94] as [number, number, number] } },
        };
      });
      autoTable(doc, {
        startY: 70,
        columns,
        body: rows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [99, 102, 241] },
        didParseCell(data) {
          const raw = data.cell.raw as unknown;
          if (raw && typeof raw === "object" && "styles" in raw && "text" in raw) {
            const typedRaw = raw as {
              styles: { textColor: [number, number, number] };
              text: string;
            };
            data.cell.styles.textColor = typedRaw.styles.textColor;
            data.cell.text = [typedRaw.text];
          }
        },
      });
    }

    handlePDFExport(doc, "Mess_Cut_Summary");
  };

  const handleNewUser = () => {
    setNavLoading(true);
    router.push("/dashboard/create-user");
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="mx-auto w-full max-w-lg animate-in fade-in px-4 pb-6 pt-3 duration-300 md:max-w-3xl md:px-6 md:pt-6 lg:max-w-4xl">
        {/* Overview header */}
        <header className="mb-5">
          <p className="text-sm font-medium text-gray-500">{formatTodayLabel()}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Overview
            </h1>
            <button
              type="button"
              onClick={handleNewUser}
              disabled={navLoading}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full bg-[var(--mh-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:opacity-95 disabled:opacity-60"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New User
            </button>
          </div>
        </header>

        {refreshError && (
          <p
            className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600"
            role="alert"
          >
            {refreshError}
          </p>
        )}

        <div className="mb-5">
          <AdminOverviewCard count={studentCount} loading={loadingUsers && users.length === 0} />
        </div>

        <div className="mb-6">
          <AdminActionGrid />
        </div>

        <div className="mb-6">
          <AdminAttendanceSummary
            date={date}
            onDateChange={setDate}
            onFetch={handleFetchDetails}
            loading={loadingSummary}
            error={summaryError?.message ?? null}
            summary={hasFetched ? attendanceSummary?.summary : null}
            details={hasFetched ? attendanceSummary?.details : undefined}
            onExportPdf={exportSummaryToPDF}
            hasFetched={hasFetched}
          />
        </div>

        <AdminRecentActivity
          users={users}
          notifications={notifications}
          bills={bills}
          loading={activityLoading && users.length === 0 && notifications.length === 0}
        />
      </div>
    </PullToRefresh>
  );
}
