import api from './api';
import type { Task } from '../types';

export const tasksApi = {
  listByProject: (projectId: string) => api.get<Task[]>(`tasks/project/${projectId}`),
  myTasks: () => api.get<Task[]>('tasks/my-tasks'),
  get: (id: string) => api.get<Task>(`tasks/${id}`),
  create: (data: {
    title: string; description?: string; due_date?: string;
    priority?: string; project_id: string; assigned_to?: string;
  }) => api.post<Task>('tasks', data),
  update: (id: string, data: Partial<Task>) => api.put<Task>(`tasks/${id}`, data),
  delete: (id: string) => api.delete(`tasks/${id}`),
};
