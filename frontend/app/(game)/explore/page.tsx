'use client';

import { useGameContext } from '../layout';
import { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Compass, Plane, AlertCircle, Sparkles, User, Cloud, Pickaxe, Flame, Coins, Clock, Weight, Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function ExplorePage() {
  const { 
    profile, 
    stats, 
    regions, 
    countries, 
    inventory, 
    travel, 
    actionLoading, 
    spawns, 
    resources, 
    claimTicket,
    gather,
    refreshData
  } = useGameContext();

  const [activeTab, setActiveTab] = useState<'map' | 'gather'>('map');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Gathering states
  const [activeGatherId, setActiveGatherId] = useState<number | null>(null);
  const [gatherProgress, setGatherProgress] = useState(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Map settings
  const positionMap: Record<number, { top: string; left: string }> = {
    1: { top: '45.5%', left: '51.5%' },  // Aegis Hold
    2: { top: '20%', left: '29%' },      // The Whispering Weald
    3: { top: '34%', left: '90%' },      // The Mirelands
    4: { top: '88%', left: '10%' },      // The Shattered Isles
    5: { top: '80%', left: '66%' },      // The Sunscorched Expanse
    6: { top: '72%', left: '42%' },      // South wood node
    7: { top: '18%', left: '56%' },      // The Frostlands
    8: { top: '60%', left: '88%' },      // The Rift
    9: { top: '52%', left: '60%' },      // Oakhaven
    10: { top: '34%', left: '14%' },     // West ruins node
  };

  const ticketsCount = inventory.find((item) => item.item_template_id === 3)?.quantity || 0;
  const activeRegion = regions.find((r) => r.id === profile?.current_region_id);
  const activeCountry = countries.find((c) => c.id === activeRegion?.country_id);
  const regionSpawns = spawns.filter((s) => s.region_id === profile?.current_region_id);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleTravel = async (regionId: number, regionName: string) => {
    setError(null);
    setSuccess(null);
    if (regionId === profile?.current_region_id) {
      setError("You are already standing at these coordinates.");
      return;
    }
    const res = await travel(regionId);
    if (res.success) {
      setSuccess(`Jump transit completed. Relocated to ${regionName}.`);
      refreshData();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to travel.');
    }
  };

  const handleClaimTicket = async () => {
    setError(null);
    setSuccess(null);
    const res = await claimTicket();
    if (res.success) {
      setSuccess('Claimed 1 Travel Ticket for transit.');
      refreshData();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to claim dev ticket.');
    }
  };

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
            setSuccess(`Gathered +${res.gatheredQuantity} ${resourceName} & gained +${res.experienceGained} XP!`);
            refreshData();
            setTimeout(() => setSuccess(null), 4000);
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

      {/* Main Exploration Console Header */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <Compass className="h-6 w-6" style={{ animation: 'spin 30s linear infinite' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Explore the Realm
            </h2>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">
              Traverse between kingdom borders and gather natural materials from surrounding sectors.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-zinc-950 p-1 border border-zinc-800 relative z-10">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold font-display uppercase tracking-widest transition-all ${
              activeTab === 'map' ? 'bg-game-gold/20 text-game-gold border border-game-gold/30' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            Sector Map
          </button>
          <button
            onClick={() => setActiveTab('gather')}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold font-display uppercase tracking-widest transition-all ${
              activeTab === 'gather' ? 'bg-game-gold/20 text-game-gold border border-game-gold/30' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Pickaxe className="h-3.5 w-3.5" />
            Gather Materials
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Sector Details */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Location details card */}
          <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 relative shadow-lg">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Your Location</span>
            <div className="flex flex-col gap-2">
              <div className="text-lg font-bold font-display text-zinc-100">{activeRegion?.name}</div>
              <div className="text-xs font-serif text-zinc-400 capitalize">{activeCountry?.name} Territory</div>
              <div className="text-[10px] text-zinc-500 font-sans mt-1 bg-zinc-950 p-2.5 border border-zinc-900 rounded-none leading-relaxed">
                Yield Abundance: <span className="text-game-gold font-bold">{activeRegion?.production_bonus ? `${activeRegion.production_bonus}x` : '1.0x'}</span>
                <br />
                Available Resources: {regionSpawns.length > 0 ? regionSpawns.map(s => resources.find(r => r.id === s.resource_id)?.name).join(', ') : 'None'}
              </div>
            </div>
          </div>

          {/* Transit ticket details */}
          <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 relative shadow-lg">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Jump Tickets</span>
            <div className="flex justify-between items-center bg-zinc-950 p-3 border border-zinc-900">
              <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Plane className="h-4 w-4 text-zinc-500" />
                Travel Passes
              </span>
              <span className="text-sm font-pixel font-bold text-game-gold">x{ticketsCount}</span>
            </div>
            <button
              onClick={handleClaimTicket}
              className="rpg-button w-full py-1 text-[9px] tracking-widest uppercase text-game-gold"
            >
              Get Free Pass
            </button>
          </div>
        </div>

        {/* Central Display */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'map' ? (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rpg-panel-stone p-4 rounded-none shadow-2xl relative overflow-hidden flex flex-col items-center gap-4"
              >
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Interactive Sector Grid Map</span>

                <div className="relative border-4 border-zinc-900 shadow-inner w-full overflow-hidden aspect-video select-none flex items-center justify-center bg-zinc-950">

                  {/* 1:1 Map Box */}
                  <div className="relative h-full aspect-square shadow-[0_0_35px_rgba(0,0,0,0.95)] z-20 border-l border-r border-zinc-900 bg-zinc-950">
                    <img src="/assets/backgrounds/fantasy_world_map.png" alt="Aegis Kingdoms World Map" className="w-full h-full object-cover" />

                    {/* Node Connections */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                      {(() => {
                        const connections = [
                          [1, 2], [1, 3], [1, 8], [1, 9], [1, 6],
                          [2, 10], [2, 5],
                          [3, 7], [3, 9],
                          [9, 4],
                          [8, 6], [8, 5]
                        ];
                        return connections.map(([startId, endId], index) => {
                          const start = positionMap[startId];
                          const end = positionMap[endId];
                          if (!start || !end) return null;
                          return (
                            <line
                              key={index}
                              x1={start.left}
                              y1={start.top}
                              x2={end.left}
                              y2={end.top}
                              className="stroke-game-gold/30 stroke-[1.5] animate-dash-travel"
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Interactive Node Buttons */}
                    <div className="absolute inset-0 z-20">
                      {regions.map((region, idx) => {
                        const coords = positionMap[region.id] || { top: `${30 + (idx * 6)}%`, left: `${20 + (idx * 7)}%` };
                        const isCurrent = region.id === profile?.current_region_id;

                        return (
                          <motion.button
                            key={region.id}
                            onClick={() => handleTravel(region.id, region.name)}
                            className={`absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer group flex items-center justify-center transition-all duration-200 ${
                              isCurrent 
                                ? 'border-2 border-game-gold bg-zinc-950 shadow-[0_0_12px_rgba(229,193,88,0.75)] z-20' 
                                : 'border border-zinc-700 bg-zinc-950/90 hover:border-game-gold hover:shadow-[0_0_8px_rgba(229,193,88,0.3)] z-10'
                            }`}
                            style={{ top: coords.top, left: coords.left }}
                            title={`${region.name} (${isCurrent ? 'Current' : 'Travel'})`}
                            whileHover={{ scale: 1.25 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <div className="relative flex items-center justify-center">
                              {isCurrent && (
                                <motion.span 
                                  className="absolute w-6 h-6 rounded-full border border-game-gold pointer-events-none" 
                                  animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                                />
                              )}
                              <span className={`w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm transition-colors duration-200 ${
                                isCurrent ? 'bg-game-gold animate-pulse' : 'bg-zinc-500 group-hover:bg-game-gold'
                              }`} />
                            </div>
                            <span className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-zinc-950 text-[9px] text-zinc-200 border border-zinc-850 px-2 py-1 uppercase font-display tracking-widest font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-30">
                              {region.name} {isCurrent ? '(Current)' : ''}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="gather"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {/* Resource Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regionSpawns.map((spawn) => {
                    const res = resources.find((r) => r.id === spawn.resource_id);
                    if (!res) return null;

                    const isGathering = activeGatherId === res.id;
                    const isAnotherGathering = activeGatherId !== null && activeGatherId !== res.id;
                    const isEnergyLocked = stats ? stats.energy < spawn.energy_cost : true;

                    // Thematic title override based on resource type
                    let siteName = "Harvesting Plain";
                    if (res.name.toLowerCase().includes("wood")) siteName = "Explore Woodcut Forest";
                    else if (res.name.toLowerCase().includes("stone")) siteName = "Mine Mountain Quarry";
                    else if (res.name.toLowerCase().includes("iron")) siteName = "Dig Iron Ore Deposit";

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
                              <h3 className="font-bold text-xs text-zinc-500 font-display uppercase tracking-wider">{siteName}</h3>
                              <h4 className="font-bold text-sm text-zinc-200 font-display tracking-wide">{res.name}</h4>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 border text-[8px] font-bold font-display uppercase tracking-widest w-fit ${getRarityBadge(res.rarity)}`}>
                            {res.rarity}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-zinc-500 text-xs font-serif leading-relaxed line-clamp-2 relative z-10">
                          {res.description || 'No description supplied.'}
                        </p>

                        {/* Resource Attributes */}
                        <div className="grid grid-cols-3 gap-0 border-t border-b border-game-gold/10 py-3 relative z-10">
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest">Weight</span>
                            <span className="text-xs font-bold font-pixel text-zinc-300 mt-1 flex items-center gap-1">
                              <Weight className="h-3 w-3 text-zinc-500" />
                              {res.weight} kg
                            </span>
                          </div>
                          <div className="flex flex-col items-center border-l border-r border-game-gold/10">
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

                        {/* Progress and gather action */}
                        <div className="flex flex-col gap-3 relative z-10">
                          {isGathering && (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-[9px] text-zinc-500 font-pixel">
                                <span>Extracting natural deposits...</span>
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
                            <Pickaxe className="h-4 w-4" />
                            {isGathering ? 'EXTRACTING...' : isEnergyLocked ? 'INSUFFICIENT ENERGY' : `START EXTRACTION (${spawn.production_time}s)`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {regionSpawns.length === 0 && (
                    <div className="bg-zinc-950 p-12 border border-zinc-900 text-center col-span-2 text-zinc-500 font-serif">
                      No extractable deposits registered in these sectors. Relocate to other territories via Sector Map.
                    </div>
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
