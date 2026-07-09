'use client';

import { useGameContext } from '../layout';
import { useState, useEffect } from 'react';
import { gameRepository } from '../../../services/repository/provider';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Compass, AlertCircle, Coins, Flame, User, Play, ChevronRight, Landmark, Newspaper, Zap
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { 
    profile, 
    stats, 
    currencies, 
    playerQuests, 
    startQuest, 
    updateQuestProgress, 
    claimEnergy,
    refreshData,
    actionLoading
  } = useGameContext();

  const [staticQuests, setStaticQuests] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadQuests = async () => {
      try {
        const qList = await gameRepository.getQuests();
        setStaticQuests(qList);
      } catch (err) {
        console.error('Failed to load static quests:', err);
      }
    };
    loadQuests();
  }, []);

  const showStatus = (text: string, ok: boolean) => {
    if (ok) {
      setSuccess(text);
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(text);
      setSuccess(null);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleStartQuest = async (questId: number) => {
    const res = await startQuest(questId);
    if (res.success) {
      showStatus('Story adventure accepted! View your target objective.', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to start quest.', false);
    }
  };

  const handleSimulateQuest = async (questId: number, current: number, required: number) => {
    const nextVal = current + 1;
    const res = await updateQuestProgress(questId, { current: nextVal, required });
    if (res.success) {
      if (nextVal >= required) {
        showStatus('Adventure completed! Quest rewards disbursed into cargo hold.', true);
      } else {
        showStatus(`Objective updated: ${nextVal} / ${required}`, true);
      }
      refreshData();
    } else {
      showStatus(res.error || 'Failed to update progress.', false);
    }
  };

  const activeQuest = playerQuests.find(q => q.status === 'active');
  const finishedQuestsCount = playerQuests.filter(q => q.status === 'completed').length;

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Dynamic Alerts */}
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

      {/* Main Hero Banner */}
      <div className="w-full h-44 border-2 border-game-gold relative overflow-hidden shadow-2xl flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent" />
        <div className="relative z-10 text-center flex flex-col gap-1.5 p-4">
          <span className="text-[9px] font-display text-game-gold tracking-[0.35em] uppercase drop-shadow-md">Persistent Sandbox RPG</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-game-gold tracking-widest uppercase filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            Aegis Kingdoms
          </h1>
          <p className="text-zinc-300 text-[10px] font-serif italic tracking-wide max-w-md mx-auto drop-shadow-md">
            "Forge your legacy, extract raw commodities, and lead your armies to coordinate national conquest."
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Column 1: Main adventure objective */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Objective Box */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col justify-between flex-1 relative shadow-xl min-h-[300px]">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <div className="relative z-10 flex flex-col gap-4">
              <h2 className="text-sm font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-2.5 flex items-center gap-2">
                <Compass className="h-4.5 w-4.5" />
                <span>Primary Objective</span>
              </h2>

              {activeQuest ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-base font-bold font-display text-zinc-100">{activeQuest.title}</h3>
                    <p className="text-xs text-zinc-400 font-serif mt-1">{activeQuest.description}</p>
                  </div>

                  {(() => {
                    const current = activeQuest.progress_json?.current || 0;
                    const required = activeQuest.progress_json?.required || 1;
                    const percent = Math.min((current / required) * 100, 100);

                    return (
                      <div className="flex flex-col gap-2 mt-2 bg-zinc-950 p-4 border border-zinc-900">
                        <div className="flex justify-between text-[10px] font-pixel text-zinc-500">
                          <span>Target Progress: {current} / {required}</span>
                          <span>{percent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 border border-zinc-800 h-2">
                          <div
                            className="bg-game-gold h-full transition-all duration-350"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-4 border-t border-zinc-900 pt-3">
                          <button
                            onClick={() => handleSimulateQuest(activeQuest.quest_id, current, required)}
                            className="rpg-button px-5 py-2 text-[10px] tracking-widest font-bold"
                          >
                            Simulate Progress
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="text-zinc-500 text-xs font-serif leading-relaxed">
                    You have no active adventures currently. Select a quest from the chronicle scrolls below to set your next travel coordinates.
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    {staticQuests.filter(q => !playerQuests.some(pq => pq.quest_id === q.id)).slice(0, 2).map((quest) => (
                      <div key={quest.id} className="bg-zinc-950 border border-zinc-900 p-3.5 flex justify-between items-center text-xs">
                        <div>
                          <h4 className="font-bold text-zinc-200">{quest.title}</h4>
                          <p className="text-[10px] text-zinc-500 font-serif mt-0.5">{quest.description}</p>
                        </div>
                        <button
                          onClick={() => handleStartQuest(quest.id)}
                          className="rpg-button rpg-button-emerald px-3.5 py-1.5 text-[9px] tracking-widest shrink-0"
                        >
                          Accept
                        </button>
                      </div>
                    ))}
                    {staticQuests.filter(q => !playerQuests.some(pq => pq.quest_id === q.id)).length === 0 && (
                      <p className="text-zinc-650 text-center py-4 font-serif text-[11px]">All story quests accepted or completed.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest text-center mt-6 border-t border-zinc-900/60 pt-3 relative z-10">
              Completed Storyline Adventures: {finishedQuestsCount}
            </div>
          </div>
        </div>

        {/* Column 2: Quick actions & News */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Quick actions panel */}
          <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 relative shadow-lg">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Quick Operations</span>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/combat')}
                className="rpg-button w-full h-11 text-[9px] tracking-widest flex items-center justify-between px-4 uppercase font-bold"
              >
                <span>Enter Combat Arena</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => router.push('/explore')}
                className="rpg-button w-full h-11 text-[9px] tracking-widest flex items-center justify-between px-4 uppercase font-bold"
              >
                <span>Explore Coordinates</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Kingdom Gazeteer (Real-time news) */}
          <div className="rpg-panel-stone p-5 rounded-none flex-1 flex flex-col gap-4 relative shadow-lg">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest font-bold border-b border-zinc-800 pb-2 flex items-center gap-1.5">
              <Newspaper className="h-4 w-4" />
              <span>Kingdom Gazeteer</span>
            </h3>

            <div className="flex flex-col gap-3.5 text-xs text-left max-h-[160px] overflow-y-auto pr-1">
              <div>
                <span className="text-[8px] font-bold text-rose-500 uppercase tracking-widest font-display">Border Disputes</span>
                <h4 className="font-bold text-zinc-300 mt-0.5">Ironhold Clans Stocking Longswords</h4>
                <p className="text-[10px] text-zinc-500 font-serif leading-relaxed mt-0.5">
                  Border skirmishes continue. Ironhold blacksmiths report record high sword productions.
                </p>
              </div>
              <div className="border-t border-zinc-900 pt-3">
                <span className="text-[8px] font-bold text-game-emerald uppercase tracking-widest font-display">Market Spikes</span>
                <h4 className="font-bold text-zinc-300 mt-0.5">Grain Reserves Stabilizing</h4>
                <p className="text-[10px] text-zinc-500 font-serif leading-relaxed mt-0.5">
                  Domestic crop yields are solid. Market VAT revenues have increased by +12%.
                </p>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
