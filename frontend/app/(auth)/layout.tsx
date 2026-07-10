'use client';

import React, { useState } from 'react';
import { 
  Globe, BookOpen, Headphones, Settings, Volume2, VolumeX,
  Swords, Crown, Sparkles, Coins, ChevronDown, Radio
} from 'lucide-react';
import { useMusic } from '../../hooks/useMusic';
import { useSFX } from '../../hooks/useSFX';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const music = useMusic();
  const sfx = useSFX();
  const [showSettings, setShowSettings] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState('aegis-prime');

  const handleHover = () => {
    sfx.playClick();
  };

  const handleToggleSettings = () => {
    sfx.playOpen();
    setShowSettings(!showSettings);
  };

  const handleSelectServer = (serverId: string) => {
    sfx.playSuccess();
    setSelectedServer(serverId);
  };

  return (
    <div className="rpg-aaa-layout select-none relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      
      {/* 1. Cinematic 4K Landscape Background Environment (Edge-to-Edge) */}
      <div 
        className="rpg-cinematic-bg"
        style={{ backgroundImage: "url('/assets/backgrounds/aegis-login-bg-v2.png')" }}
      />

      {/* 2. Skeeomorphic Depth Filters & Atmosphere Overlays */}
      <div className="rpg-vignette-overlay" />
      <div className="rpg-fog-layer" />
      
      {/* RPG Embers Animation Overlay */}
      <div className="rpg-embers-container">
        <div className="rpg-ember" style={{ left: '5%', animationDelay: '0s', animationDuration: '16s' }} />
        <div className="rpg-ember" style={{ left: '25%', animationDelay: '3s', animationDuration: '14s' }} />
        <div className="rpg-ember" style={{ left: '50%', animationDelay: '1s', animationDuration: '22s' }} />
        <div className="rpg-ember" style={{ left: '75%', animationDelay: '5s', animationDuration: '17s' }} />
        <div className="rpg-ember" style={{ left: '90%', animationDelay: '2s', animationDuration: '20s' }} />
      </div>

      {/* 3. Main Console Columns (Grid system: Left 30%, Center 40%, Right 30%) */}
      <div className="relative z-10 w-full h-full min-h-screen px-8 py-8 xl:px-12 xl:py-12 grid grid-cols-1 lg:grid-cols-10 gap-6 xl:gap-8 items-stretch max-h-screen overflow-hidden">
        
        {/* ==================================================================
           COLUMN 1 (LEFT): Kingdom Chronicle Deck (30% - Span 3)
           ================================================================== */}
        <div className="hidden lg:flex flex-col lg:col-span-3 gap-6 xl:gap-8 rpg-chronicle-deck p-6 xl:p-8 justify-between">
          
          {/* Header */}
          <div className="text-center border-b border-[#5a4632]/25 pb-3">
            <h2 className="text-lg font-bold font-serif uppercase tracking-[0.25em] text-[#d4af37] filter drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.95)]">
              Kingdom Chronicle
            </h2>
            <p className="text-zinc-500 text-[10px] uppercase font-serif tracking-widest mt-1">
              Closed Alpha Bulletin & Realm Intelligence
            </p>
          </div>

          {/* Featured Castle Artwork Frame */}
          <div className="rpg-chronicle-frame overflow-hidden aspect-[21/9] w-full bg-zinc-950">
            <img 
              src="/assets/backgrounds/aegis-login-bg-v2.png" 
              alt="Aegis Capital Ridge" 
              className="w-full h-full object-cover filter brightness-[0.65] contrast-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-4 right-4 z-20 flex justify-between items-end">
              <div>
                <span className="text-[8px] font-bold font-serif text-[#b89030] uppercase tracking-widest bg-zinc-950/80 px-2 py-0.5 border border-[#5a4632]/30">Featured Lore</span>
                <h4 className="text-xs font-bold font-serif text-zinc-100 mt-1 filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)]">The Siege of Alden Hold</h4>
              </div>
              <span className="text-[9px] font-pixel text-zinc-400">Active Campaign</span>
            </div>
          </div>

          {/* 3 Pillars of Chronicle updates */}
          <div className="grid grid-cols-3 gap-3 w-full">
            
            {/* Construction */}
            <div 
              className="rpg-chronicle-card p-3 flex flex-col items-center text-center gap-1.5"
              onMouseEnter={handleHover}
            >
              <Crown className="rpg-chronicle-card-icon h-4.5 w-4.5 text-[#5a4632] transition-colors" />
              <span className="text-[9px] font-bold uppercase tracking-wider font-serif text-zinc-850">Build</span>
              <p className="text-[8px] font-sans text-zinc-700 leading-snug">
                Foundries consume lumber & stone.
              </p>
            </div>

            {/* Campaigns */}
            <div 
              className="rpg-chronicle-card p-3 flex flex-col items-center text-center gap-1.5"
              onMouseEnter={handleHover}
            >
              <Swords className="rpg-chronicle-card-icon h-4.5 w-4.5 text-[#5a4632] transition-colors" />
              <span className="text-[9px] font-bold uppercase tracking-wider font-serif text-zinc-850">War</span>
              <p className="text-[8px] font-sans text-zinc-700 leading-snug">
                Deploy troops to national borders.
              </p>
            </div>

            {/* Sovereignty */}
            <div 
              className="rpg-chronicle-card p-3 flex flex-col items-center text-center gap-1.5"
              onMouseEnter={handleHover}
            >
              <Sparkles className="rpg-chronicle-card-icon h-4.5 w-4.5 text-[#5a4632] transition-colors" />
              <span className="text-[9px] font-bold uppercase tracking-wider font-serif text-zinc-850">Rule</span>
              <p className="text-[8px] font-sans text-zinc-700 leading-snug">
                Propose laws and manage taxes.
              </p>
            </div>

          </div>

          <div className="border-t border-[#5a4632]/25 pt-4 mt-2">
            
            {/* News Header */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#b89030] font-serif">
                Realm Dispatch
              </span>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); sfx.playClick(); }}
                className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 hover:text-[#d4af37] transition-colors"
              >
                Inspect Archives
              </a>
            </div>

            {/* Dispatch Bulletins */}
            <div className="flex flex-col gap-2">
              
              {/* Item 1 */}
              <div className="flex items-center justify-between text-[10px] hover:bg-zinc-950/40 p-1.5 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Swords className="h-3.5 w-3.5 text-[#d4af37]/50 group-hover:text-[#d4af37] transition-colors" />
                  <span className="text-zinc-400 font-sans group-hover:text-zinc-200 transition-colors">
                    The Northern Alliance declared war.
                  </span>
                </div>
                <span className="text-zinc-650 font-pixel tracking-wider">2h ago</span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between text-[10px] hover:bg-zinc-950/40 p-1.5 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Coins className="h-3.5 w-3.5 text-[#d4af37]/50 group-hover:text-[#d4af37] transition-colors" />
                  <span className="text-zinc-400 font-sans group-hover:text-zinc-200 transition-colors">
                    Merchant Caravan arrived in Greenvale.
                  </span>
                </div>
                <span className="text-zinc-650 font-pixel tracking-wider">5h ago</span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between text-[10px] hover:bg-zinc-950/40 p-1.5 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Crown className="h-3.5 w-3.5 text-[#d4af37]/50 group-hover:text-[#d4af37] transition-colors" />
                  <span className="text-zinc-400 font-sans group-hover:text-zinc-200 transition-colors">
                    Zaharad controls the Sunken Basin.
                  </span>
                </div>
                <span className="text-zinc-650 font-pixel tracking-wider">2d ago</span>
              </div>

            </div>

          </div>

        </div>

        {/* ==================================================================
           COLUMN 2 (CENTER): Centered Black Steel Plate (40% - Span 4)
           ================================================================== */}
        <div className="w-full h-full flex flex-col justify-start relative pt-8 px-8 rpg-steel-plate lg:col-span-4 max-w-[520px] lg:max-w-none mx-auto">
          {/* Corner Rivets */}
          <div className="rpg-rivet top-2 left-2" />
          <div className="rpg-rivet top-2 right-2" />
          <div className="rpg-rivet bottom-2 left-2" />
          <div className="rpg-rivet bottom-2 right-2" />

          {/* Steel Slab Inset border lines */}
          <div className="absolute inset-2 border border-zinc-800/40 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center h-full">
            
            {/* Embossed Shield Emblem & Title */}
            <div className="flex flex-col items-center mt-2 group cursor-pointer" onClick={() => sfx.playSuccess()}>
              <img
                src="/assets/branding/aegis-crest-full.png"
                alt="Aegis Kingdoms"
                className="h-96 w-auto object-contain rpg-logo-animated"
              />
            </div>

            <div className="rpg-plate-inset-line" />

            {/* Content Injection */}
            <div className="w-full px-4 flex-1">
              {children}
            </div>

          </div>
        </div>

        {/* ==================================================================
           COLUMN 3 (RIGHT): Oak Utility Panel & Server Selector (30% - Span 3)
           ================================================================== */}
        <div className="hidden lg:flex flex-col lg:col-span-3 gap-6 rpg-texture-wood p-5 justify-between relative">
          {/* Corner Rivets */}
          <div className="rpg-rivet top-1.5 left-1.5" />
          <div className="rpg-rivet top-1.5 right-1.5" />
          <div className="rpg-rivet bottom-1.5 left-1.5" />
          <div className="rpg-rivet bottom-1.5 right-1.5" />
          
          {/* Symmetrical Server Selection Deck */}
          <div className="flex flex-col gap-3 w-full">
            <span className="text-[9.5px] font-bold font-serif text-[#b89030] uppercase tracking-[0.2em] border-b border-[#5a4632]/25 pb-2 text-center flex items-center justify-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-[#3f7e4a] animate-pulse" />
              <span>Realm Servers</span>
            </span>

            <div className="flex flex-col gap-2.5">
              
              {/* Server 1: Aegis Prime */}
              <button 
                onClick={() => handleSelectServer('aegis-prime')}
                className={`rpg-server-card w-full p-2.5 text-left flex flex-col gap-1 ${selectedServer === 'aegis-prime' ? 'rpg-server-card-active' : ''}`}
              >
                <div className="flex justify-between items-center text-[10.5px] font-serif font-bold">
                  <span className={selectedServer === 'aegis-prime' ? 'text-[#d4af37]' : 'text-zinc-300'}>AEGIS PRIME</span>
                  <span className="h-2 w-2 rounded-full bg-[#3f7e4a]" />
                </div>
                <div className="flex justify-between text-[8px] tracking-wider text-zinc-550 uppercase font-sans">
                  <span>Ping: 32ms</span>
                  <span>Pop: High</span>
                </div>
              </button>

              {/* Server 2: Aethelgard */}
              <button 
                onClick={() => handleSelectServer('aethelgard')}
                className={`rpg-server-card w-full p-2.5 text-left flex flex-col gap-1 ${selectedServer === 'aethelgard' ? 'rpg-server-card-active' : ''}`}
              >
                <div className="flex justify-between items-center text-[10.5px] font-serif font-bold">
                  <span className={selectedServer === 'aethelgard' ? 'text-[#d4af37]' : 'text-zinc-300'}>AETHELGARD</span>
                  <span className="h-2 w-2 rounded-full bg-[#3f7e4a]" />
                </div>
                <div className="flex justify-between text-[8px] tracking-wider text-zinc-550 uppercase font-sans">
                  <span>Ping: 104ms</span>
                  <span>Pop: Medium</span>
                </div>
              </button>

              {/* Server 3: Mirelands */}
              <button 
                onClick={() => handleSelectServer('mirelands')}
                className={`rpg-server-card w-full p-2.5 text-left flex flex-col gap-1 ${selectedServer === 'mirelands' ? 'rpg-server-card-active' : ''}`}
              >
                <div className="flex justify-between items-center text-[10.5px] font-serif font-bold">
                  <span className={selectedServer === 'mirelands' ? 'text-[#d4af37]' : 'text-zinc-300'}>MIRELANDS</span>
                  <span className="h-2 w-2 rounded-full bg-[#3f7e4a]" />
                </div>
                <div className="flex justify-between text-[8px] tracking-wider text-zinc-550 uppercase font-sans">
                  <span>Ping: 220ms</span>
                  <span>Pop: Light</span>
                </div>
              </button>

            </div>
          </div>

          {/* Symmetrical Grid of Utility options */}
          <div className="flex flex-col gap-3 w-full">
            <span className="text-[8px] font-bold font-serif text-zinc-500 uppercase tracking-widest border-t border-[#5a4632]/20 pt-3 text-center">
              Kingdom Links
            </span>
            
            <div className="grid grid-cols-2 gap-2 w-full">
              
              {/* Web link */}
              <a 
                href="#"
                onClick={(e) => { e.preventDefault(); sfx.playSuccess(); }}
                onMouseEnter={handleHover}
                className="rpg-utility-item py-2 px-1 flex flex-col items-center justify-center gap-1 border border-zinc-800/80 bg-zinc-950/60"
              >
                <Globe className="h-4.5 w-4.5" />
                <span className="text-[8px] uppercase tracking-widest font-sans font-black">Website</span>
              </a>

              {/* Manual link */}
              <a 
                href="#"
                onClick={(e) => { e.preventDefault(); sfx.playSuccess(); }}
                onMouseEnter={handleHover}
                className="rpg-utility-item py-2 px-1 flex flex-col items-center justify-center gap-1 border border-zinc-800/80 bg-zinc-950/60"
              >
                <BookOpen className="h-4.5 w-4.5" />
                <span className="text-[8px] uppercase tracking-widest font-sans font-black">Manual</span>
              </a>

              {/* Support/Help link */}
              <a 
                href="#"
                onClick={(e) => { e.preventDefault(); sfx.playSuccess(); }}
                onMouseEnter={handleHover}
                className="rpg-utility-item py-2 px-1 flex flex-col items-center justify-center gap-1 border border-zinc-800/80 bg-zinc-950/60"
              >
                <Headphones className="h-4.5 w-4.5" />
                <span className="text-[8px] uppercase tracking-widest font-sans font-black">Support</span>
              </a>

              {/* Options cog */}
              <button 
                onClick={handleToggleSettings}
                onMouseEnter={handleHover}
                className={`rpg-utility-item py-2 px-1 flex flex-col items-center justify-center gap-1 border border-zinc-800/80 bg-zinc-950/60 ${showSettings ? 'rpg-utility-item-active' : ''}`}
              >
                <Settings className={`h-4.5 w-4.5 ${showSettings ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
                <span className="text-[8px] uppercase tracking-widest font-sans font-black">Options</span>
              </button>

            </div>

            {/* Language Selector Dropdown */}
            <div className="relative mt-2 w-full">
              <button
                onClick={() => { sfx.playClick(); setLangDropdownOpen(!langDropdownOpen); }}
                onMouseEnter={handleHover}
                className="flex items-center justify-between w-full text-[9px] font-bold uppercase tracking-widest border border-zinc-800 px-3 py-1.5 hover:border-[#d4af37]/45 transition-colors bg-zinc-950/80 text-zinc-450"
              >
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-[#d4af37]/60" />
                  <span>Language</span>
                </span>
                <div className="flex items-center gap-1 text-[#d4af37]">
                  <span>EN</span>
                  <ChevronDown className="h-2.5 w-2.5" />
                </div>
              </button>

              {langDropdownOpen && (
                <div className="absolute bottom-9 left-0 right-0 bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col z-50">
                  <button 
                    onClick={() => { sfx.playSuccess(); setLangDropdownOpen(false); }}
                    className="px-3 py-1.5 text-left text-[9px] tracking-widest text-[#d4af37] font-semibold hover:bg-zinc-900 border-b border-zinc-900"
                  >
                    ENGLISH
                  </button>
                  <button 
                    onClick={() => { sfx.playSuccess(); setLangDropdownOpen(false); }}
                    className="px-3 py-1.5 text-left text-[9px] tracking-widest text-zinc-550 hover:text-zinc-300 hover:bg-zinc-900"
                  >
                    DEUTSCH
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ==================================================================
         OVERLAY MODAL: Launcher Settings (Audio Controls)
         ================================================================== */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm border border-[#5a4632] bg-gradient-to-b from-[#151518] to-[#0d0d0f] p-5 shadow-2xl relative">
            <div className="rpg-rivet top-1.5 left-1.5" />
            <div className="rpg-rivet top-1.5 right-1.5" />
            <div className="rpg-rivet bottom-1.5 left-1.5" />
            <div className="rpg-rivet bottom-1.5 right-1.5" />

            <h4 className="text-sm font-bold font-serif uppercase tracking-widest text-[#d4af37] border-b border-zinc-800 pb-2 text-left flex items-center justify-between">
              <span>Aegis Setup</span>
              <button 
                onClick={() => { sfx.playClose(); setShowSettings(false); }} 
                className="text-zinc-500 hover:text-zinc-300 font-sans font-bold"
              >
                ✕
              </button>
            </h4>
            
            <div className="flex flex-col gap-4 mt-4">
              
              {/* Background Music controls */}
              <div className="flex flex-col gap-2 border-b border-zinc-900 pb-3">
                <div className="flex items-center justify-between text-[11px] font-serif uppercase tracking-wider text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    {music.playing ? <Volume2 className="h-3.5 w-3.5 text-[#d4af37]" /> : <VolumeX className="h-3.5 w-3.5" />}
                    <span>Orchestral OST</span>
                  </span>
                  <button 
                    onClick={() => { sfx.playClick(); music.toggle(); }}
                    className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest border transition-colors ${music.playing ? 'border-[#3f7e4a] text-[#3f7e4a] bg-emerald-950/20' : 'border-zinc-800 text-zinc-500'}`}
                  >
                    {music.playing ? 'Playing' : 'Muted'}
                  </button>
                </div>
                
                {music.playing && (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[8px] text-zinc-650 uppercase tracking-widest font-sans">Vol</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={music.volume}
                      onChange={(e) => music.changeVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                    />
                    <span className="text-[9px] font-pixel text-zinc-500 w-6 text-right">
                      {Math.round(music.volume * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* SFX synth toggles */}
              <div className="flex items-center justify-between text-[11px] font-serif uppercase tracking-wider text-zinc-400 pb-1">
                <span className="flex items-center gap-1.5">
                  {sfx.enabled ? <Volume2 className="h-3.5 w-3.5 text-[#d4af37]" /> : <VolumeX className="h-3.5 w-3.5" />}
                  <span>Synthesizer SFX</span>
                </span>
                <button 
                  onClick={() => { sfx.toggle(); sfx.playSuccess(); }}
                  className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest border transition-colors ${sfx.enabled ? 'border-[#3f7e4a] text-[#3f7e4a] bg-emerald-950/20' : 'border-zinc-800 text-zinc-500'}`}
                >
                  {sfx.enabled ? 'Enabled' : 'Muted'}
                </button>
              </div>

            </div>

            <button
              onClick={() => { sfx.playClose(); setShowSettings(false); }}
              className="rpg-button-royal w-full mt-5 py-2.5 text-[10px] tracking-widest uppercase"
            >
              Save Options
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
