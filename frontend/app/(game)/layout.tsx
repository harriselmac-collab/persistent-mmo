'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGame } from '../../hooks/useGame';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  LayoutDashboard,
  Map,
  Factory,
  Swords,
  LogOut,
  Coins,
  MapPin,
  Flame,
  Menu,
  X,
  User as UserIcon,
  Pickaxe,
  Boxes,
  History,
  Scale,
  Globe,
  Landmark,
  MessageSquare,
  Mail,
  Users,
  FileText,
  BookOpen,
  Calendar,
  Compass,
  Trophy,
  Smartphone,
  Code,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Lock,
} from 'lucide-react';
import { useMusic, TRACKS } from '../../hooks/useMusic';
import { useSFX } from '../../hooks/useSFX';

// Create a context to share game state across all game panels
const GameContext = createContext<ReturnType<typeof useGame> | null>(null);

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const { userId, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const game = useGame(userId);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const music = useMusic();
  const sfx = useSFX();

  // Floating RPG feedback text
  const [floatingTexts, setFloatingTexts] = useState<{ id: string; text: string; colorClass: string; x: number; y: number }[]>([]);

  const triggerFloatingText = (text: string, colorClass: string = 'text-game-gold', x?: number, y?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    const posX = x !== undefined ? x : typeof window !== 'undefined' ? window.innerWidth / 2 + (Math.random() * 60 - 30) : 500;
    const posY = y !== undefined ? y : typeof window !== 'undefined' ? window.innerHeight / 2 - 120 + (Math.random() * 60 - 30) : 300;

    setFloatingTexts((prev) => [...prev, { id, text, colorClass, x: posX, y: posY }]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1500);
  };

  const handleClaimEnergy = async () => {
    sfx.playClick();
    const res = await game.claimEnergy();
    if (res.success) {
      sfx.playSuccess();
      triggerFloatingText('+100 Energy EP!', 'text-game-emerald');
    } else {
      sfx.playError();
      triggerFloatingText(res.error || 'Claim Blocked!', 'text-red-500');
    }
  };

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !userId) {
      router.push('/login');
    }
  }, [userId, authLoading, router]);

  if (authLoading || game.loading || !userId) {
    return (
      <div className="relative min-h-screen flex flex-col justify-center items-center bg-zinc-950 text-zinc-100 gap-6 overflow-hidden">
        {/* RPG Embers Animation Overlay */}
        <div className="rpg-embers-container">
          <div className="rpg-ember" style={{ left: '15%', animationDelay: '0s', animationDuration: '14s' }} />
          <div className="rpg-ember" style={{ left: '35%', animationDelay: '3s', animationDuration: '16s' }} />
          <div className="rpg-ember" style={{ left: '55%', animationDelay: '1s', animationDuration: '20s' }} />
          <div className="rpg-ember" style={{ left: '75%', animationDelay: '5s', animationDuration: '15s' }} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.85)_100%)] pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-t-2 border-game-gold border-r-2 border-r-game-gold/30 animate-spin" />
            <Shield className="h-7 w-7 text-game-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse filter drop-shadow-[0_0_8px_rgba(229,193,88,0.4)]" />
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h3 className="text-sm font-bold font-display text-game-gold tracking-widest uppercase filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Syncing Aegis Terminal</h3>
            <p className="text-[10px] text-zinc-500 font-serif animate-pulse">Syncing core virtual world databases...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get active region details
  const activeRegion = game.regions.find((r) => r.id === game.profile?.current_region_id);
  const activeCountry = game.countries.find((c) => c.id === activeRegion?.country_id);

  const playerLevel = game.stats?.level || 1;

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard, requiredLevel: 1 },
    { name: 'Explore', href: '/explore', icon: Map, requiredLevel: 1 },
    { name: 'Combat Arena', href: '/combat', icon: Swords, requiredLevel: 1 },
    { name: 'Inventory', href: '/inventory', icon: Boxes, requiredLevel: 1 },
    { name: 'Kingdom Hub', href: '/kingdom', icon: Landmark, requiredLevel: 5 },
    { name: 'Commander', href: '/commander', icon: UserIcon, requiredLevel: 1 },
  ];

  return (
    <GameContext.Provider value={game}>
      <div className="min-h-screen flex bg-zinc-950 text-zinc-100 font-sans">
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          />
        )}

        {/* Sidebar Panel - Redesigned as Ornate Wood Frame */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 rpg-panel-wood flex flex-col justify-between transform transition-transform duration-300 md:relative md:transform-none border-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Corner Rivets */}
          <div className="rpg-rivet top-1.5 left-1.5" />
          <div className="rpg-rivet top-1.5 right-1.5" />
          <div className="rpg-rivet bottom-1.5 left-1.5" />
          <div className="rpg-rivet bottom-1.5 right-1.5" />

          {/* Sidebar Header */}
          <div className="p-5 border-b-2 border-game-gold/25 bg-zinc-950/40 flex items-center justify-between relative z-10">
            <Link href="/" className="flex items-center gap-2">
              <img src="/assets/branding/aegis-crest-icon.png" alt="Aegis Kingdoms Logo" className="h-6 w-6 object-contain filter drop-shadow-[0_0_4px_rgba(229,193,88,0.45)]" />
              <span className="text-sm font-bold tracking-widest font-display text-game-gold filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                AEGIS KINGDOMS
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 border border-zinc-800 hover:border-game-gold hover:bg-zinc-900 text-zinc-400 hover:text-white md:hidden transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-3.5 py-4 flex flex-col gap-1.5 overflow-y-auto relative z-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isLocked = playerLevel < item.requiredLevel;
              const isActive = pathname === item.href && !isLocked;

              if (isLocked) {
                return (
                  <div
                    key={item.href}
                    onClick={() => {
                      sfx.playError();
                      triggerFloatingText(`Requires Level ${item.requiredLevel}!`, 'text-red-500');
                    }}
                    className="flex items-center justify-between px-3.5 py-2 text-xs font-bold font-display uppercase tracking-wider border-2 border-transparent text-zinc-600 cursor-not-allowed select-none bg-zinc-900/5 hover:bg-zinc-900/10 transition-all rounded-none"
                    title={`Unlocks at Commander Level ${item.requiredLevel}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4.5 w-4.5 text-zinc-700" />
                      <span>{item.name}</span>
                    </div>
                    <Lock className="h-3.5 w-3.5 text-zinc-700" />
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setSidebarOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2 text-xs font-bold font-display uppercase tracking-wider border-2 transition-all duration-100 group ${
                    isActive
                      ? 'bg-gradient-to-r from-game-gold/15 to-transparent border-game-gold text-game-gold shadow-[0_0_10px_rgba(229,193,88,0.12)]'
                      : 'border-transparent text-zinc-400 hover:text-game-gold hover:bg-zinc-950/40 hover:border-game-gold-dark/20'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-105 ${isActive ? 'text-game-gold' : 'text-zinc-500 group-hover:text-game-gold'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* GM Tools if Admin */}
            {(game.profile?.role === 'super_admin' || game.profile?.role === 'game_master') && (
              <div className="mt-4 pt-4 border-t-2 border-game-gold/15 flex flex-col gap-1.5">
                <span className="px-3.5 text-[9px] font-bold font-display text-zinc-500 uppercase tracking-widest">GM Console</span>
                <Link
                  href="/admin"
                  onClick={() => {
                    setSidebarOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2 text-[10px] font-bold font-display uppercase tracking-wider border-2 transition-all duration-100 ${
                    pathname === '/admin'
                      ? 'border-red-900 bg-red-950/20 text-red-400'
                      : 'border-transparent text-zinc-500 hover:text-red-400 hover:bg-red-950/10'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>GM Admin</span>
                </Link>
                <Link
                  href="/developer"
                  onClick={() => {
                    setSidebarOpen(false);
                    sfx.playClick();
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2 text-[10px] font-bold font-display uppercase tracking-wider border-2 transition-all duration-100 ${
                    pathname === '/developer'
                      ? 'border-amber-900 bg-amber-950/20 text-amber-400'
                      : 'border-transparent text-zinc-500 hover:text-amber-400 hover:bg-amber-950/10'
                  }`}
                >
                  <Code className="h-4 w-4" />
                  <span>Dev Center</span>
                </Link>
              </div>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t-2 border-game-gold/25 bg-zinc-950/20 relative z-10">
            <button
              onClick={() => signOut()}
              className="flex w-full items-center justify-center gap-2 rpg-button rpg-button-crimson font-display rounded-none text-[10px] tracking-widest uppercase py-2.5"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Disconnect Link</span>
            </button>
          </div>
        </aside>

        {/* Content Shell */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          
          {/* Header Panel - Redesigned as Ornate Stone Bar */}
          <header className="h-16 rpg-panel-stone border-none flex items-center justify-between px-6 shrink-0 relative z-30 shadow-lg">
            {/* Left Header: Toggle Button & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 border border-zinc-800 bg-zinc-900 rounded-none text-zinc-400 hover:text-game-gold md:hidden hover:border-game-gold transition-colors"
              >
                <Menu className="h-4 w-4" />
              </button>
              
              {/* Location Badge (Skeuomorphic Nameplate) */}
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold font-display uppercase tracking-widest px-4 py-1.5 border border-game-gold/30 bg-game-wood/80 text-game-gold shadow-md">
                <MapPin className="h-3.5 w-3.5 text-game-gold animate-pulse" />
                <span>
                  {activeRegion?.name || 'Unknown Region'} ({activeCountry?.name || 'Unknown Nation'})
                </span>
              </div>

              {/* OST Music Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={music.toggle}
                  title={music.playing ? 'Pause music' : 'Play music'}
                  className="p-2 border border-zinc-800 bg-zinc-900 rounded-none text-zinc-400 hover:text-game-gold hover:border-game-gold transition-colors"
                >
                  {music.playing ? <Pause className="h-4 w-4 text-game-gold" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  onClick={music.next}
                  title="Next track"
                  className="p-2 border border-zinc-800 bg-zinc-900 rounded-none text-zinc-400 hover:text-game-gold hover:border-game-gold transition-colors"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 p-2 border border-zinc-800 bg-zinc-900 rounded-none text-zinc-400 hover:border-game-gold transition-colors">
                  <button
                    onClick={music.toggleMute}
                    title={music.muted ? 'Unmute' : 'Mute'}
                    className="hover:text-game-gold transition-colors"
                  >
                    {music.muted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={music.muted ? 0 : music.volume}
                    disabled={music.muted}
                    onChange={(e) => music.changeVolume(parseFloat(e.target.value))}
                    className="w-14 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-game-gold focus:outline-none"
                    style={{ WebkitAppearance: 'none', outline: 'none' }}
                  />
                </div>
                {music.playing && (
                  <span className="hidden lg:block text-[9px] font-bold font-display uppercase tracking-widest text-zinc-500 pl-1">
                    ♪ {TRACKS[music.track].name}
                  </span>
                )}
              </div>
            </div>

            {/* Right Header: Balances & Stats */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Currency: Local Balances */}
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest font-display">Local Currency</span>
                <span className="text-base font-bold text-game-emerald font-pixel tracking-wide filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                  {game.currencies?.local_currency_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[9px] text-zinc-600 font-sans">LC</span>
                </span>
              </div>

              {/* Currency: Gold Balances */}
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest font-display">Gold Reserves</span>
                <span className="text-base font-bold text-game-gold font-pixel tracking-wide flex items-center gap-1 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                  <Coins className="h-3.5 w-3.5 text-game-gold-dark" />
                  <span>{game.currencies?.gold.toFixed(4)}</span>
                </span>
              </div>

              {/* Quick Profile Info */}
              <div className="flex items-center gap-3 pl-4 border-l border-zinc-800/80">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold font-display text-zinc-200 tracking-wide">{game.profile?.username}</span>
                  <span className="text-[8px] font-bold text-game-gold-dark font-sans uppercase tracking-wider capitalize">{game.profile?.role}</span>
                </div>
                <div className="h-9 w-9 rounded-none border-2 border-game-gold bg-game-wood text-game-gold flex items-center justify-center font-bold font-display text-sm shadow-[0_0_8px_rgba(229,193,88,0.25)] select-none">
                  {game.profile?.username[0].toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          {/* Core Game Body */}
          <main className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 relative">
            <div className={`${pathname === '/map' ? 'w-full max-w-none' : 'max-w-6xl mx-auto'} flex flex-col gap-6`}>
              
              {/* Top Global Energy Bar / Experience Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Energy Monitor - Skeuomorphic health pool */}
                <div className="rpg-panel-stone p-4 rounded-none flex items-center justify-between gap-4 relative">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-red-950/20 border border-red-900/40 text-red-500 rounded-none">
                      <Flame className="h-4.5 w-4.5 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold font-display text-zinc-300 uppercase tracking-widest">Active Energy</span>
                      <span className="text-[9px] font-serif text-zinc-500 mt-0.5">Regens +5 per 6m</span>
                    </div>
                  </div>
                  <div className="flex-1 max-w-[200px] flex flex-col gap-1 items-end relative z-10">
                    <div className="w-full rpg-progress-bar rounded-none">
                      <div
                        className="rpg-progress-fill bg-gradient-to-r from-red-700 to-orange-500 rounded-none"
                        style={{ width: `${game.stats?.energy || 0}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-pixel text-red-500 tracking-wider rpg-stats-value">{game.stats?.energy || 0} / 100 EP</span>
                      <button
                        onClick={handleClaimEnergy}
                        className="rpg-button px-2 py-0.5 text-[8px] tracking-widest shadow-sm rounded-none border border-game-gold ml-1 text-game-gold uppercase select-none"
                      >
                        Restore EP
                      </button>
                    </div>
                  </div>
                </div>

                {/* Level / EXP Monitor - Skeuomorphic mana pool */}
                <div className="rpg-panel-stone p-4 rounded-none flex items-center justify-between gap-4 relative">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-indigo-950/20 border border-indigo-900/40 text-indigo-400 rounded-none">
                      <UserIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold font-display text-zinc-300 uppercase tracking-widest">Commander Level</span>
                      <span className="text-[9px] font-serif text-zinc-500 mt-0.5">Rank progression</span>
                    </div>
                  </div>
                  
                  {(() => {
                    const level = game.stats?.level || 1;
                    const exp = game.stats?.experience || 0;
                    const nextLevelExp = level * level * 100;
                    const pct = Math.min(100, Math.round((exp / nextLevelExp) * 100));
                    return (
                      <div className="flex-1 max-w-[200px] flex flex-col gap-1 items-end relative z-10">
                        <div className="w-full rpg-progress-bar rounded-none">
                          <div
                            className="rpg-progress-fill bg-gradient-to-r from-blue-700 to-indigo-500 rounded-none"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold font-pixel text-indigo-400 tracking-wider rpg-stats-value">
                          Lvl {level} ({exp} / {nextLevelExp} EXP - {pct}%)
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Renders the sub page view */}
              <div className="animate-card-slide relative z-10">{children}</div>
              
            </div>
          </main>
        </div>

        {/* Floating RPG text feedback overlay */}
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {floatingTexts.map((item) => (
            <span
              key={item.id}
              className={`absolute font-pixel font-bold text-xs uppercase tracking-widest pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)] animate-float-up-fade ${item.colorClass}`}
              style={{ left: `${item.x}px`, top: `${item.y}px`, transform: 'translate(-50%, -50%)' }}
            >
              {item.text}
            </span>
          ))}
        </div>

      </div>
    </GameContext.Provider>
  );
}

