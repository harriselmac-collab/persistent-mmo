'use client';

import { useGameContext } from '../layout';
import { useState } from 'react';
import { 
  Flame, Shield, Swords, Compass, DollarSign, Activity, AlertTriangle, 
  Sparkles, CheckCircle, Crosshair, HelpCircle, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function WarfarePage() {
  const {
    profile,
    stats,
    countries,
    regions,
    activeWars,
    militaryRegions,
    armyUnits,
    supplyRoutes,
    peaceTreaties,
    declareWar,
    mobilizeArmy,
    moveArmy,
    engageBattle,
    proposePeace,
    acceptPeace,
    actionLoading,
    refreshData
  } = useGameContext();

  const [activeTab, setActiveTab] = useState<'wars' | 'regions' | 'armies' | 'peace'>('wars');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Declare War input
  const [targetCountryId, setTargetCountryId] = useState<number>(2);

  // Army Command input
  const [selectedArmyId, setSelectedArmyId] = useState<number | null>(null);
  const [targetMoveRegionId, setTargetMoveRegionId] = useState<number>(2);

  // Propose Peace input
  const [selectedWarId, setSelectedWarId] = useState<number>(1);
  const [reparationsVal, setReparationsVal] = useState('');
  const [transferRegionId, setTransferRegionId] = useState('');

  // Resolve Citizen Country Details
  const citizenCountryId = profile?.citizenship_country_id || 1;
  const citizenCountry = countries.find(c => c.id === citizenCountryId) || countries[0];

  const handleDeclareWar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const res = await declareWar(targetCountryId);
    if (res.success) {
      setSuccessMsg('War declared successfully! Mobilize your armies immediately.');
      refreshData();
    } else {
      setError(res.error || 'Failed to declare war.');
    }
  };

  const handleMobilize = async () => {
    setError(null);
    setSuccessMsg(null);

    const res = await mobilizeArmy();
    if (res.success) {
      setSuccessMsg('Successfully mobilized 1,000 troops at your capital. Deducted 5,000 local currency from National Treasury.');
      refreshData();
    } else {
      setError(res.error || 'Failed to mobilize army.');
    }
  };

  const handleCommandMovement = async (armyId: number) => {
    setError(null);
    setSuccessMsg(null);

    const res = await moveArmy(armyId, targetMoveRegionId);
    if (res.success) {
      setSuccessMsg('Army marched successfully. Consumed 10 energy.');
      refreshData();
    } else {
      setError(res.error || 'Failed to move army.');
    }
  };

  const handleCommandInvasion = async (armyId: number, regionId: number) => {
    setError(null);
    setSuccessMsg(null);

    const res = await engageBattle(armyId, regionId);
    if (res.success) {
      setSuccessMsg('Invasion executed successfully! The region has been occupied. Consumed 20 energy.');
      refreshData();
    } else {
      setError(res.error || 'Failed to invade region.');
    }
  };

  const handleProposePeace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const reparations = parseFloat(reparationsVal) || 0;
    const transfers = transferRegionId ? [parseInt(transferRegionId)] : [];

    const res = await proposePeace(selectedWarId, reparations, transfers);
    if (res.success) {
      setSuccessMsg('Peace treaty proposal submitted successfully. Awaiting response.');
      setReparationsVal('');
      setTransferRegionId('');
      refreshData();
    } else {
      setError(res.error || 'Failed to propose peace.');
    }
  };

  const handleAcceptPeace = async (treatyId: number) => {
    setError(null);
    setSuccessMsg(null);

    const res = await acceptPeace(treatyId);
    if (res.success) {
      setSuccessMsg('Peace treaty accepted! Geopolitical conflict ended.');
      refreshData();
    } else {
      setError(res.error || 'Failed to accept peace.');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Overview Card */}
      <div className="rpg-panel-stone p-6 rounded-none flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative border-none shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 bg-zinc-950 border border-zinc-900 text-game-gold rounded-none shrink-0 shadow-inner animate-pulse">
            <Flame className="h-6 w-6 shrink-0" />
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-555 text-xs font-bold uppercase tracking-widest font-display">Geopolitical Conflict Room</span>
            <h2 className="text-xl font-bold text-game-gold uppercase tracking-wider mt-1 filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">Warfare & National Logistics</h2>
          </div>
        </div>

        <div className="flex gap-3 relative z-10 w-full md:w-auto">
          <button
            onClick={handleMobilize}
            disabled={actionLoading}
            className="w-full md:w-auto flex items-center justify-center gap-1.5 h-10 rpg-button rpg-button-crimson text-xs font-display uppercase tracking-widest select-none"
          >
            <Shield className="h-4.5 w-4.5 shrink-0" />
            <span>Mobilize Forces (-5000 Treasury)</span>
          </button>
        </div>
      </div>

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

      {/* Tabs */}
      <div className="flex border-b-2 border-game-gold/30 bg-zinc-950/40 p-0.5 shadow-inner overflow-x-auto max-w-full">
        {[
          { id: 'wars', label: 'Conflicts Directory', icon: Flame },
          { id: 'regions', label: 'Geopolitical Map', icon: Compass },
          { id: 'armies', label: 'Military Logistics', icon: Swords },
          { id: 'peace', label: 'Ceasefire Treaties', icon: CheckCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setError(null);
                setSuccessMsg(null);
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

      {/* Tab: Wars */}
      {activeTab === 'wars' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* War Declarations Form */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 border-none relative shadow-lg">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest border-b border-zinc-900 pb-3 relative z-10">Declare Geopolitical War</h3>
            
            <form onSubmit={handleDeclareWar} className="flex flex-col gap-4 relative z-10">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Target Adversary Country</label>
                <select
                  value={targetCountryId}
                  onChange={(e) => setTargetCountryId(parseInt(e.target.value))}
                  className="input-field bg-zinc-955 border border-zinc-900 rounded-none text-xs text-white px-3 h-10 focus:outline-none focus:border-game-gold font-display uppercase tracking-wider cursor-pointer"
                >
                  {countries.filter(c => c.id !== citizenCountryId).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (ID: #{c.id})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-1.5 h-10 rpg-button rpg-button-crimson text-xs font-display uppercase tracking-widest select-none"
              >
                <Crosshair className="h-4.5 w-4.5" />
                <span>Declare Hostility</span>
              </button>
            </form>
          </div>

          {/* Active Geopolitical Wars */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest border-b border-zinc-900 pb-3 flex items-center gap-2 text-left">
              <Activity className="h-4.5 w-4.5 text-game-gold-dark" />
              <span>Active Conflicts Directory</span>
            </h3>

            {activeWars.length === 0 ? (
              <p className="text-xs text-zinc-555 font-serif italic text-left">Universal peace reigns. No active wars declared.</p>
            ) : (
              activeWars.map((war) => (
                <div key={war.id} className="rpg-panel-stone p-6 rounded-none flex flex-col gap-3 relative shadow-md border-none text-left">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />

                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5 relative z-10">
                    <div className="flex items-center gap-2 font-bold text-sm text-zinc-200 font-display uppercase tracking-wider">
                      <span>{war.attacker_name}</span>
                      <span className="text-rose-500 text-xs font-bold">VS</span>
                      <span>{war.defender_name}</span>
                    </div>
                    <span className="px-2 py-0.5 border text-[8px] font-bold font-display uppercase tracking-widest bg-red-950/20 border-red-900/30 text-rose-455">
                      {war.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-zinc-555 mt-1 relative z-10 font-pixel tracking-wider">
                    <span>Hostilities Initiated: {new Date(war.started_at).toLocaleDateString()}</span>
                    <span>Conflict ID: #{war.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* Tab: Geopolitical Map */}
      {activeTab === 'regions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {militaryRegions.map((region) => {
            const hasOccupation = region.owner_country_id !== region.occupier_country_id;
            
            return (
              <div key={region.region_id} className={`rpg-panel-stone p-6 rounded-none flex flex-col gap-4 border relative shadow-md ${
                hasOccupation ? 'border-amber-500/20' : 'border-zinc-900/80'
              }`}>
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <div className="flex justify-between items-start border-b border-zinc-900 pb-3 relative z-10">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-indigo-400 font-display font-bold">Sector ID: #{region.region_id}</span>
                    <h3 className="text-md font-bold text-zinc-200 font-display uppercase mt-1 tracking-wide">{region.region_name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 border text-[8px] font-bold font-display uppercase tracking-widest ${
                    region.supply_status === 'supplied' 
                      ? 'bg-emerald-950/20 text-game-emerald border-emerald-900/30' 
                      : 'bg-red-950/20 text-rose-455 border-red-900/30 animate-pulse'
                  }`}>
                    {region.supply_status}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 text-xs text-zinc-400 font-semibold relative z-10 font-display uppercase tracking-wider text-left">
                  <div className="flex justify-between">
                    <span className="text-zinc-550">Sovereign Owner:</span>
                    <span className="text-white font-pixel text-[13px]">{region.owner_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-555">Occupying Force:</span>
                    <span className="text-game-gold font-pixel text-[13px]">{region.occupier_name}</span>
                  </div>
                  {hasOccupation && (
                    <div className="flex justify-between border-t border-zinc-900 pt-2.5 mt-1 font-display">
                      <span className="text-amber-500 uppercase text-[9px] font-bold tracking-widest">Resistance Level:</span>
                      <span className="text-white font-pixel">{region.resistance_level}%</span>
                    </div>
                  )}
                </div>

                {hasOccupation && (
                  <div className="p-3.5 bg-zinc-950 border border-zinc-900 flex gap-2 items-center text-[10px] text-amber-500 mt-1 relative z-10 font-serif leading-relaxed text-left">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-555" />
                    <span>Resource output restricted due to active occupation.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Military Logistics */}
      {activeTab === 'armies' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Mobilized Armies list */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest border-b border-zinc-900 pb-3 flex items-center gap-2 text-left">
              <Shield className="h-4.5 w-4.5 text-game-gold-dark" />
              <span>National Army Divisions</span>
            </h3>

            {armyUnits.length === 0 ? (
              <p className="text-xs text-zinc-555 font-serif italic text-left">No army units mobilized. Recruit forces above to begin.</p>
            ) : (
              armyUnits.map((army) => {
                const isSelected = selectedArmyId === army.id;
                
                return (
                  <div key={army.id} className={`rpg-panel-stone p-6 rounded-none flex flex-col gap-4 border relative shadow-md text-left ${
                    isSelected ? 'border-rose-900/50 bg-rose-955/15' : 'border-zinc-900/80'
                  }`}>
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <div className="flex justify-between items-start border-b border-zinc-900 pb-2.5 relative z-10">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-rose-455 font-display uppercase tracking-wider font-bold">Division ID: #{army.id} • Stationed: {army.region_name}</span>
                        <h4 className="text-sm font-bold text-zinc-205 font-display uppercase mt-1 tracking-wide">Regiment of {army.size.toLocaleString()} Troops</h4>
                      </div>
                      
                      <span className="px-2 py-0.5 border text-[8px] font-bold font-display uppercase tracking-widest bg-zinc-950 border-zinc-900 text-zinc-555">
                        {army.status}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 text-xs text-zinc-400 font-semibold relative z-10">
                      <div className="p-2.5 bg-zinc-950 border border-zinc-900 flex flex-col">
                        <span className="text-[9px] text-zinc-555 font-display uppercase tracking-wider">Division Morale</span>
                        <span className="text-white font-bold font-pixel text-sm mt-0.5">{army.morale}%</span>
                      </div>
                      <div className="p-2.5 bg-zinc-955 border border-zinc-900 flex flex-col">
                        <span className="text-[9px] text-zinc-555 font-display uppercase tracking-wider">Ammunition</span>
                        <span className="text-white font-bold font-pixel text-sm mt-0.5">{army.ammo_qty} Qty</span>
                      </div>
                      <div className="p-2.5 bg-zinc-955 border border-zinc-900 flex flex-col">
                        <span className="text-[9px] text-zinc-555 font-display uppercase tracking-wider">Rations</span>
                        <span className="text-white font-bold font-pixel text-sm mt-0.5">{army.rations_qty} Qty</span>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex gap-2 mt-2 relative z-10">
                      <button
                        onClick={() => setSelectedArmyId(army.id)}
                        className={`flex-1 px-3 py-2 text-xs font-bold font-display uppercase tracking-wider rounded-none select-none ${
                          isSelected ? 'bg-game-gold text-zinc-955' : 'rpg-button'
                        }`}
                      >
                        {isSelected ? 'Selected Division' : 'Select Command'}
                      </button>

                      {isSelected && (
                        <>
                          <button
                            onClick={() => handleCommandMovement(army.id)}
                            disabled={actionLoading}
                            className="px-3.5 py-1.5 rpg-button rpg-button-gold border border-game-gold text-xs font-display uppercase tracking-widest select-none"
                          >
                            March Command (-10 EP)
                          </button>
                          <button
                            onClick={() => handleCommandInvasion(army.id, targetMoveRegionId)}
                            disabled={actionLoading}
                            className="px-3.5 py-1.5 rpg-button rpg-button-crimson text-xs font-display uppercase tracking-widest select-none"
                          >
                            Invasion Order (-20 EP)
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Side: Command Console */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 border-none relative shadow-md">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest border-b border-zinc-900 pb-3 relative z-10">Command Console</h3>
            
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Target Sector / Region</label>
                <select
                  value={targetMoveRegionId}
                  onChange={(e) => setTargetMoveRegionId(parseInt(e.target.value))}
                  className="input-field bg-zinc-955 border border-zinc-900 rounded-none text-xs text-white px-3 h-10 focus:outline-none focus:border-game-gold font-display uppercase tracking-wider cursor-pointer"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} (Region #{r.id})</option>
                  ))}
                </select>
              </div>

              {/* Logistical networks mapping */}
              <div className="border-t border-zinc-900 pt-4 mt-1 flex flex-col gap-3 text-left">
                <span className="text-xs font-bold text-zinc-350 font-display uppercase tracking-wider">Logistical Supply Routes</span>
                {supplyRoutes.map((route) => (
                  <div key={route.id} className="p-2.5 bg-zinc-950 border border-zinc-900 flex justify-between items-center text-[10px] font-pixel text-zinc-550">
                    <span className="font-display text-[9px] uppercase tracking-wider">{route.from_region_name} ➔ {route.to_region_name}</span>
                    <span className="text-game-gold font-pixel font-bold">{route.bandwidth} bandwidth</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab: Peace Negotiations */}
      {activeTab === 'peace' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Propose Treaty */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 border-none relative shadow-md">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest border-b border-zinc-900 pb-3 relative z-10">Draft Peace Proposal</h3>
            
            <form onSubmit={handleProposePeace} className="flex flex-col gap-4 relative z-10">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Select Active Conflict</label>
                <select
                  value={selectedWarId}
                  onChange={(e) => setSelectedWarId(parseInt(e.target.value))}
                  className="input-field bg-zinc-950 border border-zinc-900 rounded-none text-xs text-white px-3 h-10 focus:outline-none focus:border-game-gold font-display uppercase tracking-wider cursor-pointer"
                >
                  {activeWars.map((war) => (
                    <option key={war.id} value={war.id}>War #{war.id} (VS {war.defender_name})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Gold/Currency Reparations</label>
                <input
                  type="number"
                  value={reparationsVal}
                  onChange={(e) => setReparationsVal(e.target.value)}
                  className="input-field bg-zinc-955 border border-zinc-900 rounded-none text-xs font-pixel text-right text-zinc-200 focus:outline-none focus:border-game-gold"
                  placeholder="e.g. 10000"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Transfer Region ID (Optional)</label>
                <input
                  type="text"
                  value={transferRegionId}
                  onChange={(e) => setTransferRegionId(e.target.value)}
                  className="input-field bg-zinc-955 border border-zinc-900 rounded-none text-xs font-pixel text-right text-zinc-200 focus:outline-none focus:border-game-gold"
                  placeholder="e.g. 2"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full h-10 rpg-button text-xs font-display uppercase tracking-widest select-none"
              >
                Submit Ceasefire Terms
              </button>
            </form>
          </div>

          {/* Incoming Peace Proposals - Redesigned as calligraphic treaties list */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest border-b border-zinc-900 pb-3 flex items-center gap-2 text-left">
              <CheckCircle className="h-4.5 w-4.5 text-game-gold-dark" />
              <span>Incoming Ceasefire Proposals</span>
            </h3>

            {peaceTreaties.length === 0 ? (
              <p className="text-xs text-zinc-555 font-serif italic text-left">No peace proposals currently under review.</p>
            ) : (
              peaceTreaties.map((treaty) => (
                <div key={treaty.id} className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-3.5 border-2 shadow-xl text-left">
                  <div className="flex justify-between items-start border-b border-amber-955/20 pb-2.5">
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] text-amber-900/60 font-pixel tracking-wider font-bold">Proposal ID: #{treaty.id}</span>
                      <h4 className="text-sm font-bold text-amber-955 font-display uppercase tracking-wide mt-1 font-serif">Proposed by: {treaty.proposer_name}</h4>
                    </div>
                    
                    <span className={`px-2 py-0.5 border text-[8px] font-bold font-display uppercase tracking-widest ${
                      treaty.status === 'accepted' 
                        ? 'bg-emerald-950/20 text-emerald-800 border-emerald-955/30' 
                        : 'bg-amber-950/10 text-amber-900/80 border border-amber-950/20'
                    }`}>
                      {treaty.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 text-xs text-amber-955 font-serif leading-relaxed text-left">
                    <p>• Gold Reparations Locked: <span className="text-emerald-805 font-pixel font-bold">{treaty.reparations_amount.toLocaleString()} LC</span></p>
                    {treaty.territory_transfer_json.length > 0 && (
                      <p>• Transferring Regions: <span className="text-amber-955 font-pixel font-bold">{treaty.territory_transfer_json.join(', ')}</span></p>
                    )}
                  </div>

                  {treaty.status === 'proposed' && treaty.proposer_country_id !== citizenCountryId && (
                    <button
                      onClick={() => handleAcceptPeace(treaty.id)}
                      disabled={actionLoading}
                      className="w-full h-9 rpg-button text-xs font-display uppercase tracking-widest select-none mt-1"
                    >
                      Accept Treaty & Cease War
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}
