import api from './api';
import {
    User,
    UpdateUserProfileRequest,
    CreateUserRequest,
    UpdateUserStatusRequest
} from '../../types/user';

// The API wraps the user in { success, data }.
export const getUserProfile = async () => {
    return (await api.get<{ success: boolean; data: User }>('/users/profile')).data.data;
};

export const updateUserProfile = async (data: UpdateUserProfileRequest) => {
    return (await api.put<User>('/users/profile', data)).data;
};

export const getUserProfileCompleteness = async () => {
    return (await api.get<{ completeness: number }>('/users/profile/completeness')).data;
};

export const checkUserExists = async (email?: string, phoneNumber?: string) => {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (phoneNumber) params.append('phoneNumber', phoneNumber);
    return (await api.get<{ exists: boolean }>(`/users/exists?${params.toString()}`)).data;
};

// Admin Routes
export const searchUsers = async (query: { search?: string; userType?: string; page?: number; limit?: number }) => {
    return (await api.get<{ users: User[]; total: number }>('/users/search', { params: query })).data;
};

export const listUsers = async (query: { page?: number; limit?: number; userType?: string; accountStatus?: string }) => {
    return (await api.get<{ users: User[]; total: number }>('/users/list', { params: query })).data;
};

export const createUser = async (data: CreateUserRequest) => {
    return (await api.post<User>('/users/', data)).data;
};

export const getUsersByType = async (userType: string) => {
    return (await api.get<User[]>(`/users/type/${userType}`)).data;
};

export const getAdminUserProfile = async (userId: string) => {
    return (await api.get<User>(`/users/${userId}/profile`)).data;
};

export const adminUpdateUserProfile = async (userId: string, data: UpdateUserProfileRequest) => {
    return (await api.put<User>(`/users/${userId}/profile`, data)).data;
};

export const updateUserStatus = async (userId: string, data: UpdateUserStatusRequest) => {
    return (await api.put<User>(`/users/${userId}/status`, data)).data;
};

export const unlockUser = async (userId: string) => {
    return (await api.post<{ message: string }>(`/users/${userId}/unlock`)).data;
};

export const deleteUser = async (userId: string) => {
    return (await api.delete<{ message: string }>(`/users/${userId}`)).data;
};

export const updateCurrentUser = async (data: UpdateUserProfileRequest) => {
    return (await api.patch<User>('/users/me', data)).data;
};
