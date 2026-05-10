import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FolderKanban, Plus, MoreVertical, Users, Trash2 } from 'lucide-react';
import { projectsApi } from '../api/projects';
import type { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getApiError } from '../utils';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ name: string; description: string }>();

  const load = () => {
    setLoading(true);
    projectsApi.list()
      .then(r => setProjects(r.data))
      .catch(e => toast.error(getApiError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data: { name: string; description: string }) => {
    try {
      await projectsApi.create(data);
      toast.success('Project created');
      setModalOpen(false);
      reset();
      load();
    } catch (e) {
      toast.error(getApiError(e));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await projectsApi.delete(deleteId);
      toast.success('Project deleted');
      setDeleteId(null);
      load();
    } catch (e) {
      toast.error(getApiError(e));
    }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Spinner size="lg" className="text-brand-600" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Project Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your team's initiatives</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState 
          icon={<FolderKanban className="w-8 h-8" />}
          title="No projects yet"
          description="Get started by creating your first project."
          action={<button onClick={() => setModalOpen(true)} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Create Project</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(p => (
            <div key={p.id} className="card-hover p-5 flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-400 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                {isAdmin && (
                  <button onClick={() => setDeleteId(p.id)} className="btn-ghost p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Link to={`/projects/${p.id}`} className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 transition-colors">{p.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6">{p.description}</p>
              </Link>

              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{p.members?.length || 0} members</span>
                </div>
                <span className="text-xs text-gray-400">{formatDate(p.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Project">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Project Name</label>
            <input {...register('name', { required: true })} className="input" placeholder="e.g. Website Redesign" autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} className="input min-h-[100px] resize-y" placeholder="Brief details about this project..." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting && <Spinner size="sm" />} Create
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Project"
        message="Are you sure? This will delete all tasks associated with this project. This action cannot be undone."
        confirmLabel="Delete"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
