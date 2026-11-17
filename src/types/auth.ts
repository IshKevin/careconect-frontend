export interface User {
  userId: string;
  email: string;
  phoneNumber: string;
  userType: 'patient' | 'admin' | 'super_admin' | 'doctor' | 'sponsor';
  accountStatus: string;
  emailVerified: boolean | null;
  phoneVerified: boolean | null;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  loginAttempts: number | null;
  accountLockedUntil: string | null;
  doctorId?: string; // Added for doctors
  patientId?: string; // Added for patients
  profile: {
    firstName: string;
    lastName: string;
  };
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  data: LoginResponseData | RegisterResponseData;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponseData {
  patientId: string;
  doctorId: string;
  userId: string;
  email: string;
  phoneNumber: string;
  userType: 'patient';
  accountStatus: string;
  emailVerified: boolean | null;
  phoneVerified: boolean | null;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  loginAttempts: number | null;
  accountLockedUntil: string | null;
  profile: {
    firstName: string;
    lastName: string;
  };
}

export interface AuthError {
  success: false;
  error: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: 'patient';
}