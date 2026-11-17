export interface PatientProfile {
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    bloodType?: string;
    height?: number;
    weight?: number;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    insuranceGroupNumber?: string;
    preferredPharmacy?: string;
}

export interface MedicalHistory {
    historyId: string;
    conditionType: string;
    conditionName: string;
    conditionCode?: string;
    severity: 'mild' | 'moderate' | 'severe';
    onsetDate: string;
    resolvedDate?: string;
    notes?: string;
}

export interface CreateMedicalHistoryRequest {
    conditionType: string;
    conditionName: string;
    conditionCode?: string;
    severity: 'mild' | 'moderate' | 'severe';
    onsetDate: string;
    resolvedDate?: string;
    notes?: string;
}

export type AllergenType = 'drug' | 'food' | 'environmental' | 'other';
export type Severity = 'mild' | 'moderate' | 'severe' | 'critical';

export interface Allergy {
    allergyId: string;
    allergenType: AllergenType;
    allergenName: string;
    reactionSeverity: Severity | null;
    symptoms: string | null;
    firstOccurrence?: string | null;
    lastOccurrence?: string | null;
    treatmentNotes?: string | null;
    verifiedByDoctor?: boolean;
    createdAt?: string;
}

export interface CreateAllergyRequest {
    allergenType: AllergenType;
    allergenName: string;
    reactionSeverity?: Severity;
    symptoms?: string;
    firstOccurrence?: string;
    lastOccurrence?: string;
    treatmentNotes?: string;
}

export type MedicationRoute = 'oral' | 'injection' | 'topical' | 'inhalation' | 'other';

export interface Medication {
    medicationId: string;
    medicationName: string;
    genericName?: string | null;
    dosage?: string | null;
    frequency?: string | null;
    route?: MedicationRoute | null;
    startDate?: string | null;
    endDate?: string | null;
    pharmacyFilled?: string | null;
    sideEffects?: string | null;
    isActive: boolean;
    createdAt?: string;
}

export interface CreateMedicationRequest {
    medicationName: string;
    genericName?: string;
    dosage?: string;
    frequency?: string;
    route?: MedicationRoute;
    startDate?: string;
    endDate?: string;
    pharmacyFilled?: string;
    sideEffects?: string;
    isActive?: boolean;
}

export interface PatientPreferences {
    preferredCommunicationMethod: 'email' | 'sms' | 'phone';
    appointmentReminderTiming: number;
    dataSharingConsent: {
        allowDataSharing: boolean;
        consentDate: string;
        consentVersion: string;
    };
    marketingConsent: boolean;
    researchParticipationConsent: boolean;
    familyAccessPermissions: {
        relationship: string;
        accessLevel: 'full' | 'read-only';
    }[];
    privacySettings: {
        shareWithFamilyMembers: boolean;
        shareWithPrimaryCare: boolean;
        shareForResearch: boolean;
    };
}
