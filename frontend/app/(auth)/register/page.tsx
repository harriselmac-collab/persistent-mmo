'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { useSFX } from '../../../hooks/useSFX';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { signUp, userId } = useAuth();
  const router = useRouter();
  const sfx = useSFX();

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
      sfx.playError();
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
        sfx.playError();
        setError('Invalid Closed Alpha invite code. Please enter a valid registration key.');
        return;
      }
      if (codeRecord.is_used) {
        sfx.playError();
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
      sfx.playError();
      setError('Username must be between 3 and 30 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      sfx.playError();
      setError('Username can only contain alphanumeric characters, hyphens, and underscores.');
      return;
    }
    if (password.length < 6) {
      sfx.playError();
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    sfx.playClick();

    const res = await signUp(username, email, password);
    if (!res.success) {
      sfx.playError();
      setError(res.error || 'Registration failed.');
      setLoading(false);
    } else {
      sfx.playSuccess();
    }
  };

  const handleHover = () => {
    sfx.playClick();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col gap-4 w-full mt-1"
    >
      {/* Alert Error Box */}
      {error && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-2.5 bg-red-950/30 border border-red-900/40 flex gap-2 items-start text-red-300 text-[10.5px] leading-normal font-sans"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Closed Alpha Invite Code */}
        <div className="flex flex-col gap-1">
          <label className="text-[8.5px] font-bold font-serif text-[#b89030] uppercase tracking-widest">
            Alpha Invite Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-zinc-650">
              <KeyRound className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g. AEGIS-ALPHA-01"
              disabled={loading}
              className="w-full pl-8 pr-2 py-2 rpg-field-underline rounded-none text-zinc-100 placeholder-zinc-700 text-xs tracking-wide"
              required
            />
          </div>
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1">
          <label className="text-[8.5px] font-bold font-serif text-[#b89030] uppercase tracking-widest">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-zinc-650">
              <User className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              disabled={loading}
              className="w-full pl-8 pr-2 py-2 rpg-field-underline rounded-none text-zinc-100 placeholder-zinc-700 text-xs tracking-wide"
              required
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="flex flex-col gap-1">
          <label className="text-[8.5px] font-bold font-serif text-[#b89030] uppercase tracking-widest">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-zinc-655">
              <Mail className="h-3.5 w-3.5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              disabled={loading}
              className="w-full pl-8 pr-2 py-2 rpg-field-underline rounded-none text-zinc-100 placeholder-zinc-700 text-xs tracking-wide"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label className="text-[8.5px] font-bold font-serif text-[#b89030] uppercase tracking-widest">
            Password Key
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-zinc-655">
              <Lock className="h-3.5 w-3.5" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password Key (min 6 chars)"
              disabled={loading}
              className="w-full pl-8 pr-2 py-2 rpg-field-underline rounded-none text-zinc-100 placeholder-zinc-700 text-xs tracking-wide"
              required
            />
          </div>
        </div>

        {/* Provision Account submit button */}
        <button
          type="submit"
          disabled={loading}
          onMouseEnter={handleHover}
          className="mt-4 w-full rpg-button-royal h-11 text-[10.5px] tracking-[0.18em] rounded-none select-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
          ) : (
            <span>Provision Account</span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-zinc-800"></div>
        <span className="flex-shrink mx-3 text-[9px] font-serif uppercase tracking-widest text-zinc-600">or</span>
        <div className="flex-grow border-t border-zinc-800"></div>
      </div>

      {/* Secondary Button: Back to sign in */}
      <Link
        href="/login"
        onMouseEnter={handleHover}
        onClick={() => sfx.playClose()}
        className="w-full rpg-button-steel h-10 text-[9.5px] tracking-widest rounded-none flex items-center justify-center gap-1.5"
      >
        <span>Back to Sign In</span>
      </Link>
    </motion.div>
  );
}
