import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import type {
  AttendanceRecord,
  AttendanceSummary,
  MessBill,
  Notification,
  User,
} from '@/types';

// Query keys
export const queryKeys = {
  user: ['user'] as const,
  attendance: (month: string) => ['attendance', month] as const,
  messBills: ['messBills'] as const,
  notifications: ['notifications'] as const,
  users: ['users'] as const,
  attendanceSummary: (date: string) => ['attendanceSummary', date] as const,
  yearEndResetStats: ['yearEndResetStats'] as const,
  auditLogs: (page: number, limit: number) => ['auditLogs', page, limit] as const,
};

export type YearEndResetStats = {
  academicYear: string;
  residentCount: number;
  attendanceCount: number;
  notificationCount: number;
  messBillCount: number;
  messBillPaymentCount?: number;
};


// Attendance queries
export function useAttendance(month: string) {
  return useQuery<AttendanceRecord[]>({
    queryKey: queryKeys.attendance(month),
    queryFn: async () => {
      const response = await api.get(`/api/attendance/month?month=${month}`);
      if (response.error) throw new Error(response.error);
      const data = response.data as { attendance?: AttendanceRecord[] } | undefined;
      return data?.attendance ?? [];
    },
    enabled: !!month,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAttendanceSummary(date: string) {
  return useQuery<AttendanceSummary>({
    queryKey: queryKeys.attendanceSummary(date),
    queryFn: async () => {
      const response = await api.get(`/api/attendance/admin/summary?date=${date}`);
      if (response.error) throw new Error(response.error);
      return response.data as AttendanceSummary;
    },
    enabled: !!date,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Mess bills queries
export function useMessBills() {
  return useQuery<MessBill[]>({
    queryKey: queryKeys.messBills,
    queryFn: async () => {
      const response = await api.get('/api/mess-bill');
      if (response.error) throw new Error(response.error);
      const data = response.data as { bills?: MessBill[] } | undefined;
      return data?.bills ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Notifications queries
export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const response = await api.get('/api/notifications');
      if (response.error) throw new Error(response.error);
      const data = response.data as { notifications?: Notification[] } | undefined;
      return data?.notifications ?? [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Users queries (admin only)
export function useUsers(enabled: boolean = true) {
  return useQuery<User[]>({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const response = await api.get('/api/auth/users');
      if (response.error) throw new Error(response.error);
      const data = response.data as { users?: User[] } | undefined;
      return data?.users ?? [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutations
export function useMarkAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { date: string; meals: { morning: boolean; noon: boolean; night: boolean } }) => {
      const response = await api.post('/api/attendance/mark', data);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate attendance queries for the month
      const month = variables.date.substring(0, 7); // YYYY-MM
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance(month) });
    },
  });
}

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  yearOfStudy: string;
  roomNumber: string;
  role?: 'student' | 'admin';
};

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const response = await api.post('/api/auth/register', {
        ...data,
        role: data.role ?? 'student',
      });
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

export type UpdateUserInput = {
  userId: string;
  name: string;
  email: string;
  roomNumber: string;
  yearOfStudy: string;
  status: 'active' | 'inactive';
};

function patchUsersCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (users: User[]) => User[]
) {
  queryClient.setQueryData<User[]>(queryKeys.users, (old) => updater(old ?? []));
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, ...data }: UpdateUserInput) => {
      const response = await api.patch<{ user?: User; message?: string }>(
        `/api/auth/users/${userId}`,
        data
      );
      if (response.error) throw new Error(response.error);
      if (!response.data?.user) throw new Error('Update failed');
      return response.data.user;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users });
      const previous = queryClient.getQueryData<User[]>(queryKeys.users);
      patchUsersCache(queryClient, (users) =>
        users.map((u) =>
          u.userId === variables.userId
            ? {
                ...u,
                name: variables.name,
                email: variables.email,
                roomNumber: variables.roomNumber,
                yearOfStudy: variables.yearOfStudy,
                status: variables.status,
              }
            : u
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.users, context.previous);
      }
    },
    onSuccess: (user) => {
      patchUsersCache(queryClient, (users) =>
        users.map((u) => (u.userId === user.userId ? user : u))
      );
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete<{ message?: string }>(`/api/auth/users/${userId}`);
      if (response.error) throw new Error(response.error);
      return userId;
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users });
      const previous = queryClient.getQueryData<User[]>(queryKeys.users);
      patchUsersCache(queryClient, (users) => users.filter((u) => u.userId !== userId));
      return { previous };
    },
    onError: (_err, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.users, context.previous);
      }
    },
    onSuccess: (userId) => {
      patchUsersCache(queryClient, (users) => users.filter((u) => u.userId !== userId));
    },
  });
}


export function usePublishMessBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.upload<{ bill: MessBill; notified?: boolean; warnings?: string[] }>(
        '/api/mess-bill/publish',
        formData
      );
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messBills });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

export function useUpdateMessBillPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billId, isPaid }: { billId: string; isPaid: boolean }) => {
      const response = await api.patch(`/api/mess-bill/${billId}/payment`, { isPaid });
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messBills });
    },
  });
}

export function useDeleteMessBill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (billId: string) => {
      const response = await api.delete(`/api/mess-bill/${billId}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messBills });
    },
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; message?: string; pdfUrl?: string; type?: string }) => {
      const response = await api.post('/api/notifications', data);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete(`/api/notifications/${notificationId}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

export function useYearEndResetStats() {
  return useQuery<YearEndResetStats>({
    queryKey: queryKeys.yearEndResetStats,
    queryFn: async () => {
      const response = await api.get<{ stats?: YearEndResetStats }>(
        '/api/system/year-end-reset/stats'
      );
      if (response.error) throw new Error(response.error);
      if (!response.data?.stats) throw new Error('Failed to load reset statistics');
      return response.data.stats;
    },
    staleTime: 30 * 1000,
  });
}

const YEAR_END_RESET_PHRASE = 'RESET_DATABASE';

export function useYearEndReset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ message?: string }>('/api/system/year-end-reset', {
        confirmPhrase: YEAR_END_RESET_PHRASE,
      });
      if (response.error) {
        throw new Error(
          response.error ||
            'Unable to complete reset. Please try again or contact the administrator.'
        );
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.messBills });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.yearEndResetStats });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceSummary'] });
    },
  });
}

export type AuditLogEntry = {
  _id: string;
  action: string;
  performedBy: string | null;
  performedByName: string;
  targetId: string | null;
  details: Record<string, any>;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogsResponse = {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export function useAuditLogs(page: number = 1, limit: number = 50) {
  return useQuery<AuditLogsResponse>({
    queryKey: queryKeys.auditLogs(page, limit),
    queryFn: async () => {
      const response = await api.get(`/api/system/audit-logs?page=${page}&limit=${limit}`);
      if (response.error) throw new Error(response.error);
      return response.data as AuditLogsResponse;
    },
    staleTime: 5000,
  });
}
