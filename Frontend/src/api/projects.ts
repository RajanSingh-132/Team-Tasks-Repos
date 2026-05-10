import api from './api';
import type { Project } from '../types';

export const projectsApi = {
  list: () => api.get<Project[]>('projects'),
  get: (id: string) => api.get<Project>(`projects/${id}`),
  create: (data: { name: string; description: string }) => api.post<Project>('projects', data),
  update: (id: string, data: { name?: string; description?: string }) => api.put<Project>(`projects/${id}`, data),
  delete: (id: string) => api.delete(`projects/${id}`),
  addMember: (projectId: string, userId: string) => api.post(`projects/${projectId}/members`, { user_id: userId }),
  removeMember: (projectId: string, userId: string) => api.delete(`projects/${projectId}/members/${userId}`),
};
