import api from './api';
import type { AuthTokens, User } from '../types';

export const authApi = {
  signup: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post<User>('auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthTokens>('auth/login', data),

  me: () => api.get<User>('auth/me'),
  listUsers: () => api.get<User[]>('auth/users'),
  deleteUser: (id: string) => api.delete(`auth/users/${id}`),
};
