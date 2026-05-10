import { useEffect, useState } from 'react';
import { CheckSquare, FolderKanban, AlertTriangle, TrendingUp, Clock, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardApi } from '../api/dashboard';
import type { DashboardData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getApiError } from '../utils';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = { todo: '#94a3b8', in_progress: '#f59e0b', done: '#10b981' };
const STATUS_LABELS: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get().then(r => setData(r.data)).catch(e => toast.error(getApiError(e))).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" className="text-brand-600" /></div>;
  if (!data) return null;

  const pieData = [
    { name: 'To Do',       value: data.tasks_by_status.todo,        color: STATUS_COLORS.todo },
    { name: 'In Progress', value: data.tasks_by_status.in_progress, color: STATUS_COLORS.in_progress },
    { name: 'Done',        value: data.tasks_by_status.done,        color: STATUS_COLORS.done },
  ].filter(d => d.value > 0);

  const barData = Object.entries(data.tasks_per_user).map(([uid, count]) => ({ name: uid.slice(-6), tasks: count }));

  const statCards = [
    { label: 'Total Tasks',    value: data.total_tasks,                   icon: CheckSquare,   color: 'text-brand-600',   bg: 'bg-brand-50 dark:bg-brand-950/40' },
    { label: 'Projects',       value: data.total_projects,                icon: FolderKanban,  color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'In Progress',    value: data.tasks_by_status.in_progress,   icon: TrendingUp,    color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Overdue',        value: data.overdue_tasks,                 icon: AlertTriangle, color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-950/40' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, <span className="font-semibold text-gray-700 dark:text-gray-300">{user?.name}</span> 👋</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4"><BarChart2 className="w-4 h-4 text-brand-600" /><h2 className="section-title text-base">Tasks by Status</h2></div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
                <Legend formatter={(value) => <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{value}</span>} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">No tasks yet</div>}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-brand-600" /><h2 className="section-title text-base">Status Breakdown</h2></div>
          <div className="space-y-4">
            {Object.entries(data.tasks_by_status).map(([status, count]) => {
              const pct = data.total_tasks > 0 ? Math.round((count / data.total_tasks) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{STATUS_LABELS[status]}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: STATUS_COLORS[status] }} />
                  </div>
                </div>
              );
            })}
          </div>
          {barData.length > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Tasks per User</h3>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={barData} barSize={20}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide /><Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="tasks" fill="#5b71f0" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-brand-600" /><h2 className="section-title text-base">Recent Tasks</h2></div>
          {data.recent_tasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No tasks found</p>
          ) : (
            <div className="space-y-3">
              {data.recent_tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(task.due_date)}</p>
                  </div>
                  <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status] || task.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose-500" /><h2 className="section-title text-base">Overdue Tasks</h2>
            {data.overdue_tasks > 0 && <span className="ml-auto badge bg-rose-100 dark:bg-rose-900/30 text-rose-600">{data.overdue_tasks}</span>}
          </div>
          {data.overdue_details.length === 0 ? (
            <div className="text-center py-6"><div className="text-3xl mb-2">✅</div><p className="text-sm text-gray-400 font-medium">No overdue tasks — great work!</p></div>
          ) : (
            <div className="space-y-3">
              {data.overdue_details.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                    <p className="text-xs text-rose-500 mt-0.5">Due {formatDate(task.due_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
