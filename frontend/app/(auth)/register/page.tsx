'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, KeyRound, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { signUp, userId } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      router.push('/dashboard');
    }
  }, [userId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !inviteCode) {
      setError('Please fill in all fields.');
      return;
    }

    // Closed Alpha Invite Code Verification
    if (typeof window !== 'undefined') {
      const invitesKey = 'mmo_closed_alpha_invites';
      const stored = localStorage.getItem(invitesKey);
      const invitesList = stored ? JSON.parse(stored) : [];
      const codeRecord = invitesList.find((i: any) => i.invite_code === inviteCode.trim().toUpperCase());
      
      if (!codeRecord) {
        setError('Invalid Closed Alpha invite code. Please enter a valid registration key.');
        return;
      }
      if (codeRecord.is_used) {
        setError('Alpha invite code has already been used by another tester.');
        return;
      }

      // Mark invite code as used
      codeRecord.is_used = true;
      codeRecord.used_by_email = email;
      localStorage.setItem(invitesKey, JSON.stringify(invitesList));
    }

    // Client-side validations matching database constraints
    if (username.length < 3 || username.length > 30) {
      setError('Username must be between 3 and 30 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain alphanumeric characters, hyphens, and underscores.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await signUp(username, email, password);
    if (!res.success) {
      setError(res.error || 'Registration failed.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">Create New Account</h2>
        <p className="text-zinc-400 text-xs font-serif mt-1">Register a Closed Alpha citizen identity.</p>
      </div>

      <div className="rpg-divider -my-1" />

      {error && (
        <div className="p-3 bg-red-950/40 border-2 border-red-800/60 rounded-none flex gap-2 items-start text-red-300 text-xs leading-normal font-serif">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Closed Alpha Invite Code */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold font-display text-game-gold-dark uppercase tracking-widest">Alpha Invite Code</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <KeyRound className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g. AEGIS-ALPHA-01"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rpg-input rounded-none border-2 text-zinc-200 placeholder-zinc-700 text-sm"
              required
            />
          </div>
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold font-display text-game-gold-dark uppercase tracking-widest">Username</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <User className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. shadow_commander"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rpg-input rounded-none border-2 text-zinc-200 placeholder-zinc-700 text-sm"
              required
            />
          </div>
        </div>

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
              placeholder="recruit@empire.com"
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
              placeholder="Min 6 characters"
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
              <span>Provision Account</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </button>
      </form>

      <div className="rpg-divider -my-1" />

      <div className="text-center text-xs text-zinc-500 font-serif pt-1">
        Already registered?{' '}
        <Link href="/login" className="text-game-gold hover:text-game-gold-dark transition-colors font-sans font-bold tracking-wider">
          Sign In Here
        </Link>
      </div>
    </div>
  );
}
