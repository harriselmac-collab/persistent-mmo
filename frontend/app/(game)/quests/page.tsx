'use client';

import React, { useState, useEffect } from 'react';
import { useGameContext } from '../layout';
import { gameRepository } from '../../../services/repository/provider';
import { 
  Compass, 
  Award, 
  CheckCircle, 
  Coins, 
  Zap, 
  Lock, 
  Unlock, 
  Target,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function QuestsPage() {
  const {
    profile,
    playerQuests,
    playerAchievements,
    startQuest,
    updateQuestProgress,
    refreshData
  } = useGameContext();

  const [activeTab, setActiveTab] = useState<'quests' | 'achievements'>('quests');
  const [staticQuests, setStaticQuests] = useState<any[]>([]);
  const [staticAchievements, setStaticAchievements] = useState<any[]>([]);
  const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    const load = async () => {
      const qList = await gameRepository.getQuests();
      setStaticQuests(qList);
      const aList = await gameRepository.getAchievements();
      setStaticAchievements(aList);
    };
    load();
  }, []);

  const showMsg = (text: string, ok: boolean) => {
    setActionMsg({ text, ok });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleStartQuest = async (questId: number) => {
    const res = await startQuest(questId);
    if (res.success) {
      showMsg('Quest started! Check requirements in your log.', true);
      refreshData();
    } else {
      showMsg(res.error || 'Failed to start quest.', false);
    }
  };

  const handleTriggerSimProgress = async (questId: number, current: number, required: number) => {
    const nextVal = current + 1;
    const res = await updateQuestProgress(questId, { current: nextVal, required });
    if (res.success) {
      if (nextVal >= required) showMsg('Quest completed! Rewards claimed.', true);
      else showMsg(`Progress updated: ${nextVal} / ${required}`, true);
      refreshData();
    } else {
      showMsg(res.error || 'Failed to update progress.', false);
    }
  };

  const totalPoints = playerAchievements.reduce((sum, a) => sum + (a.points || 0), 0);

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
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Adventure & Achievements
            </h1>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">
              Complete daily tasks, progress in storyline tutorials, and unlock badges.
            </p>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center gap-1.5 relative z-10">
          <button
            onClick={() => setActiveTab('quests')}
            className={`rpg-button px-4 py-2 text-[10px] tracking-widest flex items-center gap-2 ${
              activeTab === 'quests' ? 'border-game-gold text-game-gold' : 'opacity-60'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            Quests Log
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`rpg-button px-4 py-2 text-[10px] tracking-widest flex items-center gap-2 ${
              activeTab === 'achievements' ? 'border-game-gold text-game-gold' : 'opacity-60'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            Achievements
          </button>
        </div>
      </div>

      {/* Action Message Banner */}
      {actionMsg && (
        <div className={`px-4 py-3 border-l-4 text-xs font-bold font-display uppercase tracking-widest ${
          actionMsg.ok ? 'border-game-emerald bg-emerald-950/30 text-emerald-400' : 'border-red-600 bg-red-950/30 text-red-400'
        }`}>
          {actionMsg.text}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main List Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* ─── TAB 1: QUESTS ─── */}
          {activeTab === 'quests' && (
            <div className="flex flex-col gap-6">

              {/* Active Quests */}
              <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest flex items-center gap-2 border-b border-game-gold/15 pb-3 relative z-10">
                  <Zap className="h-4 w-4" /> Active Quests ({playerQuests.length})
                </h2>

                <div className="flex flex-col gap-3 relative z-10">
                  {playerQuests.map((pq) => {
                    const current = pq.progress_json?.current || 0;
                    const required = pq.progress_json?.required || 1;
                    const percent = Math.min((current / required) * 100, 100);
                    const isCompleted = pq.status === 'completed';

                    return (
                      <div key={pq.quest_id} className={`bg-zinc-950 border p-4 flex flex-col gap-3 ${isCompleted ? 'border-game-emerald/30' : 'border-zinc-800'}`}>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h3 className="text-sm font-bold font-display text-zinc-200">{pq.title}</h3>
                            <p className="text-xs text-zinc-500 font-serif mt-0.5">{pq.description}</p>
                          </div>
                          <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold font-display tracking-widest shrink-0 ${
                            isCompleted ? 'border-game-emerald/30 bg-emerald-950/20 text-emerald-400' : 'border-game-gold/30 bg-game-gold/10 text-game-gold'
                          }`}>
                            {pq.status}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-[9px] text-zinc-500 font-pixel">
                            <span>Progress: {current} / {required}</span>
                            <span>{percent.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 border border-zinc-800 h-2 shadow-inner">
                            <div
                              className={`h-full transition-all duration-500 ${isCompleted ? 'bg-game-emerald' : 'bg-game-gold'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {!isCompleted && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleTriggerSimProgress(pq.quest_id, current, required)}
                              className="rpg-button px-3 py-1.5 text-[9px] tracking-widest flex items-center gap-1"
                            >
                              <Target className="h-3 w-3" /> Simulate Progress
                            </button>
                          </div>
                        )}
                        {isCompleted && (
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-[10px] font-bold font-display uppercase tracking-widest">Quest Completed</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {playerQuests.length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-10 text-zinc-600">
                      <AlertCircle className="h-8 w-8" />
                      <p className="text-xs font-serif">No active quests in your logs.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Quests */}
              <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 relative z-10">
                  Available Quests
                </h3>
                <div className="flex flex-col gap-3 relative z-10">
                  {staticQuests.filter(q => !playerQuests.some(pq => pq.quest_id === q.id)).map((quest) => (
                    <div key={quest.id} className="bg-zinc-950 border border-zinc-800 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 border border-zinc-700/50 bg-zinc-900 text-zinc-500 text-[9px] uppercase font-bold font-display tracking-widest">
                            {quest.category}
                          </span>
                          <h4 className="text-xs font-bold font-display text-zinc-200">{quest.title}</h4>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-serif">{quest.description}</p>
                      </div>
                      <button
                        onClick={() => handleStartQuest(quest.id)}
                        className="rpg-button rpg-button-emerald px-4 py-2 text-[9px] tracking-widest shrink-0"
                      >
                        Accept Quest
                      </button>
                    </div>
                  ))}
                  {staticQuests.filter(q => !playerQuests.some(pq => pq.quest_id === q.id)).length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-8 text-zinc-600">
                      <Sparkles className="h-6 w-6" />
                      <p className="text-xs font-serif">All available quests accepted.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: ACHIEVEMENTS ─── */}
          {activeTab === 'achievements' && (
            <div className="flex flex-col gap-6">

              {/* Unlocked Achievements */}
              <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest flex items-center gap-2 border-b border-game-gold/15 pb-3 relative z-10">
                  <Award className="h-4 w-4" /> Completed Achievements
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                  {playerAchievements.map((ach) => (
                    <div key={ach.achievement_id} className="bg-zinc-950 border border-game-gold/25 p-4 flex items-center gap-3">
                      <div className="border border-game-gold/30 bg-game-gold/10 p-2.5 shrink-0">
                        <Unlock className="h-5 w-5 text-game-gold" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-display text-zinc-200">{ach.title}</h4>
                        <p className="text-[10px] text-zinc-500 font-serif mt-0.5">{ach.description}</p>
                        <span className="text-[9px] text-game-gold font-pixel font-bold block mt-1.5">+{ach.points} pts</span>
                      </div>
                    </div>
                  ))}
                  {playerAchievements.length === 0 && (
                    <div className="col-span-2 flex flex-col items-center gap-3 py-10 text-zinc-600">
                      <AlertCircle className="h-8 w-8" />
                      <p className="text-xs font-serif">No achievements unlocked yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Locked Achievements */}
              <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-md relative">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-xs font-bold font-display text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-3 relative z-10">
                  Locked Achievements
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                  {staticAchievements.filter(a => !playerAchievements.some(pa => pa.achievement_id === a.id)).map((ach) => (
                    <div key={ach.id} className="bg-zinc-950 border border-zinc-800 p-4 flex items-center gap-3 opacity-50">
                      <div className="border border-zinc-700 bg-zinc-900 p-2.5 shrink-0">
                        <Lock className="h-5 w-5 text-zinc-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-display text-zinc-400">{ach.title}</h4>
                        <p className="text-[10px] text-zinc-600 font-serif mt-0.5">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-6 col-span-1">

          {/* Achievement Points Tally */}
          <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 shadow-md relative">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest relative z-10">Achievement Points</h3>
            <div className="bg-zinc-950 border border-game-gold/20 p-6 text-center shadow-inner relative z-10">
              <span className="text-5xl font-black font-pixel text-game-gold filter drop-shadow-[0_0_8px_rgba(229,193,88,0.3)]">
                {totalPoints}
              </span>
              <p className="text-[9px] text-zinc-500 font-display uppercase tracking-widest mt-2">Total Points</p>
            </div>
          </div>

          {/* Quest Categories Guide */}
          <div className="rpg-panel-parchment p-5 rounded-none flex flex-col gap-4 relative">
            <h3 className="text-xs font-bold font-display text-amber-950 uppercase tracking-widest border-b border-amber-950/20 pb-3">
              Quest Categories
            </h3>
            <div className="flex flex-col gap-3 text-xs text-amber-950/80 font-serif">
              <div className="flex gap-2 items-start">
                <span className="h-2 w-2 rounded-full bg-emerald-700 shrink-0 mt-1" />
                <p><strong>Tutorial Quests</strong>: Skip or complete to unlock core dashboards.</p>
              </div>
              <div className="flex gap-2 items-start">
                <span className="h-2 w-2 rounded-full bg-amber-700 shrink-0 mt-1" />
                <p><strong>Daily & Weekly</strong>: Repeating quests rewarding currency and energy.</p>
              </div>
              <div className="flex gap-2 items-start">
                <span className="h-2 w-2 rounded-full bg-red-800 shrink-0 mt-1" />
                <p><strong>Story & Seasonal</strong>: Thematic storylines active during seasons.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
