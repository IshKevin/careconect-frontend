'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSponsorDashboard, getSponsorLinks, requestSponsorLink, updateSponsorLink } from '@/lib/api/sponsor';
import { getProviderDashboard } from '@/lib/api/provider';
import {
  createFacility,
  decideRefund,
  getAdminDashboard,
  getFacilities,
  getFacilitySettlement,
  getRefunds,
  markRefundProcessed,
  updateFacility,
} from '@/lib/api/admin';
import { getUserProfile } from '@/lib/api/users';
import { requestEmailVerification } from '@/lib/api/verification';
import { getReconciliationRuns, getReconciliationRun, runReconciliation } from '@/lib/api/reconciliation';
import type { RefundStatus, VerificationStatus } from '@/types/admin-ops';
import type { SponsorLinkPatch, SponsorLinkRequest } from '@/types/sponsor';

export const useProfile = () => useQuery({ queryKey: ['profile'], queryFn: getUserProfile });

export const useSponsorDashboard = () => useQuery({ queryKey: ['sponsor', 'dashboard'], queryFn: getSponsorDashboard });

export const useSponsorLinks = () => useQuery({ queryKey: ['sponsor', 'links'], queryFn: getSponsorLinks });

export const useRequestSponsorLink = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SponsorLinkRequest) => requestSponsorLink(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsor'] }),
  });
};

export const useUpdateSponsorLink = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ linkId, body }: { linkId: string; body: SponsorLinkPatch }) => updateSponsorLink(linkId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsor'] }),
  });
};

export const useProviderDashboard = () => useQuery({ queryKey: ['provider', 'dashboard'], queryFn: () => getProviderDashboard() });

export const useAdminDashboard = () => useQuery({ queryKey: ['admin', 'dashboard'], queryFn: getAdminDashboard });

export const useFacilities = () => useQuery({ queryKey: ['admin', 'facilities'], queryFn: getFacilities });

export const useFacilitySettlement = (facilityId: string | null) =>
  useQuery({
    queryKey: ['admin', 'facilities', facilityId, 'settlement'],
    queryFn: () => getFacilitySettlement(facilityId as string),
    enabled: Boolean(facilityId),
  });

export const useCreateFacility = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFacility,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
};

export const useUpdateFacility = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityId, verificationStatus }: { facilityId: string; verificationStatus: VerificationStatus }) =>
      updateFacility(facilityId, { verificationStatus }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
};

export const useRefunds = (status: RefundStatus | undefined) =>
  useQuery({ queryKey: ['admin', 'refunds', status ?? 'all'], queryFn: () => getRefunds(status) });

export const useRefundDecision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ refundId, decision, note }: { refundId: string; decision: 'approve' | 'reject'; note?: string }) =>
      decideRefund(refundId, { decision, note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
};

export const useMarkRefundProcessed = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ refundId, note }: { refundId: string; note?: string }) => markRefundProcessed(refundId, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
};

export const useReconciliationRuns = () => useQuery({ queryKey: ['admin', 'reconciliation'], queryFn: getReconciliationRuns });

export const useReconciliationRun = (runId: string | null) =>
  useQuery({
    queryKey: ['admin', 'reconciliation', runId],
    queryFn: () => getReconciliationRun(runId as string),
    enabled: Boolean(runId),
  });

export const useRunReconciliation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: runReconciliation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
};

export const useRequestVerification = () => useMutation({ mutationFn: requestEmailVerification });
