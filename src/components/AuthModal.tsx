import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  loginAsGuest,
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await loginAsGuest();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Guest Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      if (tab === 'signup') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        await registerWithEmail(email.trim(), password, displayName.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please verify and try again.');
      } else if (err?.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(err?.message || 'Authentication error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full bg-[#1e1f20] border border-[#333537] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent">
              Korea AI Studio
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2b2c2d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-2 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {tab === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {tab === 'login'
                ? 'Sign in to access your chat history and saved AI images across devices.'
                : 'Sign up to create custom images, enhance prompts, and save your favorites.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-[#141517] rounded-xl border border-[#333537]">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-[#2b2c2d] text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                tab === 'signup'
                  ? 'bg-[#2b2c2d] text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Social Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#2b2c2d] hover:bg-[#36383a] text-white font-medium text-xs rounded-xl border border-[#3e4144] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-[#333537]"></div>
            <span className="px-3 text-[11px] text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 border-t border-[#333537]"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'signup' && (
              <div>
                <label className="block text-[11px] font-medium text-gray-300 uppercase tracking-wider mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#141517] text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-[#333537] focus:outline-none focus:border-[#4285f4] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-gray-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#141517] text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-[#333537] focus:outline-none focus:border-[#4285f4] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === 'signup' ? 'Min 6 characters' : 'Enter password'}
                  className="w-full bg-[#141517] text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-[#333537] focus:outline-none focus:border-[#4285f4] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#4285f4] hover:bg-[#3367d6] text-white font-medium text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Guest fallback option */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors cursor-pointer underline underline-offset-4"
            >
              Or continue as Guest (No password required)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
