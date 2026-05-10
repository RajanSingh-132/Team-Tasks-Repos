import { format, isPast, parseISO } from 'date-fns';

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    try { return format(new Date(dateStr), 'MMM d, yyyy'); } catch { return '—'; }
  }
}

export function isOverdue(dateStr: string | undefined | null, status: string): boolean {
  if (!dateStr || status === 'done') return false;
  try {
    return isPast(parseISO(dateStr));
  } catch {
    try { return isPast(new Date(dateStr)); } catch { return false; }
  }
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function getApiError(err: unknown): string {
  const e = err as { response?: { data?: { detail?: string } }; message?: string };
  return e?.response?.data?.detail || e?.message || 'Something went wrong';
}

export const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', done: 'Done',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low', medium: 'Medium', high: 'High',
};
