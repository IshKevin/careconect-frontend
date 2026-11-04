import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Medication } from '../types/patient';
import * as PatientAPI from '../lib/api/patient';
import {
    CreateMedicationRequest
} from '../types/patient';

export const PATIENT_KEYS = {
    all: ['patient'] as const,
    profile: () => [...PATIENT_KEYS.all, 'profile'] as const,
    medicalSummary: () => [...PATIENT_KEYS.all, 'medicalSummary'] as const,
    medicalHistory: () => [...PATIENT_KEYS.all, 'medicalHistory'] as const,
    allergies: () => [...PATIENT_KEYS.all, 'allergies'] as const,
    medications: () => [...PATIENT_KEYS.all, 'medications'] as const,
    preferences: () => [...PATIENT_KEYS.all, 'preferences'] as const,
};

export function usePatientProfile() {
    return useQuery({
        queryKey: PATIENT_KEYS.profile(),
        queryFn: PatientAPI.getPatientProfile,
    });
}

export function useUpdatePatientProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: PatientAPI.updatePatientProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.profile() });
        },
    });
}

export function useMedicalHistory() {
    return useQuery({
        queryKey: PATIENT_KEYS.medicalHistory(),
        queryFn: PatientAPI.getMedicalHistory,
    });
}

export function useAddMedicalHistory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: PatientAPI.addMedicalHistory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.medicalHistory() });
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.medicalSummary() });
        },
    });
}

export function useDeleteMedicalHistory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: PatientAPI.deleteMedicalHistory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.medicalHistory() });
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.medicalSummary() });
        },
    });
}

export function useAllergies() {
    return useQuery({
        queryKey: PATIENT_KEYS.allergies(),
        queryFn: PatientAPI.getAllergies,
    });
}

export function useAddAllergy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: PatientAPI.addAllergy,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.allergies() });
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.medicalSummary() });
        },
    });
}

export function useDeleteAllergy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: PatientAPI.deleteAllergy,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.allergies() });
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.medicalSummary() });
        },
    });
}

export function useMedications() {
    return useQuery({
        queryKey: PATIENT_KEYS.medications(),
        queryFn: PatientAPI.getMedications,
        // The API wraps lists in { success, data }; hand consumers the array.
        select: (res: unknown): Medication[] => (Array.isArray(res) ? res : ((res as { data?: Medication[] })?.data ?? [])),
    });
}

export function useAddMedication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: PatientAPI.addMedication,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.medications() });
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.medicalSummary() });
        },
    });
}

export function useUpdateMedication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateMedicationRequest }) =>
            PatientAPI.updateMedication(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.medications() });
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.medicalSummary() });
        },
    });
}

export function useDeleteMedication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: PatientAPI.deleteMedication,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.medications() });
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.medicalSummary() });
        },
    });
}

export function usePatientPreferences() {
    return useQuery({
        queryKey: PATIENT_KEYS.preferences(),
        queryFn: PatientAPI.getPatientPreferences,
    });
}

export function useUpdatePatientPreferences() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: PatientAPI.updatePatientPreferences,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.preferences() });
        },
    });
}
