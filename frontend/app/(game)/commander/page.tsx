'use client';

import { useGameContext } from '../layout';
import { useState, useEffect } from 'react';
import { gameRepository } from '../../../services/repository/provider';
import { 
  User, Award, Mail, History, Shield, Flame, Scale, Clock, Heart, 
  Coins, Sparkles, Inbox, Feather, Box, Send, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommanderPage() {
  const {
    profile,
    stats,
    currencies,
    regions,
    countries,
    experienceThresholds,
    playerAchievements,
    playerMail,
    auditLogs,
    inventory,
    sendMail,
    claimMailAttachments,
    refreshData
  } = useGameContext();

  const [activeTab, setActiveTab] = useState<'profile' | 'achievements' | 'mail' | 'log'>('profile');
  const [staticAchievements, setStaticAchievements] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mail states
  const [activeMailId, setActiveMailId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachCurrency, setAttachCurrency] = useState(0);
  const [attachGold, setAttachGold] = useState(0);
  const [attachItemId, setAttachItemId] = useState<number | null>(null);
  const [attachQty, setAttachQty] = useState(0);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const aList = await gameRepository.getAchievements();
        setStaticAchievements(aList);
      } catch (err) {
        console.error('Failed to load achievements:', err);
      }
    };
    loadAchievements();
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

  const handleComposeMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !subject || !body) return;
    const res = await sendMail(recipientId, subject, body, attachCurrency, attachGold, attachItemId || undefined, attachQty);
    if (res.success) {
      setComposing(false);
      setRecipientId(''); setSubject(''); setBody('');
      setAttachCurrency(0); setAttachGold(0); setAttachItemId(null); setAttachQty(0);
      showStatus('Mail dispatched successfully!', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to send mail.', false);
    }
  };

  const handleClaimMail = async (mailId: number) => {
    const res = await claimMailAttachments(mailId);
    if (res.success) {
      showStatus('Attachments claimed successfully!', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to claim attachments.', false);
    }
  };

  const activeRegion = regions.find((r) => r.id === profile?.current_region_id);
  const activeCountry = countries.find((c) => c.id === activeRegion?.country_id);
  const citizenshipCountry = countries.find((c) => c.id === profile?.citizenship_country_id);

  // Experience calculations
  const threshold = experienceThresholds.find((t) => t.level === stats?.level);
  const nextLevelExp = threshold?.required_experience || ((stats?.level || 1) * (stats?.level || 1) * 100);
  const expPercentage = stats ? Math.min(100, Math.round((stats.experience / nextLevelExp) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Alerts */}
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

      {/* Header Panel */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Commander Registry
            </h2>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">
              Inspect your Commander attributes, achievements, mail inbox, and service records.
            </p>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex bg-zinc-950 p-1 border border-zinc-800 relative z-10">
          {[
            { id: 'profile', label: 'Attributes', icon: User },
            { id: 'achievements', label: 'Medals', icon: Award },
            { id: 'mail', label: 'Inbox Mail', icon: Mail },
            { id: 'log', label: 'Service Log', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setError(null);
                  setComposing(false);
                  setActiveMailId(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[9px] font-bold font-display uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-game-gold/20 text-game-gold border border-game-gold/30' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left column info card */}
        <div className="lg:col-span-1 rpg-panel-stone p-5 rounded-none flex flex-col gap-4 relative shadow-lg">
          <div className="rpg-rivet top-1 left-1" />
          <div className="rpg-rivet top-1 right-1" />
          <div className="rpg-rivet bottom-1 left-1" />
          <div className="rpg-rivet bottom-1 right-1" />

          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="h-11 w-11 border-2 border-game-gold bg-game-wood text-game-gold flex items-center justify-center font-display font-black text-lg">
              {profile?.username[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold font-display text-sm text-zinc-100">{profile?.username}</h3>
              <p className="text-[9px] text-game-gold-dark font-display uppercase tracking-wider mt-0.5">{profile?.role}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Citizenship:</span>
              <span className="font-bold text-zinc-300">{citizenshipCountry?.name || 'Genesis Land'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Sector:</span>
              <span className="font-bold text-zinc-300">{activeRegion?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Level Rank:</span>
              <span className="font-bold text-zinc-300">Level {stats?.level}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-zinc-800 pt-3">
            <div className="flex justify-between text-[9px] text-zinc-500 font-pixel">
              <span>EXP Progress</span>
              <span>{expPercentage}%</span>
            </div>
            <div className="w-full bg-zinc-900 border border-zinc-800 h-2 shadow-inner">
              <div
                className="bg-indigo-500 h-full transition-all duration-500"
                style={{ width: `${expPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic central content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            
            {/* 1. CHARACTER SHEET / PROFILE */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative"
              >
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3">Raw Attributes & Combat Pool</h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                  <div className="p-3 bg-zinc-950 border border-zinc-900 text-center flex flex-col items-center">
                    <Heart className="h-6 w-6 text-red-500 mb-1" />
                    <span className="text-[8px] text-zinc-500 font-display uppercase tracking-widest">Health Pool</span>
                    <span className="text-sm font-pixel font-bold text-zinc-200 mt-1">{stats?.health} / {stats?.max_health}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 border border-zinc-900 text-center flex flex-col items-center">
                    <Flame className="h-6 w-6 text-game-gold mb-1" />
                    <span className="text-[8px] text-zinc-500 font-display uppercase tracking-widest">Strength</span>
                    <span className="text-sm font-pixel font-bold text-zinc-200 mt-1">{(stats?.strength || 10).toFixed(2)}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 border border-zinc-900 text-center flex flex-col items-center">
                    <Feather className="h-6 w-6 text-emerald-500 mb-1" />
                    <span className="text-[8px] text-zinc-500 font-display uppercase tracking-widest">Harvest Skill</span>
                    <span className="text-sm font-pixel font-bold text-zinc-200 mt-1">{(stats?.work_skill || 1).toFixed(2)}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 border border-zinc-900 text-center flex flex-col items-center">
                    <Shield className="h-6 w-6 text-indigo-500 mb-1" />
                    <span className="text-[8px] text-zinc-500 font-display uppercase tracking-widest">Defense</span>
                    <span className="text-sm font-pixel font-bold text-zinc-200 mt-1">{(stats?.defense || 0).toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. ACHIEVEMENTS */}
            {activeTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative"
              >
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3">Military Medals & Badges</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {staticAchievements.map((ach) => {
                    const isUnlocked = playerAchievements.some(pa => pa.achievement_id === ach.id);
                    return (
                      <div key={ach.id} className={`bg-zinc-950 border p-3.5 flex items-start gap-3 rounded-none ${isUnlocked ? 'border-game-gold/30' : 'border-zinc-900 opacity-60'}`}>
                        <div className={`p-2 border rounded-none ${isUnlocked ? 'border-game-gold bg-game-gold/10 text-game-gold' : 'border-zinc-800 text-zinc-600'}`}>
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs font-display text-zinc-200 flex items-center gap-1.5">
                            {ach.title}
                            {isUnlocked && <span className="text-[8px] border border-game-gold px-1 text-game-gold">Unlocked</span>}
                          </h4>
                          <p className="text-[10px] text-zinc-500 font-serif mt-1">{ach.description}</p>
                          <p className="text-[9px] font-pixel text-zinc-600 mt-1">Reward: +{ach.points_reward} points</p>
                        </div>
                      </div>
                    );
                  })}
                  {staticAchievements.length === 0 && (
                    <p className="text-zinc-600 font-serif text-xs py-4 col-span-2 text-center">No achievements registered in this realm database.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* 3. INBOX MAIL */}
            {activeTab === 'mail' && (
              <motion.div
                key="mail"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {composing ? (
                  <form onSubmit={handleComposeMail} className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 relative shadow-lg">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <div className="flex justify-between items-center border-b border-game-gold/15 pb-3">
                      <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest">Write Letter</h3>
                      <button type="button" onClick={() => setComposing(false)} className="text-[10px] text-zinc-500 hover:text-zinc-300">Back to Inbox</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Recipient UUID</label>
                        <input type="text" required value={recipientId} onChange={(e) => setRecipientId(e.target.value)} placeholder="Recipient UUID..." className="rpg-input px-3 py-2 text-xs w-full animate-none" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Subject</label>
                        <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Letter subject..." className="rpg-input px-3 py-2 text-xs w-full animate-none" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Message Body</label>
                      <textarea required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Dearest commander..." className="rpg-input px-3 py-2 text-xs w-full h-24 resize-none animate-none" />
                    </div>

                    <div className="flex justify-end gap-2.5">
                      <button type="submit" className="rpg-button rpg-button-emerald px-5 py-2 text-[9px] flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5" /> Send Letter
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 relative shadow-lg">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <div className="flex justify-between items-center border-b border-game-gold/15 pb-3">
                      <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest">Your Correspondence</h3>
                      <button type="button" onClick={() => setComposing(true)} className="rpg-button px-3 py-1 text-[9px] flex items-center gap-1">
                        <Feather className="h-3.5 w-3.5" /> Write Letter
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                      {playerMail.map((mail) => (
                        <div key={mail.id} className="bg-zinc-950 border border-zinc-900 p-4 flex flex-col gap-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-zinc-200">{mail.subject}</span>
                            <span className="text-[8px] text-zinc-500">{new Date(mail.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-zinc-500 font-serif text-[11px] leading-relaxed">{mail.body}</p>
                          
                          {(mail.attached_currency > 0 || mail.attached_gold > 0) && !mail.is_claimed && (
                            <div className="flex justify-between items-center bg-zinc-900/60 p-2.5 border border-zinc-850 mt-1">
                              <span className="text-[10px] text-game-gold font-pixel">Attachments: {mail.attached_currency} LC / {mail.attached_gold} G</span>
                              <button onClick={() => handleClaimMail(mail.id)} className="rpg-button px-3 py-1 text-[9px]">Claim</button>
                            </div>
                          )}
                        </div>
                      ))}
                      {playerMail.length === 0 && (
                        <p className="text-zinc-650 font-serif text-center py-6">Your inbox is currently empty.</p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. SERVICE LOG */}
            {activeTab === 'log' && (
              <motion.div
                key="log"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative"
              >
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3">Service Chronicles</h3>
                
                <div className="flex flex-col gap-2 mt-2 max-h-[400px] overflow-y-auto pr-1">
                  {auditLogs.map((log) => {
                    let text = log.action;
                    if (log.action === 'auth.signup') text = 'Registered terminal account.';
                    else if (log.action === 'region.travel') text = `Jumped region to ${log.metadata.to}.`;
                    else if (log.action === 'company.work') text = `Worked shift at ${log.metadata.company_name}.`;
                    else if (log.action === 'combat.train') text = `Completed military drill. Gained strength.`;
                    else if (log.action === 'resource.gather') text = `Extracted raw ${log.metadata.resource_name}.`;
                    
                    return (
                      <div key={log.id} className="p-3 bg-zinc-950 border border-zinc-900 flex justify-between items-center text-xs">
                        <span className="text-zinc-300 font-serif">{text}</span>
                        <span className="text-[8px] text-zinc-500 font-pixel">{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                    );
                  })}
                  {auditLogs.length === 0 && (
                    <p className="text-zinc-600 font-serif text-center py-6">No historical records logged.</p>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
