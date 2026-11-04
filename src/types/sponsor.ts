// Shapes returned by GET /sponsor/dashboard, GET/POST /sponsor/links, PATCH /sponsor/links/:linkId.
// The sponsor dashboard never carries medical data.

export type SponsorRelationship = 'parent' | 'child' | 'spouse' | 'sibling' | 'guardian' | 'other';

export type SponsorLinkStatus = 'pending' | 'active' | 'revoked';

export interface SponsorLink {
  linkId: string;
  // Names come from the backend list; the other party's name is shown, never their contact details.
  sponsorName?: string;
  patientName?: string;
  sponsorUserId: string;
  patientUserId: string;
  relationship: SponsorRelationship;
  status: SponsorLinkStatus;
  medicalAccessGranted: boolean;
  requestedAt: string;
  approvedAt: string | null;
  revokedAt: string | null;
}

export interface SponsorDashboard {
  linkedPatients: {
    linkId: string;
    patientUserId: string;
    name: string;
    relationship: SponsorRelationship;
    medicalAccessGranted: boolean;
  }[];
  pendingRequests: {
    linkId: string;
    patientName: string;
    requestedAt: string;
  }[];
  invoices: {
    summary: {
      pendingCount: number;
      pendingAmount: string;
      paidCount: number;
      paidAmount: string;
    };
    recent: {
      invoiceId: string;
      invoiceNumber: string | null;
      patientName: string;
      totalAmount: string;
      invoiceStatus: string;
      invoiceDate: string;
    }[];
  };
  upcomingAppointments: {
    appointmentId: string;
    patientName: string;
    doctorName: string;
    scheduledDate: string;
    scheduledTime: string;
    appointmentType: string;
    appointmentStatus: string;
    consultationFee: string | null;
  }[];
  recentPayments: {
    txRef: string;
    patientName: string;
    invoiceId: string | null;
    amount: string;
    currency: string;
    completedAt: string | null;
  }[];
}

export interface SponsorLinkRequest {
  patientEmail: string;
  relationship: SponsorRelationship;
}

export interface SponsorLinkPatch {
  status?: 'active' | 'revoked';
  medicalAccessGranted?: boolean;
}
