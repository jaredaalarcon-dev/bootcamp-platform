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

export interface CourseReport {
  id: string;
  title: string;
  category: string;
  status: string;
  enrollments: number;
  completions: number;
  completionRate: number;
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

  return { loading, getStats, getUsers, updateUserRole, getReports };
}
