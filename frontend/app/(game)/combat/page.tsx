'use client';

import { useGameContext } from '../layout';
import { useState } from 'react';
import { 
  Swords, Shield, Trophy, Activity, Heart, Award, Sparkles, AlertCircle, ShoppingBag, Zap 
} from 'lucide-react';

export default function CombatPage() {
  const {
    profile,
    stats,
    inventory,
    equipment,
    enemyTemplates,
    combatRankings,
    battles,
    countries,
    regions,
    executePvEBattle,
    executePvPBattle,
    consumeItem,
    train,
    fight,
    actionLoading,
    refreshData,
    isOnline
  } = useGameContext();

  const [activeTab, setActiveTab] = useState<'pve' | 'pvp' | 'training' | 'war' | 'rankings'>('pve');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Combat Outcome States
  const [combatOutcome, setCombatOutcome] = useState<{
    isVictory: boolean;
    xpGained?: number;
    currencyGained?: number;
    roundsLog?: any[];
    lootGained?: any[];
    playerHp?: number;
    ratingChange?: number;
  } | null>(null);

  // Helper mapping for item templates on client
  const getItemTemplateDetails = (templateId: number) => {
    switch (templateId) {
      case 1:
        return { name: 'Wheat Bread', category: 'Food', icon: '🍞' };
      case 2:
        return { name: 'Iron Sword', category: 'Weapon', icon: '⚔️' };
      case 3:
        return { name: 'Travel Ticket', category: 'Ticket', icon: '🎫' };
      case 4:
        return { name: 'Iron Plate Helm', category: 'Helmet', icon: '🪖' };
      case 5:
        return { name: 'Iron Plate Chest', category: 'Armor', icon: '👕' };
      case 6:
        return { name: 'Leather Boots', category: 'Boots', icon: '🥾' };
      case 7:
        return { name: 'Steel Pickaxe', category: 'Tool', icon: '⛏️' };
      default:
        return { name: `Item #${templateId}`, category: 'Quest', icon: '📦' };
    }
  };

  // Resolve equipped items detail
  const getEquippedDetail = (slotId: string) => {
    if (!equipment) return null;
    const invId = (equipment as any)[slotId];
    if (!invId) return null;
    return inventory.find((i) => i.id === invId);
  };

  const equippedWeapon = getEquippedDetail('weapon_id');
  const equippedHelm = getEquippedDetail('helmet_id');
  const equippedChest = getEquippedDetail('chest_id');
  const equippedBoots = getEquippedDetail('boots_id');

  // Quick Consumables (Bread, Water, Medicine)
  const consumables = inventory.filter((item) => {
    const details = getItemTemplateDetails(item.item_template_id);
    return ['Food', 'Drink', 'Medicine'].includes(details.category) && item.quantity > 0;
  });

  const handleConsume = async (itemId: string, name: string) => {
    setError(null);
    setSuccessMsg(null);
    const res = await consumeItem(itemId);
    if (res.success) {
      setSuccessMsg(`Consumed ${name}. Restored energy/health.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setError(res.error || 'Failed to consume item.');
    }
  };

  const handlePvEFight = async (enemyId: number) => {
    setError(null);
    setSuccessMsg(null);
    setCombatOutcome(null);

    const res = await executePvEBattle(enemyId);
    if (res.success) {
      setCombatOutcome({
        isVictory: res.isVictory || false,
        xpGained: res.xpGained,
        currencyGained: res.currencyGained,
        roundsLog: res.roundsLog,
        lootGained: res.lootGained,
        playerHp: res.playerHp
      });
      if (res.isVictory) {
        setSuccessMsg('Battle Victory! Loot rewards transferred to your inventory.');
      } else {
        setError('Defeat! You were knocked out. Use medicine or food to recover health.');
      }
    } else {
      setError(res.error || 'Failed to initiate fight.');
    }
  };

  const handlePvPDuel = async (opponentId: string, username: string) => {
    setError(null);
    setSuccessMsg(null);
    setCombatOutcome(null);

    const res = await executePvPBattle(opponentId);
    if (res.success) {
      setCombatOutcome({
        isVictory: res.isVictory || false,
        roundsLog: res.roundsLog,
        ratingChange: res.ratingChange,
        playerHp: res.playerHp
      });
      if (res.isVictory) {
        setSuccessMsg(`Duel Won! Defeated ${username} in ranked arena (+${res.ratingChange} rating).`);
      } else {
        setError(`Duel Lost! Defeated by ${username} (-${Math.abs(res.ratingChange || 0)} rating).`);
      }
    } else {
      setError(res.error || 'Failed to start PvP duel.');
    }
  };

  const handleTrainStrength = async () => {
    setError(null);
    setSuccessMsg(null);
    setCombatOutcome(null);

    const res = await train();
    if (res.success) {
      setSuccessMsg(`Training complete! Gained ${res.strengthGained} Strength and ${res.expGained} EXP.`);
      refreshData();
    } else {
      setError(res.error || 'Failed to complete training session.');
    }
  };

  const handleFightInBattle = async (battleId: string, sideCountryId: number) => {
    setError(null);
    setSuccessMsg(null);
    setCombatOutcome(null);

    const res = await fight(battleId, sideCountryId);
    if (res.success) {
      setSuccessMsg(`Fought in battle! Dealt ${res.damageDealt} damage and gained ${res.xpGained} EXP.`);
      refreshData();
    } else {
      setError(res.error || 'Failed to fight in battle.');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Notifications */}
      {error && (
        <div className="rpg-panel-stone border-red-900/60 text-red-400 p-4 flex gap-3 items-center text-sm rounded-none relative shadow-md">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="rpg-panel-stone border-game-gold/40 text-game-emerald p-4 flex gap-3 items-center text-sm rounded-none relative shadow-md">
          <Sparkles className="h-5 w-5 shrink-0 text-game-gold-dark animate-pulse" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Status & Equipment vs Combat Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Character Sheet & Equipment */}
        <div className="flex flex-col gap-6">
          
          {/* Health & Energy Status */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 relative shadow-md border-none">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest relative z-10">Vitals Monitor</span>
            
            <div className="flex flex-col gap-3 relative z-10">
              {/* HP Bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-display uppercase tracking-wider font-bold">
                  <span className="text-zinc-400 flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-rose-500 shrink-0" /> Health Points</span>
                  <span className="text-white font-pixel">{stats?.health || 0} / {stats?.max_health || 100} HP</span>
                </div>
                <div className="h-3 w-full bg-zinc-950 border border-game-gold/15 p-[0.5px]">
                  <div 
                    className="bg-rose-600 h-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, ((stats?.health || 0) / (stats?.max_health || 100)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Energy Bar */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex justify-between text-[11px] font-display uppercase tracking-wider font-bold">
                  <span className="text-zinc-400 flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Tactical Energy</span>
                  <span className="text-white font-pixel">{stats?.energy || 0} / 100 EP</span>
                </div>
                <div className="h-3 w-full bg-zinc-950 border border-game-gold/15 p-[0.5px]">
                  <div 
                    className="bg-amber-555 bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-300"
                    style={{ width: `${stats?.energy || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Sheet */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-3 relative shadow-md border-none">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest border-b border-zinc-900 pb-2 relative z-10">Offensive & Defensive Specs</span>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-400 mt-1 relative z-10">
              <div className="p-3 bg-zinc-950 border border-zinc-900 flex flex-col">
                <span className="text-[9px] text-zinc-550 font-display uppercase tracking-wider">Attack Power</span>
                <span className="text-lg font-bold font-pixel text-white mt-1 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                  {10 + Math.floor((stats?.strength || 1) * 1.5) + (equippedWeapon ? 20 : 0)}
                </span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900 flex flex-col">
                <span className="text-[9px] text-zinc-550 font-display uppercase tracking-wider">Physical Defense</span>
                <span className="text-lg font-bold font-pixel text-white mt-1 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                  {5 + (equippedHelm ? 8 : 0) + (equippedChest ? 25 : 0)}
                </span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900 flex flex-col">
                <span className="text-[9px] text-zinc-550 font-display uppercase tracking-wider">PvP Elo Rating</span>
                <span className="text-lg font-bold font-pixel text-game-gold mt-1 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">{stats?.pvp_rating || 1000}</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900 flex flex-col">
                <span className="text-[9px] text-zinc-550 font-display uppercase tracking-wider">Combat Level</span>
                <span className="text-lg font-bold font-pixel text-indigo-400 mt-1 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">Lvl {stats?.level_pve || 1}</span>
              </div>
            </div>
          </div>

          {/* Equipment Slots Grid */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 relative shadow-md border-none">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest relative z-10">Active Gear Slots</span>
            
            <div className="flex flex-col gap-3 relative z-10">
              {[
                { label: 'Weapon', item: equippedWeapon, slot: 'weapon_id' },
                { label: 'Helmet', item: equippedHelm, slot: 'helmet_id' },
                { label: 'Chestplate', item: equippedChest, slot: 'chest_id' },
                { label: 'Boots', item: equippedBoots, slot: 'boots_id' }
              ].map((slot) => {
                const details = slot.item ? getItemTemplateDetails(slot.item.item_template_id) : null;
                return (
                  <div key={slot.label} className="p-3.5 bg-zinc-950 border border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 border border-game-gold/25 bg-game-wood/40 text-game-gold text-xs font-pixel font-bold select-none shrink-0 shadow-inner">
                        {details ? details.icon : slot.label[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-200 font-display tracking-wide uppercase">{details ? details.name : `Empty ${slot.label}`}</span>
                        <span className="text-[9px] text-zinc-550 font-pixel mt-0.5">
                          {slot.item ? `Quality Q${slot.item.quality}` : 'No active gear attributes'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Healing & Consumables */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 relative shadow-md border-none">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest relative z-10">Consumables Stock</span>
            
            <div className="flex flex-col gap-2 relative z-10">
              {consumables.length === 0 ? (
                <p className="text-xs text-zinc-550 font-serif italic py-2">No food or medicine in backpack.</p>
              ) : (
                consumables.map((item) => {
                  const details = getItemTemplateDetails(item.item_template_id);
                  return (
                    <div key={item.id} className="p-3 bg-zinc-950 border border-zinc-900 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-200 font-display tracking-wider">{details.icon} {details.name}</span>
                        <span className="text-[9px] text-zinc-500 font-pixel mt-0.5">Quantity: x{item.quantity}</span>
                      </div>
                      <button
                        onClick={() => handleConsume(item.id, details.name || 'Consumable')}
                        disabled={actionLoading}
                        className="rpg-button px-3 py-1 text-[9px] font-display uppercase tracking-wider select-none border border-game-gold"
                      >
                        Eat / Use
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Tabbed Interface for battles and scoreboards */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Navigation tabs */}
          <div className="flex border-b-2 border-game-gold/30 bg-zinc-950/40 p-0.5 shadow-inner overflow-x-auto max-w-full">
            {[
              { id: 'pve', label: 'PvE Campaign', icon: Swords },
              { id: 'pvp', label: 'Ranked PvP Arena', icon: Trophy },
              { id: 'training', label: 'Training Grounds', icon: Zap },
              { id: 'war', label: 'Regional Wars', icon: Shield },
              { id: 'rankings', label: 'Scoreboard Rankings', icon: Award }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setCombatOutcome(null);
                  }}
                  className={`px-4 py-2.5 text-[10px] font-bold font-display uppercase tracking-widest transition-all text-center border-t-2 border-l-2 border-r-2 flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-game-wood border-game-gold text-game-gold shadow-[0_-2px_5px_rgba(229,193,88,0.1)] translate-y-[2px]'
                      : 'bg-zinc-950/20 border-transparent text-zinc-500 hover:text-game-gold'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-game-gold" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* PvE Tab */}
          {activeTab === 'pve' && (
            <div className="flex flex-col gap-6">
              
              {/* Encounter Selection */}
              <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 relative shadow-md border-none">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest relative z-10">Select Target Anomaly</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {enemyTemplates.map((enemy) => {
                    const reqEnergy = 10;
                    const canFight = (stats?.energy || 0) >= reqEnergy && (stats?.health || 0) > 0;
                    
                    return (
                      <div key={enemy.id} className="p-4 bg-zinc-950 border border-zinc-900 flex flex-col justify-between gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-205 font-display uppercase tracking-wide">{enemy.name}</span>
                            <span className="text-[10px] text-zinc-550 font-serif mt-1">Difficulty: {enemy.difficulty.toUpperCase()}</span>
                          </div>
                          <span className={`px-2 py-0.5 border text-[8px] font-bold font-display uppercase tracking-widest ${enemy.difficulty === 'boss' ? 'bg-red-950/20 border-red-900/30 text-rose-400 animate-pulse' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                            {enemy.difficulty}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-500 border-t border-zinc-900 pt-3 mt-1 font-display uppercase tracking-wider">
                          <div className="flex flex-col">
                            <span>Health</span>
                            <span className="text-zinc-300 font-pixel font-bold text-xs mt-0.5">{enemy.health} HP</span>
                          </div>
                          <div className="flex flex-col">
                            <span>Attack</span>
                            <span className="text-zinc-300 font-pixel font-bold text-xs mt-0.5">{enemy.attack} ATK</span>
                          </div>
                          <div className="flex flex-col">
                            <span>Speed</span>
                            <span className="text-zinc-300 font-pixel font-bold text-xs mt-0.5">{enemy.speed} SPD</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handlePvEFight(enemy.id)}
                          disabled={actionLoading || !canFight}
                          className="w-full flex items-center justify-center gap-1.5 h-10 rpg-button rpg-button-crimson text-xs font-display uppercase tracking-widest select-none disabled:opacity-40"
                        >
                          <Swords className="h-4.5 w-4.5 shrink-0" />
                          <span>Engage Fight (-10 EP)</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PvP Tab */}
          {activeTab === 'pvp' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 relative shadow-md border-none">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest border-b border-zinc-900 pb-3 relative z-10">Arena Lobby Matchmaking</span>
              
              <div className="flex flex-col gap-3 relative z-10">
                {combatRankings.map((player) => {
                  const reqEnergy = 10;
                  const canFight = (stats?.energy || 0) >= reqEnergy && (stats?.health || 0) > 0;
                  
                  return (
                    <div key={player.profile_id} className="p-4.5 bg-zinc-950 border border-zinc-900 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-game-wood/40 border border-game-gold/20 text-game-gold font-pixel font-bold text-xs">
                          {player.pvp_rating}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-200 font-display tracking-wider uppercase text-left">{player.username}</span>
                          <span className="text-[10px] text-zinc-500 font-pixel mt-1 text-left">Lvl: {player.level_pve} • Strength: {player.strength.toFixed(1)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePvPDuel(player.profile_id, player.username)}
                        disabled={actionLoading || !canFight}
                        className="flex items-center gap-1.5 px-4 py-2 rpg-button rpg-button-crimson text-xs font-display uppercase tracking-widest select-none disabled:opacity-40"
                      >
                        <Swords className="h-4 w-4 shrink-0" />
                        <span>Duel Arena</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rankings Tab - Redesigned as handwritten scroll page */}
          {activeTab === 'rankings' && (
            <div className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-4 text-left border-2 shadow-2xl h-full">
              <div className="border-b border-amber-955/20 pb-3 flex items-center justify-between font-display">
                <h3 className="text-sm font-bold text-amber-950 uppercase tracking-widest">Lobby Leaderboard</h3>
                <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Arena Champions</span>
              </div>

              <div className="overflow-x-auto relative">
                <table className="w-full text-xs text-amber-950">
                  <thead>
                    <tr className="border-b-2 border-amber-955/25 text-amber-900/60 font-bold text-[9px] uppercase font-display tracking-wider">
                      <th className="py-2.5 text-left">Username</th>
                      <th className="py-2.5 text-center">Elo Rating</th>
                      <th className="py-2.5 text-center">PvE Level</th>
                      <th className="py-2.5 text-center">Kills</th>
                      <th className="py-2.5 text-center">Deaths</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combatRankings.map((player) => (
                      <tr key={player.profile_id} className="border-b border-amber-950/10 hover:bg-amber-950/5">
                        <td className="py-3 font-semibold font-serif text-amber-950 uppercase text-left">{player.username}</td>
                        <td className="py-3 text-center text-amber-900 font-bold font-pixel text-sm">{player.pvp_rating}</td>
                        <td className="py-3 text-center font-bold text-indigo-900 font-pixel text-sm">Lvl {player.level_pve}</td>
                        <td className="py-3 text-center text-emerald-850 font-bold font-pixel text-sm">+{player.kills}</td>
                        <td className="py-3 text-center text-rose-800 font-bold font-pixel text-sm">-{player.deaths}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Training Grounds Tab */}
          {activeTab === 'training' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-6 relative shadow-md border-none">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <div className="border-b border-zinc-900 pb-3 flex items-center justify-between z-10 relative">
                <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Training Grounds</span>
                <span className="text-[10px] text-zinc-550 font-pixel">Cost: 10 EP / Session</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10 relative">
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-zinc-950 border border-zinc-900 flex flex-col gap-3">
                    <span className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Physical Training Room</span>
                    <p className="text-xs text-zinc-300 font-serif leading-relaxed">
                      Push your limits to increase your base physical power. Higher strength directly amplifies the damage and influence you contribute in regional warfare.
                    </p>
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-550 font-display uppercase">Current Strength:</span>
                        <span className="text-white font-pixel font-bold text-sm">{(stats?.strength || 1.0).toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-550 font-display uppercase">Training Rewards:</span>
                        <span className="text-game-emerald font-display uppercase font-bold text-[10px] tracking-wider">+0.1000 STR & +10 EXP</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleTrainStrength}
                    disabled={actionLoading || (stats?.energy || 0) < 10}
                    className="w-full flex items-center justify-center gap-2 h-12 rpg-button text-sm font-display uppercase tracking-widest select-none disabled:opacity-40"
                  >
                    <Zap className="h-5 w-5 text-game-gold animate-pulse shrink-0" />
                    <span>Train Physical Strength (-10 EP)</span>
                  </button>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-900 flex flex-col justify-center items-center text-center gap-4">
                  <div className="h-20 w-20 rounded-none border border-game-gold/30 bg-game-wood/40 flex items-center justify-center text-game-gold text-3xl font-pixel shadow-inner select-none animate-pulse">
                    🏋️
                  </div>
                  <div className="flex flex-col gap-1 text-center">
                    <span className="text-xs font-bold text-zinc-200 font-display uppercase tracking-wider">Workout Log</span>
                    <span className="text-[10px] text-zinc-500 font-serif">
                      Last session: {stats?.last_train_at ? new Date(stats.last_train_at).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regional Wars Tab */}
          {activeTab === 'war' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-6 relative shadow-md border-none">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <div className="border-b border-zinc-900 pb-3 flex items-center justify-between z-10 relative">
                <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Active Geopolitical Wars</span>
                <span className="text-[10px] text-zinc-500 font-pixel">Stationed Region: {regions.find(r => r.id === profile?.current_region_id)?.name || 'Unknown'}</span>
              </div>

              <div className="flex flex-col gap-6 z-10 relative">
                {battles.length === 0 ? (
                  <p className="text-xs text-zinc-555 font-serif italic py-4">No active regional warfare campaigns at this time.</p>
                ) : (
                  battles.map((battle) => {
                    const attackerName = countries.find(c => c.id === battle.attacker_country_id)?.name || `Country #${battle.attacker_country_id}`;
                    const defenderName = countries.find(c => c.id === battle.defender_country_id)?.name || `Country #${battle.defender_country_id}`;
                    const battleRegionName = regions.find(r => r.id === battle.region_id)?.name || `Region #${battle.region_id}`;
                    
                    const isSameRegion = profile?.current_region_id === battle.region_id;
                    const canFight = (stats?.energy || 0) >= 10 && isSameRegion;

                    const totalScore = Number(battle.attacker_score) + Number(battle.defender_score);
                    const attackerPct = totalScore > 0 ? (Number(battle.attacker_score) / totalScore) * 100 : 50;
                    const defenderPct = totalScore > 0 ? (Number(battle.defender_score) / totalScore) * 100 : 50;

                    return (
                      <div key={battle.id} className="p-5 bg-zinc-950 border border-zinc-900 flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-900 pb-3">
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] text-rose-500 font-pixel font-bold">CONFLICT ID: #{battle.id.slice(0, 8).toUpperCase()}</span>
                            <h4 className="text-sm font-bold text-zinc-200 font-display uppercase mt-1 tracking-wide">
                              {attackerName} VS {defenderName}
                            </h4>
                            <span className="text-[10px] text-zinc-500 font-serif mt-0.5">Campaign Battleground: {battleRegionName}</span>
                          </div>
                          
                          <span className="px-2 py-0.5 border text-[8px] font-bold font-display uppercase tracking-widest bg-red-950/20 border-red-900/30 text-rose-400 mt-2 md:mt-0 animate-pulse">
                            ACTIVE WAR
                          </span>
                        </div>

                        {/* Score Wall / Battle Progress */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-[11px] font-display uppercase tracking-wider font-bold">
                            <span className="text-zinc-400">{attackerName} ({Number(battle.attacker_score).toLocaleString()} PTS)</span>
                            <span className="text-zinc-400">{defenderName} ({Number(battle.defender_score).toLocaleString()} PTS)</span>
                          </div>
                          
                          {/* Progress bar split */}
                          <div className="h-4 w-full bg-zinc-950 border border-game-gold/15 p-[0.5px] flex">
                            <div 
                              className="bg-rose-700 h-full transition-all duration-500"
                              style={{ width: `${attackerPct}%` }}
                            />
                            <div 
                              className="bg-blue-700 h-full transition-all duration-500"
                              style={{ width: `${defenderPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Fight Buttons & Alerts */}
                        <div className="flex flex-col gap-3 mt-1">
                          {!isSameRegion ? (
                            <div className="p-3 bg-zinc-900/50 border border-zinc-800 text-[10px] text-amber-500 flex gap-2 items-center font-serif leading-relaxed text-left">
                              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-500" />
                              <span>
                                You are stationed in <strong>{regions.find(r => r.id === profile?.current_region_id)?.name || 'Unknown'}</strong>. 
                                Travel to <strong>{battleRegionName}</strong> to join this battle.
                              </span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <button
                                onClick={() => handleFightInBattle(battle.id, battle.attacker_country_id)}
                                disabled={actionLoading || !canFight}
                                className="flex items-center justify-center gap-1.5 h-10 rpg-button rpg-button-crimson text-xs font-display uppercase tracking-widest select-none disabled:opacity-40"
                              >
                                <Swords className="h-4 w-4 shrink-0" />
                                <span>Support Attacker (-10 EP)</span>
                              </button>
                              <button
                                onClick={() => handleFightInBattle(battle.id, battle.defender_country_id)}
                                disabled={actionLoading || !canFight}
                                className="flex items-center justify-center gap-1.5 h-10 rpg-button text-xs font-display uppercase tracking-widest select-none disabled:opacity-40"
                              >
                                <Shield className="h-4 w-4 shrink-0 text-game-gold" />
                                <span>Support Defender (-10 EP)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Combat simulation round logs viewer - Redesigned as aged battle manuscript scroll */}
          {combatOutcome && (
            <div className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-4 border-2 text-left shadow-2xl animate-card-slide">
              <h3 className="text-sm font-bold text-amber-950 uppercase tracking-widest border-b border-amber-950/20 pb-3 flex items-center gap-2 font-display">
                <Activity className="h-4.5 w-4.5 text-rose-800" />
                <span>Simulation Activity Logs</span>
              </h3>

              {/* Loot Window */}
              {combatOutcome.lootGained && combatOutcome.lootGained.length > 0 && (
                <div className="p-4 bg-amber-950/5 border border-emerald-950/20 flex flex-col gap-2">
                  <span className="text-[10px] text-emerald-800 font-display font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-emerald-800 shrink-0" /> Loot Acquired
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {combatOutcome.lootGained.map((loot, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-amber-955/10 border border-amber-950/20 text-[11px] text-amber-950 font-serif font-semibold">
                        {loot.name} (x{loot.quantity})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Turn Logs */}
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 mt-2 font-serif text-[11px] text-amber-900/80 leading-relaxed">
                {combatOutcome.roundsLog?.map((round, idx) => (
                  <div key={idx} className="p-2.5 border-b border-amber-950/10 flex items-start gap-3">
                    <span className="text-amber-900/40 font-bold font-pixel tracking-wider shrink-0 mt-0.5">R{round.round}</span>
                    <div className="flex-1 text-left">
                      <span className="text-amber-955 font-bold font-display uppercase text-[10px] tracking-wide">{round.attacker}</span> attacked <span className="text-amber-955 font-bold font-display uppercase text-[10px] tracking-wide">{round.defender}</span>, doing <span className={`font-black font-display uppercase text-[10px] ${round.action === 'critical' ? 'text-rose-800' : 'text-amber-950'}`}>{round.damage} damage</span> ({round.action}).
                    </div>
                    <span className="text-rose-800 font-pixel font-bold shrink-0 text-xs">{round.defender_hp} HP</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
