import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, CheckSquare, Clock, ArrowLeft, Users as UsersIcon, UserPlus, X } from 'lucide-react';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import type { Project, Task, User } from '../types';
import { formatDate, getApiError, STATUS_LABELS, PRIORITY_LABELS } from '../utils';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAdmin: isGlobalAdmin } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const isProjectAdmin = project?.admin_id === currentUser?.id || isGlobalAdmin;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      projectsApi.get(id),
      tasksApi.listByProject(id),
      authApi.listUsers()
    ])
      .then(([p, t, u]) => { 
        setProject(p.data); 
        setTasks(t.data); 
        setAllUsers(u.data);
      })
      .catch(e => toast.error(getApiError(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddMember = async (userId: string) => {
    if (!id) return;
    try {
      await projectsApi.addMember(id, userId);
      const res = await projectsApi.get(id);
      setProject(res.data);
      toast.success('Member added successfully');
    } catch (e) {
      toast.error(getApiError(e));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id || !window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await projectsApi.removeMember(id, userId);
      const res = await projectsApi.get(id);
      setProject(res.data);
      toast.success('Member removed successfully');
    } catch (e) {
      toast.error(getApiError(e));
    }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Spinner size="lg" className="text-brand-600" /></div>;
  if (!project) return <div className="text-center py-12">Project not found</div>;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <div className="card p-6 md:p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">Project</span>
            <span className="text-sm text-gray-400 font-medium">Created {formatDate(project.created_at)}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">{project.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed max-w-3xl">{project.description}</p>
          
          <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-gray-100 dark:border-gray-800 pt-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Team Members ({project.members?.length || 0})</p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {project.members?.map(mId => {
                    const u = allUsers.find(user => user.id === mId);
                    return (
                      <div key={mId} className="relative group">
                        <Avatar name={u?.name || mId} className="border-2 border-white dark:border-gray-900" />
                        {isProjectAdmin && mId !== project.admin_id && (
                          <button 
                            onClick={() => handleRemoveMember(mId)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isProjectAdmin && (
                  <button 
                    onClick={() => setShowMemberModal(true)}
                    className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-brand-600 hover:border-brand-600 transition-colors"
                    title="Add Member"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-gray-200 dark:bg-gray-800" />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Tasks</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{tasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-brand-500" /> Tasks
        </h2>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={<CheckSquare className="w-8 h-8" />} title="No tasks found" description="There are no tasks in this project yet." />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {tasks.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">{t.title}</p>
                      {t.description && <p className="text-xs text-gray-500 truncate max-w-xs">{t.description}</p>}
                    </td>
                    <td className="py-3 px-4"><span className={`badge badge-${t.status}`}>{STATUS_LABELS[t.status] || t.status}</span></td>
                    <td className="py-3 px-4"><span className={`badge badge-${t.priority}`}>{PRIORITY_LABELS[t.priority] || t.priority}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5" /> {formatDate(t.due_date)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-brand-600" /> Add Members
              </h3>
              <button onClick={() => setShowMemberModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {allUsers.filter(u => !project.members?.includes(u.id)).length === 0 ? (
                <p className="text-center py-4 text-gray-500 text-sm">All users are already members.</p>
              ) : (
                allUsers.filter(u => !project.members?.includes(u.id)).map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAddMember(u.id)}
                      className="p-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-colors"
                      title="Add to project"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
