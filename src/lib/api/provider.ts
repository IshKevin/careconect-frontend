import api from './api';
import { ProviderDashboard } from '../../types/provider';

// Doctors call without arguments. Admins pass the doctor's id.
export const getProviderDashboard = async (doctorId?: string) =>
  (
    await api.get<{ success: boolean; data: ProviderDashboard }>('/provider/dashboard', {
      params: doctorId ? { doctorId } : undefined,
    })
  ).data.data;
