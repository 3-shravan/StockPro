import { Role } from '@/types/enums';

export interface User {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  department?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthTokenResponse {
  token: string;
  role: Role;
  userId: number;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  role?: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}
