import api from './api';

// POST /auth/forgot-password { email } (public). The reply is the same whether or not the account exists.
export const requestPasswordReset = async (email: string) =>
  (await api.post<{ success: boolean }>('/auth/forgot-password', { email })).data;

// POST /auth/reset-password { token, newPassword, confirmPassword } (public, from the emailed link).
export const confirmPasswordReset = async (token: string, newPassword: string, confirmPassword: string) =>
  (await api.post<{ success: boolean }>('/auth/reset-password', { token, newPassword, confirmPassword })).data;
