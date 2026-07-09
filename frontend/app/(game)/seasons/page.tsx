'use client';

import React, { useState } from 'react';
import { useGameContext } from '../layout';
import { 
  Trophy, 
  Award, 
  Archive, 
  TrendingUp,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function SeasonsPage() {
  const { seasons, seasonLeaderboard } = useGameContext();

  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(seasons.length > 0 ? seasons[0].id : 1);

  const activeSeason = seasons.find(s => s.id === activeSeasonId) || (seasons.length > 0 ? seasons[0] : null);

  return (
    <div className="flex flex-col gap-6">

      {/* Header Panel */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex items-center gap-4 shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold relative z-10">
          <Trophy className="h-6 w-6" />
        </div>
        <div className="relative z-10">
          <h1 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
            Aegis Seasonal Arena
          </h1>
          <p className="text-zinc-500 text-xs font-serif mt-0.5">
            Check current cosmetic reward metrics, active leaderboards, and historical records.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Leaderboard (left 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest flex items-center gap-2 border-b border-game-gold/15 pb-3 relative z-10">
              <Trophy className="h-4 w-4 text-game-gold" />
              Season Leaderboard
            </h2>

            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-game-gold/15 text-zinc-500">
                    <th className="pb-3 text-left font-display uppercase tracking-widest text-[9px]">Rank</th>
                    <th className="pb-3 text-left font-display uppercase tracking-widest text-[9px]">Commander</th>
                    <th className="pb-3 text-right font-display uppercase tracking-widest text-[9px]">Season Score</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonLeaderboard.map((row) => (
                    <tr key={row.profile_id} className="border-b border-zinc-900 hover:bg-zinc-950/60 transition-colors">
                      <td className="py-3 font-pixel text-sm">
                        {row.rank === 1 ? (
                          <span className="text-game-gold">🥇 1st</span>
                        ) : row.rank === 2 ? (
                          <span className="text-zinc-300">🥈 2nd</span>
                        ) : row.rank === 3 ? (
                          <span className="text-amber-700">🥉 3rd</span>
                        ) : (
                          <span className="text-zinc-500"># {row.rank}</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 border border-game-gold/30 bg-game-wood flex items-center justify-center text-[9px] text-game-gold font-bold font-display">
                            {row.username?.slice(0, 2).toUpperCase() || 'P'}
                          </div>
                          <span className="font-bold font-display text-zinc-200">{row.username}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-pixel text-game-gold text-sm">
                        {row.score.toLocaleString()} pts
                      </td>
                    </tr>
                  ))}
                  {seasonLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-zinc-600">
                          <AlertCircle className="h-8 w-8" />
                          <p className="text-xs font-serif">No rankings loaded for target season.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Season Details & Historic Selector */}
        <div className="flex flex-col gap-6 col-span-1">

          {/* Season Details */}
          {activeSeason && (
            <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <div className="relative z-10">
                <span className="px-2 py-0.5 border border-game-gold/30 bg-game-gold/10 text-game-gold text-[9px] uppercase font-bold font-display tracking-widest">
                  {activeSeason.status}
                </span>
                <h3 className="text-base font-bold font-display text-zinc-200 mt-2">
                  Season {activeSeason.number}: {activeSeason.title}
                </h3>
              </div>

              <div className="flex flex-col gap-2 relative z-10 border-t border-game-gold/15 pt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-display uppercase tracking-widest text-[9px]">Starts At</span>
                  <span className="text-zinc-200 font-bold font-pixel">{new Date(activeSeason.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-display uppercase tracking-widest text-[9px]">Ends At</span>
                  <span className="text-zinc-200 font-bold font-pixel">{new Date(activeSeason.end_date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Reward Card */}
              <div className="relative z-10 bg-zinc-950 border border-game-gold/20 p-4 text-center flex flex-col gap-2 shadow-inner">
                <Award className="h-10 w-10 text-game-gold mx-auto mb-1" />
                <h4 className="text-[10px] font-bold font-display text-game-gold uppercase tracking-widest">
                  Season Championship Reward
                </h4>
                <p className="text-[9px] text-zinc-500 font-serif leading-relaxed">
                  Earn ranks to unlock exclusive character frame cosmetics template #{activeSeason.reward_cosmetic_template_id || 99}.
                </p>
              </div>
            </div>
          )}

          {/* Historic seasons selector */}
          <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 shadow-md relative">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest flex items-center gap-2 relative z-10">
              <Archive className="h-4 w-4" /> Historic Archives
            </h3>
            <div className="flex flex-col gap-2 relative z-10">
              {seasons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSeasonId(s.id)}
                  className={`p-3 border transition-all flex justify-between items-center text-left w-full ${
                    activeSeasonId === s.id
                      ? 'border-game-gold/50 bg-game-gold/5 text-game-gold'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-xs font-bold font-display">Season {s.number}</span>
                  <span className="text-[9px] font-pixel text-zinc-500">{s.status}</span>
                </button>
              ))}
              {seasons.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-zinc-600">
                  <Sparkles className="h-6 w-6" />
                  <p className="text-[10px] font-serif">No seasons recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
