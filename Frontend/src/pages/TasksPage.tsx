import { useEffect, useState } from 'react';
import { CheckSquare, Clock, Plus, X, Calendar, Flag, User, Briefcase } from 'lucide-react';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import { authApi } from '../api/auth';
import type { Task, Project, User as UserType } from '../types';
import { formatDate, getApiError, STATUS_LABELS, PRIORITY_LABELS } from '../utils';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  
  // New Task Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    project_id: '',
    assigned_to: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        tasksApi.myTasks(),
        projectsApi.list(),
        authApi.listUsers()
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (e) {
      toast.error(getApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (id: string, status: Task['status']) => {
    try {
      await tasksApi.update(id, { status });
      toast.success('Status updated');
      setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
    } catch (e) { toast.error(getApiError(e)); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id) {
      toast.error('Please select a project');
      return;
    }
    try {
      await tasksApi.create(formData);
      toast.success('Task created successfully');
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        project_id: '',
        assigned_to: ''
      });
      load();
    } catch (e) {
      toast.error(getApiError(e));
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  if (loading) return <div className="flex justify-center h-64 items-center"><Spinner size="lg" className="text-brand-600" /></div>;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Task Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your assigned work</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {['all', 'todo', 'in_progress', 'done'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === f ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                {f === 'all' ? 'All' : STATUS_LABELS[f as keyof typeof STATUS_LABELS]}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon={<CheckSquare className="w-8 h-8" />} 
          title="No tasks found" 
          description={filter === 'all' ? "You don't have any tasks assigned yet." : `No tasks in ${STATUS_LABELS[filter as keyof typeof STATUS_LABELS]} status.`} 
          action={filter === 'all' && <button onClick={() => setShowModal(true)} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Create Task</button>}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(t => (
            <div key={t.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{t.title}</h3>
                  <span className={`badge badge-${t.priority} scale-90`}>{PRIORITY_LABELS[t.priority] || t.priority}</span>
                </div>
                {t.description && <p className="text-sm text-gray-500 line-clamp-1 mb-3">{t.description}</p>}
                <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Due {formatDate(t.due_date)}</span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> {projects.find(p => p.id === t.project_id)?.name || 'Unknown Project'}
                  </span>
                </div>
              </div>
              
              <div className="flex-shrink-0 sm:border-l border-gray-100 dark:border-gray-800 sm:pl-5 sm:ml-2">
                <select 
                  value={t.status} 
                  onChange={(e) => handleStatusChange(t.id, e.target.value as Task['status'])}
                  className={`text-sm font-bold border-2 rounded-xl px-3 py-2 outline-none cursor-pointer transition-colors ${
                    t.status === 'todo' ? 'border-gray-200 text-gray-600 bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:bg-gray-800' :
                    t.status === 'in_progress' ? 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:bg-amber-950/20' :
                    'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:bg-emerald-950/20'
                  }`}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                <Plus className="w-6 h-6 text-brand-600" /> Create New Task
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Task Title</label>
                <input 
                  type="text" required
                  className="input-field" placeholder="What needs to be done?"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea 
                  className="input-field min-h-[100px] py-3" placeholder="Add more details..."
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand-500" /> Due Date
                  </label>
                  <input 
                    type="date" required
                    className="input-field"
                    value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Flag className="w-4 h-4 text-brand-500" /> Priority
                  </label>
                  <select 
                    className="input-field"
                    value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-brand-500" /> Project
                  </label>
                  <select 
                    required className="input-field"
                    value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-brand-500" /> Assign To
                  </label>
                  <select 
                    required className="input-field"
                    value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})}
                  >
                    <option value="">Select User</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-4 mt-4 text-base shadow-glow">
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
