'use client';

import { useGameContext } from '../layout';
import { useState } from 'react';
import { History, Flame, Pickaxe, Award, Globe, AlertCircle } from 'lucide-react';

export default function HistoryPage() {
  const { gatherLogs, energyHistory, resources, regions } = useGameContext();
  const [activeTab, setActiveTab] = useState<'gather' | 'energy'>('gather');

  const getResourceName = (resId: number) =>
    resources.find((r) => r.id === resId)?.name || `Resource #${resId}`;

  const getRegionName = (regId: number) =>
    regions.find((r) => r.id === regId)?.name || `Region #${regId}`;

  return (
    <div className="flex flex-col gap-6">

      {/* Header Panel */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <History className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Central Activity Audit
            </h2>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">
              Chronological record of resource extraction and energy change tracing.
            </p>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center gap-1.5 relative z-10">
          <button
            onClick={() => setActiveTab('gather')}
            className={`rpg-button px-4 py-2 text-[10px] tracking-widest flex items-center gap-2 ${
              activeTab === 'gather' ? 'border-game-gold text-game-gold' : 'opacity-60'
            }`}
          >
            <Pickaxe className="h-3.5 w-3.5 shrink-0" />
            <span>Gather Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('energy')}
            className={`rpg-button px-4 py-2 text-[10px] tracking-widest flex items-center gap-2 ${
              activeTab === 'energy' ? 'border-game-gold text-game-gold' : 'opacity-60'
            }`}
          >
            <Flame className="h-3.5 w-3.5 shrink-0" />
            <span>Energy Traces</span>
          </button>
        </div>
      </div>

      {/* Logs Feed Board */}
      <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 relative z-10">
          {activeTab === 'gather' ? 'Resource Extraction Ledger' : 'Energy Transaction Records'}
        </h3>

        {activeTab === 'gather' ? (
          <div className="flex flex-col gap-3 relative z-10">
            {gatherLogs.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="h-8 w-8 text-zinc-700 animate-pulse" />
                <p className="text-sm font-serif">No gather operations have been performed yet.</p>
              </div>
            ) : (
              gatherLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-zinc-950 border border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-game-gold/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 border border-game-emerald/30 bg-game-emerald/10 text-emerald-400">
                      <Pickaxe className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold font-display text-zinc-200">
                        Gathered x{log.quantity_gathered} {getResourceName(log.resource_id)}
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1.5 font-serif">
                        <Globe className="h-3.5 w-3.5 text-zinc-600" />
                        <span>Sector: {getRegionName(log.region_id)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t border-zinc-800/40 pt-3 sm:pt-0 sm:border-0">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold font-display tracking-widest">Energy Spent</span>
                        <span className="text-xs font-bold font-pixel text-red-400 mt-0.5">-{log.energy_spent} EP</span>
                      </div>
                      <div className="flex flex-col items-end border-l border-zinc-800 pl-4">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold font-display tracking-widest">XP Gained</span>
                        <span className="text-xs font-bold font-pixel text-game-gold mt-0.5 flex items-center gap-1">
                          <Award className="h-3.5 w-3.5 text-game-gold-dark" />
                          <span>+{log.experience_earned} XP</span>
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-600 font-pixel pl-4 border-l border-zinc-800/60 hidden sm:inline">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 relative z-10">
            {energyHistory.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="h-8 w-8 text-zinc-700 animate-pulse" />
                <p className="text-sm font-serif">No energy adjustments have occurred yet.</p>
              </div>
            ) : (
              energyHistory.map((log) => {
                const isGain = log.change_amount > 0;

                let desc = log.reason;
                if (log.reason === 'offline_regen') {
                  desc = 'Offline automatic energy recovery tick';
                } else if (log.reason.startsWith('gathering_')) {
                  desc = `Resource gathering: ${log.reason.split('_')[1]}`;
                }

                return (
                  <div
                    key={log.id}
                    className="p-4 bg-zinc-950 border border-zinc-900 flex items-center justify-between gap-4 hover:border-game-gold/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 border ${isGain ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-900/30 bg-red-950/20 text-red-400'}`}>
                        <Flame className="h-5 w-5 animate-pulse" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-bold font-display text-zinc-300 capitalize">{desc}</span>
                        <span className="text-[9px] text-zinc-600 mt-1 font-mono">Audit ID: {log.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className={`text-sm font-extrabold font-pixel ${isGain ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isGain ? `+${log.change_amount}` : log.change_amount} EP
                      </span>
                      <span className="text-xs text-zinc-600 font-pixel hidden sm:inline">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
