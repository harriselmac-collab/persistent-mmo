'use client';

import { useGameContext } from '../layout';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
import { ApexOptions } from 'apexcharts';
import {
  ShoppingBag,
  Plus,
  Coins,
  History,
  TrendingUp,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Clock,
  Trash2,
  Bell,
  Star,
  ArrowRightLeft,
  DollarSign
} from 'lucide-react';

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

export default function MarketplacePage() {
  const {
    resources,
    currencies,
    playerResources,
    myCompanies,
    activeCompanyInventory,
    activeCompanyVault,
    activeCompanyId,
    inventory,
    marketListings,
    marketOrders,
    marketHistory,
    marketNotifications,
    watchlist,
    priceAlerts,
    listAssetForSale,
    placeBuyOrder,
    cancelListing,
    cancelOrder,
    toggleWatch,
    createAlert,
    deleteAlert,
    readNotification,
    refreshData
  } = useGameContext();

  const getRarityClass = (itemName: string) => {
    switch (itemName) {
      case 'Wood':
      case 'Stone':
      case 'Wheat Bread':
        return 'rarity-common';
      case 'Iron Ore':
      case 'Iron Sword':
      case 'Iron Plate Helm':
      case 'Iron Plate Chest':
      case 'Leather Boots':
        return 'rarity-uncommon';
      case 'Steel Pickaxe':
      case 'Travel Ticket':
        return 'rarity-rare';
      default:
        return 'rarity-common';
    }
  };

  const getItemDeltaChange = (itemName: string) => {
    const charCodeSum = itemName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const pct = ((charCodeSum % 100) / 10) - 5;
    if (pct === 0) return null;
    const isPositive = pct > 0;
    return {
      text: `${isPositive ? '▲' : '▼'} ${isPositive ? '+' : ''}${pct.toFixed(1)}%`,
      color: isPositive ? 'text-emerald-500' : 'text-rose-500'
    };
  };

  // Navigation tab selections
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'positions' | 'notifications'>('browse');
  
  // Browsing filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'raw' | 'refined'>('all');
  const [sortBy, setSortBy] = useState<'cheapest' | 'newest' | 'volume'>('cheapest');

  // Detail Modal overlay
  const [selectedAsset, setSelectedAsset] = useState<{ type: 'resource' | 'item'; id: number; name: string } | null>(null);

  // Form Inputs
  const [listFrom, setListFrom] = useState<'player' | 'company'>('player');
  const [assetType, setAssetType] = useState<'resource' | 'item'>('resource');
  const [selectedResourceId, setSelectedResourceId] = useState<number>(1);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [listQuantity, setListQuantity] = useState<string>('1');
  const [listPrice, setListPrice] = useState<string>('5');
  const [isBuyOrder, setIsBuyOrder] = useState<boolean>(false);

  // Price Alert Inputs
  const [alertPrice, setAlertPrice] = useState<string>('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('below');

  // Message prompts
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Enrich Resources catalog with marketplace metrics
  const marketCommodities = useMemo(() => {
    return resources.map((r) => {
      // Find history matches
      const assetHistory = marketHistory.filter((t) => t.asset_type === 'resource' && t.resource_id === r.id);
      
      // Calculate avg price and volume
      const avgPrice = assetHistory.length > 0 
        ? assetHistory.reduce((acc, curr) => acc + Number(curr.price_per_unit), 0) / assetHistory.length 
        : r.base_value;
        
      const dailyVolume = assetHistory.reduce((acc, curr) => acc + curr.quantity, 0);

      // Find lowest active ask (listing price)
      const asks = marketListings
        .filter((l) => l.asset_type === 'resource' && l.resource_id === r.id && l.status === 'active')
        .map((l) => Number(l.price_per_unit));
      const lowestAsk = asks.length > 0 ? Math.min(...asks) : null;

      // Find highest active bid (buy order price)
      const bids = marketOrders
        .filter((o) => o.asset_type === 'resource' && o.resource_id === r.id && o.status === 'active')
        .map((o) => Number(o.price_per_unit));
      const highestBid = bids.length > 0 ? Math.max(...bids) : null;

      const isWatched = watchlist.some((w) => w.asset_type === 'resource' && w.asset_id === r.id);

      return {
        ...r,
        avgPrice,
        dailyVolume,
        lowestAsk,
        highestBid,
        isWatched,
      };
    });
  }, [resources, marketListings, marketOrders, marketHistory, watchlist]);

  // Filters search query
  const filteredCommodities = useMemo(() => {
    return marketCommodities
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'cheapest') {
          return (a.lowestAsk || a.base_value) - (b.lowestAsk || b.base_value);
        } else if (sortBy === 'volume') {
          return b.dailyVolume - a.dailyVolume;
        }
        return b.id - a.id; // Default newest templates
      });
  }, [marketCommodities, searchQuery, activeCategory, sortBy]);

  // Selected item transaction history
  const selectedHistory = useMemo(() => {
    if (!selectedAsset) return [];
    return marketHistory
      .filter((t) => t.asset_type === selectedAsset.type && (
        selectedAsset.type === 'resource' 
          ? t.resource_id === selectedAsset.id 
          : t.item_template_id === selectedAsset.id
      ))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [marketHistory, selectedAsset]);

  // ApexCharts data and options hook
  const chartData = useMemo<{ series: { name: string; data: { x: number; y: number }[] }[]; options: ApexOptions }>(() => {
    if (!selectedHistory.length) return { series: [], options: {} };

    const seriesData = selectedHistory.map((h) => ({
      x: new Date(h.created_at).getTime(),
      y: Number(h.price_per_unit)
    }));

    const options: ApexOptions = {
      chart: {
        id: 'price-history',
        type: 'area',
        toolbar: { show: false },
        zoom: { enabled: false },
        background: 'transparent',
      },
      colors: ['#e5c158'], // Game Gold
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      grid: {
        borderColor: '#1f2025',
        strokeDashArray: 3,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            colors: '#71717a',
            fontSize: '9px',
            fontFamily: 'var(--font-sans)',
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: (val: number) => `${val.toFixed(2)} LC`,
          style: {
            colors: '#71717a',
            fontSize: '9px',
            fontFamily: 'var(--font-pixel)',
          }
        }
      },
      tooltip: {
        theme: 'dark',
        x: {
          format: 'dd MMM HH:mm',
        },
        y: {
          formatter: (val: number) => `${val.toFixed(2)} LC`
        },
        style: {
          fontSize: '10px',
          fontFamily: 'var(--font-sans)',
        }
      }
    };

    return {
      series: [{ name: 'Unit Price', data: seriesData }],
      options
    };
  }, [selectedHistory]);

  // Current active bids and asks for order book
  const activeOrderBook = useMemo(() => {
    if (!selectedAsset) return { bids: [], asks: [] };
    
    const asks = marketListings
      .filter((l) => l.asset_type === selectedAsset.type && l.resource_id === selectedAsset.id && l.status === 'active')
      .sort((a, b) => a.price_per_unit - b.price_per_unit);

    const bids = marketOrders
      .filter((o) => o.asset_type === selectedAsset.type && o.resource_id === selectedAsset.id && o.status === 'active')
      .sort((a, b) => b.price_per_unit - a.price_per_unit);

    return { bids, asks };
  }, [marketListings, marketOrders, selectedAsset]);

  // Selected inventory item templates
  const playerGearItems = useMemo(() => {
    return inventory.map((i) => {
      // Find template
      const name = i.item_template_id === 3 ? 'Developer Jump Ticket' : `Gear Item #${i.item_template_id}`;
      return {
        ...i,
        name,
      };
    });
  }, [inventory]);

  // Action Click Handlers
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const qty = parseInt(listQuantity);
    const price = parseFloat(listPrice);
    const cId = listFrom === 'company' ? activeCompanyId : null;

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      setError('Quantity and price must be positive numbers.');
      return;
    }

    if (isBuyOrder) {
      // Create buy order (Locks cash)
      const res = await placeBuyOrder(cId, assetType, assetType === 'resource' ? selectedResourceId : null, null, qty, price, 'local');
      if (res.success) {
        setSuccess('Buy order placed successfully! Cash escrowed.');
        setListQuantity('1');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res.error || 'Failed to place buy order.');
      }
    } else {
      // Create sell listing (Locks resources/items)
      const res = await listAssetForSale(
        cId,
        assetType,
        assetType === 'resource' ? selectedResourceId : null,
        assetType === 'item' ? selectedItemId : null,
        qty,
        price,
        'local'
      );
      if (res.success) {
        setSuccess('Item listed for sale successfully! Goods escrowed.');
        setListQuantity('1');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res.error || 'Failed to list asset.');
      }
    }
  };

  const handleCancelListing = async (id: string) => {
    setError(null);
    setSuccess(null);
    const res = await cancelListing(id);
    if (res.success) {
      setSuccess('Listing cancelled. Items returned from escrow.');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to cancel listing.');
    }
  };

  const handleCancelOrder = async (id: string) => {
    setError(null);
    setSuccess(null);
    const res = await cancelOrder(id);
    if (res.success) {
      setSuccess('Buy order cancelled. Cash refunded.');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to cancel order.');
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const price = parseFloat(alertPrice);
    if (isNaN(price) || price <= 0) return;

    const res = await createAlert(selectedAsset.type, selectedAsset.id, price, alertCondition);
    if (res.success) {
      setAlertPrice('');
      setSuccess('Price alert registered successfully.');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const myActiveListings = useMemo(() => {
    return marketListings.filter((l) => l.seller_id === currencies?.profile_id && l.status === 'active');
  }, [marketListings, currencies]);

  const myActiveOrders = useMemo(() => {
    return marketOrders.filter((o) => o.buyer_id === currencies?.profile_id && o.status === 'active');
  }, [marketOrders, currencies]);

  const trendingItems = useMemo(() => {
    return marketCommodities
      .filter((c) => c.dailyVolume > 0)
      .sort((a, b) => b.dailyVolume - a.dailyVolume)
      .slice(0, 3);
  }, [marketCommodities]);

  const listingFeeRate = 0.02; // 2%
  const vatTaxRate = 0.05; // 5%

  const activeWalletBal = currencies?.local_currency_balance || 0;
  const activeCompanyBal = activeCompanyVault?.local_currency || 0;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Ticker Row - Redesigned as Wood Beam */}
      <div className="w-full overflow-hidden rpg-panel-wood py-3 px-4 flex items-center justify-between text-xs shadow-md border-none relative select-none z-10">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-2 text-game-gold font-display uppercase tracking-widest text-[9px] relative z-10 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
          <TrendingUp className="h-4 w-4 text-game-gold" />
          <span>Market Ticker:</span>
        </div>
        <div className="flex-1 flex gap-8 justify-end items-center overflow-x-auto select-none pl-6 text-zinc-350 scrollbar-none relative z-10">
          {marketCommodities.slice(0, 6).map((c) => (
            <div key={c.id} className="flex items-center gap-2 shrink-0">
              <span className="text-zinc-200 font-display font-medium text-[11px]">{c.name}</span>
              <span className="text-game-emerald font-pixel font-bold">{(c.lowestAsk || c.base_value).toFixed(2)} LC</span>
              {c.dailyVolume > 0 && <span className="text-[9px] text-zinc-550 font-sans">Vol {c.dailyVolume}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="rpg-panel-stone border-red-900/60 text-red-400 p-4 flex gap-3 items-center text-sm rounded-none relative shadow-md">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rpg-panel-stone border-game-gold/40 text-game-emerald p-4 flex gap-3 items-center text-sm rounded-none relative shadow-md">
          <Sparkles className="h-5 w-5 shrink-0 text-game-gold-dark" />
          <span>{success}</span>
        </div>
      )}

      {/* Page Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-game-gold font-display uppercase tracking-wider filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">Global Exchange Ledger</h1>
          <p className="text-zinc-500 text-xs font-serif mt-1">Sovereign double-auction exchange ledger. Clean player-to-player trade operations.</p>
        </div>

        {/* Tab Controllers */}
        <div className="flex border-b-2 border-game-gold/30 bg-zinc-950/40 p-0.5 self-stretch sm:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 text-[10px] font-bold font-display uppercase tracking-widest transition-all text-center border-t-2 border-l-2 border-r-2 ${
              activeTab === 'browse' 
                ? 'bg-game-wood border-game-gold text-game-gold shadow-[0_-2px_5px_rgba(229,193,88,0.1)] translate-y-[2px]' 
                : 'bg-zinc-950/20 border-transparent text-zinc-500 hover:text-game-gold'
            }`}
          >
            Browse Listings
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-[10px] font-bold font-display uppercase tracking-widest transition-all text-center border-t-2 border-l-2 border-r-2 ${
              activeTab === 'create' 
                ? 'bg-game-wood border-game-gold text-game-gold shadow-[0_-2px_5px_rgba(229,193,88,0.1)] translate-y-[2px]' 
                : 'bg-zinc-950/20 border-transparent text-zinc-500 hover:text-game-gold'
            }`}
          >
            Create Listing
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 text-[10px] font-bold font-display uppercase tracking-widest transition-all text-center border-t-2 border-l-2 border-r-2 relative ${
              activeTab === 'positions' 
                ? 'bg-game-wood border-game-gold text-game-gold shadow-[0_-2px_5px_rgba(229,193,88,0.1)] translate-y-[2px]' 
                : 'bg-zinc-950/20 border-transparent text-zinc-500 hover:text-game-gold'
            }`}
          >
            My Positions
            {(myActiveListings.length > 0 || myActiveOrders.length > 0) && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-game-gold text-zinc-950 rounded-none flex items-center justify-center text-[9px] font-black border border-zinc-900 shadow">
                {myActiveListings.length + myActiveOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 text-[10px] font-bold font-display uppercase tracking-widest transition-all text-center border-t-2 border-l-2 border-r-2 relative ${
              activeTab === 'notifications' 
                ? 'bg-game-wood border-game-gold text-game-gold shadow-[0_-2px_5px_rgba(229,193,88,0.1)] translate-y-[2px]' 
                : 'bg-zinc-950/20 border-transparent text-zinc-500 hover:text-game-gold'
            }`}
          >
            Alerts & Notifs
            {marketNotifications.some((n) => !n.read) && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-600 text-white rounded-none flex items-center justify-center text-[9px] font-black border border-zinc-955 animate-pulse">
                !
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Main content layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side Column: Filter Controls / Favorites Watchlist */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Quick Stats / Wallet Balance summary */}
          <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 text-left relative shadow-md">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest relative z-10">Trading Balances</span>
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-game-gold" />
                <span className="text-xs text-zinc-300 font-display">Wallet Balance</span>
              </div>
              <span className="text-sm font-bold font-pixel text-white">{activeWalletBal.toLocaleString(undefined, { maximumFractionDigits: 1 })} LC</span>
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-zinc-500" />
                <span className="text-xs text-zinc-400 font-display">Company Vault</span>
              </div>
              <span className="text-sm font-bold font-pixel text-zinc-450">{activeCompanyBal.toLocaleString(undefined, { maximumFractionDigits: 1 })} LC</span>
            </div>
          </div>

          {/* Search/Filter Controls Card */}
          {activeTab === 'browse' && (
            <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 text-left relative shadow-md">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest relative z-10">Search Filters</span>
              
              {/* Search Bar */}
              <div className="relative z-10">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 rounded-none bg-zinc-950 border border-zinc-900 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-game-gold transition-colors font-display"
                />
              </div>

              {/* Categories */}
              <div className="flex flex-col gap-2 relative z-10">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-display">Category</span>
                <div className="flex flex-col gap-1">
                  {(['all', 'raw', 'refined'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`text-left px-3 py-2 rounded-none text-xs font-bold font-display uppercase tracking-wider transition-colors ${
                        activeCategory === cat 
                          ? 'bg-game-gold text-zinc-950 font-black border border-game-gold' 
                          : 'bg-zinc-950/40 border border-zinc-900 text-zinc-400 hover:text-game-gold hover:bg-zinc-950'
                      }`}
                    >
                      {cat === 'all' ? 'All Commodities' : `${cat} Materials`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting */}
              <div className="flex flex-col gap-2 relative z-10">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-display">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'cheapest' | 'newest' | 'volume')}
                  className="w-full h-9 rounded-none bg-zinc-950 border border-zinc-900 text-xs text-white px-3 focus:outline-none focus:border-game-gold font-display uppercase tracking-wider cursor-pointer"
                >
                  <option value="cheapest">Cheapest Ask First</option>
                  <option value="newest">Recently Seeded</option>
                  <option value="volume">Highest Trading Volume</option>
                </select>
              </div>
            </div>
          )}

          {/* Watchlist Star List */}
          <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-3 text-left relative shadow-md">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <span className="text-[10px] text-game-gold-dark font-display uppercase tracking-widest relative z-10">My Watchlist</span>
            {watchlist.length === 0 ? (
              <span className="text-xs font-serif text-zinc-500 relative z-10">Star items to watch prices closely here.</span>
            ) : (
              <div className="flex flex-col gap-2 relative z-10">
                {watchlist.map((w) => {
                  const res = marketCommodities.find((c) => c.id === w.asset_id);
                  if (!res) return null;
                  return (
                    <div
                      key={`${w.asset_type}-${w.asset_id}`}
                      onClick={() => setSelectedAsset({ type: 'resource', id: res.id, name: res.name })}
                      className="flex items-center justify-between p-2 rounded-none bg-zinc-950 border border-zinc-900 hover:border-game-gold/30 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 text-game-gold fill-game-gold shrink-0" />
                        <span className="text-xs text-zinc-200 font-display uppercase font-bold tracking-wider">{res.name}</span>
                      </div>
                      <span className="text-xs font-bold font-pixel text-game-emerald">{(res.lowestAsk || res.base_value).toFixed(2)} LC</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Large Tab Content Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          {/* Tab 1: Browse Exchange (Commodities Grids) */}
          {activeTab === 'browse' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredCommodities.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedAsset({ type: 'resource', id: item.id, name: item.name })}
                  className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 text-left border-none shadow-lg relative cursor-pointer hover:scale-[1.01] transition-transform duration-200"
                >
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatch('resource', item.id);
                    }}
                    className="absolute top-4 right-4 text-zinc-650 hover:text-game-gold transition-colors relative z-20"
                  >
                    <Star className={`h-4 w-4 ${item.isWatched ? 'text-game-gold fill-game-gold' : ''}`} />
                  </button>

                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`h-10 w-10 border bg-zinc-950/80 flex items-center justify-center select-none transition-all ${getRarityClass(item.name)}`}>
                      {renderItemIcon(item.name, '📦', 'w-8 h-8')}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-zinc-555 font-bold font-display uppercase tracking-widest">{item.category}</span>
                      <span className="text-sm font-bold text-zinc-200 font-display mt-0.5 tracking-wide">{item.name}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-4 text-xs relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest flex items-center justify-between pr-2">
                        <span>Lowest Ask</span>
                        {(() => {
                          const delta = getItemDeltaChange(item.name);
                          if (!delta) return null;
                          return (
                            <span className={`text-[8px] font-bold font-pixel ${delta.color}`}>
                              {delta.text}
                            </span>
                          );
                        })()}
                      </span>
                      <span className="text-sm font-bold font-pixel text-white mt-1 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                        {item.lowestAsk ? `${item.lowestAsk.toFixed(2)} LC` : 'No Ask'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-zinc-550 font-display uppercase tracking-widest">Highest Bid</span>
                      <span className="text-sm font-bold font-pixel text-zinc-500 mt-1">
                        {item.highestBid ? `${item.highestBid.toFixed(2)} LC` : 'No Bid'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-900/60 pt-3 relative z-10 font-display uppercase tracking-wider">
                    <span>Daily Vol: <b className="text-zinc-400 font-pixel text-[11px]">{item.dailyVolume}</b></span>
                    <span className="text-game-gold hover:text-game-gold-light flex items-center gap-0.5">
                      Details <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Create Listing Form Wizard */}
          {activeTab === 'create' && (
            <div className="rpg-panel-stone p-6 md:p-8 rounded-none flex flex-col gap-6 text-left relative shadow-xl">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-md font-bold text-game-gold font-display uppercase tracking-widest relative z-10 filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.8)]">Place Exchange Order</h2>
              
              <form onSubmit={handleCreateListing} className="flex flex-col gap-6 relative z-10">
                
                {/* 1. Account selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Fulfill from Portfolio</label>
                    <div className="flex bg-zinc-950 border border-zinc-900 p-0.5">
                      <button
                        type="button"
                        onClick={() => setListFrom('player')}
                        className={`flex-1 py-1.5 text-[10px] font-bold font-display uppercase tracking-wider transition-colors rounded-none ${
                          listFrom === 'player' ? 'bg-game-gold text-zinc-950 font-black' : 'text-zinc-550 hover:text-game-gold'
                        }`}
                      >
                        Player Bag
                      </button>
                      <button
                        type="button"
                        onClick={() => setListFrom('company')}
                        className={`flex-1 py-1.5 text-[10px] font-bold font-display uppercase tracking-wider transition-colors rounded-none ${
                          listFrom === 'company' ? 'bg-game-gold text-zinc-950 font-black' : 'text-zinc-550 hover:text-game-gold'
                        }`}
                      >
                        Company Vault
                      </button>
                    </div>
                  </div>

                  {/* Buy vs Sell Order Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Action Type</label>
                    <div className="flex bg-zinc-950 border border-zinc-900 p-0.5">
                      <button
                        type="button"
                        onClick={() => setIsBuyOrder(false)}
                        className={`flex-1 py-1.5 text-[10px] font-bold font-display uppercase tracking-wider transition-colors rounded-none ${
                          !isBuyOrder ? 'bg-game-gold text-zinc-950 font-black' : 'text-zinc-550 hover:text-game-gold'
                        }`}
                      >
                        Sell Listing (Ask)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBuyOrder(true)}
                        className={`flex-1 py-1.5 text-[10px] font-bold font-display uppercase tracking-wider transition-colors rounded-none ${
                          isBuyOrder ? 'bg-game-gold text-zinc-950 font-black' : 'text-zinc-550 hover:text-game-gold'
                        }`}
                      >
                        Buy Order (Bid)
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Choose Asset Type (If Player) */}
                {listFrom === 'player' && !isBuyOrder && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Asset Class</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none font-display uppercase tracking-wide">
                        <input
                          type="radio"
                          name="assetClass"
                          checked={assetType === 'resource'}
                          onChange={() => {
                            setAssetType('resource');
                            setSelectedItemId('');
                          }}
                          className="accent-game-gold"
                        />
                        <span>Standard Commodities (Resource)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none font-display uppercase tracking-wide">
                        <input
                          type="radio"
                          name="assetClass"
                          checked={assetType === 'item'}
                          onChange={() => {
                            setAssetType('item');
                            setSelectedResourceId(1);
                          }}
                          className="accent-game-gold"
                        />
                        <span>Gear / Inventory Templates</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 3. Dropdown Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {assetType === 'resource' ? (
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Select Resource</label>
                      <select
                        value={selectedResourceId}
                        onChange={(e) => setSelectedResourceId(parseInt(e.target.value))}
                        className="w-full h-10 rounded-none bg-zinc-950 border border-zinc-900 text-xs text-white px-3 focus:outline-none focus:border-game-gold cursor-pointer font-display uppercase tracking-wider"
                      >
                        {resources.map((r) => {
                          const stock = listFrom === 'player'
                            ? playerResources.find((p) => p.resource_id === r.id)?.quantity || 0
                            : activeCompanyInventory.find((p) => p.resource_id === r.id)?.quantity || 0;
                          return (
                            <option key={r.id} value={r.id}>
                              {r.name} (Available: {stock})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Select Gear Item</label>
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="w-full h-10 rounded-none bg-zinc-950 border border-zinc-900 text-xs text-white px-3 focus:outline-none focus:border-game-gold cursor-pointer font-display uppercase tracking-wider"
                      >
                        <option value="">-- Choose Gear Instance --</option>
                        {playerGearItems.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} (Quality: {i.quality})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quantity Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={listQuantity}
                      onChange={(e) => setListQuantity(e.target.value)}
                      className="w-full h-10 rounded-none bg-zinc-950 border border-zinc-900 text-xs font-pixel text-white px-3 focus:outline-none focus:border-game-gold text-right"
                    />
                  </div>
                </div>

                {/* Price Input & Math breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div className="flex flex-col gap-2 md:col-span-1">
                    <label className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Unit Price (LC)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      className="w-full h-10 rounded-none bg-zinc-950 border border-zinc-900 text-xs font-pixel text-white px-3 focus:outline-none focus:border-game-gold text-right"
                    />
                  </div>

                  {/* Dynamic Math Fees Estimates */}
                  {(() => {
                    const priceVal = parseFloat(listPrice) || 0;
                    const qtyVal = parseInt(listQuantity) || 0;
                    const gross = priceVal * qtyVal;
                    const tax = gross * vatTaxRate;
                    const fee = gross * listingFeeRate;
                    const netPayout = isBuyOrder ? gross : (gross - tax - fee);
                    
                    return (
                      <div className="md:col-span-2 p-4 rounded-none bg-zinc-950 border border-zinc-900 text-[11px] grid grid-cols-2 gap-2 text-zinc-550 font-sans">
                        <div>Subtotal Gross: <b className="text-zinc-200 font-pixel">{gross.toFixed(2)} LC</b></div>
                        <div>Estimated VAT (5%): <b className="text-rose-800 font-pixel">{tax.toFixed(2)} LC</b></div>
                        <div>System Fee (2%): <b className="text-rose-800 font-pixel">{fee.toFixed(2)} LC</b></div>
                        <div className="border-t border-zinc-900 pt-2 col-span-2 flex justify-between font-bold text-xs text-zinc-300 font-display uppercase tracking-widest">
                          <span>{isBuyOrder ? 'Locked in Escrow:' : 'Net Seller Payout (on trade):'}</span>
                          <span className="text-game-emerald font-pixel text-[13px]">{isBuyOrder ? gross.toFixed(2) : netPayout.toFixed(2)} LC</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Form submit button */}
                <button
                  type="submit"
                  className="w-full h-11 rpg-button text-xs font-display uppercase tracking-widest select-none"
                >
                  {isBuyOrder ? 'Escrow Cash & Create Bid Order' : 'Escrow Goods & List on Exchange'}
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: My Exchange Positions */}
          {activeTab === 'positions' && (
            <div className="flex flex-col gap-6">
              
              {/* Active Sell Listings */}
              <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-3 text-left relative border-none shadow-md">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest relative z-10">My Active Sell Listings</h3>
                {myActiveListings.length === 0 ? (
                  <span className="text-xs font-serif text-zinc-500 py-2 relative z-10">No active asks listed by you.</span>
                ) : (
                  <div className="flex flex-col gap-2 relative z-10">
                    {myActiveListings.map((l) => {
                      const res = resources.find((r) => r.id === l.resource_id);
                      return (
                        <div key={l.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-900 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-zinc-200 font-display uppercase tracking-wider">{res?.name || `Resource #${l.resource_id}`}</span>
                            <span className="text-zinc-500 font-pixel">Qty: {l.quantity}</span>
                            <span className="text-game-emerald font-pixel">Price: {Number(l.price_per_unit).toFixed(2)} LC</span>
                          </div>
                          <button
                            onClick={() => handleCancelListing(l.id)}
                            className="rpg-button rpg-button-crimson px-2.5 py-1.5 text-[9px] font-display uppercase tracking-widest border border-red-800/40 rounded-none select-none"
                          >
                            Cancel & Refund
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Buy Orders */}
              <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-3 text-left relative border-none shadow-md">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest relative z-10">My Active Buy Orders</h3>
                {myActiveOrders.length === 0 ? (
                  <span className="text-xs font-serif text-zinc-500 py-2 relative z-10">No active bids placed by you.</span>
                ) : (
                  <div className="flex flex-col gap-2 relative z-10">
                    {myActiveOrders.map((o) => {
                      const res = resources.find((r) => r.id === o.resource_id);
                      return (
                        <div key={o.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-900 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-zinc-200 font-display uppercase tracking-wider">{res?.name || `Resource #${o.resource_id}`}</span>
                            <span className="text-zinc-500 font-pixel">Qty: {o.quantity}</span>
                            <span className="text-game-gold font-pixel">Bid: {Number(o.price_per_unit).toFixed(2)} LC</span>
                          </div>
                          <button
                            onClick={() => handleCancelOrder(o.id)}
                            className="rpg-button rpg-button-crimson px-2.5 py-1.5 text-[9px] font-display uppercase tracking-widest border border-red-800/40 rounded-none select-none"
                          >
                            Cancel & Refund
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* My Trade History */}
              <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-3 text-left relative border-none shadow-md">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest relative z-10">My Completed Trades</h3>
                {marketHistory.length === 0 ? (
                  <span className="text-xs font-serif text-zinc-500 py-2 relative z-10">No transaction history recorded yet.</span>
                ) : (
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 relative z-10">
                    {marketHistory.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-900 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-zinc-200 font-display uppercase font-bold tracking-wide">{t.resource_name || 'Standard Commodity'}</span>
                          <span className="text-[10px] font-serif text-zinc-500">
                            Sold by {t.seller_name || 'Anonymous'} to {t.buyer_name || 'Anonymous'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold font-pixel text-game-emerald">+{t.quantity} Units</span>
                          <span className="text-[9px] font-pixel text-zinc-500">{Number(t.price_per_unit).toFixed(2)} LC/ea</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Price Alerts and Notification Logs */}
          {activeTab === 'notifications' && (
            <div className="flex flex-col gap-6">
              
              {/* Notification Roster */}
              <div className="rpg-panel-stone p-5 rounded-none flex flex-col gap-3 text-left relative border-none shadow-md">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <h3 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest relative z-10">Exchange Notification Logs</h3>
                {marketNotifications.length === 0 ? (
                  <span className="text-xs font-serif text-zinc-500 py-2 relative z-10">No trade notifications received.</span>
                ) : (
                  <div className="flex flex-col gap-2 relative z-10">
                    {marketNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => readNotification(n.id)}
                        className={`p-3 border flex justify-between items-start gap-4 cursor-pointer transition-colors ${
                          n.read
                            ? 'bg-zinc-950/30 border-zinc-900 text-zinc-500'
                            : 'bg-game-wood/20 border-game-gold/30 text-game-gold font-semibold'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Bell className={`h-4 w-4 shrink-0 mt-0.5 ${n.read ? 'text-zinc-650' : 'text-game-gold'}`} />
                          <span className="text-xs font-serif leading-relaxed">{n.message}</span>
                        </div>
                        <span className="text-[9px] font-pixel text-zinc-500 shrink-0">{new Date(n.created_at).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Item Detail Console Modal Overlay */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-hidden">
          
          {/* Immersive Fire Embers */}
          <div className="rpg-embers-container">
            <div className="rpg-ember" style={{ left: '20%', animationDelay: '0s', animationDuration: '10s' }} />
            <div className="rpg-ember" style={{ left: '50%', animationDelay: '2s', animationDuration: '12s' }} />
            <div className="rpg-ember" style={{ left: '80%', animationDelay: '4s', animationDuration: '8s' }} />
          </div>

          <div className="w-full max-w-4xl rpg-panel-stone border-2 border-game-gold p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto text-left shadow-2xl relative rounded-none z-10 animate-scale-up">
            <div className="rpg-rivet top-1.5 left-1.5" />
            <div className="rpg-rivet top-1.5 right-1.5" />
            <div className="rpg-rivet bottom-1.5 left-1.5" />
            <div className="rpg-rivet bottom-1.5 right-1.5" />
            
            <button
              onClick={() => {
                setSelectedAsset(null);
                setAlertPrice('');
              }}
              className="absolute top-5 right-5 rpg-button rpg-button-crimson px-3 py-1 font-display uppercase tracking-widest text-[9px] rounded-none select-none"
            >
              ✕ Close
            </button>

            {/* Header info */}
            <div className="flex items-center gap-3 border-b-2 border-game-gold/15 pb-4">
              {renderItemIcon(selectedAsset.name, '📈', 'w-12 h-12')}
              <div>
                <h2 className="text-xl font-bold text-game-gold font-display uppercase tracking-widest">{selectedAsset.name}</h2>
                <span className="text-[10px] text-zinc-500 font-display uppercase tracking-wider">Exchange Analytics & Active Order Books</span>
              </div>
            </div>

            {/* Price Chart SVG Section */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Trading price history</span>
              {chartData.series.length > 0 && chartData.series[0].data.length > 0 ? (
                <div className="bg-zinc-950 border border-zinc-900 p-2 overflow-hidden">
                  <Chart
                    options={chartData.options}
                    series={chartData.series}
                    type="area"
                    height={150}
                  />
                </div>
              ) : (
                <div className="w-full h-36 border border-zinc-900 bg-zinc-950 flex items-center justify-center text-zinc-550 font-serif text-xs">
                  No transaction history recorded yet.
                </div>
              )}
            </div>

            {/* Layout Grid: Order Book & Price Alert forms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Column 1: Order Book Bids (Buy Orders) */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 flex flex-col gap-2 shadow-inner">
                <span className="text-[9px] text-game-emerald font-display uppercase tracking-widest font-bold">Buy Orders (Bids)</span>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeOrderBook.bids.length === 0 ? (
                    <span className="text-[9px] text-zinc-650 font-serif py-3">No active bids.</span>
                  ) : (
                    activeOrderBook.bids.map((b) => (
                      <div key={b.id} className="flex justify-between items-center text-[10px] p-2 bg-zinc-950 border border-zinc-900/60 font-pixel">
                        <span className="text-zinc-400">Qty {b.quantity}</span>
                        <span className="font-bold text-game-emerald">{Number(b.price_per_unit).toFixed(2)} LC</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Order Book Asks (Sell Listings) */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 flex flex-col gap-2 shadow-inner">
                <span className="text-[9px] text-game-gold font-display uppercase tracking-widest font-bold">Sell Listings (Asks)</span>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeOrderBook.asks.length === 0 ? (
                    <span className="text-[9px] text-zinc-650 font-serif py-3">No active asks.</span>
                  ) : (
                    activeOrderBook.asks.map((a) => (
                      <div key={a.id} className="flex justify-between items-center text-[10px] p-2 bg-zinc-950 border border-zinc-900/60 font-pixel">
                        <span className="text-zinc-400">Qty {a.quantity}</span>
                        <span className="font-bold text-zinc-200">{Number(a.price_per_unit).toFixed(2)} LC</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 3: Setup Price Alert Form */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 flex flex-col gap-4">
                <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest">Set Price Alert</span>
                
                <form onSubmit={handleCreateAlert} className="flex flex-col gap-3 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] text-zinc-550 uppercase font-bold font-display tracking-wider">Condition</label>
                    <select
                      value={alertCondition}
                      onChange={(e) => setAlertCondition(e.target.value as 'above' | 'below')}
                      className="h-8 bg-zinc-900 border border-zinc-950 px-2 text-white font-display text-[10px] uppercase tracking-wide focus:outline-none"
                    >
                      <option value="below">Drops below (≤)</option>
                      <option value="above">Rises above (≥)</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] text-zinc-550 uppercase font-bold font-display tracking-wider">Target Trigger Price (LC)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                      className="h-8 bg-zinc-900 border border-zinc-950 px-2 text-white font-pixel text-right focus:outline-none focus:border-game-gold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-8 rpg-button text-white font-bold tracking-widest uppercase text-[9px] select-none mt-1"
                  >
                    Activate Alert
                  </button>
                </form>

                {/* Display existing active alerts */}
                {(() => {
                  const currentAlerts = priceAlerts.filter((a) => a.asset_type === selectedAsset.type && a.asset_id === selectedAsset.id);
                  if (currentAlerts.length === 0) return null;
                  return (
                    <div className="flex flex-col gap-1 text-[9px] border-t border-zinc-900 pt-2 text-left font-display">
                      <span className="text-zinc-550 font-bold uppercase tracking-wider">Active Alerts:</span>
                      {currentAlerts.map((a) => (
                        <div key={a.id} className="flex justify-between items-center text-zinc-400 p-1 bg-zinc-950 border border-zinc-900">
                          <span className="font-pixel">{a.alert_condition === 'below' ? '≤' : '≥'} {a.target_price} LC</span>
                          <button
                            onClick={() => deleteAlert(a.id)}
                            className="text-red-500 hover:text-red-400 font-bold text-[8px] uppercase tracking-wide"
                          >
                            delete
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
