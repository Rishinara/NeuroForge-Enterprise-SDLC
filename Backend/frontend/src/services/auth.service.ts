import api from '../lib/api';

export interface UserPayload {
  userId: number;
  email: string;
  fullName: string;
  orgId: number | null;
  orgName: string | null;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: UserPayload;
}

export const authService = {
  signup: (data: { fullName: string; firstName?: string; lastName?: string; email: string; phone?: string; role?: string; password: string; }) =>
    api.post<AuthResponse>('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  me: () =>
    api.get<UserPayload>('/auth/me'),
};