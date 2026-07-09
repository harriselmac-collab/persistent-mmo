'use client';

import React, { useState } from 'react';
import { useGameContext } from '../layout';
import { runEconomicSimulation, SimResult } from '../../../services/formulas';
import { 
  Terminal, Key, PlusCircle, Trash2, Copy, Check, AlertCircle,
  Code, Sliders, Database, Sparkles, TrendingUp, Ticket
} from 'lucide-react';

export default function DeveloperPortal() {
  const {
    developerKeys, createDeveloperKey, revokeDeveloperKey,
    closedAlphaInvites, generateClosedAlphaInvite, refreshData
  } = useGameContext();

  const [activeTab, setActiveTab] = useState<'keys' | 'designer' | 'sim' | 'invites'>('keys');

  const [labelInput, setLabelInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [createdKeyPlainText, setCreatedKeyPlainText] = useState<string | null>(null);

  const [designerMode, setDesignerMode] = useState<'region' | 'item' | 'recipe'>('region');
  
  const [newRegName, setNewRegName] = useState('');
  const [newRegClimate, setNewRegClimate] = useState('temperate');
  const [newRegCost, setNewRegCost] = useState(10);

  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('weapon');
  const [newItemRarity, setNewItemRarity] = useState('common');
  const [newItemVal, setNewItemVal] = useState(50);

  const [newRecResultId, setNewRecResultId] = useState('');
  const [newRecTime, setNewRecTime] = useState(10);
  const [newRecEnergy, setNewRecEnergy] = useState(5);

  const [simPlayers, setSimPlayers] = useState(100);
  const [simTicks, setSimTicks] = useState(50);
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const [customInviteCode, setCustomInviteCode] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const showStatus = (text: string, ok: boolean) => { setStatusMsg({ text, ok }); setTimeout(() => setStatusMsg(null), 3000); };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelInput.trim()) return;
    const res = await createDeveloperKey(labelInput);
    if (res.success && res.key) {
      setCreatedKeyPlainText(res.key);
      setLabelInput('');
      refreshData();
    } else {
      showStatus(res.error || 'Failed to generate developer API key.', false);
    }
  };

  const handleRevokeKey = async (id: number) => {
    const res = await revokeDeveloperKey(id);
    if (res.success) {
      showStatus('Developer key marked inactive.', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to revoke key.', false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePostDesignerModel = async (e: React.FormEvent) => {
    e.preventDefault();
    showStatus('Content Designer Model posted to repository!', true);
    setNewRegName('');
    setNewItemName('');
    setNewRecResultId('');
  };

  const handleTriggerSim = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = runEconomicSimulation(simPlayers, simTicks);
      setSimResult(res);
      setIsSimulating(false);
    }, 1000);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInviteCode.trim()) return;
    const res = await generateClosedAlphaInvite(customInviteCode.toUpperCase());
    if (res.success) {
      showStatus('Alpha Invite Code generated!', true);
      setCustomInviteCode('');
      refreshData();
    } else {
      showStatus(res.error || 'Failed to generate invite code.', false);
    }
  };

  const tabs = [
    { id: 'keys', label: 'API Credentials', icon: Key },
    { id: 'designer', label: 'Visual Designer', icon: Database },
    { id: 'sim', label: 'Economic Sim', icon: Sliders },
    { id: 'invites', label: 'Alpha Invites', icon: Ticket },
  ] as const;

  const inputCls = "rpg-input px-3 py-2 text-xs w-full";

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <Terminal className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Developer & Balancing Portal
            </h1>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">Configure public APIs, create structural items content, and simulate agent inflation index.</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 border border-zinc-800 relative z-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold font-display uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-game-gold/20 text-game-gold border border-game-gold/30' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="h-3 w-3" />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Banner */}
      {statusMsg && (
        <div className={`px-4 py-3 border-l-4 text-xs font-bold font-display uppercase tracking-widest ${
          statusMsg.ok ? 'border-game-emerald bg-emerald-950/30 text-emerald-400' : 'border-red-600 bg-red-950/30 text-red-400'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Central Display */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* ── API KEYS ── */}
          {activeTab === 'keys' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 flex items-center gap-2 relative z-10">
                <Key className="h-4 w-4" /> API Keys Console
              </h2>

              <form onSubmit={handleGenerateKey} className="flex gap-2 relative z-10">
                <input type="text" required value={labelInput} onChange={(e) => setLabelInput(e.target.value)} placeholder="Key Label (e.g. My Market Monitor)..." className="rpg-input flex-1 px-3 py-2 text-xs" />
                <button type="submit" className="rpg-button rpg-button-emerald px-4 py-2 text-[9px] tracking-widest flex items-center gap-1">
                  <PlusCircle className="h-4 w-4" /> Generate New Key
                </button>
              </form>

              {createdKeyPlainText && (
                <div className="bg-emerald-950 border border-emerald-800 p-4 flex justify-between items-center text-xs relative z-10">
                  <div>
                    <span className="text-emerald-400 font-bold block">Save your Key! It will not be shown again:</span>
                    <code className="text-zinc-200 block mt-1 font-mono text-[10px] select-all">{createdKeyPlainText}</code>
                  </div>
                  <button onClick={() => handleCopy(createdKeyPlainText)} className="border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 p-2 text-zinc-400 transition">
                    {copiedKey === createdKeyPlainText ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3 relative z-10">
                <h3 className="text-[9px] text-zinc-500 uppercase font-bold font-display tracking-widest">Your Credentials</h3>
                <div className="border border-zinc-800 bg-zinc-950 divide-y divide-zinc-900">
                  {developerKeys.map((k) => (
                    <div key={k.id} className="p-4 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold font-display text-zinc-200">{k.label || 'API Key'}</p>
                        <p className="text-[9px] text-zinc-500 font-pixel mt-1">Hash: {k.api_key_hash} | Limit: {k.rate_limit_per_min} req/min</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 border text-[9px] font-bold font-display uppercase tracking-widest ${
                          k.is_active ? 'border-game-emerald/30 bg-game-emerald/10 text-emerald-400' : 'border-zinc-700 bg-zinc-900 text-zinc-500'
                        }`}>{k.is_active ? 'active' : 'revoked'}</span>
                        {k.is_active && (
                          <button onClick={() => handleRevokeKey(k.id)} className="border border-red-900/30 bg-red-950/20 text-red-400 p-1.5 transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {developerKeys.length === 0 && <p className="text-zinc-600 py-6 text-center font-serif">No API Keys registered.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── VISUAL CONTENT DESIGNER ── */}
          {activeTab === 'designer' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <div className="flex justify-between items-center border-b border-game-gold/15 pb-3 relative z-10">
                <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest flex items-center gap-2">
                  <Database className="h-4 w-4" /> Visual Content Designer
                </h2>
                
                <div className="flex bg-zinc-950 p-1 border border-zinc-800 text-[9px] font-bold font-display uppercase tracking-widest">
                  {['region', 'item', 'recipe'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDesignerMode(mode as any)}
                      className={`px-2.5 py-1 transition ${designerMode === mode ? 'bg-game-gold/20 text-game-gold border border-game-gold/30' : 'text-zinc-500'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handlePostDesignerModel} className="flex flex-col gap-4 bg-zinc-950 border border-zinc-800 p-5 relative z-10">
                {designerMode === 'region' && (
                  <>
                    <h3 className="text-[9px] font-bold font-display text-zinc-400 uppercase tracking-widest mb-2">Create New Region</h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Region Name</label>
                      <input type="text" required value={newRegName} onChange={(e) => setNewRegName(e.target.value)} placeholder="e.g. Copper Hills..." className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Climate</label>
                      <select value={newRegClimate} onChange={(e) => setNewRegClimate(e.target.value)} className={inputCls}>
                        <option value="temperate">Temperate</option>
                        <option value="cold">Cold Frost</option>
                        <option value="lush">Lush Meadows</option>
                        <option value="rocky">Rocky Mountain</option>
                        <option value="arid">Arid Desert</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Travel Energy Cost</label>
                      <input type="number" value={newRegCost} onChange={(e) => setNewRegCost(Number(e.target.value))} className={inputCls} />
                    </div>
                  </>
                )}

                {designerMode === 'item' && (
                  <>
                    <h3 className="text-[9px] font-bold font-display text-zinc-400 uppercase tracking-widest mb-2">Create Item Template</h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Item Name</label>
                      <input type="text" required value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Titanium Longsword..." className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Item Type</label>
                        <select value={newItemType} onChange={(e) => setNewItemType(e.target.value)} className={inputCls}>
                          <option value="weapon">Weapon</option>
                          <option value="shield">Shield</option>
                          <option value="armor">Armor</option>
                          <option value="helmet">Helmet</option>
                          <option value="boots">Boots</option>
                          <option value="tool">Tool</option>
                          <option value="food">Food</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Rarity</label>
                        <select value={newItemRarity} onChange={(e) => setNewItemRarity(e.target.value)} className={inputCls}>
                          <option value="common">Common</option>
                          <option value="uncommon">Uncommon</option>
                          <option value="rare">Rare</option>
                          <option value="epic">Epic</option>
                          <option value="legendary">Legendary</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Base Currency Value</label>
                      <input type="number" value={newItemVal} onChange={(e) => setNewItemVal(Number(e.target.value))} className={inputCls} />
                    </div>
                  </>
                )}

                {designerMode === 'recipe' && (
                  <>
                    <h3 className="text-[9px] font-bold font-display text-zinc-400 uppercase tracking-widest mb-2">Create Item Crafting Recipe</h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Result Item Template ID</label>
                      <input type="number" required value={newRecResultId} onChange={(e) => setNewRecResultId(e.target.value)} placeholder="Template ID (e.g. 136)..." className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Craft Duration (seconds)</label>
                        <input type="number" value={newRecTime} onChange={(e) => setNewRecTime(Number(e.target.value))} className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Energy Cost</label>
                        <input type="number" value={newRecEnergy} onChange={(e) => setNewRecEnergy(Number(e.target.value))} className={inputCls} />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end pt-2">
                  <button type="submit" className="rpg-button rpg-button-emerald px-5 py-2 text-[9px] tracking-widest flex items-center gap-1">
                    <Sparkles className="h-4 w-4" /> Save Content Template
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── ECONOMIC SIMULATION ── */}
          {activeTab === 'sim' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative text-left">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 flex items-center gap-2 relative z-10">
                <Sliders className="h-4 w-4" /> Economic Agent Simulator
              </h2>

              <div className="bg-zinc-950 border border-zinc-800 p-5 flex flex-col gap-4 relative z-10">
                <p className="text-[10px] text-zinc-500 font-serif leading-relaxed">
                  Run a local micro-player agent loop to simulate commodity market transactions, calculate price indexes, and evaluate gold sink performance.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Players Count ({simPlayers})</label>
                    <input type="range" min={10} max={1000} step={10} value={simPlayers} onChange={(e) => setSimPlayers(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Simulation Ticks ({simTicks})</label>
                    <input type="range" min={10} max={200} step={5} value={simTicks} onChange={(e) => setSimTicks(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={handleTriggerSim} disabled={isSimulating} className="rpg-button rpg-button-emerald px-6 py-2.5 text-[9px] tracking-widest disabled:opacity-50">
                    {isSimulating ? 'Simulating Agent Ticks...' : 'Execute Economic Run'}
                  </button>
                </div>
              </div>

              {simResult && (
                <div className="flex flex-col gap-4 relative z-10">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-zinc-950 border border-zinc-800 p-4 text-center">
                      <TrendingUp className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
                      <p className="text-[8px] text-zinc-500 uppercase font-display tracking-widest">Inflation Rate</p>
                      <p className={`text-sm font-bold font-pixel mt-1 ${simResult.inflationRate > 20 ? 'text-red-400' : 'text-emerald-450'}`}>{simResult.inflationRate}%</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-4 text-center">
                      <Check className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                      <p className="text-[8px] text-zinc-500 uppercase font-display tracking-widest">Stability Index</p>
                      <p className="text-sm font-bold font-pixel text-zinc-200 mt-1">{simResult.priceStabilityIndex}%</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-4 text-center">
                      <Code className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-[8px] text-zinc-500 uppercase font-display tracking-widest">Peak Avg Price</p>
                      <p className="text-sm font-bold font-pixel text-purple-450 mt-1">${Math.max(...simResult.marketPriceTrends).toFixed(2)} LC</p>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-4 flex flex-col gap-2">
                    <h4 className="text-[9px] font-bold font-display text-zinc-400 uppercase tracking-widest">Simulation Output Feed</h4>
                    <div className="bg-zinc-900 border border-zinc-800 p-3 font-mono text-[9px] text-zinc-500 space-y-1 max-h-48 overflow-y-auto">
                      {simResult.logs.map((log, idx) => <p key={idx}>{log}</p>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ALPHA INVITES ── */}
          {activeTab === 'invites' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative text-left">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 flex items-center gap-2 relative z-10">
                <Ticket className="h-4 w-4" /> Closed Alpha Invite Registry
              </h2>

              <form onSubmit={handleCreateInvite} className="flex gap-2 relative z-10">
                <input type="text" required value={customInviteCode} onChange={(e) => setCustomInviteCode(e.target.value)} placeholder="Create Custom Code (e.g. AEGIS-SPECIAL)..." className="rpg-input flex-1 px-3 py-2 text-xs" />
                <button type="submit" className="rpg-button rpg-button-emerald px-4 py-2 text-[9px] tracking-widest">Register Key</button>
              </form>

              <div className="flex flex-col gap-3 relative z-10">
                <h3 className="text-[9px] text-zinc-500 uppercase font-bold font-display tracking-widest">Alpha Invitation Codes ({closedAlphaInvites.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                  {closedAlphaInvites.map((inv) => (
                    <div key={inv.id} className="bg-zinc-950 border border-zinc-800 p-3 flex justify-between items-center text-xs">
                      <code className="font-mono text-zinc-300 font-bold">{inv.invite_code}</code>
                      <span className={`px-2 py-0.5 border text-[9px] font-bold font-display uppercase tracking-widest ${
                        inv.is_used ? 'border-red-900/30 bg-red-950/20 text-red-400' : 'border-game-emerald/30 bg-emerald-950/20 text-emerald-400'
                      }`}>{inv.is_used ? 'Used' : 'Active'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Help Column */}
        <div className="flex flex-col gap-6">
          <div className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-4">
            <h3 className="text-xs font-bold font-display text-amber-950 uppercase tracking-widest border-b border-amber-950/20 pb-3 flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-amber-900" /> API Integration
            </h3>
            <div className="flex flex-col gap-3 text-[11px] text-amber-950/80 font-serif leading-relaxed">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-800 shrink-0 mt-0.5" />
                <p>Include credentials inside request headers as: <code className="bg-amber-950/10 px-1 border border-amber-950/20">Authorization: Bearer your_key</code>.</p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-800 shrink-0 mt-0.5" />
                <p>Default rate limits are capped at <strong>60 requests per minute</strong>. Exceeding triggers HTTP 429 locks.</p>
              </div>
            </div>
          </div>

          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-md relative">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest relative z-10">Integration Snippet</h3>
            <pre className="bg-zinc-950 border border-game-gold/10 p-3 text-[9px] text-zinc-400 overflow-x-auto font-pixel relative z-10 leading-relaxed">
{`const res = await fetch('https://aegis.com/api/v1/listings', {
  headers: {
    'Authorization': 'Bearer aegis_pk_live_xx'
  }
});
const data = await res.json();`}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
