// src/hooks/useAdminApi.ts
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export interface AdminStats {
  totalCourses: number;
  totalCategories: number;
  totalStudents: number;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  topCourses: { courseId: string; title: string; enrollments: number }[];
}

export interface AdminUser {
  id: string;
  supabaseId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleId: string;
  enrollments: number;
  createdAt: string;
}

export interface PaymentRow {
  enrollmentId: string;
  userId: string;
  studentName: string;
  email: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  percentage: number;
  paid: boolean;
  paidAt: string | null;
  paymentNote: string | null;
  profileComplete: boolean;
  certificateIssued: boolean;
  constanciaIssued: boolean;
}

export interface CourseReport {
  id: string;
  title: string;
  category: string;
  status: string;
  enrollments: number;
  completions: number;
  completionRate: number;
}

export interface Periodo { actual: number; anterior: number }

export interface CourseAnalytics {
  id: string;
  title: string;
  category: string;
  status: string;
  image: string | null;
  lessons: number;
  enrollments: number;
  completions: number;
  inProgress: number;
  avgProgress: number;
  newEnrollments: number;
}

export interface Analytics {
  days: number;
  granularity: "day" | "week";
  kpis: {
    enrollments: Periodo;
    lessons: Periodo;
    students: Periodo;
    activeStudents: Periodo;
    totalStudents: number;
    totalEnrollments: number;
    completionRate: number;
    avgProgress: number;
  };
  timeline: { date: string; enrollments: number; lessons: number; students: number }[];
  status: { completado: number; en_progreso: number; sin_iniciar: number };
  heatmap: number[][];
  funnel: { key: string; label: string; value: number }[];
  courses: CourseAnalytics[];
  topStudents: { name: string; email: string; lessons: number; courses: number; certificates: number }[];
  generatedAt: string;
}

export function useAdminApi() {
  const [loading, setLoading] = useState(false);

  const req = async <T>(fn: () => Promise<T>) => {
    setLoading(true);
    try { return await fn(); } finally { setLoading(false); }
  };

  const getStats = () =>
    req(async () => {
      const { data } = await apiClient.get("/admin/stats");
      return (data.data ?? data) as AdminStats;
    });

  const getUsers = () =>
    req(async () => {
      const { data } = await apiClient.get("/admin/users");
      return (data.data ?? data) as AdminUser[];
    });

  const updateUserRole = (id: string, role: string) =>
    req(async () => {
      const { data } = await apiClient.patch(`/admin/users/${id}/role`, { role });
      return data;
    });

  const getReports = () =>
    req(async () => {
      const { data } = await apiClient.get("/admin/reports");
      return (data.data ?? data) as CourseReport[];
    });

  const getAnalytics = (days = 30) =>
    req(async () => {
      const { data } = await apiClient.get("/admin/analytics", { params: { days } });
      return (data.data ?? data) as Analytics;
    });

  const getPayments = () =>
    req(async () => {
      const { data } = await apiClient.get("/admin/payments");
      return (data.data ?? data) as PaymentRow[];
    });

  const setPayment = (enrollmentId: string, paid: boolean, note?: string | null) =>
    req(async () => {
      const { data } = await apiClient.patch(`/admin/enrollments/${enrollmentId}/payment`, { paid, note });
      return (data.data ?? data) as Pick<PaymentRow, "enrollmentId" | "paid" | "paidAt" | "paymentNote">;
    });

  return { loading, getStats, getUsers, updateUserRole, getReports, getAnalytics, getPayments, setPayment };
}
