// Shape returned by GET /provider/dashboard (doctor, or admin with ?doctorId=).

export interface ProviderDashboard {
  doctor: {
    doctorId: string;
    name: string;
    specialty: string | null;
    consultationFee: string | null;
    facility: {
      facilityId: string;
      name: string | null;
      verificationStatus: 'pending' | 'verified' | 'rejected' | 'suspended' | null;
    } | null;
  };
  appointments: {
    today: number;
    nextSevenDays: number;
    completed: number;
    noShow: number;
    cancelled: number;
  };
  patients: { total: number };
  consultations: { total: number };
  invoices: {
    pendingCount: number;
    pendingAmount: string;
    paidCount: number;
    paidAmount: string;
    refundedAmount: string;
  };
  upcomingAppointments: {
    appointmentId: string;
    patientName: string;
    scheduledDate: string;
    scheduledTime: string;
    appointmentType: string;
    appointmentStatus: string;
  }[];
}
