import api from './api';
import {
    AdminSettings,
    AuditLog,
    GenerateReportRequest,
    AdminMetrics
} from '../../types/admin';
import { User, UpdateUserProfileRequest, UpdateUserStatusRequest } from '../../types/user';
import {
    AdminDashboard,
    Facility,
    FacilityCreateInput,
    FacilitySettlement,
    ReconciliationRun,
    Refund,
    RefundStatus,
    VerificationStatus,
} from '../../types/admin-ops';

export const getAdminUsers = async (query: { page?: number; limit?: number; userType?: string; accountStatus?: string }) => {
    return (await api.get<{ users: User[]; total: number }>('/admin/users', { params: query })).data;
};

export const getAdminUserById = async (userId: string) => {
    return (await api.get<User>(`/admin/users/${userId}`)).data;
};

export const updateAdminUser = async (userId: string, data: UpdateUserProfileRequest) => {
    return (await api.patch<User>(`/admin/users/${userId}`, data)).data;
};

export const updateAdminUserStatus = async (userId: string, data: UpdateUserStatusRequest) => {
    return (await api.patch<User>(`/admin/users/${userId}/status`, data)).data;
};

export const deleteAdminUser = async (userId: string) => {
    return (await api.delete<{ message: string }>(`/admin/users/${userId}`)).data;
};

export const getMetricsOverview = async () => {
    return (await api.get<AdminMetrics>('/admin/metrics/overview')).data;
};

export const updateAdminSettings = async (data: AdminSettings) => {
    return (await api.patch<AdminSettings>('/admin/settings', data)).data;
};

export const getAuditLogs = async (query: { page?: number; limit?: number; startDate?: string; endDate?: string }) => {
    return (await api.get<{ logs: AuditLog[]; total: number }>('/admin/audit-logs', { params: query })).data;
};

export const generateReport = async (data: GenerateReportRequest) => {
    return (await api.post<Blob>('/admin/reports/generate', data, { responseType: 'blob' })).data;
};

// ---- Admin dashboard, facilities, refunds and reconciliation (envelope: { success, data }) ----

export const getAdminDashboard = async () =>
    (await api.get<{ success: boolean; data: AdminDashboard }>('/admin/dashboard')).data.data;

export const getFacilities = async () =>
    (await api.get<{ success: boolean; data: Facility[] }>('/admin/facilities')).data.data;

export const createFacility = async (body: FacilityCreateInput) =>
    (await api.post<{ success: boolean; data: Facility }>('/admin/facilities', body)).data.data;

export const updateFacility = async (facilityId: string, body: Partial<FacilityCreateInput> & { verificationStatus?: VerificationStatus }) =>
    (await api.patch<{ success: boolean; data: Facility }>(`/admin/facilities/${facilityId}`, body)).data.data;

export const getFacilitySettlement = async (facilityId: string) =>
    (await api.get<{ success: boolean; data: FacilitySettlement }>(`/admin/facilities/${facilityId}/settlement`)).data.data;

export const getRefunds = async (status?: RefundStatus) =>
    (await api.get<{ success: boolean; data: Refund[] }>('/admin/refunds', { params: status ? { status } : undefined })).data.data;

export const decideRefund = async (refundId: string, body: { decision: 'approve' | 'reject'; note?: string }) =>
    (await api.post<{ success: boolean; data: Refund }>(`/refunds/${refundId}/decision`, body)).data.data;

export const markRefundProcessed = async (refundId: string, note?: string) =>
    (await api.post<{ success: boolean; data: Refund }>(`/refunds/${refundId}/mark-processed`, note ? { note } : {})).data.data;

export const runReconciliation = async () =>
    (await api.post<{ success: boolean; data: ReconciliationRun }>('/admin/reconciliation/runs')).data.data;

export const getReconciliationRuns = async () =>
    (await api.get<{ success: boolean; data: ReconciliationRun[] }>('/admin/reconciliation/runs')).data.data;

export const getReconciliationRun = async (runId: string) =>
    (await api.get<{ success: boolean; data: ReconciliationRun }>(`/admin/reconciliation/runs/${runId}`)).data.data;
