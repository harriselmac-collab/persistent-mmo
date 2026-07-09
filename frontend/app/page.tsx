'use client';

import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';
import { useState } from 'react';
import {
  Shield,
  Coins,
  Vote,
  Sword,
  Globe,
  ChevronRight,
  Play,
  Volume2,
  VolumeX,
  Sliders,
  Settings,
  HelpCircle,
  Radio,
  FileText,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { useMusic } from '../hooks/useMusic';
import { useSFX } from '../hooks/useSFX';

export default function LandingPage() {
  const { userId, loading, signOut } = useAuth();
  const music = useMusic();
  const sfx = useSFX();
  const [showSettings, setShowSettings] = useState(false);

  // Play sound on button interactions
  const handleHover = () => {
    sfx.playClick();
  };

  const handleClick = (soundType: 'click' | 'success' | 'travel' | 'open' | 'close' = 'click') => {
    if (soundType === 'success') {
      sfx.playSuccess();
    } else if (soundType === 'open') {
      sfx.playOpen();
    } else if (soundType === 'close') {
      sfx.playClose();
    } else {
      sfx.playClick();
    }
  };

  return (
    <div 
      className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-zinc-950 bg-cover bg-center select-none"
      style={{
        backgroundImage: "linear-gradient(rgba(9, 9, 11, 0.85), rgba(9, 9, 11, 0.94)), url('/assets/backgrounds/hero-kingdoms-dark.png')"
      }}
    >
      {/* RPG Embers Animation Overlay */}
      <div className="rpg-embers-container pointer-events-none">
        <div className="rpg-ember" style={{ left: '5%', animationDelay: '0s', animationDuration: '16s' }} />
        <div className="rpg-ember" style={{ left: '20%', animationDelay: '3s', animationDuration: '14s' }} />
        <div className="rpg-ember" style={{ left: '35%', animationDelay: '1s', animationDuration: '20s' }} />
        <div className="rpg-ember" style={{ left: '55%', animationDelay: '7s', animationDuration: '18s' }} />
        <div className="rpg-ember" style={{ left: '75%', animationDelay: '2s', animationDuration: '15s' }} />
        <div className="rpg-ember" style={{ left: '92%', animationDelay: '5s', animationDuration: '22s' }} />
      </div>

      {/* Vignette Shadow Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(0,0,0,0.9)_100%)] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b-2 border-game-gold/15 bg-zinc-950/40 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 border border-game-gold bg-zinc-950/80 shadow-[0_0_8px_rgba(229,193,88,0.2)]">
            <Shield className="h-5 w-5 text-game-gold animate-pulse" />
          </div>
          <span className="text-sm font-bold tracking-[0.25em] font-display text-game-gold select-none filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
            AEGIS KINGDOMS
          </span>
        </div>
        
        {/* Top-Right Connection Indicator */}
        <div className="flex items-center gap-4 text-[9px] font-display tracking-widest uppercase">
          <span className="h-2 w-2 rounded-full bg-game-emerald animate-ping" />
          <span className="text-zinc-500 font-bold">Closed Alpha v1.2</span>
        </div>
      </header>

      {/* Main Launcher Console */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-stretch">
          
          {/* LEFT: Game Chronicles & Announcements (Parchment panel) */}
          <div className="lg:col-span-5 flex flex-col rpg-panel-parchment p-6 shadow-2xl relative min-h-[300px]">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <div className="relative z-10 flex flex-col flex-1">
              <h3 className="text-sm font-bold font-display uppercase tracking-widest text-[#382212] border-b-2 border-[#5c4033]/20 pb-2.5 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Realm Chronicles</span>
              </h3>
              
              <div className="flex-1 overflow-y-auto max-h-[360px] pr-2 mt-4 flex flex-col gap-5 text-left select-text">
                <div>
                  <span className="text-[8px] font-bold font-display uppercase tracking-widest text-amber-950 bg-[#e8dbae] px-1.5 py-0.5 border border-[#5c4033]/20">Alpha V1.2 Patch Notes</span>
                  <h4 className="text-xs font-bold font-display text-amber-950 mt-1.5">Window Overlay Mode Restored!</h4>
                  <p className="text-[10.5px] text-[#4d3221] font-serif leading-relaxed mt-1">
                    Commanders can now open multiple, concurrent draggable dashboards overlaying the kingdom map. Drag panels to the center and click to minimize/maximize layouts easily.
                  </p>
                </div>

                <div className="border-t border-[#5c4033]/10 pt-4">
                  <span className="text-[8px] font-bold font-display uppercase tracking-widest text-amber-950 bg-[#e8dbae] px-1.5 py-0.5 border border-[#5c4033]/20">Active Lore</span>
                  <h4 className="text-xs font-bold font-display text-amber-950 mt-1.5">Rise of the Ironhold Clans</h4>
                  <p className="text-[10.5px] text-[#4d3221] font-serif leading-relaxed mt-1">
                    Border disputes are escalating. The Ironhold Clans are stocking their armories with heavy longswords. Run for local Congress to coordinate national defenses!
                  </p>
                </div>
              </div>
              
              <div className="text-[8.5px] font-bold text-center text-[#5c4033]/60 uppercase tracking-widest border-t border-[#5c4033]/20 pt-4 mt-auto">
                Scroll down to read historical updates
              </div>
            </div>
          </div>

          {/* RIGHT: Main Console Menu (Wood panel) */}
          <div className="lg:col-span-7 flex flex-col rpg-panel-wood p-8 shadow-2xl relative text-center justify-between min-h-[480px]">
            <div className="rpg-rivet top-1.5 left-1.5" />
            <div className="rpg-rivet top-1.5 right-1.5" />
            <div className="rpg-rivet bottom-1.5 left-1.5" />
            <div className="rpg-rivet bottom-1.5 right-1.5" />

            <div className="relative z-10 flex flex-col items-center flex-1 py-4 justify-between gap-6">
              
              {/* Pulsing Crest logo */}
              <div className="flex flex-col items-center select-none cursor-pointer group" onClick={() => handleClick('success')}>
                <img
                  src="/assets/branding/aegis-crest-full.png"
                  alt="Aegis Crest Logo"
                  className="h-28 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] group-hover:scale-102 group-hover:drop-shadow-[0_0_15px_rgba(229,193,88,0.35)] transition-all duration-300"
                />
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-game-gold/60 mt-3 font-display">
                  Persistent Strategy Sandbox
                </span>
              </div>

              {/* Launcher Title Buttons */}
              <div className="flex flex-col gap-3.5 w-full max-w-sm">
                {loading ? (
                  <div className="h-12 w-full bg-zinc-950 border border-zinc-800 animate-pulse flex items-center justify-center">
                    <span className="text-[10px] text-zinc-500 font-display uppercase tracking-widest">Verifying Connection...</span>
                  </div>
                ) : userId ? (
                  <>
                    <Link
                      href="/dashboard"
                      onMouseEnter={handleHover}
                      onClick={() => handleClick('success')}
                      className="rpg-button h-13 px-8 text-xs tracking-widest rounded-none bg-gradient-to-b from-game-gold to-game-gold-dark hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(229,193,88,0.15)] animate-pulse"
                    >
                      <Play className="h-4.5 w-4.5 fill-current" />
                      <span>ENTER REALM</span>
                    </Link>
                    
                    <button
                      onClick={async () => {
                        handleClick('click');
                        await signOut();
                      }}
                      onMouseEnter={handleHover}
                      className="rpg-button rpg-button-crimson h-11 px-8 text-[10px] tracking-widest rounded-none flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>DISCONNECT TERMINAL</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onMouseEnter={handleHover}
                      onClick={() => handleClick('open')}
                      className="rpg-button h-12 px-8 text-xs tracking-widest rounded-none bg-gradient-to-b from-game-gold to-game-gold-dark hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(229,193,88,0.15)]"
                    >
                      <Play className="h-4.5 w-4.5 fill-current" />
                      <span>LOG IN TO CHARACTER</span>
                    </Link>

                    <Link
                      href="/register"
                      onMouseEnter={handleHover}
                      onClick={() => handleClick('open')}
                      className="rpg-button h-12 px-8 text-[10px] tracking-widest rounded-none border border-game-gold text-game-gold hover:text-white flex items-center justify-center gap-2"
                    >
                      <UserIcon className="h-4 w-4" />
                      <span>CREATE NEW COMMANDER</span>
                    </Link>
                  </>
                )}
                
                <button
                  onClick={() => {
                    handleClick('open');
                    setShowSettings(!showSettings);
                  }}
                  onMouseEnter={handleHover}
                  className="rpg-button h-10 px-8 text-[9px] tracking-widest rounded-none border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 flex items-center justify-center gap-1.5"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>LAUNCHER SETTINGS</span>
                </button>
              </div>

              {/* Launcher Settings Panel (Embedded toggle) */}
              {showSettings && (
                <div className="w-full max-w-sm border border-zinc-800 bg-zinc-950/90 p-4 flex flex-col gap-3 transition-all">
                  <h4 className="text-[9px] font-bold font-display uppercase tracking-widest text-game-gold border-b border-zinc-800 pb-1 text-left flex items-center justify-between">
                    <span>Terminal Options</span>
                    <button onClick={() => { handleClick('close'); setShowSettings(false); }} className="text-zinc-600 hover:text-zinc-300 font-sans font-bold">X</button>
                  </h4>
                  
                  {/* Background Music controls */}
                  <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-wider text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      {music.playing ? <Volume2 className="h-3.5 w-3.5 text-game-gold" /> : <VolumeX className="h-3.5 w-3.5" />}
                      <span>Orchestral OST</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { handleClick('click'); music.toggle(); }}
                        className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest border transition-colors ${music.playing ? 'border-game-emerald text-game-emerald bg-emerald-950/20' : 'border-zinc-800 text-zinc-500'}`}
                      >
                        {music.playing ? 'Playing' : 'Muted'}
                      </button>
                      
                      {music.playing && (
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={music.volume}
                          onChange={(e) => music.changeVolume(parseFloat(e.target.value))}
                          className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-game-gold"
                        />
                      )}
                    </div>
                  </div>

                  {/* SFX synth toggles */}
                  <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-wider text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      {sfx.enabled ? <Volume2 className="h-3.5 w-3.5 text-game-gold" /> : <VolumeX className="h-3.5 w-3.5" />}
                      <span>Synthesizer SFX</span>
                    </span>
                    <button 
                      onClick={() => { sfx.toggle(); sfx.playSuccess(); }}
                      className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest border transition-colors ${sfx.enabled ? 'border-game-emerald text-game-emerald bg-emerald-950/20' : 'border-zinc-800 text-zinc-500'}`}
                    >
                      {sfx.enabled ? 'Enabled' : 'Muted'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-zinc-900/60 bg-zinc-950/20 text-center text-[9px] text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4 font-serif">
        <span>© 2026 Aegis Kingdoms. Real-time tactical strategy interface. Designed for desk screens.</span>
        <div className="flex gap-6">
          <a href="#" onMouseEnter={handleHover} onClick={() => handleClick()} className="hover:text-game-gold transition-colors font-sans font-bold tracking-widest uppercase">Privacy Rules</a>
          <a href="#" onMouseEnter={handleHover} onClick={() => handleClick()} className="hover:text-game-gold transition-colors font-sans font-bold tracking-widest uppercase">Terms of War</a>
          <a href="#" onMouseEnter={handleHover} onClick={() => handleClick()} className="hover:text-game-gold transition-colors font-sans font-bold tracking-widest uppercase">Citizen Manual</a>
        </div>
      </footer>
    </div>
  );
}
