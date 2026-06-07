"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, PageContainer } from "@/components/ui";
import type jsPDF from "jspdf";
import toast from "react-hot-toast";
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

function isAbsent(d: AttendanceSummaryDetail, meal: "morning" | "noon" | "night") {
  const absentKey = `${meal}Absent` as const;
  const val = d[absentKey];
  if (typeof val === "boolean") return val;
  return !!d[meal];
}

function formatDateLong(dateStr: string) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTimeLong(date: Date) {
  const datePart = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} ${timePart}`;
}

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
  const { user } = useAuth();
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

  const exportSummaryToPDF = async () => {
    if (!attendanceSummary?.summary || !fetchDate) return;
    const [ { default: jsPDF }, { default: autoTable } ] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable")
    ]);

    const absentDetails = (attendanceSummary.details || []).filter(
      (d: AttendanceSummaryDetail) =>
        isAbsent(d, "morning") || isAbsent(d, "noon") || isAbsent(d, "night")
    );

    if (!absentDetails.length) {
      toast.error("No mess cuts found to export for this date.");
      return;
    }

    // Sort by Room Number first naturally, then Name
    const sortedAbsentDetails = [...absentDetails].sort((a, b) => {
      const roomA = a.roomNumber || "";
      const roomB = b.roomNumber || "";
      const roomCompare = roomA.localeCompare(roomB, undefined, { numeric: true, sensitivity: 'base' });
      if (roomCompare !== 0) return roomCompare;
      return (a.name || "").localeCompare(b.name || "");
    });

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const totalResidents = attendanceSummary.details?.length || 0;
    const morningCuts = attendanceSummary.summary.morning || 0;
    const noonCuts = attendanceSummary.summary.noon || 0;
    const nightCuts = attendanceSummary.summary.night || 0;

    const morningPresent = Math.max(0, totalResidents - morningCuts);
    const noonPresent = Math.max(0, totalResidents - noonCuts);
    const nightPresent = Math.max(0, totalResidents - nightCuts);

    const formattedSelectedDate = formatDateLong(fetchDate);
    const now = new Date();
    const generatedDateTimeStr = formatDateTimeLong(now);

    const totalPagesExp = "{total_pages_count_string}";

    // Draw header elements on first page
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("MH App", 15, 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229); // Primary Indigo color
    doc.text("MESS CUT SUMMARY REPORT", 15, 20);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 24, 195, 24);

    // Selected Date & Generated date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date: ${formattedSelectedDate}`, 15, 30);
    doc.text(`Generated: ${generatedDateTimeStr}`, 195, 30, { align: "right" });

    // Summary Card Box on Page 1
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(241, 245, 249);
    doc.roundedRect(15, 36, 180, 24, 2, 2, "FD");

    // Print horizontal columns for summary statistics
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL RESIDENTS", 20, 42);
    doc.text("MORNING PRESENT", 65, 42);
    doc.text("NOON PRESENT", 110, 42);
    doc.text("NIGHT PRESENT", 155, 42);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(`${totalResidents}`, 20, 50);

    // Eating vs Cuts
    doc.text(`${morningPresent}`, 65, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(239, 68, 68);
    doc.text(` (${morningCuts} cuts)`, 72, 50);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`${noonPresent}`, 110, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(239, 68, 68);
    doc.text(` (${noonCuts} cuts)`, 118, 50);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`${nightPresent}`, 155, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(239, 68, 68);
    doc.text(` (${nightCuts} cuts)`, 163, 50);

    // Define table data
    const columns = [
      { header: "Sl No", dataKey: "slno" },
      { header: "Name", dataKey: "name" },
      { header: "Room Number", dataKey: "room" },
      { header: "Year", dataKey: "year" },
      { header: "Morning", dataKey: "morning" },
      { header: "Noon", dataKey: "noon" },
      { header: "Night", dataKey: "night" },
    ];

    const rows = sortedAbsentDetails.map((d: AttendanceSummaryDetail, i: number) => {
      const morningAbsent = isAbsent(d, "morning");
      const noonAbsent = isAbsent(d, "noon");
      const nightAbsent = isAbsent(d, "night");
      return {
        slno: i + 1,
        name: d.name,
        room: d.roomNumber || "—",
        year: d.yearOfStudy || "—",
        morning: morningAbsent
          ? { text: "No", styles: { textColor: [220, 38, 38] as [number, number, number] } }
          : { text: "Yes", styles: { textColor: [22, 163, 74] as [number, number, number] } },
        noon: noonAbsent
          ? { text: "No", styles: { textColor: [220, 38, 38] as [number, number, number] } }
          : { text: "Yes", styles: { textColor: [22, 163, 74] as [number, number, number] } },
        night: nightAbsent
          ? { text: "No", styles: { textColor: [220, 38, 38] as [number, number, number] } }
          : { text: "Yes", styles: { textColor: [22, 163, 74] as [number, number, number] } },
      };
    });

    autoTable(doc, {
      startY: 68,
      columns,
      body: rows,
      margin: { top: 25, right: 15, bottom: 22, left: 15 },
      styles: {
        fontSize: 9,
        cellPadding: 2.5,
        valign: "middle",
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        slno: { halign: "center", cellWidth: 15 },
        name: { halign: "left", fontStyle: "bold", cellWidth: 65 },
        room: { halign: "center", cellWidth: 25 },
        year: { halign: "center", cellWidth: 15 },
        morning: { halign: "center", cellWidth: 20 },
        noon: { halign: "center", cellWidth: 20 },
        night: { halign: "center", cellWidth: 20 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell(data) {
        const raw = data.cell.raw as unknown;
        if (raw && typeof raw === "object" && "styles" in raw && "text" in raw) {
          const typedRaw = raw as {
            styles: { textColor: [number, number, number] };
            text: string;
          };
          data.cell.styles.textColor = typedRaw.styles.textColor;
          data.cell.styles.fontStyle = "bold";
          data.cell.text = [typedRaw.text];
        }
      },
      didDrawPage(data) {
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        // Draw running header on later pages
        if (data.pageNumber > 1) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text("Mess Cut Summary Report", 15, 12);
          doc.text(`Date: ${formattedSelectedDate}`, pageWidth - 15, 12, { align: "right" });
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.5);
          doc.line(15, 15, pageWidth - 15, 15);
        }

        // Draw Footer on all pages
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.5);
        doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Generated by MH App v2.0.1", 15, pageHeight - 12);
        doc.text(`Generated: ${generatedDateTimeStr}`, 15, pageHeight - 7);

        // Page Number
        const pageNumberStr = `Page ${data.pageNumber} of ${totalPagesExp}`;
        doc.text(pageNumberStr, pageWidth - 15, pageHeight - 12, { align: "right" });
      },
    });

    if (typeof doc.putTotalPages === "function") {
      doc.putTotalPages(totalPagesExp);
    }

    handlePDFExport(doc, `Mess_Cut_Summary_${fetchDate}`);
  };

  const handleNewUser = () => {
    setNavLoading(true);
    router.push("/dashboard/create-user");
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <AppHeader
        title="Mens Hostel"
        subtitle="Admin"
        showMenu={true}
        actions={
          <Link
            href="/profile"
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--mh-primary-soft)] text-sm font-bold text-[var(--mh-primary)] ring-2 ring-white shadow-sm transition active:scale-[0.96]"
            aria-label="Profile"
          >
            {user?.name?.charAt(0).toUpperCase() ?? "A"}
          </Link>
        }
      />
      <PageContainer>
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
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full bg-[var(--mh-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:opacity-95 disabled:opacity-60 cursor-pointer"
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
            hasRecords={hasFetched ? (attendanceSummary?.hasRecords !== false) : false}
          />
        </div>

        <AdminRecentActivity
          users={users}
          notifications={notifications}
          bills={bills}
          loading={activityLoading && users.length === 0 && notifications.length === 0}
        />
      </PageContainer>
    </PullToRefresh>
  );
}
