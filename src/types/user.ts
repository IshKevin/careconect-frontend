export interface UserProfile {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
}

export interface User {
  userId: string;
  email: string;
  phoneNumber: string;
  userType: 'patient' | 'admin' | 'doctor' | 'sponsor';
  accountStatus: 'active' | 'suspended' | 'pending';
  emailVerified: boolean | null;
  phoneVerified: boolean | null;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  loginAttempts: number | null;
  accountLockedUntil: string | null;
  profile: UserProfile;
}

export interface CreateUserRequest {
  email: string;
  phoneNumber: string;
  password: string;
  userType: 'patient' | 'admin' | 'doctor' | 'sponsor';
  firstName: string;
  lastName: string;
  accountStatus?: 'active' | 'suspended' | 'pending';
}

export interface UpdateUserProfileRequest {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserStatusRequest {
  accountStatus: 'active' | 'suspended';
  reason?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersLastMonth: number;
  // Add other stats as needed
}
