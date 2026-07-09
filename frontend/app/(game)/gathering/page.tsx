'use client';

import { useGameContext } from '../layout';
import { useState, useEffect, useRef } from 'react';
import { Pickaxe, Flame, Sparkles, AlertCircle, Coins, Clock, Weight, HelpCircle } from 'lucide-react';

const ITEM_ASSET_MAP: Record<string, string> = {
  'Wood': '/assets/items/wood.png',
  'Stone': '/assets/items/stone.png',
  'Iron Ore': '/assets/items/iron_ore.png',
  'Wheat Bread': '/assets/items/wheat_bread.png',
  'Iron Sword': '/assets/items/iron_sword.png',
};

const renderItemIcon = (name: string, fallbackEmoji: string, sizeClass: string = "w-8 h-8") => {
  const assetPath = ITEM_ASSET_MAP[name];
  if (assetPath) {
    return <img src={assetPath} alt={name} className={`${sizeClass} object-contain`} />;
  }
  return <span className="text-xl select-none">{fallbackEmoji}</span>;
};

export default function GatheringPage() {
  const { profile, stats, resources, spawns, regions, countries, gather, actionLoading, refreshData } = useGameContext();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; quantity: number; exp: number } | null>(null);
  
  const [activeGatherId, setActiveGatherId] = useState<number | null>(null);
  const [gatherProgress, setGatherProgress] = useState(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeRegion = regions.find((r) => r.id === profile?.current_region_id);
  const activeCountry = countries.find((c) => c.id === activeRegion?.country_id);
  const regionSpawns = spawns.filter((s) => s.region_id === profile?.current_region_id);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleGatherClick = (resourceId: number, durationSeconds: number, resourceName: string) => {
    if (actionLoading || activeGatherId !== null) return;
    setError(null);
    setSuccess(null);

    const spawn = regionSpawns.find((s) => s.resource_id === resourceId);
    if (spawn && stats && stats.energy < spawn.energy_cost) {
      setError(`Insufficient energy. Gathering ${resourceName} requires ${spawn.energy_cost} EP.`);
      return;
    }

    setActiveGatherId(resourceId);
    setGatherProgress(0);

    const intervalMs = 50;
    const totalSteps = (durationSeconds * 1000) / intervalMs;
    let currentStep = 0;

    progressTimerRef.current = setInterval(async () => {
      currentStep++;
      const percent = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setGatherProgress(percent);

      if (currentStep >= totalSteps) {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        try {
          const res = await gather(resourceId);
          if (res.success) {
            setSuccess({ name: resourceName, quantity: res.gatheredQuantity, exp: res.experienceGained });
            refreshData();
          } else {
            setError(res.error || 'Gathering attempt failed.');
          }
        } catch (err: any) {
          setError(err?.message || 'An unexpected error occurred during gathering.');
        } finally {
          setActiveGatherId(null);
          setGatherProgress(0);
        }
      }
    }, intervalMs);
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'uncommon': return 'border-emerald-700/50 text-emerald-400 bg-emerald-950/20';
      case 'rare': return 'border-blue-700/50 text-blue-400 bg-blue-950/20';
      case 'epic': return 'border-purple-700/50 text-purple-400 bg-purple-950/20';
      case 'legendary': return 'border-game-gold/50 text-game-gold bg-game-gold/10';
      default: return 'border-zinc-700/50 text-zinc-400 bg-zinc-900';
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Alert banners */}
      {error && (
        <div className="px-4 py-3 border-l-4 border-red-600 bg-red-950/30 text-red-400 text-xs font-bold font-display uppercase tracking-widest flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-3 shadow-lg relative">
          <div className="rpg-rivet top-1 left-1" />
          <div className="rpg-rivet top-1 right-1" />
          <div className="rpg-rivet bottom-1 left-1" />
          <div className="rpg-rivet bottom-1 right-1" />
          <div className="flex items-center gap-2 font-bold text-game-gold relative z-10">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="text-xs font-display uppercase tracking-widest">Resource Extracted Successfully!</span>
          </div>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-zinc-950 border border-game-emerald/30 p-4 flex flex-col items-center shadow-inner">
              <span className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Yield Extracted</span>
              <span className="text-sm font-bold font-pixel text-white mt-1">+{success.quantity} {success.name}</span>
            </div>
            <div className="bg-zinc-950 border border-game-gold/30 p-4 flex flex-col items-center shadow-inner">
              <span className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Exp Gained</span>
              <span className="text-sm font-bold font-pixel text-game-gold mt-1">+{success.exp} EXP</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <Pickaxe className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Resource Extraction Grid
            </h2>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">Harvest raw resources directly from your local sector.</p>
          </div>
        </div>

        <div className="flex flex-col items-end text-right relative z-10">
          <span className="text-[9px] text-zinc-500 uppercase font-bold font-display tracking-widest">Sector Yield Efficiency</span>
          <span className="text-sm font-bold font-display text-zinc-200 mt-0.5">
            {activeRegion?.name} ({activeRegion?.production_bonus ? `${activeRegion.production_bonus}x` : '1.0x'} bonus)
          </span>
        </div>
      </div>

      {/* Resource cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regionSpawns.map((spawn) => {
          const res = resources.find((r) => r.id === spawn.resource_id);
          if (!res) return null;

          const isGathering = activeGatherId === res.id;
          const isAnotherGathering = activeGatherId !== null && activeGatherId !== res.id;
          const isEnergyLocked = stats ? stats.energy < spawn.energy_cost : true;

          return (
            <div
              key={res.id}
              className={`rpg-panel-stone p-5 rounded-none flex flex-col gap-4 relative overflow-hidden shadow-lg transition-all duration-300 ${
                isGathering ? 'outline outline-2 outline-game-gold/40' : ''
              }`}
            >
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              {/* Card Header */}
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  {renderItemIcon(res.name, '📦', "w-10 h-10")}
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-sm text-zinc-200 font-display tracking-wide">{res.name}</h3>
                    <span className={`px-2 py-0.5 border text-[8px] font-bold font-display uppercase tracking-widest w-fit ${getRarityBadge(res.rarity)}`}>
                      {res.rarity}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Base Value</span>
                  <span className="text-xs font-bold font-pixel text-game-gold mt-0.5 flex items-center gap-1">
                    <Coins className="h-3 w-3 text-game-gold-dark" />
                    {res.base_value} LC
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-zinc-500 text-xs font-serif leading-relaxed line-clamp-2 relative z-10">
                {res.description || 'No description supplied.'}
              </p>

              {/* Resource Attributes */}
              <div className="grid grid-cols-3 gap-0 border-t-2 border-b-2 border-game-gold/10 py-3 relative z-10">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest">Weight</span>
                  <span className="text-xs font-bold font-pixel text-zinc-300 mt-1 flex items-center gap-1">
                    <Weight className="h-3 w-3 text-zinc-500" />
                    {res.weight} kg
                  </span>
                </div>
                <div className="flex flex-col items-center border-l-2 border-r-2 border-game-gold/10">
                  <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest">EP Cost</span>
                  <span className="text-xs font-bold font-pixel text-red-400 mt-1 flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    {spawn.energy_cost} EP
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest">Exp Gain</span>
                  <span className="text-xs font-bold font-pixel text-game-gold mt-1">
                    +{spawn.experience_reward} XP
                  </span>
                </div>
              </div>

              {/* Progress & Button */}
              <div className="flex flex-col gap-3 relative z-10">
                {isGathering && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[9px] text-zinc-500 font-pixel">
                      <span>Harvesting coordinates...</span>
                      <span>{gatherProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 border border-game-gold/20 h-2 shadow-inner">
                      <div
                        className="bg-game-gold h-full transition-all duration-75 shadow-[0_0_8px_rgba(229,193,88,0.4)]"
                        style={{ width: `${gatherProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleGatherClick(res.id, spawn.production_time, res.name)}
                  disabled={actionLoading || isAnotherGathering || isGathering || isEnergyLocked}
                  className={`rpg-button w-full flex items-center justify-center gap-2 py-2.5 text-[10px] tracking-widest ${
                    isGathering ? 'border-game-gold text-game-gold opacity-80' : ''
                  }`}
                >
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>
                    {isGathering ? 'Gathering...' : `Gather (${spawn.production_time}s)`}
                  </span>
                </button>
              </div>
            </div>
          );
        })}

        {regionSpawns.length === 0 && (
          <div className="col-span-full rpg-panel-stone py-16 rounded-none flex flex-col items-center justify-center gap-3 text-center max-w-md mx-auto p-6 shadow-lg relative">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />
            <HelpCircle className="h-10 w-10 text-zinc-700 relative z-10" />
            <div className="relative z-10">
              <p className="text-sm font-bold font-display text-zinc-400">Zero Resources in Capital</p>
              <p className="text-xs text-zinc-600 font-serif mt-1 leading-relaxed">
                Genesis Capital has no raw resources. Travel to neighboring regions like the Emerald Woodlands or Granite Quarry to harvest timber, stone, and ores!
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
