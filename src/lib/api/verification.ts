import api from './api';

// POST /auth/email-verification/request (signed in). Sends the verification email.
export const requestEmailVerification = async () =>
  (await api.post<{ success: boolean; data: { alreadyVerified: boolean } }>('/auth/email-verification/request')).data.data;

// POST /auth/email-verification/confirm { token } (public, from the emailed link).
export const confirmEmailVerification = async (token: string) =>
  (await api.post<{ success: boolean; data: { verified: true } }>('/auth/email-verification/confirm', { token })).data.data;
