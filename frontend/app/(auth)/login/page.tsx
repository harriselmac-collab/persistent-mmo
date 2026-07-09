'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { signIn, userId, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If logged in, send to dashboard
    if (userId) {
      router.push('/dashboard');
    }
  }, [userId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await signIn(email, password);
    if (!res.success) {
      setError(res.error || 'Invalid credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">Welcome Commander</h2>
        <p className="text-zinc-400 text-xs font-serif mt-1">Enter your credentials to return to duty.</p>
      </div>

      <div className="rpg-divider -my-1" />

      {error && (
        <div className="p-3 bg-red-950/40 border-2 border-red-800/60 rounded-none flex gap-2 items-start text-red-300 text-xs leading-normal font-serif">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold font-display text-game-gold-dark uppercase tracking-widest">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@empire.com"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rpg-input rounded-none border-2 text-zinc-200 placeholder-zinc-700 text-sm"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold font-display text-game-gold-dark uppercase tracking-widest">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <KeyRound className="h-4 w-4" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rpg-input rounded-none border-2 text-zinc-200 placeholder-zinc-700 text-sm"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full rpg-button h-11 text-sm tracking-widest rounded-none select-none"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <span className="flex items-center gap-2">
              <span>Sign In to Terminal</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </button>
      </form>

      <div className="rpg-divider -my-1" />

      <div className="text-center text-xs text-zinc-500 font-serif pt-1">
        New recruit?{' '}
        <Link href="/register" className="text-game-gold hover:text-game-gold-dark transition-colors font-sans font-bold tracking-wider">
          Create an Account
        </Link>
      </div>
    </div>
  );
}
