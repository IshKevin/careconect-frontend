export interface Appointment {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    appointmentType: 'consultation' | 'follow-up' | 'checkup' | 'follow_up' | 'emergency' | 'telemedicine' | 'routine_checkup';
    scheduledDate: string;
    scheduledTime: string;
    reason: string;
    notes?: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    // What the API actually returns (status above is kept for older screens).
    appointmentStatus?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
    doctor?: {
        firstName: string;
        lastName: string;
        specialty: string;
    };
    patient?: {
        firstName: string;
        lastName: string;
    };
}

export interface BookAppointmentRequest {
    doctorId: string;
    appointmentType: 'consultation' | 'follow-up' | 'checkup';
    scheduledDate: string;
    scheduledTime: string;
    reason: string;
    notes?: string;
}

export interface RescheduleAppointmentRequest {
    scheduledDate: string;
    scheduledTime: string;
}

export interface CancelAppointmentRequest {
    cancellationReason: string;
}

export interface UpdateAppointmentStatusRequest {
    appointmentStatus: 'completed' | 'cancelled' | 'rescheduled';
    notes?: string;
}

export interface AdminUpdateAppointmentRequest {
    appointmentStatus: 'rescheduled';
    scheduledDate: string;
    scheduledTime: string;
}
