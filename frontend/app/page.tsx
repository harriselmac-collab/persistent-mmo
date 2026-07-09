'use client';

import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';
import { Shield, Coins, Vote, Sword, Globe, ChevronRight, Play } from 'lucide-react';

export default function LandingPage() {
  const { userId, loading } = useAuth();

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-zinc-950">
      {/* RPG Embers Animation Overlay */}
      <div className="rpg-embers-container">
        <div className="rpg-ember" style={{ left: '5%', animationDelay: '0s', animationDuration: '16s' }} />
        <div className="rpg-ember" style={{ left: '20%', animationDelay: '3s', animationDuration: '14s' }} />
        <div className="rpg-ember" style={{ left: '35%', animationDelay: '1s', animationDuration: '20s' }} />
        <div className="rpg-ember" style={{ left: '55%', animationDelay: '7s', animationDuration: '18s' }} />
        <div className="rpg-ember" style={{ left: '75%', animationDelay: '2s', animationDuration: '15s' }} />
        <div className="rpg-ember" style={{ left: '92%', animationDelay: '5s', animationDuration: '22s' }} />
      </div>

      {/* Vignette Shadow Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.85)_100%)] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-zinc-900/60 bg-zinc-950/20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-900 border border-game-gold rounded-full shadow-[0_0_8px_rgba(229,193,88,0.2)]">
            <Shield className="h-5 w-5 text-game-gold" />
          </div>
          <span className="text-xl font-bold tracking-widest font-display text-game-gold select-none filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
            AEGIS KINGDOMS
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          {loading ? (
            <div className="h-8 w-16 bg-zinc-900 border border-zinc-800 animate-pulse" />
          ) : userId ? (
            <Link
              href="/dashboard"
              className="rpg-button px-5 py-2 text-xs rounded-none"
            >
              Go to Game
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-bold font-display uppercase tracking-widest text-zinc-400 hover:text-game-gold transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rpg-button px-5 py-2 text-xs rounded-none"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-12 max-w-7xl mx-auto w-full text-center">
        <div className="max-w-3xl flex flex-col items-center">
          
          {/* RPG Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-game-gold bg-game-wood/80 text-[10px] font-bold font-display text-game-gold tracking-[0.2em] uppercase mb-8 shadow-lg filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            <Globe className="h-3.5 w-3.5 text-game-gold" />
            <span>Persistent Virtual World MMORPG</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold font-display leading-[1.15] tracking-wider text-game-gold filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.95)] mb-6">
            Build Empires. Govern Nations. <br className="hidden sm:inline" />
            Wage War in Real Time.
          </h1>

          {/* Paragraph */}
          <p className="text-zinc-300 text-base sm:text-lg font-serif max-w-2xl leading-relaxed mb-10 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Join thousands of active citizens. Mine resources, establish company payrolls, pass national bills in Congress, and fight for territorial borders in a completely player-driven universe.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-5 w-full justify-center">
            {userId ? (
              <Link
                href="/dashboard"
                className="rpg-button h-14 px-10 text-sm tracking-widest rounded-none w-full sm:w-auto"
              >
                <span>Enter Dashboard</span>
                <ChevronRight className="h-5 w-5 ml-1" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rpg-button h-14 px-10 text-sm tracking-widest rounded-none w-full sm:w-auto bg-gradient-to-b from-game-gold to-game-gold-dark hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black shadow-[0_0_20px_rgba(229,193,88,0.2)]"
                >
                  <Play className="h-4 w-4 fill-current text-zinc-950 mr-1.5" />
                  <span>Start Playing Free</span>
                </Link>
                <Link
                  href="/login"
                  className="rpg-button h-14 px-10 text-sm tracking-widest rounded-none w-full sm:w-auto bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:text-white"
                >
                  <span>Sign In to Account</span>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="rpg-divider my-12 w-full max-w-5xl" />

        {/* Feature Cards Grid (Skeuomorphic Stone Panels) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {/* Card 1: Economy */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 text-left transition-all duration-300 hover:scale-[1.02] group">
            {/* Corner Rivets */}
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <div className="p-3 w-fit bg-game-gold/10 border border-game-gold/30 text-game-gold rounded-none">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-game-gold tracking-wide mb-2">Industrial Markets</h3>
              <p className="text-zinc-400 font-serif text-xs leading-relaxed">
                Establish mining companies or factories. Hire real players, pay competitive wages, refine raw materials, and sell goods on localized citizen market boards.
              </p>
            </div>
          </div>

          {/* Card 2: Combat */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 text-left transition-all duration-300 hover:scale-[1.02] group">
            {/* Corner Rivets */}
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <div className="p-3 w-fit bg-red-950/20 border border-red-900/40 text-red-500 rounded-none">
              <Sword className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-game-gold tracking-wide mb-2">Military Conquest</h3>
              <p className="text-zinc-400 font-serif text-xs leading-relaxed">
                Train daily to build physical strength. Deploy to real-time regional combat zones, coordinate wall damage multipliers, and capture territories to expand borders.
              </p>
            </div>
          </div>

          {/* Card 3: Politics */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 text-left transition-all duration-300 hover:scale-[1.02] group">
            {/* Corner Rivets */}
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <div className="p-3 w-fit bg-emerald-950/20 border border-emerald-900/40 text-emerald-500 rounded-none">
              <Vote className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-game-gold tracking-wide mb-2">Political Institutions</h3>
              <p className="text-zinc-400 font-serif text-xs leading-relaxed">
                Run for local Congressional seats or campaign for the Presidency. Propose declarations of war, adjust VAT/Import tax rates, and manage national currency reserves.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-zinc-900/60 bg-zinc-950/10 text-center text-[10px] text-zinc-600 flex flex-col sm:flex-row items-center justify-between gap-4 font-serif">
        <span>© 2026 Aegis Kingdoms. All rights reserved. Designed for browser desktops, tablets, and phones.</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-game-gold transition-colors font-sans font-bold tracking-widest uppercase">Privacy Policy</a>
          <a href="#" className="hover:text-game-gold transition-colors font-sans font-bold tracking-widest uppercase">Terms of Service</a>
          <a href="#" className="hover:text-game-gold transition-colors font-sans font-bold tracking-widest uppercase">Guide Docs</a>
        </div>
      </footer>
    </div>
  );
}
