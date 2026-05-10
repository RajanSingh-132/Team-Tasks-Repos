import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Users, UserPlus, UserMinus,
  CheckSquare, Pencil, Trash2, Calendar, Flag,
} from 'lucide-react';
import { useForm } from '../../../node_modules/react-hook-form/dist';
import toast from 'react-hot-toast';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import type { Project, Task } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, isOverdue, getApiError, STATUS_LABELS, PRIORITY_LABELS } from '../Utils';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import clsx from 'clsx';

interface TaskForm {
  title: string; description: string; due_date: string;
  priority: 'low' | 'medium' | 'high'; assigned_to: string;
}

const STATUSES = ['todo', 'in_progress', 'done'] as const;

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTask, setShowTask] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeStatus, setActiveStatus] = useState<string>('all');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TaskForm>();

  const load = async () => {
    if (!id) return;
    try {
      const [pRes, tRes] = await Promise.all([projectsApi.get(id), tasksApi.listByProject(id)]);
      setProject(pRes.data);
      setTasks(tRes.data);
    } catch (e) {
      toast.error(getApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const openEditTask = (t: Task) => {
    setEditTask(t);
    setValue('title', t.title);
    setValue('description', t.description);
    setValue('due_date', t.due_date?.split('T')[0] || '');
    setValue('priority', t.priority);
    setValue('assigned_to', t.assigned_to);
  };

  const onTaskSubmit = async (data: TaskForm) => {
    if (!id) return;
    setSaving(true);
    try {
      if (editTask) {
        await tasksApi.update(editTask.id, { ...data, due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined });
        toast.success('Task updated');
        setEditTask(null);
      } else {
        await tasksApi.create({ ...data, project_id: id, due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined });
        toast.success('Task created');
        setShowTask(false);
      }
      reset();
      load();
    } catch (e) {
      toast.error(getApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    setDeleting(true);
    try {
      await tasksApi.delete(deleteTaskId);
      toast.success('Task deleted');
      setDeleteTaskId(null);
      load();
    } catch (e) {
      toast.error(getApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await tasksApi.update(task.id, { status: newStatus as Task['status'] });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus as Task['status'] } : t));
      toast.success('Status updated');
    } catch (e) {
      toast.error(getApiError(e));
    }
  };

  const filteredTasks = activeStatus === 'all' ? tasks : tasks.filter(t => t.status === activeStatus);

  const TaskFormContent = () => (
    <form onSubmit={handleSubmit(onTaskSubmit)} className="space-y-4">
      <div>
        <label className="label">Title</label>
        <input {...register('title', { required: 'Title is required' })} className="input" placeholder="Task title" />
        {errors.title && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.title.message}</p>}
      </div>
      <div>
        <label className="label">Description</label>
        <textarea {...register('description')} rows={2} className="input resize-none" placeholder="Optional description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Due Date</label>
          <input type="date" {...register('due_date')} className="input" />
        </div>
        <div>
          <label className="label">Priority</label>
          <select {...register('priority')} className="input">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Assign to (User ID)</label>
        <input {...register('assigned_to')} className="input" placeholder="Leave blank for unassigned" />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={() => { setShowTask(false); setEditTask(null); reset(); }}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Spinner size="sm" />}
          {editTask ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-600" /></div>;
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Project not found.</p>
        <Link to="/projects" className="btn-primary mt-4 inline-flex">Back to Projects</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/projects" className="btn-ghost p-2 mt-1 rounded-lg flex-shrink-0"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="page-title truncate">{project.name}</h1>
          {project.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>}
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5" />{project.members.length} members
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckSquare className="w-3.5 h-3.5" />{tasks.length} tasks
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {isAdmin && (
            <button className="btn-secondary" onClick={() => setShowMembers(true)}>
              <UserPlus className="w-4 h-4" /> Members
            </button>
          )}
          {isAdmin && (
            <button className="btn-primary" onClick={() => { reset(); setShowTask(true); }}>
              <Plus className="w-4 h-4" /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150',
              activeStatus === s
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {s === 'all' ? `All (${tasks.length})` : `${STATUS_LABELS[s]} (${tasks.filter(t => t.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUSES.map(status => {
          const colTasks = tasks.filter(t => t.status === status);
          const isFiltered = activeStatus !== 'all' && activeStatus !== status;
          if (isFiltered) return null;

          const colColors: Record<string, string> = {
            todo: 'border-gray-300 dark:border-gray-700',
            in_progress: 'border-amber-400 dark:border-amber-600',
            done: 'border-emerald-400 dark:border-emerald-600',
          };
          const colBg: Record<string, string> = {
            todo: 'bg-gray-50 dark:bg-gray-900/50',
            in_progress: 'bg-amber-50/50 dark:bg-amber-950/20',
            done: 'bg-emerald-50/50 dark:bg-emerald-950/20',
          };

          return (
            <div key={status} className={`rounded-2xl p-4 border-t-4 ${colColors[status]} ${colBg[status]} flex flex-col gap-3 min-h-48`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{STATUS_LABELS[status]}</h3>
                <span className="text-xs font-bold text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>

              {colTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-400 py-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                  No tasks
                </div>
              ) : (
                <div className="space-y-3">
                  {colTasks.map(task => {
                    const overdue = isOverdue(task.due_date, task.status);
                    const canEdit = isAdmin || task.assigned_to === user?.id;
                    return (
                      <div key={task.id} className={clsx(
                        'bg-white dark:bg-gray-900 rounded-xl p-4 border shadow-sm',
                        overdue ? 'border-rose-200 dark:border-rose-900' : 'border-gray-100 dark:border-gray-800',
                        'hover:shadow-md transition-shadow'
                      )}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">{task.title}</p>
                          {isAdmin && (
                            <div className="flex gap-1 flex-shrink-0">
                              <button className="btn-ghost p-1 rounded" onClick={() => openEditTask(task)}><Pencil className="w-3 h-3" /></button>
                              <button className="btn-ghost p-1 rounded text-red-400 hover:text-red-500" onClick={() => setDeleteTaskId(task.id)}><Trash2 className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className={`badge badge-${task.priority}`}>
                            <Flag className="w-2.5 h-2.5" />{PRIORITY_LABELS[task.priority]}
                          </span>
                          {overdue && <span className="badge bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">Overdue</span>}
                        </div>

                        {task.due_date && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                            <Calendar className="w-3 h-3" />
                            <span className={overdue ? 'text-rose-500 font-medium' : ''}>{formatDate(task.due_date)}</span>
                          </div>
                        )}

                        {/* Status changer */}
                        {canEdit && (
                          <select
                            value={task.status}
                            onChange={e => handleStatusChange(task, e.target.value)}
                            className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                          >
                            {STATUSES.map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      <Modal open={showTask} onClose={() => { setShowTask(false); reset(); }} title="Add Task" size="md">
        <TaskFormContent />
      </Modal>

      {/* Edit Task Modal */}
      <Modal open={!!editTask} onClose={() => { setEditTask(null); reset(); }} title="Edit Task" size="md">
        <TaskFormContent />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="This task will be permanently deleted."
        loading={deleting}
        confirmLabel="Delete Task"
      />

      {/* Members Modal */}
      <Modal open={showMembers} onClose={() => setShowMembers(false)} title="Manage Members" size="md">
        <div className="space-y-4">
          <div className="space-y-2">
            {project.members.map(memberId => (
              <div key={memberId} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate">{memberId}</span>
                {project.admin_id !== memberId && isAdmin && (
                  <button
                    className="btn-ghost p-1.5 rounded text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={async () => {
                      try {
                        await projectsApi.removeMember(project.id, memberId);
                        toast.success('Member removed');
                        load();
                      } catch (e) { toast.error(getApiError(e)); }
                    }}
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isAdmin && (
            <div>
              <label className="label">Add Member by User ID</label>
              <div className="flex gap-2">
                <input
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  className="input flex-1"
                  placeholder="User ObjectID"
                />
                <button
                  className="btn-primary flex-shrink-0"
                  onClick={async () => {
                    if (!memberEmail.trim()) return;
                    try {
                      await projectsApi.addMember(project.id, memberEmail.trim());
                      toast.success('Member added');
                      setMemberEmail('');
                      load();
                    } catch (e) { toast.error(getApiError(e)); }
                  }}
                >
                  <UserPlus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}