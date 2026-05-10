import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Users, Trash2, Edit3, ArrowRight } from 'lucide-react';
import { useForm } from '../../../node_modules/react-hook-form/dist';
import toast from 'react-hot-toast';
import { projectsApi } from '../api/projects';
import type { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getApiError } from '../Utils';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';

interface ProjectForm { name: string; description: string; }

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register: reg, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProjectForm>();

  const load = () => {
    setLoading(true);
    projectsApi.list()
      .then(r => setProjects(r.data))
      .catch(e => toast.error(getApiError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openEdit = (p: Project) => {
    setEditProject(p);
    setValue('name', p.name);
    setValue('description', p.description);
  };

  const onSubmit = async (data: ProjectForm) => {
    setSaving(true);
    try {
      if (editProject) {
        await projectsApi.update(editProject.id, data);
        toast.success('Project updated');
        setEditProject(null);
      } else {
        await projectsApi.create(data);
        toast.success('Project created');
        setShowCreate(false);
      }
      reset();
      load();
    } catch (e) {
      toast.error(getApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await projectsApi.delete(deleteId);
      toast.success('Project deleted');
      setDeleteId(null);
      load();
    } catch (e) {
      toast.error(getApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  const ProjectForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Project Name</label>
        <input {...reg('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
          className="input" placeholder="e.g. Website Redesign" />
        {errors.name && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.name.message}</p>}
      </div>
      <div>
        <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea {...reg('description')} rows={3} className="input resize-none" placeholder="What's this project about?" />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={() => { setShowCreate(false); setEditProject(null); reset(); }}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Spinner size="sm" />}
          {editProject ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { reset(); setShowCreate(true); }}>
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-600" /></div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-8 h-8" />}
          title="No projects yet"
          description={isAdmin ? "Create your first project to get started." : "You haven't been added to any project yet."}
          action={isAdmin ? (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> Create Project
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="card-hover p-5 group flex flex-col gap-4 animate-slide-up">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="w-5 h-5 text-brand-600" />
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="btn-ghost p-1.5 rounded-lg" onClick={() => openEdit(project)} title="Edit">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button className="btn-ghost p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setDeleteId(project.id)} title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
                </div>
                <Link
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Open <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Create New Project">
        <ProjectForm />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editProject} onClose={() => { setEditProject(null); reset(); }} title="Edit Project">
        <ProjectForm />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="This will permanently delete the project and all its tasks. This cannot be undone."
        loading={deleting}
        confirmLabel="Delete Project"
      />
    </div>
  );
}