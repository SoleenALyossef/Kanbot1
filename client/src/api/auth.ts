import type { AuthResponse, LoginRequest, MeResponse, RegisterRequest } from '../types/api';
import { http } from './client';

export const authApi = {
  register: (body: RegisterRequest) => http.post<AuthResponse>('/auth/register', body),
  login: (body: LoginRequest) => http.post<AuthResponse>('/auth/login', body),
  me: () => http.get<MeResponse>('/auth/me'),
};
