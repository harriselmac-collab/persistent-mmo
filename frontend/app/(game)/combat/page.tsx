'use client';

import { useGameContext } from '../layout';
import { useState, useEffect, useRef } from 'react';
import { 
  Swords, Shield, Trophy, Heart, Award, Sparkles, AlertCircle, ShoppingBag, Zap, ShieldAlert, Dumbbell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface RoundLog {
  round: number;
  attacker: string;
  defender: string;
  damage: number;
  action: string;
  defender_hp: number;
}

interface LootItem {
  name: string;
  quantity: number;
}

const triggerConfetti = () => {
  const duration = 1.8 * 1000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: ['#e5c158', '#10b981', '#ffffff']
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: ['#e5c158', '#10b981', '#ffffff']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

export default function CombatPage() {
  const {
    profile,
    stats,
    inventory,
    equipment,
    enemyTemplates,
    combatRankings,
    executePvEBattle,
    train,
    actionLoading,
    refreshData
  } = useGameContext();

  const [activeTab, setActiveTab] = useState<'pve' | 'train' | 'rankings'>('pve');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected enemy template for details & fighting
  const [selectedEnemyId, setSelectedEnemyId] = useState<number>(1);

  // Combat Outcome States
  const [combatOutcome, setCombatOutcome] = useState<{
    isVictory: boolean;
    xpGained?: number;
    currencyGained?: number;
    roundsLog?: RoundLog[];
    lootGained?: LootItem[];
    playerHp?: number;
  } | null>(null);

  // Clash Arena Simulation States
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [animatedPlayerHp, setAnimatedPlayerHp] = useState(100);
  const [animatedEnemyHp, setAnimatedEnemyHp] = useState(100);
  const [maxPlayerHp, setMaxPlayerHp] = useState(100);
  const [maxEnemyHp, setMaxEnemyHp] = useState(100);
  const [arenaEnemyName, setArenaEnemyName] = useState('');
  const [floatingDamageTexts, setFloatingDamageTexts] = useState<{ id: string; text: string; target: 'player' | 'enemy' }[]>([]);
  const [activeHitFlash, setActiveHitFlash] = useState<'player' | 'enemy' | null>(null);
  const [attackingSide, setAttackingSide] = useState<'player' | 'enemy' | null>(null);
  const [pendingOutcome, setPendingOutcome] = useState<any>(null);

  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Clean up timers
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  const animateRounds = (rounds: RoundLog[], finalOutcome: any, initialPlayerHp: number, initialEnemyHp: number, enemyName: string) => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    let currentIdx = 0;
    let currentEnemyHp = initialEnemyHp;
    let currentPlayerHp = initialPlayerHp;

    const playNextRound = () => {
      if (currentIdx >= rounds.length) {
        setIsAnimating(false);
        setCombatOutcome(finalOutcome);
        setPendingOutcome(null);
        if (finalOutcome.isVictory) {
          showStatus('Battle Victory! Loot rewards transferred to your inventory.', true);
          triggerConfetti();
        } else {
          showStatus('Defeat! You were knocked out. Buy bread to recover health.', false);
        }
        refreshData();
        return;
      }

      const round = rounds[currentIdx];
      setCurrentRoundIndex(currentIdx);

      const isPlayerAttacking = round.attacker === profile?.username;

      if (isPlayerAttacking) {
        setAttackingSide('player');
        const t1 = setTimeout(() => {
          setActiveHitFlash('enemy');
          currentEnemyHp = Math.max(0, currentEnemyHp - round.damage);
          setAnimatedEnemyHp(currentEnemyHp);

          const floatId = Math.random().toString();
          setFloatingDamageTexts(prev => [...prev, { id: floatId, text: `-${round.damage}`, target: 'enemy' }]);

          const tFloat = setTimeout(() => {
            setFloatingDamageTexts(prev => prev.filter(t => t.id !== floatId));
          }, 1000);
          timeoutRefs.current.push(tFloat);

          const tClear = setTimeout(() => setActiveHitFlash(null), 180);
          timeoutRefs.current.push(tClear);
        }, 1500 * 0.1);
        timeoutRefs.current.push(t1);
      } else {
        setAttackingSide('enemy');
        const t1 = setTimeout(() => {
          setActiveHitFlash('player');
          currentPlayerHp = Math.max(0, currentPlayerHp - round.damage);
          setAnimatedPlayerHp(currentPlayerHp);

          const floatId = Math.random().toString();
          setFloatingDamageTexts(prev => [...prev, { id: floatId, text: `-${round.damage}`, target: 'player' }]);

          const tFloat = setTimeout(() => {
            setFloatingDamageTexts(prev => prev.filter(t => t.id !== floatId));
          }, 1000);
          timeoutRefs.current.push(tFloat);

          const tClear = setTimeout(() => setActiveHitFlash(null), 180);
          timeoutRefs.current.push(tClear);
        }, 1500 * 0.1);
        timeoutRefs.current.push(t1);
      }

      const tReset = setTimeout(() => setAttackingSide(null), 1500 * 0.35);
      timeoutRefs.current.push(tReset);

      currentIdx++;
      const tNext = setTimeout(playNextRound, 1500 * 0.6);
      timeoutRefs.current.push(tNext);
    };

    playNextRound();
  };

  const handleSkipAnimation = () => {
    if (!pendingOutcome) return;
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    setIsAnimating(false);
    setAttackingSide(null);
    setActiveHitFlash(null);
    setFloatingDamageTexts([]);
    
    setAnimatedPlayerHp(pendingOutcome.playerHp || 0);
    setAnimatedEnemyHp(0);

    setCombatOutcome(pendingOutcome);
    if (pendingOutcome.isVictory) {
      showStatus('Battle Victory! Loot rewards transferred to your inventory.', true);
      triggerConfetti();
    } else {
      showStatus('Defeat! You were knocked out. Buy bread to recover health.', false);
    }
    setPendingOutcome(null);
    refreshData();
  };

  const handlePvEBattleStart = async (enemyId: number) => {
    if (actionLoading || isAnimating) return;
    setError(null);
    setSuccessMsg(null);
    setCombatOutcome(null);

    const enemy = enemyTemplates.find(e => e.id === enemyId);
    if (!enemy) return;

    if (stats && stats.health <= 10) {
      showStatus('Your health is too low to enter the battle arena! Consume bread to heal.', false);
      return;
    }

    const res = await executePvEBattle(enemyId);
    if (res.success) {
      const logs = res.roundsLog || [];
      const isVictory = res.isVictory || false;
      const xpGained = res.xpGained || 0;
      const currencyGained = res.currencyGained || 0;
      const lootGained: LootItem[] = res.lootGained || [];
      const finalPlayerHp = res.playerHp;

      const finalOutcome = {
        isVictory,
        xpGained,
        currencyGained,
        roundsLog: logs,
        lootGained,
        playerHp: finalPlayerHp
      };

      setPendingOutcome(finalOutcome);
      setArenaEnemyName(enemy.name);
      setMaxPlayerHp(stats?.health || 100);
      setMaxEnemyHp(enemy.health);
      setAnimatedPlayerHp(stats?.health || 100);
      setAnimatedEnemyHp(enemy.health);
      setIsAnimating(true);
      setCurrentRoundIndex(0);

      animateRounds(logs, finalOutcome, stats?.health || 100, enemy.health, enemy.name);
    } else {
      showStatus(res.error || 'Battle failed to initialize.', false);
    }
  };

  const handleTrain = async () => {
    if (actionLoading || isAnimating) return;
    setError(null);
    setSuccessMsg(null);
    
    if (stats && stats.energy < 10) {
      showStatus('Insufficient Energy! Train requires 10 EP.', false);
      return;
    }

    const res = await train();
    if (res.success) {
      showStatus(`Military drill completed! Strength gained: +0.10, EXP gained: +10!`, true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to train.', false);
    }
  };

  const showStatus = (text: string, ok: boolean) => {
    if (ok) {
      setSuccessMsg(text);
      setError(null);
    } else {
      setError(text);
      setSuccessMsg(null);
    }
  };

  const selectedEnemy = enemyTemplates.find(e => e.id === selectedEnemyId) || enemyTemplates[0];

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Dynamic Alerts */}
      {error && (
        <div className="px-4 py-3 border-l-4 border-red-600 bg-red-950/30 text-red-400 text-xs font-bold font-display uppercase tracking-widest flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="px-4 py-3 border-l-4 border-game-emerald bg-emerald-950/30 text-emerald-400 text-xs font-bold font-display uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <Swords className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Combat Arena
            </h2>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">
              Enter localized battles against monsters, or complete military drills to gain Strength.
            </p>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-zinc-950 p-1 border border-zinc-800 relative z-10">
          <button
            onClick={() => { setActiveTab('pve'); setCombatOutcome(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold font-display uppercase tracking-widest transition-all ${
              activeTab === 'pve' ? 'bg-game-gold/20 text-game-gold border border-game-gold/30' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Swords className="h-3.5 w-3.5" />
            Monster Arena
          </button>
          <button
            onClick={() => { setActiveTab('train'); setCombatOutcome(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold font-display uppercase tracking-widest transition-all ${
              activeTab === 'train' ? 'bg-game-gold/20 text-game-gold border border-game-gold/30' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            Train Strength
          </button>
          <button
            onClick={() => { setActiveTab('rankings'); setCombatOutcome(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold font-display uppercase tracking-widest transition-all ${
              activeTab === 'rankings' ? 'bg-game-gold/20 text-game-gold border border-game-gold/30' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            Rankings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Left Column: Target Selector or drills details */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {activeTab === 'pve' && (
            <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 relative shadow-lg">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Target Monsters</span>
              <div className="flex flex-col gap-2">
                {enemyTemplates.map(enemy => (
                  <button
                    key={enemy.id}
                    onClick={() => {
                      if (!isAnimating) setSelectedEnemyId(enemy.id);
                    }}
                    className={`p-3 flex justify-between items-center text-xs border transition-all text-left ${
                      selectedEnemyId === enemy.id 
                        ? 'border-game-gold bg-game-gold/5 text-game-gold font-bold' 
                        : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:border-zinc-800'
                    }`}
                  >
                    <div>
                      <p className="font-display text-sm">{enemy.name}</p>
                      <p className="text-[9px] text-zinc-500 font-pixel mt-0.5">Health: {enemy.health} HP | Atk: {enemy.attack}</p>
                    </div>
                    <span className="text-[10px] font-pixel text-zinc-500 border border-zinc-850 px-1 capitalize">{enemy.difficulty}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'train' && (
            <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 relative shadow-lg">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Commander Strength</span>
              <div className="bg-zinc-950 p-4 border border-zinc-900 flex flex-col gap-2 text-center text-xs">
                <span className="text-zinc-500">Active Strength Modifier:</span>
                <span className="text-2xl font-bold font-pixel text-game-gold">{(stats?.strength || 10).toFixed(2)}</span>
                <p className="text-[10px] text-zinc-550 leading-relaxed font-serif mt-1">Completing physical drills boosts your military modifiers, enhancing all combat damages.</p>
              </div>
            </div>
          )}

          {/* Stats Summary Panel */}
          <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 relative shadow-lg">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Health reserves</span>
            <div className="flex justify-between items-center bg-zinc-950 p-3 border border-zinc-900">
              <span className="text-xs text-zinc-400 flex items-center gap-1.5"><Heart className="h-4 w-4 text-rose-500" /> Vital HP</span>
              <span className="text-sm font-pixel font-bold text-rose-500">{stats?.health} / {stats?.max_health} HP</span>
            </div>
          </div>
        </div>

        {/* Central Display */}
        <div className="lg:col-span-3">
          
          {/* PVE ARENA */}
          {activeTab === 'pve' && (
            <div className="flex flex-col gap-6">
              
              {/* Animation Arena */}
              {isAnimating && (
                <div className="rpg-panel-stone p-6 rounded-none flex flex-col items-center justify-between min-h-[300px] bg-zinc-950 relative overflow-hidden shadow-2xl">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />
                  
                  {/* Skip button at top */}
                  <div className="w-full flex justify-end relative z-30">
                    <button
                      onClick={handleSkipAnimation}
                      className="rpg-button px-4 py-1 text-[9px] tracking-widest font-bold uppercase text-game-gold border border-game-gold"
                    >
                      Instant Finish
                    </button>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-4 flex-1 items-center relative z-20">
                    {/* Player Side */}
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className={`h-16 w-16 border-2 rounded-none flex items-center justify-center font-display font-black text-2xl relative transition-all ${
                        activeHitFlash === 'player' ? 'border-red-500 bg-red-950/40 text-red-500' : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      } ${attackingSide === 'player' ? 'translate-x-6' : ''}`}>
                        {profile?.username[0].toUpperCase()}
                        
                        {/* Floating damage text */}
                        {floatingDamageTexts.filter(t => t.target === 'player').map(t => (
                          <span key={t.id} className="absolute -top-4 font-pixel font-bold text-lg text-red-500 animate-bounce">{t.text}</span>
                        ))}
                      </div>
                      <div className="w-full max-w-[120px] flex flex-col gap-1 items-center">
                        <span className="text-[10px] font-bold text-zinc-300 font-display truncate max-w-full">{profile?.username}</span>
                        <div className="w-full bg-zinc-900 border border-zinc-850 h-2">
                          <div className="bg-rose-600 h-full transition-all duration-150" style={{ width: `${(animatedPlayerHp / maxPlayerHp) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-pixel text-rose-500">{animatedPlayerHp} / {maxPlayerHp} HP</span>
                      </div>
                    </div>

                    {/* Enemy Side */}
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className={`h-16 w-16 border-2 rounded-none flex items-center justify-center font-display font-black text-2xl relative transition-all ${
                        activeHitFlash === 'enemy' ? 'border-red-500 bg-red-950/40 text-red-500' : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      } ${attackingSide === 'enemy' ? '-translate-x-6' : ''}`}>
                        👾
                        
                        {/* Floating damage text */}
                        {floatingDamageTexts.filter(t => t.target === 'enemy').map(t => (
                          <span key={t.id} className="absolute -top-4 font-pixel font-bold text-lg text-red-500 animate-bounce">{t.text}</span>
                        ))}
                      </div>
                      <div className="w-full max-w-[120px] flex flex-col gap-1 items-center">
                        <span className="text-[10px] font-bold text-zinc-300 font-display truncate max-w-full">{arenaEnemyName}</span>
                        <div className="w-full bg-zinc-900 border border-zinc-850 h-2">
                          <div className="bg-rose-600 h-full transition-all duration-150" style={{ width: `${(animatedEnemyHp / maxEnemyHp) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-pixel text-rose-500">{animatedEnemyHp} / {maxEnemyHp} HP</span>
                      </div>
                    </div>
                  </div>

                  {/* Clash round status */}
                  <div className="text-[9px] font-display uppercase tracking-widest text-zinc-550 border-t border-zinc-900 w-full text-center pt-3 relative z-20">
                    Round {currentRoundIndex + 1} Logged
                  </div>
                </div>
              )}

              {/* Combat Results & Fight Action */}
              {!isAnimating && (
                <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative min-h-[300px]">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />

                  {combatOutcome ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                        <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold font-display tracking-widest ${
                          combatOutcome.isVictory ? 'border-game-emerald bg-emerald-950/20 text-emerald-400' : 'border-red-900 bg-red-950/20 text-red-500'
                        }`}>
                          {combatOutcome.isVictory ? 'Victory' : 'Defeat'}
                        </span>
                        <h3 className="font-bold text-zinc-300 text-sm font-display">Clash Arena Resolved</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-950 border border-zinc-900 p-4 flex flex-col items-center">
                          <span className="text-[8px] text-zinc-500 font-display uppercase tracking-widest">EXP Earned</span>
                          <span className="text-base font-pixel font-bold text-game-gold mt-1">+{combatOutcome.xpGained} EXP</span>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-900 p-4 flex flex-col items-center">
                          <span className="text-[8px] text-zinc-500 font-display uppercase tracking-widest">Wages Earned</span>
                          <span className="text-base font-pixel font-bold text-game-emerald mt-1">+{combatOutcome.currencyGained} LC</span>
                        </div>
                      </div>

                      {combatOutcome.lootGained && combatOutcome.lootGained.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                          <h4 className="text-[9px] text-zinc-500 font-display uppercase tracking-widest font-bold">Acquired Materials</h4>
                          <div className="flex flex-wrap gap-2">
                            {combatOutcome.lootGained.map((item, idx) => (
                              <div key={idx} className="bg-zinc-950 border border-zinc-850 p-2 flex items-center gap-2 text-xs">
                                <ShoppingBag className="h-4 w-4 text-game-gold-dark" />
                                <span className="font-bold text-zinc-200">+{item.quantity} {item.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => setCombatOutcome(null)}
                          className="rpg-button px-5 py-2 text-[10px] tracking-widest uppercase font-bold"
                        >
                          Clear Rewards
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between flex-1 gap-6">
                      <div className="flex flex-col gap-3">
                        <h3 className="font-bold text-sm text-zinc-300 font-display">Target Details: {selectedEnemy.name}</h3>
                        <p className="text-xs text-zinc-500 font-serif leading-relaxed">
                          "This creature resides in Sector coordinate zones. Engaging it costs 0 energy but consumes vital HP during combat cycles."
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="bg-zinc-950 border border-zinc-900 p-3.5 flex justify-between items-center text-xs">
                            <span className="text-zinc-500">Monster Difficulty:</span>
                            <span className="font-bold text-rose-500 font-display capitalize">{selectedEnemy.difficulty}</span>
                          </div>
                          <div className="bg-zinc-950 border border-zinc-900 p-3.5 flex justify-between items-center text-xs">
                            <span className="text-zinc-500">Estimated HP:</span>
                            <span className="font-bold text-zinc-300 font-pixel text-sm">{selectedEnemy.health} HP</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePvEBattleStart(selectedEnemyId)}
                        disabled={actionLoading}
                        className="rpg-button rpg-button-crimson w-full py-3 text-[10px] tracking-widest font-black uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(153,27,27,0.15)] mt-auto"
                      >
                        <Swords className="h-4 w-4" />
                        <span>INITIALIZE COMBAT CYCLE</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TRAINING PANEL */}
          {activeTab === 'train' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative min-h-[300px]">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 flex items-center gap-1">
                <Dumbbell className="h-4 w-4" />
                <span>Physical Drills Center</span>
              </h3>

              <p className="text-zinc-500 text-xs font-serif leading-relaxed mt-1">
                Train physical exercises to boost your combat base modifiers. Spending energy on physical drills is required to increase your base Strength over time.
              </p>

              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="bg-zinc-950 border border-zinc-900 p-3 text-center">
                  <span className="text-[8px] text-zinc-500 font-display uppercase tracking-widest block">Cost</span>
                  <span className="text-xs font-pixel font-bold text-red-500 mt-1 block">10 Energy</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-900 p-3 text-center">
                  <span className="text-[8px] text-zinc-500 font-display uppercase tracking-widest block">Strength Gain</span>
                  <span className="text-xs font-pixel font-bold text-game-gold mt-1 block">+0.1 Strength</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-900 p-3 text-center">
                  <span className="text-[8px] text-zinc-500 font-display uppercase tracking-widest block">EXP Gain</span>
                  <span className="text-xs font-pixel font-bold text-zinc-300 mt-1 block">+10 EXP</span>
                </div>
              </div>

              <button
                onClick={handleTrain}
                disabled={actionLoading}
                className="rpg-button w-full py-3 text-[10px] tracking-widest font-black uppercase flex items-center justify-center gap-2 mt-auto"
              >
                <Dumbbell className="h-4 w-4" />
                <span>EXECUTE TRAINING DRILL</span>
              </button>
            </div>
          )}

          {/* LEADERBOARDS PANEL */}
          {activeTab === 'rankings' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative min-h-[300px]">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3">Combat Rankings</h3>

              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500">
                      {['Rank', 'Commander', 'PvP Rating', 'Strength'].map((h, i) => (
                        <th key={i} className="pb-2 text-[9px] uppercase font-display tracking-widest font-bold pr-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {combatRankings.map((r, i) => (
                      <tr key={i} className="hover:bg-zinc-950/20 text-zinc-300">
                        <td className="py-2.5 font-pixel font-bold text-game-gold text-sm">#{i + 1}</td>
                        <td className="py-2.5 font-bold">{r.username}</td>
                        <td className="py-2.5 font-pixel font-bold text-game-emerald text-sm">{r.pvp_rating || 0} PvP</td>
                        <td className="py-2.5 font-pixel text-zinc-400 text-sm">{(r.strength || 10).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
