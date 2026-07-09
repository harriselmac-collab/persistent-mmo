'use client';

import { useGameContext } from '../layout';
import { useState } from 'react';
import { MapPin, Globe, Compass, Plane, AlertCircle, Sparkles, User, Cloud } from 'lucide-react';

export default function MapPage() {
  const { profile, stats, regions, countries, inventory, travel, actionLoading, spawns, resources, claimTicket } = useGameContext();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const positionMap: Record<number, { top: string; left: string }> = {
    1: { top: '45.5%', left: '51.5%' },  // Aegis Hold (Central Castle / Aethelhaven)
    2: { top: '20%', left: '29%' },      // The Whispering Weald (Silverwood)
    3: { top: '34%', left: '90%' },      // The Mirelands (The Fenlands)
    4: { top: '88%', left: '10%' },      // The Shattered Isles (Sea of Whispers islands)
    5: { top: '80%', left: '66%' },      // The Sunscorched Expanse (Zaharad/Qara'tun)
    6: { top: '72%', left: '42%' },      // South wood node
    7: { top: '18%', left: '56%' },      // The Frostlands (The Cragged Peaks)
    8: { top: '60%', left: '88%' },      // The Rift (The Elderwood)
    9: { top: '52%', left: '60%' },      // Oakhaven (Lake Elara village)
    10: { top: '34%', left: '14%' },     // West ruins node (Alden Hold)
  };

  const ticketsCount = inventory.find((item) => item.item_template_id === 3)?.quantity || 0;

  const activeRegion = regions.find((r) => r.id === profile?.current_region_id);
  const activeCountry = countries.find((c) => c.id === activeRegion?.country_id);

  const handleTravel = async (regionId: number, regionName: string) => {
    setError(null);
    setSuccess(null);
    const res = await travel(regionId);
    if (res.success) {
      setSuccess(`Coordinates synced. Jump transit completed to ${regionName}.`);
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
      setSuccess('Added 1 Travel Ticket to your cargo hold.');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to claim dev ticket.');
    }
  };

  const getRegionResources = (regionId: number) => {
    return spawns
      .filter((s) => s.region_id === regionId)
      .map((s) => resources.find((r) => r.id === s.resource_id))
      .filter((r) => r !== undefined);
  };

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

      {/* Map Overview Header */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <Compass className="h-6 w-6" style={{ animation: 'spin 20s linear infinite' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Geographical Jump Portal
            </h2>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">
              Relocate between nations to access distinct resource reserves.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right relative z-10">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-zinc-500 uppercase font-bold font-display tracking-widest">Active Coordinates</span>
            <span className="text-sm font-bold font-display text-zinc-200 mt-0.5">
              {activeRegion?.name} ({activeCountry?.name})
            </span>
          </div>
          <div className="flex flex-col items-end border-l-2 border-game-gold/20 pl-5">
            <span className="text-[9px] text-zinc-500 uppercase font-bold font-display tracking-widest">Travel Tickets</span>
            <span className="text-sm font-bold font-pixel text-game-gold flex items-center gap-1.5 mt-0.5">
              <Plane className="h-3.5 w-3.5" />
              <span>x{ticketsCount}</span>
            </span>
            <button
              onClick={handleClaimTicket}
              className="text-[8px] text-game-gold-dark hover:text-game-gold underline font-display uppercase tracking-widest mt-1 cursor-pointer transition-colors"
            >
              Get Dev Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Strategic World Map Viewer */}
      <div className="rpg-panel-stone p-4 rounded-none shadow-2xl relative overflow-hidden flex flex-col items-center gap-4">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />
        
        <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Interactive Realm Overview</span>
        
        {/* Widescreen Board Frame (16:9 aspect-video) containing the 1:1 square map centered */}
        <div 
          className="relative border-4 border-zinc-900 shadow-inner w-full overflow-hidden aspect-video select-none flex items-center justify-center bg-repeat bg-center"
          style={{ backgroundImage: "url('/assets/textures/wood-walnut.png')", backgroundSize: '180px' }}
        >
          {/* Subtle vignette/shadow inside the wooden table border */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 pointer-events-none z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none z-10" />
          
          {/* Center 1:1 Square Map Box */}
          <div className="relative h-full aspect-square shadow-[0_0_35px_rgba(0,0,0,0.95)] z-20 border-l border-r border-zinc-900 bg-zinc-950">
            <img src="/assets/backgrounds/fantasy_world_map.png" alt="Aegis Kingdoms World Map" className="w-full h-full object-cover" />
            
            {/* Drifting Clouds Atmosphere */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.25] mix-blend-color-dodge z-10">
              <div
                className="absolute top-[10%] w-96 h-48 blur-2xl animate-cloud-drift-slow"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)' }}
              />
              <div
                className="absolute top-[50%] w-80 h-40 blur-2xl animate-cloud-drift-fast"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
                  animationDelay: '-25s'
                }}
              />
            </div>

            {/* Travel Route Connections Network */}
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

            {/* Pulsing interactive nodes mapped to regions */}
            <div className="absolute inset-0 z-20">
              {regions.map((region, idx) => {
                const coords = positionMap[region.id] || { top: `${30 + (idx * 6)}%`, left: `${20 + (idx * 7)}%` };
                const isCurrent = region.id === profile?.current_region_id;
                
                return (
                  <button
                    key={region.id}
                    onClick={() => handleTravel(region.id, region.name)}
                    className={`absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer group flex items-center justify-center transition-all duration-200 ${
                      isCurrent 
                        ? 'border-2 border-game-gold bg-zinc-950 shadow-[0_0_12px_rgba(229,193,88,0.75)] z-20' 
                        : 'border border-zinc-700 bg-zinc-950/90 hover:border-game-gold hover:shadow-[0_0_8px_rgba(229,193,88,0.3)] z-10'
                    }`}
                    style={{ top: coords.top, left: coords.left }}
                    title={`${region.name} (${isCurrent ? 'Current' : 'Travel'})`}
                  >
                    <div className="relative flex items-center justify-center">
                      {isCurrent && (
                        <span className="absolute w-6 h-6 rounded-full border border-game-gold animate-ping opacity-60 pointer-events-none" />
                      )}
                      <span className={`w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm transition-colors duration-200 ${
                        isCurrent 
                          ? 'bg-game-gold animate-pulse' 
                          : 'bg-zinc-500 group-hover:bg-game-gold-dark'
                      }`} />
                    </div>
                    
                    {/* Tooltip */}
                    <span className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-zinc-950 text-[9px] text-zinc-200 border border-zinc-850 px-2 py-1 uppercase font-display tracking-widest font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-30">
                      {region.name} {isCurrent ? '(Current)' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Country Region Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {countries.map((country) => {
          const countryRegions = regions.filter((r) => r.country_id === country.id);

          return (
            <div key={country.id} className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <div className="flex items-center gap-2 border-b-2 border-game-gold/15 pb-3 relative z-10">
                <Globe className="h-4.5 w-4.5 text-game-gold-dark" />
                <h3 className="font-bold text-sm font-display text-game-gold tracking-wide">{country.name}</h3>
              </div>

              <div className="flex flex-col gap-3 relative z-10">
                {countryRegions.map((region) => {
                  const isCurrent = region.id === profile?.current_region_id;
                  const isSameCountry = region.country_id === activeRegion?.country_id;
                  const energyCost = isSameCountry ? 10 : 20;
                  const requiresTicket = !isSameCountry;
                  const regionResources = getRegionResources(region.id);

                  return (
                    <div
                      key={region.id}
                      className={`border p-4 flex flex-col gap-3 transition-all ${
                        isCurrent
                          ? 'border-game-gold/50 bg-game-gold/5 shadow-[0_0_12px_rgba(229,193,88,0.08)]'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                      }`}
                    >
                      {/* Name & current badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-bold font-display text-zinc-200 flex items-center gap-1.5">
                            {isCurrent && <MapPin className="h-4 w-4 text-game-gold shrink-0 fill-current" />}
                            <span>{region.name}</span>
                          </span>
                          <div className="flex items-center gap-2 text-[9px] text-zinc-500 mt-1 capitalize font-serif">
                            <span className="flex items-center gap-0.5">
                              <Cloud className="h-3 w-3" /> {region.climate}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <User className="h-3 w-3" /> Pop {region.population}
                            </span>
                          </div>
                        </div>

                        {isCurrent && (
                          <span className="px-2 py-0.5 border border-game-gold/40 bg-game-gold/10 text-[9px] font-bold font-display text-game-gold uppercase tracking-widest shrink-0">
                            Current
                          </span>
                        )}
                      </div>

                      {/* Resources */}
                      <div className="flex flex-wrap gap-1">
                        {regionResources.length === 0 ? (
                          <span className="text-[9px] text-zinc-600 italic font-serif">No raw resources</span>
                        ) : (
                          regionResources.map((res) =>
                            res && (
                              <span
                                key={res.id}
                                className="px-2 py-0.5 border border-zinc-700/30 bg-zinc-900 text-[9px] text-zinc-400 font-display"
                              >
                                {res.name}
                              </span>
                            )
                          )
                        )}
                      </div>

                      {/* Travel action */}
                      {!isCurrent && (
                        <div className="flex items-center justify-between gap-2 border-t border-zinc-800 pt-3">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest">Cost</span>
                              <span className="text-xs font-pixel text-red-400">{energyCost} EP</span>
                            </div>
                            {requiresTicket && (
                              <div className="flex flex-col border-l border-zinc-800 pl-3">
                                <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest">Ticket</span>
                                <span className={`text-xs font-pixel ${ticketsCount > 0 ? 'text-zinc-400' : 'text-red-500'}`}>
                                  1 Required
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleTravel(region.id, region.name)}
                            disabled={actionLoading || (requiresTicket && ticketsCount === 0) || (stats ? stats.energy < energyCost : true)}
                            className="rpg-button px-3 py-1.5 text-[9px] tracking-widest"
                          >
                            Jump Transit
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

