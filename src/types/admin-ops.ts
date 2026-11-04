// Shapes for the admin dashboard, facilities, refunds and reconciliation endpoints.

export type FacilityType = 'hospital' | 'clinic' | 'private_practice' | 'health_center';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';
export type RefundStatus = 'pending' | 'approved' | 'processed' | 'rejected' | 'failed';

export interface AdminDashboard {
  users: {
    byType: Record<string, number>;
    total: number;
    newLast30Days: number;
    unverifiedEmails: number;
    suspended: number;
  };
  appointments: {
    byStatus: Record<string, number>;
    daily: { date: string; count: number }[];
  };
  invoices: {
    byStatus: Record<string, { count: number; amount: string }>;
    revenueDaily: { date: string; count: number; amount: string }[];
  };
  payments: {
    byStatus: Record<string, { count: number; amount: string }>;
  };
  refunds: {
    byStatus: Record<string, { count: number; amount: string }>;
    pendingApprovals: number;
  };
  sponsorship: {
    byStatus: Record<string, number>;
    activeWithMedicalAccess: number;
  };
  facilities: {
    byStatus: Record<string, number>;
    toReview: { facilityId: string; name: string; facilityType: string; createdAt: string }[];
  };
  reconciliation: {
    lastRunId: string;
    lastRunAt: string;
    status: string;
    mismatchCount: number;
    resolvedCount: number;
  } | null;
}

export interface Facility {
  facilityId: string;
  name: string;
  facilityType: FacilityType;
  registrationNumber: string;
  district: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  settlementAccountRef: string | null;
  verificationStatus: VerificationStatus;
  doctorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FacilityCreateInput {
  name: string;
  facilityType: FacilityType;
  registrationNumber: string;
  district?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface FacilitySettlement {
  facility: Facility;
  invoicedCount: number;
  paidGross: string;
  refunded: string;
  netSettlable: string;
  pendingInvoices: string;
  byDoctor: { doctorId: string; paidGross: string; refunded: string; net: string }[];
}

export interface Refund {
  refundId: string;
  invoiceId: string;
  transactionId: string;
  amount: string;
  currency: string;
  reason: string;
  status: RefundStatus;
  requestedBy: string;
  approvedBy: string | null;
  decisionNote: string | null;
  pesapalRefundRef: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
}

export interface ReconciliationFinding {
  type: string;
  reference: string;
  detail: string;
}

export interface ReconciliationRun {
  runId: string;
  triggeredBy: string;
  status: 'completed' | 'failed';
  startedAt: string;
  finishedAt: string | null;
  checkedTransactions: number;
  checkedInvoices: number;
  resolvedCount: number;
  mismatchCount: number;
  findings: ReconciliationFinding[];
  error: string | null;
}
