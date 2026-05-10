import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Zap, ArrowRight, Moon, Sun, Shield, Users as UsersIcon } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getApiError } from '../utils';
import Spinner from '../components/ui/Spinner';

interface SignupForm { name: string; email: string; password: string; confirmPassword: string; role: string; }

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggle } = useTheme();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SignupForm>({
    defaultValues: { role: 'member' }
  });
  const password = watch('password');
  const role = watch('role');

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    try {
      await authApi.signup({ name: data.name, email: data.email, password: data.password, role: data.role });
      const loginRes = await authApi.login({ email: data.email, password: data.password });
      await login(loginRes.data.access_token);
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl" />
      </div>
      <button onClick={toggle} className="absolute top-4 right-4 btn-ghost p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
      </button>

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white">Task<span className="text-brand-600">Flow</span></span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">Create account</h1>
          <p className="text-gray-500 text-sm">Join your team's workspace</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
                type="text" placeholder="John Doe" className="input" />
              {errors.name && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email address</label>
              <input {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                type="email" placeholder="you@example.com" className="input" />
              {errors.email && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                  type={showPass ? 'text' : 'password'} placeholder="••••••••" className="input pr-11" />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input {...register('confirmPassword', { required: 'Please confirm your password', validate: v => v === password || 'Passwords do not match' })}
                type="password" placeholder="••••••••" className="input" />
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <label className="label">I want to join as</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onClick={() => setValue('role', 'admin')}
                  className={clsx(
                    "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200",
                    role === 'admin' 
                      ? "bg-purple-50 dark:bg-purple-950/20 border-purple-500 text-purple-700 dark:text-purple-400 shadow-sm" 
                      : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200 dark:hover:border-gray-600"
                  )}
                >
                  <Shield className={clsx("w-5 h-5", role === 'admin' ? "text-purple-600" : "text-gray-300")} />
                  <span className="text-xs font-bold">Admin</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setValue('role', 'member')}
                  className={clsx(
                    "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200",
                    role === 'member' 
                      ? "bg-blue-50 dark:bg-blue-950/20 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm" 
                      : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200 dark:hover:border-gray-600"
                  )}
                >
                  <UsersIcon className={clsx("w-5 h-5", role === 'member' ? "text-blue-600" : "text-gray-300")} />
                  <span className="text-xs font-bold">Member</span>
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3 text-base mt-2" disabled={loading}>
              {loading ? <Spinner size="sm" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Already have an account?{' '}
              <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold">Sign in →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
