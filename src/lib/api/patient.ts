import api from './api';
import {
    PatientProfile,
    MedicalHistory,
    CreateMedicalHistoryRequest,
    Allergy,
    CreateAllergyRequest,
    Medication,
    CreateMedicationRequest,
    PatientPreferences
} from '../../types/patient';

export const getPatientProfile = async () => {
    return (await api.get<PatientProfile>('/patient/profile')).data;
};

export const createPatientProfile = async (data: PatientProfile) => {
    return (await api.post<PatientProfile>('/patient/profile', data)).data;
};

export const updatePatientProfile = async (data: PatientProfile) => {
    return (await api.put<PatientProfile>('/patient/profile', data)).data;
};

export const getMedicalSummary = async () => {
    return (await api.get<unknown>('/patient/medical-summary')).data;
};

export const getMedicalHistory = async () => {
    return (await api.get<MedicalHistory[]>('/patient/medical-history')).data;
};

export const addMedicalHistory = async (data: CreateMedicalHistoryRequest) => {
    return (await api.post<MedicalHistory>('/patient/medical-history', data)).data;
};

export const deleteMedicalHistory = async (historyId: string) => {
    return (await api.delete<{ message: string }>(`/patient/medical-history/${historyId}`)).data;
};

export const getAllergies = async () => {
    return (await api.get<Allergy[]>('/patient/allergies')).data;
};

export const addAllergy = async (data: CreateAllergyRequest) => {
    return (await api.post<Allergy>('/patient/allergies', data)).data;
};

// Edits send only the fields that change; '' clears an optional field.
export const updateAllergy = async (allergyId: string, data: Partial<CreateAllergyRequest>) => {
    return (await api.put<{ success: boolean; data: Allergy }>(`/patient/allergies/${allergyId}`, data)).data.data;
};

export const deleteAllergy = async (allergyId: string) => {
    return (await api.delete<{ message: string }>(`/patient/allergies/${allergyId}`)).data;
};

export const getMedications = async () => {
    return (await api.get<Medication[]>('/patient/medications')).data;
};

export const addMedication = async (data: CreateMedicationRequest) => {
    return (await api.post<Medication>('/patient/medications', data)).data;
};

export const updateMedication = async (medicationId: string, data: Partial<CreateMedicationRequest>) => {
    return (await api.put<Medication>(`/patient/medications/${medicationId}`, data)).data;
};

export const deleteMedication = async (medicationId: string) => {
    return (await api.delete<{ message: string }>(`/patient/medications/${medicationId}`)).data;
};

export const updateMedicationStatus = async (medicationId: string, isActive: boolean) => {
    return (await api.put<Medication>(`/patient/medications/${medicationId}/status`, { isActive })).data;
};

export const getPatientPreferences = async () => {
    return (await api.get<PatientPreferences>('/patient/preferences')).data;
};

export const updatePatientPreferences = async (data: PatientPreferences) => {
    return (await api.put<PatientPreferences>('/patient/preferences', data)).data;
};

// Admin/Doctor access routes would go here if needed, but they are technically separate resources (admin view of patient)
// For simplicity I will put them here or in a separate file if they become too many.
// Keeping them here for cohesion with "Patient Data".

export const getAdminPatientProfile = async (userId: string) => {
    return (await api.get<PatientProfile>(`/patient/admin/${userId}/profile`)).data;
};

export const getDoctorPatientProfile = async (userId: string) => {
    return (await api.get<PatientProfile>(`/patient/doctor/${userId}/profile`)).data;
};
