import api from './api';
import { SponsorDashboard, SponsorLink, SponsorLinkPatch, SponsorLinkRequest } from '../../types/sponsor';

// All calls return the API envelope { success, data, requestId }.
export const getSponsorDashboard = async () =>
  (await api.get<{ success: boolean; data: SponsorDashboard }>('/sponsor/dashboard')).data.data;

export const getSponsorLinks = async () =>
  (await api.get<{ success: boolean; data: SponsorLink[] }>('/sponsor/links')).data.data;

// Generic 202 reply: the same message whether or not the patient exists.
export const requestSponsorLink = async (body: SponsorLinkRequest) =>
  (await api.post<{ success: boolean; message: string }>('/sponsor/links', body)).data;

export const updateSponsorLink = async (linkId: string, body: SponsorLinkPatch) =>
  (await api.patch<{ success: boolean; data: SponsorLink }>(`/sponsor/links/${linkId}`, body)).data.data;
