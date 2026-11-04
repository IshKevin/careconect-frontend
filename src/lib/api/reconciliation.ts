import api from './api';
import type { ReconciliationRun } from '../../types/admin-ops';

// PAY-07 reconciliation endpoints (admin only). Envelope: { success, data }.
export const runReconciliation = async () =>
  (await api.post<{ success: boolean; data: ReconciliationRun }>('/admin/reconciliation/runs')).data.data;

export const getReconciliationRuns = async () =>
  (await api.get<{ success: boolean; data: ReconciliationRun[] }>('/admin/reconciliation/runs')).data.data;

export const getReconciliationRun = async (runId: string) =>
  (await api.get<{ success: boolean; data: ReconciliationRun }>(`/admin/reconciliation/runs/${runId}`)).data.data;
