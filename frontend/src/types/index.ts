export type UserStatus = 'active' | 'inactive' | 'blocked';

export type User = {
  userId: string;
  name: string;
  email: string;
  role: string;
  yearOfStudy?: string;
  roomNumber?: string;
  status?: UserStatus;
  notificationPreferences?: {
    bills: boolean;
    announcements: boolean;
    system: boolean;
  };
};

export type AttendanceRecord = {
  date: string;
  meals: { morning: boolean; noon: boolean; night: boolean };
};

export type AttendanceSummaryDetail = {
  name: string;
  email?: string;
  roomNumber?: string;
  yearOfStudy?: string;
  morning?: boolean;
  noon?: boolean;
  night?: boolean;
  morningAbsent?: boolean;
  noonAbsent?: boolean;
  nightAbsent?: boolean;
};

export type AttendanceSummary = {
  date?: string;
  summary: { morning: number; noon: number; night: number };
  details: AttendanceSummaryDetail[];
  hasRecords?: boolean;
};

export type MessBillPaymentStatus = {
  isPaid: boolean;
  paidAt: string | null;
};

export type MessBill = {
  _id: string;
  month: number;
  year: number;
  dueDate: string;
  fileName: string;
  fileUrl: string;
  downloadUrl: string;
  mimeType?: string;
  uploadedAt?: string;
  isPublished?: boolean;
  paymentStatus?: MessBillPaymentStatus | null;
};

export type Notification = {
  _id: string;
  title: string;
  message?: string;
  pdfUrl?: string;
  type?: string;
  messBillId?: string;
  userId?: string | null;
  createdAt: string;
  isRead?: boolean;
  isDeleted?: boolean;
};
