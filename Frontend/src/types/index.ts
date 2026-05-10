export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  admin_id: string;
  members: string[];
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  project_id: string;
  assigned_to: string;
  created_by: string;
  created_at: string;
}

export interface DashboardData {
  total_tasks: number;
  total_projects: number;
  tasks_by_status: {
    todo: number;
    in_progress: number;
    done: number;
  };
  overdue_tasks: number;
  overdue_details: Array<{ id: string; title: string; due_date: string; assigned_to: string }>;
  tasks_per_user: Record<string, number>;
  recent_tasks: Array<{ id: string; title: string; status: string; due_date: string }>;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
}
