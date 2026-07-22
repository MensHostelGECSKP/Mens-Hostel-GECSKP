"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import FullPageLoader from "@/components/FullPageLoader";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiArrowUpTray,
  HiDocumentArrowDown,
  HiCheckCircle,
  HiExclamationTriangle,
  HiXCircle,
  HiArrowPath,
  HiDocumentText,
  HiUsers,
} from "react-icons/hi2";

interface RowError {
  rowNumber: number;
  errors: string[];
  email: string;
}

interface PreviewData {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateCount: number;
  validRows: any[];
  invalidRows: any[];
  rowErrors: RowError[];
}

interface ImportResult {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  durationMs: number;
  emailStats: {
    sent: number;
    failed: number;
    skipped: number;
  };
  rowResults: Array<{
    rowNumber: number;
    name: string;
    email: string;
    status: 'imported' | 'failed';
    message: string;
    emailStatus: 'sent' | 'failed' | 'skipped';
    emailError?: string;
  }>;
  successfullyImported: number;
  failed: number;
  errors: Array<{ rowNumber: number; email: string; error: string }>;
}

type StepState = "upload" | "preview" | "importing" | "result";

export default function ImportUsersPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [step, setStep] = useState<StepState>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [progressVal, setProgressVal] = useState(0);
  const [progressMax, setProgressMax] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        router.replace("/login");
      } else if (user?.role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [loading, isLoggedIn, user?.role, router]);

  if (loading) {
    return <FullPageLoader text="Loading..." />;
  }

  if (!isLoggedIn || user?.role !== "admin") {
    return null;
  }

  // Actions
  const handleDownloadTemplate = () => {
    try {
      const a = document.createElement("a");
      a.href = "/MH_App_User_Import_Template.xlsx";
      a.download = "MH_App_User_Import_Template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Template downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download template. Try again.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    // Validate file extension
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      toast.error("Please upload a valid Excel spreadsheet (.xlsx or .xls)");
      return;
    }

    setFile(selectedFile);
    setStep("upload");
    setUploadProgress(10);
    setStatusMessage("Uploading file...");

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      setStatusMessage("Validating columns and rows...");
      const res = await api.upload<PreviewData>("/api/system/import/preview", formData);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.error) {
        toast.error(res.error);
        resetPageState();
      } else if (res.data) {
        setPreviewData(res.data);
        setTimeout(() => {
          setStep("preview");
        }, 300);
      }
    } catch (err) {
      clearInterval(progressInterval);
      toast.error("Network error. Unable to validate file.");
      resetPageState();
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData || previewData.validRowsCount === 0 || executing) return;

    setExecuting(true);
    setShowConfirmModal(false);
    setStep("importing");
    
    const totalToProcess = previewData.validRows.length;
    setProgressMax(totalToProcess);
    setProgressVal(0);
    setStatusMessage(`Preparing to onboard ${totalToProcess} users...`);

    const aggregatedResult: ImportResult = {
      totalRows: previewData.totalRows,
      importedCount: 0,
      skippedCount: previewData.invalidRowsCount,
      failedCount: 0,
      durationMs: 0,
      emailStats: {
        sent: 0,
        failed: 0,
        skipped: 0,
      },
      rowResults: [],
      successfullyImported: 0,
      failed: previewData.invalidRowsCount,
      errors: [],
    };

    const BATCH_SIZE = 3;
    const startTime = Date.now();

    try {
      for (let i = 0; i < totalToProcess; i += BATCH_SIZE) {
        const chunk = previewData.validRows.slice(i, i + BATCH_SIZE);
        const currentBatchStart = i + 1;
        const currentBatchEnd = Math.min(i + BATCH_SIZE, totalToProcess);
        setStatusMessage(`Onboarding users ${currentBatchStart} to ${currentBatchEnd} of ${totalToProcess}...`);

        const res = await api.post<ImportResult>("/api/system/import/execute", {
          users: chunk,
          validationSkippedCount: 0,
        });

        if (res.error) {
          throw new Error(res.error);
        }

        if (res.data) {
          const chunkData = res.data;
          aggregatedResult.importedCount += chunkData.importedCount;
          aggregatedResult.failedCount += chunkData.failedCount;
          aggregatedResult.emailStats.sent += chunkData.emailStats.sent;
          aggregatedResult.emailStats.failed += chunkData.emailStats.failed;
          aggregatedResult.emailStats.skipped += chunkData.emailStats.skipped;
          aggregatedResult.rowResults.push(...chunkData.rowResults);
          aggregatedResult.successfullyImported += chunkData.successfullyImported;
          aggregatedResult.failed += chunkData.failed;
          if (chunkData.errors) {
            aggregatedResult.errors.push(...chunkData.errors);
          }
        }

        setProgressVal(currentBatchEnd);
      }

      aggregatedResult.durationMs = Date.now() - startTime;
      setImportResult(aggregatedResult);
      toast.success("Users successfully onboarded!");
      setStep("result");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during import execution.");
      setStep("preview");
    } finally {
      setExecuting(false);
    }
  };

  const resetPageState = () => {
    setFile(null);
    setUploadProgress(0);
    setStatusMessage("");
    setPreviewData(null);
    setImportResult(null);
    setProgressVal(0);
    setProgressMax(0);
    setStep("upload");
    setExecuting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-3 md:px-6 md:pb-8 md:pt-6 page-transition">
      {/* Back button */}
      <button
        type="button"
        onClick={() => {
          if (step === "preview") {
            resetPageState();
          } else {
            router.back();
          }
        }}
        className="mb-4 flex min-h-[40px] items-center gap-1 text-sm font-semibold text-[var(--mh-primary)] hover:opacity-85 transition active:scale-[0.98]"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--mh-primary-soft)] text-[var(--mh-primary)] shadow-sm">
          <HiUsers className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bulk Import</h1>
          <p className="text-sm text-gray-500">Structured resident onboarding system</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Upload Excel File */}
        {step === "upload" && uploadProgress === 0 && (
          <motion.div
            key="upload-container"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Information Card */}
            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Instructions</h2>
              <p className="text-sm leading-relaxed text-gray-600">
                To onboarding residents in bulk, download our official Excel template, fill in the columns correctly, and upload the file below.
              </p>

              {/* Template Download Button */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--mh-primary)] px-4 py-2 text-xs font-semibold text-[var(--mh-primary)] bg-[var(--mh-primary-soft)] hover:bg-indigo-100 transition active:scale-[0.98]"
              >
                <HiDocumentArrowDown className="h-4 w-4" />
                Download Template
              </button>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 cursor-pointer transition-all duration-300 min-h-[220px] bg-white ${
                dragOver
                  ? "border-[var(--mh-primary)] bg-indigo-50/50 shadow-inner scale-[1.01]"
                  : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-[var(--mh-primary)] mb-4 shadow-sm">
                <HiArrowUpTray className="h-7 w-7" />
              </span>
              <p className="text-base font-semibold text-gray-800">
                Drag and drop template file here
              </p>
              <p className="text-xs text-gray-400 mt-1">
                or click to browse from device (xlsx, xls format)
              </p>
            </div>
          </motion.div>
        )}

        {/* Upload & Validation Progress */}
        {step === "upload" && uploadProgress > 0 && (
          <motion.div
            key="progress-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center justify-center min-h-[300px]"
          >
            <HiArrowPath className="h-10 w-10 text-[var(--mh-primary)] animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">Processing Document</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">{statusMessage}</p>
            
            {/* Custom progress bar */}
            <div className="w-full max-w-xs bg-gray-100 h-2.5 rounded-full mt-6 overflow-hidden">
              <motion.div
                className="bg-[var(--mh-primary)] h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-xs font-semibold text-gray-600 mt-2">{uploadProgress}%</p>
          </motion.div>
        )}

        {/* Step 2: Preview Screen */}
        {step === "preview" && previewData && (
          <motion.div
            key="preview-container"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 text-center">
                <span className="text-2xl font-extrabold text-gray-800">{previewData.totalRows}</span>
                <span className="block text-xs font-medium text-gray-500 mt-1">Total Rows</span>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 text-center">
                <span className="text-2xl font-extrabold text-emerald-600">{previewData.validRowsCount}</span>
                <span className="block text-xs font-medium text-gray-500 mt-1">Valid Rows</span>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 text-center">
                <span className="text-2xl font-extrabold text-rose-500">{previewData.invalidRowsCount}</span>
                <span className="block text-xs font-medium text-gray-500 mt-1">Invalid Rows</span>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 text-center">
                <span className="text-2xl font-extrabold text-amber-500">{previewData.duplicateCount}</span>
                <span className="block text-xs font-medium text-gray-500 mt-1">Duplicate Users</span>
              </div>
            </div>

            {/* Error Report List */}
            {previewData.rowErrors.length > 0 && (
              <div className="rounded-2xl bg-rose-50/70 border border-rose-100 p-5">
                <div className="flex items-center gap-2 mb-3 text-rose-800 font-semibold text-sm">
                  <HiExclamationTriangle className="h-5 w-5 shrink-0" />
                  Validation Failures Found ({previewData.rowErrors.length} rows contain errors)
                </div>
                <div className="max-h-64 overflow-y-auto space-y-3.5 pr-2">
                  {previewData.rowErrors.map((err) => (
                    <div
                      key={err.rowNumber}
                      className="text-xs bg-white rounded-xl p-3 border border-rose-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-gray-700 block md:inline mr-2">Row {err.rowNumber}</span>
                        <span className="text-gray-400 truncate md:inline block">{err.email}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 md:justify-end">
                        {err.errors.map((msg, index) => (
                          <span
                            key={index}
                            className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full font-medium"
                          >
                            {msg}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid Users List */}
            {previewData.validRowsCount > 0 && (
              <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Valid Residents ready for onboarding ({previewData.validRowsCount})
                </h3>
                <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100 pr-1">
                  {previewData.validRows.map((u, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50/50 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-gray-800 block truncate">{u.name}</span>
                        <span className="text-gray-400 block truncate mt-0.5">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="bg-[var(--mh-primary-soft)] text-[var(--mh-primary)] px-2.5 py-0.5 rounded-full font-medium">
                          Year {u.yearOfStudy}
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                          {u.roomNumber ? `Room ${u.roomNumber}` : 'No Room'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Prompt Panel */}
            {previewData.validRowsCount > 0 ? (
              <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 text-center md:text-left md:flex md:items-center md:justify-between gap-4">
                <div>
                  <h4 className="text-base font-semibold text-gray-800">Ready to Import</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {previewData.validRowsCount} users will be registered and will receive credentials via email.
                  </p>
                </div>
                <div className="flex gap-3 justify-center mt-4 md:mt-0">
                  <button
                    type="button"
                    onClick={resetPageState}
                    className="min-h-[44px] px-5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="min-h-[44px] px-6 rounded-xl bg-[var(--mh-primary)] text-sm font-semibold text-white hover:opacity-90 shadow-sm transition active:scale-[0.98]"
                  >
                    Import Users
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 text-center flex flex-col items-center">
                <HiXCircle className="h-10 w-10 text-amber-500 mb-2" />
                <h4 className="text-base font-semibold text-amber-800">No Valid Users Found</h4>
                <p className="text-xs text-amber-600 mt-1 max-w-sm">
                  Please fix the validation issues in your spreadsheet and try uploading it again.
                </p>
                <button
                  type="button"
                  onClick={resetPageState}
                  className="mt-4 min-h-[38px] px-4 rounded-xl border border-amber-200 bg-white text-xs font-semibold text-amber-700 hover:bg-amber-100 transition active:scale-[0.98]"
                >
                  Upload Another File
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Executing Import Progress */}
        {step === "importing" && (
          <motion.div
            key="importing-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-white p-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center justify-center min-h-[300px]"
          >
            <HiArrowPath className="h-12 w-12 text-[var(--mh-primary)] animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">Importing Users</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-md leading-relaxed">{statusMessage}</p>
            
            {progressMax > 0 && (
              <div className="w-full max-w-md mt-6">
                <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{progressVal} of {progressMax} ({Math.round((progressVal / progressMax) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200/50">
                  <div 
                    className="bg-[var(--mh-primary)] h-full transition-all duration-300 ease-out" 
                    style={{ width: `${(progressVal / progressMax) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Success / Result Screen */}
        {step === "result" && importResult && (
          <motion.div
            key="result-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 space-y-6 text-center"
          >
            <div className="flex flex-col items-center">
              <HiCheckCircle className="h-16 w-16 text-emerald-500 mb-2 animate-bounce" />
              <h2 className="text-xl font-bold text-gray-800">Onboarding Complete</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Users were created sequentially and each welcome email was attempted immediately after creation.
              </p>
            </div>

            {/* Results breakdown */}
            <div className="bg-gray-50 rounded-2xl p-5 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 border border-gray-100">
              <div className="text-center md:border-r md:border-gray-200">
                <span className="block text-2xl font-extrabold text-gray-800">{importResult.totalRows}</span>
                <span className="text-xs font-semibold text-gray-500 mt-0.5">Total</span>
              </div>
              <div className="text-center md:border-r md:border-gray-200">
                <span className="block text-2xl font-extrabold text-emerald-600">{importResult.importedCount}</span>
                <span className="text-xs font-semibold text-gray-500 mt-0.5">Imported</span>
              </div>
              <div className="text-center md:border-r md:border-gray-200">
                <span className="block text-2xl font-extrabold text-amber-600">{importResult.skippedCount}</span>
                <span className="text-xs font-semibold text-gray-500 mt-0.5">Skipped</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-extrabold text-rose-500">{importResult.failedCount}</span>
                <span className="text-xs font-semibold text-gray-500 mt-0.5">Failed</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 max-w-3xl mx-auto grid grid-cols-3 gap-4 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="text-center">
                <span className="block text-xl font-bold text-emerald-600">{importResult.emailStats.sent}</span>
                <span className="text-xs font-semibold text-gray-500">Emails Sent</span>
              </div>
              <div className="text-center">
                <span className="block text-xl font-bold text-rose-500">{importResult.emailStats.failed}</span>
                <span className="text-xs font-semibold text-gray-500">Emails Failed</span>
              </div>
              <div className="text-center">
                <span className="block text-xl font-bold text-gray-700">{Math.round(importResult.durationMs / 1000)}</span>
                <span className="text-xs font-semibold text-gray-500">Seconds</span>
              </div>
            </div>

            {importResult.rowResults.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 text-left max-w-3xl mx-auto space-y-2 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <span className="font-semibold text-gray-800 text-xs flex items-center gap-1.5">
                  <HiDocumentText className="h-4 w-4" />
                  Row Results
                </span>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {importResult.rowResults.map((row) => (
                    <div key={row.rowNumber} className="flex flex-col gap-1 rounded-xl border border-gray-100 p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-800">Row {row.rowNumber} · {row.name}</span>
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${row.status === 'imported' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {row.status === 'imported' ? 'Imported' : 'Failed'}
                        </span>
                      </div>
                      <div className="text-gray-500">{row.email}</div>
                      <div className="text-gray-600">{row.message}</div>
                      {row.emailStatus !== 'skipped' && (
                        <div className="text-gray-500">
                          Email: {row.emailStatus === 'sent' ? 'Sent' : `Failed${row.emailError ? ` - ${row.emailError}` : ''}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center pt-2">
              <button
                type="button"
                onClick={resetPageState}
                className="min-h-[44px] px-5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition active:scale-[0.98]"
              >
                Import Another
              </button>
              <Link
                href="/dashboard/manage-users"
                className="min-h-[44px] px-6 rounded-xl bg-[var(--mh-primary)] text-sm font-semibold text-white hover:opacity-90 flex items-center justify-center shadow-sm transition active:scale-[0.98]"
              >
                Done
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog Overlay */}
      <AnimatePresence>
        {showConfirmModal && previewData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-sm border border-gray-100 space-y-5"
            >
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-[var(--mh-primary)] mb-3">
                  <HiUsers className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Import Confirmation</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {previewData.validRowsCount} users are ready to be registered in the system. Proceed with importing?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={executing}
                  className="min-h-[44px] w-full rounded-xl bg-[var(--mh-primary)] text-sm font-semibold text-white hover:opacity-90 shadow-sm transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {executing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Importing...
                    </>
                  ) : (
                    "Import Users"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
