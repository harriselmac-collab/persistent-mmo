'use client';

import { useGameContext } from '../layout';
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Landmark, Award, Users, FileText, PlusCircle, CheckCircle, XCircle, 
  AlertCircle, Sparkles, TrendingUp, DollarSign, Hammer, Scale, Coins,
  Trash2, Bell, ShieldAlert, UserPlus, UserMinus, Flame, Crosshair, HelpCircle,
  Clock, ArrowRightLeft, Lock, Pickaxe
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

export default function KingdomPage() {
  const game = useGameContext();
  const {
    profile,
    stats,
    currencies,
    resources,
    inventory,
    refreshData,
    actionLoading,
    
    // Marketplace APIs
    marketListings,
    marketOrders,
    marketHistory,
    listAssetForSale,
    placeBuyOrder,
    cancelListing,
    cancelOrder,
    
    // Guild APIs
    guilds,
    myGuild,
    guildMembers,
    createGuild,
    applyToGuild,
    withdrawGuildVault,
    
    // Politics APIs
    countries,
    politicalParties,
    activeElections,
    candidates,
    bills,
    createParty,
    joinParty,
    runForOffice,
    voteCandidate,
    proposeBill,
    voteBill,
    
    // Industrial APIs
    myCompanies,
    companyTemplates,
    companyJobs,
    createCompany,
    vaultCashTransfer,
    vaultResourceTransfer,
    postCompanyJob,
    applyJob,
    runCompanyShift,
    
    // Warfare APIs
    activeWars,
    armyUnits,
    declareWar,
    mobilizeArmy,
    moveArmy,
    engageBattle,
    proposePeace
  } = game;

  const playerLevel = stats?.level || 1;

  const tabs = [
    { id: 'market', label: 'Town Market', icon: Scale, level: 5 },
    { id: 'guild', label: 'Guild Center', icon: Users, level: 10 },
    { id: 'senate', label: 'Senate & Politics', icon: Landmark, level: 15 },
    { id: 'companies', label: 'Companies', icon: Hammer, level: 20 },
    { id: 'war', label: 'War Room', icon: Flame, level: 30 },
  ] as const;

  const [activeTab, setActiveTab] = useState<'market' | 'guild' | 'senate' | 'companies' | 'war'>('market');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  // ────────────────────────────────────────────────────────
  // TOWN MARKET STATES & LOGIC
  // ────────────────────────────────────────────────────────
  const [marketBrowseTab, setMarketBrowseTab] = useState<'buy' | 'sell' | 'orders'>('buy');
  const [marketSearch, setMarketSearch] = useState('');
  
  // Sale inputs
  const [sellAssetType, setSellAssetType] = useState<'resource' | 'item'>('resource');
  const [sellResourceId, setSellResourceId] = useState(1);
  const [sellQuantity, setSellQuantity] = useState('1');
  const [sellPrice, setSellPrice] = useState('10');

  // Buy inputs
  const [buyResourceId, setBuyResourceId] = useState(1);
  const [buyQuantity, setBuyQuantity] = useState('1');
  const [buyPrice, setBuyPrice] = useState('10');

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(sellQuantity);
    const prc = parseFloat(sellPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(prc) || prc <= 0) {
      showStatus('Invalid quantity or price.', false);
      return;
    }
    const res = await listAssetForSale(null, sellAssetType, sellResourceId, null, qty, prc, 'local');
    if (res.success) {
      showStatus('Listed asset on market successfully!', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to list asset.', false);
    }
  };

  const handleCreateBuyOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(buyQuantity);
    const prc = parseFloat(buyPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(prc) || prc <= 0) {
      showStatus('Invalid quantity or price.', false);
      return;
    }
    const res = await placeBuyOrder(null, 'resource', buyResourceId, null, qty, prc, 'local');
    if (res.success) {
      showStatus('Market order created successfully!', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to create order.', false);
    }
  };

  // ────────────────────────────────────────────────────────
  // GUILD STATES & LOGIC
  // ────────────────────────────────────────────────────────
  const [createGuildOpen, setCreateGuildOpen] = useState(false);
  const [guildName, setGuildName] = useState('');
  const [guildTag, setGuildTag] = useState('');
  const [guildDesc, setGuildDesc] = useState('');

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('10');
  const [withdrawIsGold, setWithdrawIsGold] = useState(false);

  const handleCreateGuildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guildName || !guildTag) return;
    const res = await createGuild(guildName, guildTag, guildDesc);
    if (res.success) {
      setCreateGuildOpen(false);
      setGuildName('');
      setGuildTag('');
      setGuildDesc('');
      showStatus('Guild registered successfully!', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to create guild', false);
    }
  };

  const handleWithdrawGuildVaultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myGuild) return;
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return;
    const res = await withdrawGuildVault(myGuild.id, amt, withdrawIsGold);
    if (res.success) {
      setWithdrawOpen(false);
      showStatus('Guild funds withdrawn successfully!', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to withdraw guild funds.', false);
    }
  };

  // ────────────────────────────────────────────────────────
  // SENATE STATES & LOGIC
  // ────────────────────────────────────────────────────────
  const [senateTab, setSenateTab] = useState<'elections' | 'bills' | 'party'>('bills');
  const [billTitle, setBillTitle] = useState('');
  const [billDesc, setBillDesc] = useState('');
  const [billType, setBillType] = useState<'tax_change' | 'budget_transfer'>('tax_change');
  const [billParamVal, setBillParamVal] = useState('5.00');

  const [partyName, setPartyName] = useState('');
  const [partyDesc, setPartyDesc] = useState('');

  const handleProposeBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTitle || !billDesc) return;
    let params: Record<string, any> = {};
    if (billType === 'tax_change') {
      const tax = parseFloat(billParamVal);
      if (isNaN(tax) || tax < 0 || tax > 100) return;
      params = { vat_rate: tax, income_tax_rate: tax };
    } else {
      const amt = parseFloat(billParamVal);
      if (isNaN(amt) || amt <= 0) return;
      params = { amount: amt };
    }
    const res = await proposeBill(billTitle, billDesc, billType, params);
    if (res.success) {
      setBillTitle('');
      setBillDesc('');
      setBillParamVal('');
      showStatus('Proposed senate bill created successfully!', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to propose bill.', false);
    }
  };

  const handleVoteBill = async (billId: number, vote: 'yes' | 'no') => {
    const res = await voteBill(billId, vote);
    if (res.success) {
      showStatus('Vote registered successfully!', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to register vote.', false);
    }
  };

  const handleRegisterAsCandidate = async (electionId: number) => {
    const res = await runForOffice(electionId);
    if (res.success) {
      showStatus('Registered as candidate successfully!', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to register as candidate.', false);
    }
  };

  const handleCreatePartySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || !partyDesc) return;
    const res = await createParty(partyName, partyDesc);
    if (res.success) {
      setPartyName('');
      setPartyDesc('');
      showStatus('Political party formed successfully!', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to form party.', false);
    }
  };

  // ────────────────────────────────────────────────────────
  // COMPANIES STATES & LOGIC
  // ────────────────────────────────────────────────────────
  const [companiesTab, setCompaniesTab] = useState<'dashboard' | 'labor'>('labor');
  const [newCompName, setNewCompName] = useState('');
  const [newCompRegion, setNewCompRegion] = useState(1);
  const [newCompTemplate, setNewCompTemplate] = useState(1);
  
  // Work shift progress tracker
  const [shiftProgress, setShiftProgress] = useState(0);
  const [activeShiftCompId, setActiveShiftCompId] = useState<string | null>(null);
  const shiftTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (shiftTimerRef.current) clearInterval(shiftTimerRef.current);
    };
  }, []);

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;
    const res = await createCompany(newCompName, Number(newCompRegion), Number(newCompTemplate));
    if (res.success) {
      setNewCompName('');
      showStatus(`Company incorporated successfully!`, true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to incorporate company.', false);
    }
  };

  const handleWorkShift = (companyId: string, companyName: string) => {
    if (activeShiftCompId) return;
    setActiveShiftCompId(companyId);
    setShiftProgress(0);

    const steps = 100;
    const duration = 2000; // 2 seconds work animation
    let step = 0;

    shiftTimerRef.current = setInterval(async () => {
      step++;
      setShiftProgress(step);
      if (step >= steps) {
        if (shiftTimerRef.current) clearInterval(shiftTimerRef.current);
        const res = await runCompanyShift(companyId);
        if (res.success) {
          showStatus(`Shift completed at ${companyName}. Wage and materials dispatched.`, true);
          refreshData();
        } else {
          showStatus(res.error || 'Work shift failed.', false);
        }
        setActiveShiftCompId(null);
        setShiftProgress(0);
      }
    }, duration / steps);
  };

  // ────────────────────────────────────────────────────────
  // WARFARE STATES & LOGIC
  // ────────────────────────────────────────────────────────
  const [warTab, setWarTab] = useState<'campaigns' | 'commands'>('campaigns');
  const [targetCountryId, setTargetCountryId] = useState(2);
  const [selectedArmyId, setSelectedArmyId] = useState<number | null>(null);
  const [targetMoveRegionId, setTargetMoveRegionId] = useState(2);

  const handleDeclareWarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await declareWar(targetCountryId);
    if (res.success) {
      showStatus('War declared successfully! Command your units.', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to declare war.', false);
    }
  };

  const handleCommandMovement = async (armyId: number) => {
    const res = await moveArmy(armyId, targetMoveRegionId);
    if (res.success) {
      showStatus('Army marched successfully. Consumed 10 energy.', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to move army.', false);
    }
  };

  const handleCommandInvasion = async (armyId: number, regionId: number) => {
    const res = await engageBattle(armyId, regionId);
    if (res.success) {
      showStatus('Invasion executed successfully! The region has been occupied.', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to invade region.', false);
    }
  };

  // Current tab metadata
  const selectedTabMeta = tabs.find(t => t.id === activeTab);
  const isTabLocked = selectedTabMeta ? playerLevel < selectedTabMeta.level : false;

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

      {/* Header Panel */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Kingdom Registry
            </h2>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">
              Participate in national politics, declare territorial campaigns, and coordinate marketplace trade.
            </p>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 border border-zinc-800 relative z-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTabLockedCheck = playerLevel < tab.level;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold font-display uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-game-gold/20 text-game-gold border border-game-gold/30' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{tab.label}</span>
                {isTabLockedCheck && <Lock className="h-2.5 w-2.5 ml-1 text-zinc-650" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Panel Display */}
      <div>
        {isTabLocked ? (
          <div className="rpg-panel-stone p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <div className="h-16 w-16 border-2 border-zinc-800 rounded-full flex items-center justify-center bg-zinc-950 text-zinc-600 shadow-inner">
              <Lock className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-zinc-400 uppercase tracking-widest">
                System Locked
              </h3>
              <p className="text-xs text-zinc-500 font-serif mt-1.5 max-w-sm mx-auto">
                The {selectedTabMeta?.label} is currently sealed. Your character must reach Commander Level {selectedTabMeta?.level} to unlock this system.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* ──────────────────────────────────────────────────────── */}
            {/* TAB: TOWN MARKETPLACE */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'market' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Marketplace Browse List */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <div className="flex justify-between items-center border-b border-game-gold/15 pb-3">
                      <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest">Active Listings</h3>
                      
                      <div className="flex bg-zinc-950 p-0.5 border border-zinc-900 text-[9px] font-bold font-display uppercase tracking-widest">
                        {['buy', 'sell', 'orders'].map((bt) => (
                          <button
                            key={bt}
                            onClick={() => setMarketBrowseTab(bt as any)}
                            className={`px-3 py-1 transition-all ${marketBrowseTab === bt ? 'bg-game-gold/20 text-game-gold border border-game-gold/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            {bt === 'buy' ? 'Browse Shop' : bt === 'sell' ? 'Sell Asset' : 'Place Buy Bid'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {marketBrowseTab === 'buy' && (
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={marketSearch}
                            onChange={(e) => setMarketSearch(e.target.value)}
                            placeholder="Search exchange products..."
                            className="rpg-input px-3 py-2 text-xs w-full pl-8"
                          />
                          <Scale className="h-4 w-4 text-zinc-500 absolute left-2.5 top-2.5" />
                        </div>

                        <div className="divide-y divide-zinc-900 border border-zinc-800 bg-zinc-950">
                          {marketListings.filter(l => l.status === 'active' && resources.find(r => r.id === l.resource_id)?.name.toLowerCase().includes(marketSearch.toLowerCase())).map((listing) => {
                            const res = resources.find(r => r.id === listing.resource_id);
                            return (
                              <div key={listing.id} className="p-3 flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2.5">
                                  {renderItemIcon(res?.name || '', '📦', 'h-8 w-8')}
                                  <div>
                                    <p className="font-bold text-zinc-200">{res?.name}</p>
                                    <p className="text-[9px] text-zinc-500">Seller Balance: {listing.quantity} units</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <span className="text-xs font-bold font-pixel text-game-emerald block">{listing.price_per_unit} LC</span>
                                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-display">per unit</span>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      const resBuy = await placeBuyOrder(null, 'resource', listing.resource_id ?? null, null, 1, listing.price_per_unit, 'local');
                                      if (resBuy.success) {
                                        showStatus('Purchased 1 unit from market!', true);
                                        refreshData();
                                      } else {
                                        showStatus(resBuy.error || 'Purchase failed', false);
                                      }
                                    }}
                                    className="rpg-button px-3 py-1.5 text-[9px] tracking-widest"
                                  >
                                    Buy 1
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {marketListings.filter(l => l.status === 'active').length === 0 && (
                            <p className="text-zinc-600 text-center py-6 font-serif">No products listed on market.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {marketBrowseTab === 'sell' && (
                      <form onSubmit={handleCreateListing} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Resource Type</label>
                            <select
                              value={sellResourceId}
                              onChange={(e) => setSellResourceId(Number(e.target.value))}
                              className="rpg-input px-3 py-2 text-xs w-full"
                            >
                              {resources.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Quantity</label>
                            <input
                              type="number"
                              required
                              value={sellQuantity}
                              onChange={(e) => setSellQuantity(e.target.value)}
                              className="rpg-input px-3 py-2 text-xs w-full"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Price per Unit (LC)</label>
                          <input
                            type="number"
                            required
                            value={sellPrice}
                            onChange={(e) => setSellPrice(e.target.value)}
                            className="rpg-input px-3 py-2 text-xs w-full"
                          />
                        </div>

                        <button type="submit" disabled={actionLoading} className="rpg-button rpg-button-emerald w-full py-2.5 text-[9px] tracking-widest">
                          List Asset on Shop
                        </button>
                      </form>
                    )}

                    {marketBrowseTab === 'orders' && (
                      <form onSubmit={handleCreateBuyOrder} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Resource Type</label>
                            <select
                              value={buyResourceId}
                              onChange={(e) => setBuyResourceId(Number(e.target.value))}
                              className="rpg-input px-3 py-2 text-xs w-full"
                            >
                              {resources.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Quantity to Bid</label>
                            <input
                              type="number"
                              required
                              value={buyQuantity}
                              onChange={(e) => setBuyQuantity(e.target.value)}
                              className="rpg-input px-3 py-2 text-xs w-full"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Price bid per Unit (LC)</label>
                          <input
                            type="number"
                            required
                            value={buyPrice}
                            onChange={(e) => setBuyPrice(e.target.value)}
                            className="rpg-input px-3 py-2 text-xs w-full"
                          />
                        </div>

                        <button type="submit" disabled={actionLoading} className="rpg-button w-full py-2.5 text-[9px] tracking-widest">
                          Submit Buy Bid Contract
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Right sidebar: Wallet balances & Active positions */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 shadow-lg relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Wallet Accounts</span>
                    <div className="flex flex-col gap-3">
                      <div className="bg-zinc-950 p-3 border border-zinc-900 flex justify-between items-center">
                        <span className="text-xs text-zinc-400 flex items-center gap-1.5"><Coins className="h-4 w-4 text-game-emerald" /> Local currency</span>
                        <span className="text-sm font-pixel font-bold text-game-emerald">{currencies?.local_currency_balance.toLocaleString()} LC</span>
                      </div>
                      <div className="bg-zinc-950 p-3 border border-zinc-900 flex justify-between items-center">
                        <span className="text-xs text-zinc-400 flex items-center gap-1.5"><Award className="h-4 w-4 text-game-gold" /> Gold Bullion</span>
                        <span className="text-sm font-pixel font-bold text-game-gold">{currencies?.gold.toFixed(4)} G</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────── */}
            {/* TAB: GUILD CENTER */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'guild' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                  {myGuild ? (
                    <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
                      <div className="rpg-rivet top-1 left-1" />
                      <div className="rpg-rivet top-1 right-1" />
                      <div className="rpg-rivet bottom-1 left-1" />
                      <div className="rpg-rivet bottom-1 right-1" />

                      <div className="flex justify-between items-start border-b border-game-gold/15 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="border border-game-gold/30 bg-game-gold/10 text-game-gold px-2 py-0.5 text-[9px] font-bold font-pixel">[{myGuild.tag}]</span>
                            <h2 className="text-lg font-bold font-display text-zinc-200">{myGuild.name}</h2>
                          </div>
                          <p className="text-zinc-500 text-xs font-serif mt-1">{myGuild.description || 'No description provided.'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Guild Leader</p>
                          <p className="text-sm font-bold font-display text-zinc-300 mt-0.5">{myGuild.leader_name || 'Owner'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { icon: Coins, color: 'text-game-gold', label: 'Treasury', value: `$${myGuild.treasury_local.toLocaleString()}` },
                          { icon: Award, color: 'text-amber-400', label: 'Gold Vault', value: `${myGuild.treasury_gold.toLocaleString()} G` },
                          { icon: Users, color: 'text-blue-400', label: 'Citizens', value: String(myGuild.members_count || 1) },
                        ].map((s, i) => (
                          <div key={i} className="bg-zinc-950 border border-zinc-800 p-3 text-center">
                            <s.icon className={`h-5 w-5 ${s.color} mx-auto mb-1`} />
                            <p className="text-[8px] text-zinc-500 uppercase font-display tracking-widest">{s.label}</p>
                            <p className={`text-sm font-bold font-pixel ${s.color} mt-1`}>{s.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => setWithdrawOpen(!withdrawOpen)} className="rpg-button flex-1 py-2 text-[9px] tracking-widest">
                          Withdraw Treasury Funds
                        </button>
                      </div>

                      {withdrawOpen && (
                        <form onSubmit={handleWithdrawGuildVaultSubmit} className="bg-zinc-950 border border-game-gold/15 p-4 flex flex-col gap-3">
                          <h4 className="text-[9px] uppercase font-bold font-display text-game-gold tracking-widest">Treasury Vault Withdrawal</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Amount" className="rpg-input px-3 py-1.5 text-xs animate-none" />
                            <select value={withdrawIsGold ? 'gold' : 'local'} onChange={(e) => setWithdrawIsGold(e.target.value === 'gold')} className="rpg-input px-3 py-1.5 text-xs animate-none">
                              <option value="local">Local Currency</option>
                              <option value="gold">Gold</option>
                            </select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setWithdrawOpen(false)} className="rpg-button px-3 py-1.5 text-[9px] tracking-widest opacity-60">Cancel</button>
                            <button type="submit" className="rpg-button rpg-button-emerald px-4 py-1.5 text-[9px] tracking-widest">Withdraw</button>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="rpg-panel-stone p-8 rounded-none flex flex-col items-center gap-5 text-center shadow-lg relative">
                      <div className="rpg-rivet top-1 left-1" />
                      <div className="rpg-rivet top-1 right-1" />
                      <div className="rpg-rivet bottom-1 left-1" />
                      <div className="rpg-rivet bottom-1 right-1" />
                      
                      <ShieldAlert className="h-12 w-12 text-zinc-600" />
                      <div>
                        <h3 className="text-sm font-bold font-display text-zinc-300">Form your Coalition</h3>
                        <p className="text-xs text-zinc-500 font-serif mt-1 max-w-md">
                          Guilds enable player coordination, shared assets, resource storage, and high-tier military cooperation.
                        </p>
                      </div>

                      <button onClick={() => setCreateGuildOpen(!createGuildOpen)} className="rpg-button rpg-button-emerald px-4 py-2.5 text-[9px] tracking-widest">
                        Form a New Guild
                      </button>

                      {createGuildOpen && (
                        <form onSubmit={handleCreateGuildSubmit} className="w-full max-w-md text-left bg-zinc-950 border border-game-gold/15 p-5 flex flex-col gap-3 mt-3">
                          <h4 className="text-[9px] uppercase font-bold font-display text-game-gold tracking-widest">Guild Registration</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Guild Name</label>
                              <input type="text" required value={guildName} onChange={(e) => setGuildName(e.target.value)} placeholder="e.g. Iron Shields" className="rpg-input px-3 py-2 text-xs w-full animate-none" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Tag (Max 5)</label>
                              <input type="text" required value={guildTag} onChange={(e) => setGuildTag(e.target.value)} placeholder="e.g. SHLD" maxLength={5} className="rpg-input px-3 py-2 text-xs w-full animate-none" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Description</label>
                            <textarea value={guildDesc} onChange={(e) => setGuildDesc(e.target.value)} placeholder="Our guild mission..." className="rpg-input px-3 py-2 text-xs w-full h-20 resize-none animate-none" />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setCreateGuildOpen(false)} className="rpg-button px-3 py-1.5 text-[9px] tracking-widest opacity-60">Cancel</button>
                            <button type="submit" disabled={actionLoading} className="rpg-button rpg-button-emerald px-4 py-1.5 text-[9px] tracking-widest">Register Guild</button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-1 flex flex-col gap-6">
                  {/* Guild lists */}
                  <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 shadow-lg relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Active Guilds</span>
                    <div className="flex flex-col gap-2">
                      {guilds.map((g) => (
                        <div key={g.id} className="bg-zinc-950 p-2.5 border border-zinc-900 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[10px] font-bold font-pixel text-game-gold">[{g.tag}]</span>
                            <span className="text-zinc-200 ml-1 font-semibold">{g.name}</span>
                          </div>
                          {!myGuild && (
                            <button
                              onClick={async () => {
                                const resApp = await applyToGuild(g.id, 'I wish to join.');
                                if (resApp.success) {
                                  showStatus('Application submitted to leader!', true);
                                } else {
                                  showStatus(resApp.error || 'Failed to apply.', false);
                                }
                              }}
                              className="rpg-button px-2.5 py-1 text-[8px]"
                            >
                              Join
                            </button>
                          )}
                        </div>
                      ))}
                      {guilds.length === 0 && (
                        <p className="text-zinc-600 text-center py-4 font-serif text-[10px]">No active guilds found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────── */}
            {/* TAB: SENATE & POLITICS */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'senate' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Propose and vote bill */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  {/* Propose Bill */}
                  <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3">
                      Propose National Bill
                    </h3>

                    <form onSubmit={handleProposeBillSubmit} className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest font-bold">Bill Title</label>
                          <input type="text" required value={billTitle} onChange={(e) => setBillTitle(e.target.value)} placeholder="e.g. Grain Tax Relief" className="rpg-input px-3 py-2 text-xs w-full animate-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest font-bold">Bill Type</label>
                          <select value={billType} onChange={(e) => setBillType(e.target.value as any)} className="rpg-input px-3 py-2 text-xs w-full animate-none">
                            <option value="tax_change">Change Tax Rates</option>
                            <option value="budget_transfer">Treasury Payout</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest font-bold">Tax Rate / Amount</label>
                          <input type="text" required value={billParamVal} onChange={(e) => setBillParamVal(e.target.value)} className="rpg-input px-3 py-2 text-xs w-full animate-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest font-bold">Proposer</label>
                          <input type="text" disabled value={profile?.username} className="rpg-input px-3 py-2 text-xs w-full bg-zinc-950 opacity-60 border-zinc-900" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest font-bold">Bill Description</label>
                        <textarea required value={billDesc} onChange={(e) => setBillDesc(e.target.value)} placeholder="Explain the structural benefits..." className="rpg-input px-3 py-2 text-xs w-full h-16 resize-none animate-none" />
                      </div>

                      <button type="submit" disabled={actionLoading} className="rpg-button rpg-button-emerald py-2.5 text-[9px] tracking-widest">
                        Submit Bill to Vote
                      </button>
                    </form>
                  </div>

                  {/* Active Bills voting */}
                  <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3">Active Senate Bills</h3>
                    <div className="flex flex-col gap-3">
                      {bills.filter(b => b.status === 'voting').map((bill) => (
                        <div key={bill.id} className="bg-zinc-950 border border-zinc-900 p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-zinc-200 text-xs font-display">{bill.title}</h4>
                              <p className="text-zinc-500 text-[11px] font-serif mt-1">{bill.description}</p>
                            </div>
                            <span className="border border-game-gold/30 bg-game-gold/10 text-game-gold px-2 py-0.5 text-[9px] uppercase font-display font-bold">Voting</span>
                          </div>
                          
                          <div className="flex justify-end gap-2.5 border-t border-zinc-900 pt-3">
                            <button onClick={() => handleVoteBill(bill.id, 'yes')} className="rpg-button rpg-button-emerald px-4 py-1.5 text-[9px]">Vote Aye (Yes)</button>
                            <button onClick={() => handleVoteBill(bill.id, 'no')} className="rpg-button rpg-button-crimson px-4 py-1.5 text-[9px]">Vote Nay (No)</button>
                          </div>
                        </div>
                      ))}
                      {bills.filter(b => b.status === 'voting').length === 0 && (
                        <p className="text-zinc-600 text-center py-6 font-serif">No legislative bills up for vote currently.</p>
                      )}
                    </div>
                  </div>

                </div>

                <div className="lg:col-span-1 flex flex-col gap-6">
                  {/* Parties & Elections */}
                  <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 shadow-lg relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Elections Center</span>
                    <div className="flex flex-col gap-2">
                      {activeElections.map((elec) => (
                        <div key={elec.id} className="bg-zinc-950 p-3 border border-zinc-900 flex flex-col gap-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-zinc-300">National Election</span>
                            <span className="text-[9px] text-zinc-500 uppercase">{elec.status}</span>
                          </div>
                          <button
                            onClick={() => handleRegisterAsCandidate(elec.id)}
                            className="rpg-button w-full py-1 text-[8px]"
                          >
                            Register Candidate
                          </button>
                        </div>
                      ))}
                      {activeElections.length === 0 && (
                        <p className="text-zinc-600 text-center py-4 font-serif text-[10px]">No active elections at this cycle.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────── */}
            {/* TAB: COMPANIES */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'companies' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Companies list and creation */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  {/* Create Company */}
                  <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3">
                      Incorporate Industrial Factory
                    </h3>

                    <form onSubmit={handleCreateCompanySubmit} className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest font-bold">Company Name</label>
                          <input type="text" required value={newCompName} onChange={(e) => setNewCompName(e.target.value)} placeholder="e.g. Ironhold Smelter" className="rpg-input px-3 py-2 text-xs w-full animate-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest font-bold">Production Facility</label>
                          <select value={newCompTemplate} onChange={(e) => setNewCompTemplate(Number(e.target.value))} className="rpg-input px-3 py-2 text-xs w-full animate-none">
                            {companyTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name} (Cost: {t.cost_local} LC)</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button type="submit" disabled={actionLoading} className="rpg-button rpg-button-emerald py-2.5 text-[9px] tracking-widest">
                        Incorporate Company
                      </button>
                    </form>
                  </div>

                  {/* My Companies List */}
                  <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3">Your Production Workshops</h3>
                    <div className="flex flex-col gap-3">
                      {myCompanies.map((comp) => {
                        const isWorking = activeShiftCompId === comp.id;
                        const temp = companyTemplates.find(t => t.id === (comp as any).template_id);
                        return (
                          <div key={comp.id} className="bg-zinc-950 border border-zinc-900 p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-bold text-zinc-200 text-xs font-display">{comp.name}</h4>
                                <p className="text-[9px] text-zinc-500 uppercase font-display mt-0.5">{temp?.name || 'Production Factory'}</p>
                              </div>
                              <span className="border border-zinc-800 bg-zinc-900 text-zinc-400 px-2 py-0.5 text-[8px] font-pixel">ID: {comp.id.slice(0, 8)}</span>
                            </div>

                            {isWorking && (
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-[9px] text-zinc-500 font-pixel">
                                  <span>Running machinery...</span>
                                  <span>{shiftProgress}%</span>
                                </div>
                                <div className="w-full bg-zinc-900 border border-zinc-800 h-2 shadow-inner">
                                  <div
                                    className="bg-game-gold h-full transition-all duration-75 shadow-[0_0_8px_rgba(229,193,88,0.4)]"
                                    style={{ width: `${shiftProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-2.5">
                              <button
                                onClick={() => handleWorkShift(comp.id, comp.name)}
                                disabled={isWorking || activeShiftCompId !== null}
                                className="rpg-button px-4 py-2 text-[9px] flex items-center gap-1.5"
                              >
                                <Pickaxe className="h-3.5 w-3.5" />
                                {isWorking ? 'RUNNING SHIFT...' : 'RUN WORK SHIFT (2s)'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {myCompanies.length === 0 && (
                        <p className="text-zinc-600 text-center py-6 font-serif">You do not own any industrial companies.</p>
                      )}
                    </div>
                  </div>

                </div>

                <div className="lg:col-span-1 flex flex-col gap-6">
                  {/* Labor Market Board */}
                  <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 shadow-lg relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Labor Market Jobs</span>
                    <div className="flex flex-col gap-2">
                      {companyJobs.map((job) => (
                        <div key={job.id} className="bg-zinc-950 p-2.5 border border-zinc-900 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-zinc-300">Salary: {job.salary} LC</p>
                            <p className="text-[9px] text-zinc-500 uppercase mt-0.5">Vacancies: {job.vacancies}</p>
                          </div>
                          <button
                            onClick={async () => {
                              const resJob = await applyJob(job.id);
                              if (resJob.success) {
                                showStatus('Contract signed! You are now employed here.', true);
                              } else {
                                showStatus(resJob.error || 'Failed to apply.', false);
                              }
                            }}
                            className="rpg-button px-2.5 py-1 text-[8px]"
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                      {companyJobs.length === 0 && (
                        <p className="text-zinc-600 text-center py-4 font-serif text-[10px]">No active job openings.</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ──────────────────────────────────────────────────────── */}
            {/* TAB: WAR ROOM */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'war' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* War declarations & list */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  {/* Declare war */}
                  <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3">
                      Declare Territorial Conquest
                    </h3>

                    <form onSubmit={handleDeclareWarSubmit} className="flex gap-2">
                      <select
                        value={targetCountryId}
                        onChange={(e) => setTargetCountryId(Number(e.target.value))}
                        className="rpg-input px-3 py-2 text-xs flex-1 animate-none"
                      >
                        {countries.filter(c => c.id !== profile?.citizenship_country_id).map(c => (
                          <option key={c.id} value={c.id}>Invade {c.name} borders</option>
                        ))}
                      </select>
                      <button type="submit" disabled={actionLoading} className="rpg-button rpg-button-crimson px-5 py-2 text-[9px] tracking-widest font-bold">
                        DECLARE WAR
                      </button>
                    </form>
                  </div>

                  {/* Active Campaigns */}
                  <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3">Active Military Campaigns</h3>
                    <div className="flex flex-col gap-3">
                      {activeWars.map((war) => {
                        const att = countries.find(c => c.id === war.attacker_country_id);
                        const df = countries.find(c => c.id === war.defender_country_id);
                        return (
                          <div key={war.id} className="bg-zinc-950 border border-zinc-900 p-4 flex justify-between items-center text-xs">
                            <div>
                              <h4 className="font-bold text-rose-500 text-xs font-display">{att?.name} vs {df?.name}</h4>
                              <p className="text-zinc-500 text-[10px] uppercase font-display mt-0.5">Campaign status: {war.status}</p>
                            </div>
                            <span className="border border-red-950 bg-red-950/20 text-red-500 px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold font-display animate-pulse">WAR ACTIVE</span>
                          </div>
                        );
                      })}
                      {activeWars.length === 0 && (
                        <p className="text-zinc-600 text-center py-6 font-serif">Territorial borders are secure. Peace reigns across kingdoms.</p>
                      )}
                    </div>
                  </div>

                </div>

                <div className="lg:col-span-1 flex flex-col gap-6">
                  {/* Army Commands */}
                  <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 shadow-lg relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest font-bold">Army Mobilization</span>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={async () => {
                          const resMob = await mobilizeArmy();
                          if (resMob.success) showStatus('Mobilized 1,000 troops!', true);
                          else showStatus(resMob.error || 'Failed to mobilize.', false);
                        }}
                        className="rpg-button w-full py-2 text-[9px] tracking-widest"
                      >
                        Mobilize capital troops
                      </button>

                      {armyUnits.map((a) => (
                        <div key={a.id} className="bg-zinc-950 p-2.5 border border-zinc-900 flex flex-col gap-2 text-[10px]">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-zinc-300">Regiment #{a.id}</span>
                            <span className="text-zinc-500">Qty: {a.size}</span>
                          </div>
                          
                          <div className="flex gap-1.5 mt-1">
                            <select
                              value={targetMoveRegionId}
                              onChange={(e) => setTargetMoveRegionId(Number(e.target.value))}
                              className="rpg-input px-2 py-1 text-[9px] flex-1 animate-none"
                            >
                              <option value="2">Sector 2</option>
                              <option value="3">Sector 3</option>
                              <option value="4">Sector 4</option>
                            </select>
                            <button
                              onClick={() => handleCommandMovement(a.id)}
                              className="rpg-button px-2 py-1 text-[8px]"
                            >
                              March
                            </button>
                            <button
                              onClick={() => handleCommandInvasion(a.id, targetMoveRegionId)}
                              className="rpg-button rpg-button-crimson px-2 py-1 text-[8px]"
                            >
                              Invade
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
