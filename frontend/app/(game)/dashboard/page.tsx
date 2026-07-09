'use client';

import { useGameContext } from '../layout';
import { Sparkles, Calendar, BookOpen, AlertCircle, Scale, Coins } from 'lucide-react';

export default function DashboardPage() {
  const { profile, stats, playerResources, resources, auditLogs, regions, countries, experienceThresholds } = useGameContext();

  const activeRegion = regions.find((r) => r.id === profile?.current_region_id);
  const activeCountry = countries.find((c) => c.id === activeRegion?.country_id);
  const citizenshipCountry = countries.find((c) => c.id === profile?.citizenship_country_id);

  // Experience calculations from DB thresholds table
  const threshold = experienceThresholds.find((t) => t.level === stats?.level);
  const nextLevelExp = threshold?.required_experience || ((stats?.level || 1) * (stats?.level || 1) * 100);
  const expPercentage = stats ? Math.min(100, Math.round((stats.experience / nextLevelExp) * 100)) : 0;

  // Calculate cargo statistics
  const cargoCount = playerResources.reduce((sum, item) => sum + item.quantity, 0);
  const cargoWeight = playerResources.reduce((sum, item) => {
    const res = resources.find((r) => r.id === item.resource_id);
    return sum + (item.quantity * (res?.weight || 0.10));
  }, 0);
  const cargoValue = playerResources.reduce((sum, item) => {
    const res = resources.find((r) => r.id === item.resource_id);
    return sum + (item.quantity * (res?.base_value || 1.0));
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner */}
      <div className="w-full h-44 border-2 border-game-gold relative overflow-hidden shadow-2xl flex items-center justify-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/assets/backgrounds/hero-kingdoms-dark.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/40 to-transparent" />
        <div className="relative z-10 text-center flex flex-col gap-1.5 p-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-game-gold tracking-widest uppercase filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            Aegis Kingdoms
          </h1>
          <p className="text-zinc-300 text-[10px] font-serif italic tracking-wide max-w-md mx-auto drop-shadow-md">
            "Forge your legacy, trade raw commodities on the exchange, and conquer opposing kingdoms."
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Column 1: Profile & Stats */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Profile Card */}
        <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col gap-6 shadow-xl">
          <div className="rpg-rivet top-1 left-1" />
          <div className="rpg-rivet top-1 right-1" />
          <div className="rpg-rivet bottom-1 left-1" />
          <div className="rpg-rivet bottom-1 right-1" />

          <div className="absolute right-0 top-0 h-40 w-40 bg-game-gold/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
            <div className="h-16 w-16 border-2 border-game-gold bg-game-wood text-game-gold flex items-center justify-center text-2xl font-display font-black shadow-lg shadow-black/60 select-none">
              {profile?.username[0].toUpperCase()}
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-2xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">{profile?.username}</h2>
                <span className="px-2.5 py-0.5 border border-game-gold/20 bg-zinc-950 text-[9px] font-bold uppercase tracking-widest text-game-gold w-fit mx-auto sm:mx-0">
                  {profile?.role}
                </span>
              </div>
              <p className="text-zinc-500 text-xs font-serif mt-1 flex items-center justify-center sm:justify-start gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 border-game-gold/15 pt-6 relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Citizenship</span>
              <span className="text-sm font-bold font-display text-zinc-200">{citizenshipCountry?.name || 'Genesis Land'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Physical Coordinates</span>
              <span className="text-sm font-bold font-display text-zinc-200">
                {activeRegion?.name}, {activeCountry?.name}
              </span>
            </div>
          </div>
        </div>
 
        {/* Hero Attributes & Traits */}
        <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 relative shadow-lg">
          <div className="rpg-rivet top-1 left-1" />
          <div className="rpg-rivet top-1 right-1" />
          <div className="rpg-rivet bottom-1 left-1" />
          <div className="rpg-rivet bottom-1 right-1" />

          <h3 className="text-sm font-bold font-display text-game-gold uppercase tracking-widest relative z-10">Hero Attributes & Traits</h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative z-10">
            {/* Health / Vitality */}
            <div className="p-3 bg-zinc-950/80 border border-zinc-900 shadow-inner flex flex-col items-center text-center rounded-none group hover:border-game-gold/30 transition-all">
              <img src="/assets/traits/health.png" alt="Health" className="h-12 w-12 object-contain filter drop-shadow-md mb-2 group-hover:scale-105 transition-transform" />
              <span className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest font-display">Health</span>
              <span className="text-sm font-bold font-pixel text-white mt-1">{stats?.health || 100} / {stats?.max_health || 100}</span>
            </div>

            {/* Combat Power (Strength) */}
            <div className="p-3 bg-zinc-950/80 border border-zinc-900 shadow-inner flex flex-col items-center text-center rounded-none group hover:border-game-gold/30 transition-all">
              <img src="/assets/traits/strength.png" alt="Strength" className="h-12 w-12 object-contain filter drop-shadow-md mb-2 group-hover:scale-105 transition-transform" />
              <span className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest font-display">Strength</span>
              <span className="text-sm font-bold font-pixel text-white mt-1">{(stats?.strength || 10).toFixed(2)}</span>
            </div>

            {/* Harvesting Level (Work Skill) */}
            <div className="p-3 bg-zinc-950/80 border border-zinc-900 shadow-inner flex flex-col items-center text-center rounded-none group hover:border-game-gold/30 transition-all">
              <img src="/assets/traits/work_skill.png" alt="Work Skill" className="h-12 w-12 object-contain filter drop-shadow-md mb-2 group-hover:scale-105 transition-transform" />
              <span className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest font-display">Harvesting</span>
              <span className="text-sm font-bold font-pixel text-white mt-1">{(stats?.work_skill || 1).toFixed(2)}</span>
            </div>

            {/* Defense */}
            <div className="p-3 bg-zinc-950/80 border border-zinc-900 shadow-inner flex flex-col items-center text-center rounded-none group hover:border-game-gold/30 transition-all">
              <img src="/assets/traits/defense.png" alt="Defense" className="h-12 w-12 object-contain filter drop-shadow-md mb-2 group-hover:scale-105 transition-transform" />
              <span className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest font-display">Defense</span>
              <span className="text-sm font-bold font-pixel text-white mt-1">{(stats?.defense || 0).toFixed(2)}</span>
            </div>

            {/* Speed */}
            <div className="p-3 bg-zinc-950/80 border border-zinc-900 shadow-inner flex flex-col items-center text-center rounded-none group hover:border-game-gold/30 transition-all col-span-2 sm:col-span-1">
              <img src="/assets/traits/speed.png" alt="Speed" className="h-12 w-12 object-contain filter drop-shadow-md mb-2 group-hover:scale-105 transition-transform" />
              <span className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest font-display">Speed</span>
              <span className="text-sm font-bold font-pixel text-white mt-1">{(stats?.speed || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Cargo Summary Dashboard */}
        <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 relative shadow-lg">
          <div className="rpg-rivet top-1 left-1" />
          <div className="rpg-rivet top-1 right-1" />
          <div className="rpg-rivet bottom-1 left-1" />
          <div className="rpg-rivet bottom-1 right-1" />

          <h3 className="text-sm font-bold font-display text-game-gold uppercase tracking-widest relative z-10">Cargo Hold Overview</h3>

          <div className="grid grid-cols-3 gap-4 relative z-10">
            <div className="p-3 bg-zinc-950 border border-zinc-900 shadow-inner flex flex-col items-center">
              <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest font-display">Total Cargo</span>
              <span className="text-base font-bold font-pixel text-white mt-1">{cargoCount} items</span>
            </div>
            
            <div className="p-3 bg-zinc-950 border border-zinc-900 shadow-inner flex flex-col items-center">
              <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest font-display">Cargo Weight</span>
              <span className="text-base font-bold font-pixel text-white mt-1 flex items-center gap-1">
                <Scale className="h-4 w-4 text-zinc-600" />
                <span>{cargoWeight.toFixed(1)} kg</span>
              </span>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-900 shadow-inner flex flex-col items-center">
              <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest font-display">Market Value</span>
              <span className="text-base font-bold font-pixel text-game-emerald mt-1 flex items-center gap-1">
                <Coins className="h-4 w-4 text-game-gold-dark" />
                <span>{cargoValue.toFixed(1)} LC</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Column 2: Recent Logs Feed - Redesigned as Aged Parchment Scroll */}
      <div className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-4 h-full min-h-[400px] border-2 shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-950/20 pb-3">
          <h3 className="text-sm font-bold font-display text-amber-950 flex items-center gap-2 uppercase tracking-widest">
            <Sparkles className="h-4.5 w-4.5 text-amber-900" />
            <span>Activity Feed</span>
          </h3>
          <span className="px-2 py-0.5 border border-amber-950/30 bg-amber-950/10 text-[8px] font-bold text-amber-950 tracking-widest uppercase">
            Realtime
          </span>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[460px] pr-1">
          {auditLogs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-amber-900/50 py-12">
              <AlertCircle className="h-8 w-8 text-amber-900/30" />
              <p className="text-xs font-serif">No entries recorded in terminal log.</p>
            </div>
          ) : (
            auditLogs.map((log) => {
              let text = log.action;
              let detailText = '';
              let isCost = false;
              if (log.action === 'auth.signup') {
                text = 'Registered brand new terminal account.';
              } else if (log.action === 'region.travel') {
                text = `Traveled from ${log.metadata.from} to ${log.metadata.to}`;
                detailText = `Cost deducted: -${log.metadata.energy_cost} EP`;
                isCost = true;
              } else if (log.action === 'company.work') {
                text = `Worked at ${log.metadata.company_name}`;
                detailText = `Earned +${log.metadata.wage_earned} LC (Wage)`;
              } else if (log.action === 'combat.train') {
                text = `Completed physical military training session.`;
                detailText = `Gained +${log.metadata.strength_gained} Strength`;
              } else if (log.action === 'combat.fight') {
                text = `Hit the wall in Regional Conflict.`;
                detailText = `Contributed +${Math.round(log.metadata.damage_dealt)} Combat Score`;
                isCost = true;
              } else if (log.action === 'resource.gather') {
                text = `Harvested resource: ${log.metadata.resource_name}`;
                detailText = `Acquired +${log.metadata.quantity} units, +${log.metadata.experience_earned} XP`;
              }

              return (
                <div key={log.id} className="p-3 bg-amber-950/5 border-b border-amber-950/10 flex flex-col gap-0.5 hover:bg-amber-950/10 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-amber-950 font-serif leading-relaxed">{text}</span>
                    <span className="text-[9px] text-amber-900/60 font-pixel tracking-wider">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {detailText && (
                    <span className={`text-[10px] font-bold font-display ${isCost ? 'text-rose-800' : 'text-emerald-800'}`}>{detailText}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      
    </div>
  </div>
  );
}
