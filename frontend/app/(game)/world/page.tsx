'use client';

import { useGameContext } from '../layout';
import { useState } from 'react';
import { Globe, RefreshCw, AlertCircle, Sparkles, TrendingUp, Users, Factory, Flame, Briefcase, DollarSign, Calendar, TrendingDown } from 'lucide-react';

export default function WorldDynamicsPage() {
  const { 
    regionalEconomies, 
    worldEvents, 
    simulationLogs, 
    npcLogs, 
    isOnline, 
    triggerSimulationTick, 
    actionLoading, 
    resources, 
    marketListings 
  } = useGameContext();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTriggerTick = async () => {
    setError(null);
    setSuccess(null);
    const res = await triggerSimulationTick();
    if (res.success) {
      setSuccess(`Living World simulation tick resolved successfully (Tick #${res.tickIndex || 'Next'}).`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to execute simulation cycle.');
    }
  };

  const activeEvents = worldEvents.filter((e) => e.active);

  const getCommodityStats = (resId: number) => {
    const res = resources.find((r) => r.id === resId);
    if (!res) return { name: 'Unknown', base: 0, marketAvg: 0, count: 0 };
    const activeListings = marketListings.filter((l) => l.resource_id === resId && l.status === 'active');
    const avgPrice = activeListings.length > 0
      ? activeListings.reduce((sum, l) => sum + l.price_per_unit, 0) / activeListings.length
      : res.base_value;
    const totalQty = activeListings.reduce((sum, l) => sum + l.quantity, 0);
    return { name: res.name, base: res.base_value, marketAvg: Number(avgPrice.toFixed(2)), count: totalQty, icon: res.icon };
  };

  const trackedCommodities = [
    { id: 1, label: 'Wood' },
    { id: 3, label: 'Iron Ore' },
    { id: 4, label: 'Coal' },
    { id: 5, label: 'Grain' },
    { id: 11, label: 'Steel' },
    { id: 14, label: 'Bread' }
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Messages */}
      {error && (
        <div className="px-4 py-3 border-l-4 border-red-600 bg-red-950/30 text-red-400 text-xs font-bold font-display uppercase tracking-widest flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="px-4 py-3 border-l-4 border-game-emerald bg-emerald-950/30 text-emerald-400 text-xs font-bold font-display uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* World Status Header */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 border-2 border-game-emerald/40 bg-emerald-950/20 text-emerald-400">
            <Globe className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
                Living World Simulation
              </h2>
              <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
              <span className="text-[9px] text-zinc-500 font-bold font-display uppercase tracking-widest">{isOnline ? 'Live' : 'Offline'}</span>
            </div>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">
              NPC citizens, autonomous manufacturing chains, and dynamic markets operating 24/7.
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerTick}
          disabled={actionLoading}
          className="rpg-button rpg-button-emerald px-5 py-2.5 text-[10px] tracking-widest flex items-center gap-2 relative z-10"
        >
          <RefreshCw className={`h-4 w-4 shrink-0 ${actionLoading ? 'animate-spin' : ''}`} />
          <span>Trigger Simulation Cycle</span>
        </button>
      </div>

      {/* Commodity Price Tickers */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {trackedCommodities.map((comm) => {
          const stats = getCommodityStats(comm.id);
          const diff = stats.marketAvg - stats.base;
          const isUp = diff >= 0;

          return (
            <div key={comm.id} className="rpg-panel-stone p-4 rounded-none flex flex-col gap-2 text-left relative shadow-md">
              <div className="rpg-rivet top-0.5 left-0.5" />
              <div className="rpg-rivet top-0.5 right-0.5" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">{stats.name}</span>
                <span className="px-1.5 py-0.5 border border-zinc-700 bg-zinc-950 text-[8px] font-pixel text-zinc-500">
                  x{stats.count}
                </span>
              </div>
              <div className="relative z-10">
                <span className="text-lg font-bold font-pixel text-zinc-200">{stats.marketAvg.toFixed(2)} LC</span>
                <span className={`text-[9px] font-bold flex items-center gap-1 mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{isUp ? '+' : ''}{diff.toFixed(2)} delta</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Regional Economy Cards */}
      <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="border-b-2 border-game-gold/15 pb-3 flex items-center justify-between relative z-10">
          <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest">Regional Economic Grid</h3>
          <span className="text-[9px] text-zinc-500 font-serif">Geographical GDP & Labor Dynamics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {regionalEconomies.map((econ) => {
            const employmentRate = econ.population > 0 
              ? Math.round((econ.employed / econ.population) * 100) 
              : 0;

            return (
              <div key={econ.region_id} className="bg-zinc-950 border border-zinc-800 p-5 flex flex-col gap-4 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h4 className="text-sm font-bold font-display text-zinc-200">{econ.region_name}</h4>
                  <span className="px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-[8px] font-bold font-display text-zinc-500 uppercase">
                    #{econ.region_id}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Population/Employment */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 flex items-center gap-1 font-display uppercase tracking-widest">
                        <Users className="h-3 w-3" /> Population
                      </span>
                      <span className="text-zinc-300 font-pixel">{econ.population.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 flex items-center gap-1 font-display uppercase tracking-widest">
                        <Briefcase className="h-3 w-3" /> Employment
                      </span>
                      <span className="text-zinc-300 font-pixel">{employmentRate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 border border-zinc-800">
                      <div className="bg-game-emerald h-full transition-all duration-500" style={{ width: `${employmentRate}%` }} />
                    </div>
                  </div>

                  {/* GDP & Taxes */}
                  <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3">
                    <div>
                      <span className="text-[8px] text-zinc-500 font-display uppercase tracking-widest">Est. GDP</span>
                      <div className="text-sm font-bold font-pixel text-zinc-200 flex items-center gap-0.5 mt-1">
                        <DollarSign className="h-3.5 w-3.5 text-zinc-500" />
                        {econ.gdp.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-500 font-display uppercase tracking-widest">Tax Reserves</span>
                      <div className="text-sm font-bold font-pixel text-game-emerald flex items-center gap-0.5 mt-1">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        {econ.tax_reserves.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {regionalEconomies.length === 0 && (
            <div className="col-span-3 flex flex-col items-center gap-3 py-12 text-zinc-600">
              <Globe className="h-8 w-8" />
              <p className="text-xs font-serif">No regional economies loaded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* World Events & NPC Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Active Events */}
        <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 min-h-[350px] shadow-lg relative">
          <div className="rpg-rivet top-1 left-1" />
          <div className="rpg-rivet top-1 right-1" />
          <div className="rpg-rivet bottom-1 left-1" />
          <div className="rpg-rivet bottom-1 right-1" />

          <div className="border-b-2 border-game-gold/15 pb-3 flex items-center justify-between relative z-10">
            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest">Active World Events</h3>
            <span className="px-2 py-0.5 border border-amber-800/30 bg-amber-950/20 text-[9px] font-bold font-display text-amber-400">
              {activeEvents.length} Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3 max-h-[360px] pr-1 relative z-10">
            {activeEvents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-zinc-600 py-12">
                <Calendar className="h-8 w-8 text-zinc-700" />
                <p className="text-xs font-serif">No active event modifier anomalies.</p>
              </div>
            ) : (
              activeEvents.map((evt) => (
                <div key={evt.id} className="p-4 bg-amber-950/10 border border-amber-800/20 flex flex-col gap-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-display text-amber-400 flex items-center gap-1.5">
                      <Flame className="h-4 w-4" />
                      <span>{evt.name}</span>
                    </span>
                    <span className="text-[9px] text-zinc-500 font-pixel">{evt.duration_ticks} Ticks</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-serif leading-relaxed">{evt.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* NPC Activity Feed */}
        <div className="lg:col-span-2 rpg-panel-parchment p-6 rounded-none flex flex-col gap-4 min-h-[350px] relative">
          <div className="border-b border-amber-950/20 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold font-display text-amber-950 uppercase tracking-widest flex items-center gap-2">
              <Factory className="h-4 w-4" />
              NPC Activity Stream
            </h3>
            <span className="px-2 py-0.5 border border-amber-950/20 bg-amber-950/10 text-[8px] font-bold font-display text-amber-950 tracking-widest uppercase">
              Live Feed
            </span>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[360px] pr-1">
            {npcLogs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-amber-900/40 py-12">
                <AlertCircle className="h-8 w-8 text-amber-900/30" />
                <p className="text-xs font-serif">No activity logged in NPC stream.</p>
              </div>
            ) : (
              npcLogs.map((log) => {
                let badgeClass = 'border-amber-950/20 text-amber-900';
                if (log.action === 'factory.produce') badgeClass = 'border-amber-700/30 text-amber-800';
                else if (log.action === 'factory.manufacture') badgeClass = 'border-emerald-900/30 text-emerald-900';
                else if (log.action === 'company.bankrupt') badgeClass = 'border-red-900/30 text-red-900';

                return (
                  <div key={log.id} className="p-3 bg-amber-950/5 border-b border-amber-950/10 flex items-start gap-3 hover:bg-amber-950/10 transition-colors">
                    <span className={`px-1.5 py-0.5 border text-[8px] font-bold font-display uppercase shrink-0 ${badgeClass}`}>
                      {log.action.replace('factory.', '')}
                    </span>
                    <div className="flex flex-col text-left flex-1">
                      <span className="text-xs text-amber-950 font-bold font-serif">{log.actor_name}</span>
                      <span className="text-[10px] text-amber-900/70 font-serif mt-0.5 leading-relaxed">{log.details}</span>
                    </div>
                    <span className="text-[9px] text-amber-900/50 font-pixel shrink-0 mt-0.5">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
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
