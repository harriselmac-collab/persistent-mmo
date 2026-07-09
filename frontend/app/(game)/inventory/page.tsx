'use client';

import { useGameContext } from '../layout';
import { useState, useMemo } from 'react';
import { ItemRecipeInput } from '@/types/entities';
import { 
  Search, 
  SlidersHorizontal, 
  Scale, 
  Coins, 
  AlertCircle, 
  ShoppingBag, 
  Sparkles, 
  Hammer, 
  ShieldAlert, 
  User, 
  Shield, 
  Wrench, 
  Scroll, 
  ArrowRightLeft, 
  Heart,
  Zap,
  Gauge,
  Lock
} from 'lucide-react';

const DEFAULT_ITEM_TEMPLATES = [
  { id: 1, category_id: 3, name: 'Wheat Bread', description: 'Crispy oven-baked loaf. Restores 10 energy.', type: 'food', base_value: 5, weight: 0.10, max_durability: 0, rarity: 'common', attributes: { 'energy_restore': 10 } },
  { id: 2, category_id: 6, name: 'Iron Sword', description: 'Standard-issue military sword.', type: 'weapon', base_value: 50, weight: 2.50, max_durability: 100, rarity: 'common', attributes: { 'attack': 20 } },
  { id: 3, category_id: 16, name: 'Travel Ticket', description: 'Genesis Airlines inter-country single-use pass.', type: 'ticket', base_value: 20, weight: 0.01, max_durability: 0, rarity: 'common' },
  { id: 4, category_id: 9, name: 'Iron Plate Helm', description: 'Heavy iron defense crown.', type: 'helmet', base_value: 35, weight: 1.80, max_durability: 120, rarity: 'common', attributes: { 'defense': 8 } },
  { id: 5, category_id: 7, name: 'Iron Plate Chest', description: 'Full body protective iron coating.', type: 'armor', base_value: 90, weight: 5.00, max_durability: 150, rarity: 'common', attributes: { 'defense': 25 } },
  { id: 6, category_id: 10, name: 'Leather Boots', description: 'Soft leather speed shoes.', type: 'boots', base_value: 25, weight: 0.90, max_durability: 80, rarity: 'common', attributes: { 'speed': 0.05 } },
  { id: 7, category_id: 13, name: 'Steel Pickaxe', description: 'Advanced mining pick improving harvest speeds.', type: 'tool', base_value: 60, weight: 3.00, max_durability: 200, rarity: 'uncommon', attributes: { 'mining_bonus': 0.15 } },
];

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

export default function InventoryPage() {
  const { 
    stats,
    playerResources, 
    resources, 
    inventory, 
    equipment,
    recipes,
    blueprints,
    itemHistory,
    claimCheat, 
    refreshData,
    equipItem,
    unequipItem,
    consumeItem,
    craftItem,
    repairItem,
    unlockBlueprint
  } = useGameContext();

  const isCraftingLocked = (stats?.level || 1) < 8;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'raw' | 'refined' | 'gear' | 'consumable'>('all');
  const [activeSort, setActiveSort] = useState<'name' | 'quantity' | 'weight' | 'value'>('quantity');

  // Sub-tabs on the right panel
  const [rightPanelTab, setRightPanelTab] = useState<'bag' | 'craft' | 'blueprints' | 'repair' | 'history'>('bag');

  // Selected item overlay for details & comparison
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClaimCheat = async () => {
    setError(null);
    setSuccess(null);
    const res = await claimCheat();
    if (res.success) {
      setSuccess('Applied cheat codes: +10k local currency, gold, and all raw/refined materials!');
      refreshData();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to apply cheat.');
    }
  };

  // 1. Process resources stock
  const gatheredItems = useMemo(() => {
    return playerResources
      .map((item) => {
        const res = resources.find((r) => r.id === item.resource_id);
        return {
          id: `res-${item.resource_id}`,
          resourceId: item.resource_id,
          name: res?.name || `Resource #${item.resource_id}`,
          icon: '📦',
          description: res?.description || '',
          rarity: res?.rarity || 'common',
          category: res?.category || 'raw',
          weight: res?.weight || 0.10,
          base_value: res?.base_value || 1.0,
          quantity: item.quantity,
          isResource: true,
          quality: 2,
          maxDurability: 0,
          currentDurability: 0,
          itemInstanceId: null,
          attributes: {}
        };
      })
      .filter((item) => item.quantity > 0);
  }, [playerResources, resources]);

  // 2. Process unique and stackable inventories templates
  const bagItems = useMemo(() => {
    // Add default mock templates or templates loaded from supabase
    return inventory.map((item) => {
      // Basic static templates mapping
      let details = { 
        name: `Item #${item.item_template_id}`, 
        desc: 'Advanced equipment or quest asset.', 
        category: 'gear', 
        icon: '⚔️', 
        weight: 1.00, 
        value: 10,
        rarity: 'common',
        maxDurability: 100,
        attributes: {} as Record<string, number>
      };

      if (item.item_template_id === 1) {
        details = { name: 'Wheat Bread', desc: 'Crispy oven-baked loaf. Restores 10 energy.', category: 'consumable', icon: '🍞', weight: 0.10, value: 5, rarity: 'common', maxDurability: 0, attributes: { 'energy_restore': 10 } };
      } else if (item.item_template_id === 2) {
        details = { name: 'Iron Sword', desc: 'Standard-issue military sword.', category: 'gear', icon: '⚔️', weight: 2.50, value: 50, rarity: 'common', maxDurability: 100, attributes: { 'attack': 20 } };
      } else if (item.item_template_id === 3) {
        details = { name: 'Travel Ticket', desc: 'Genesis Airlines inter-country pass.', category: 'consumable', icon: '🎫', weight: 0.01, value: 20, rarity: 'common', maxDurability: 0, attributes: {} };
      } else if (item.item_template_id === 4) {
        details = { name: 'Iron Plate Helm', desc: 'Heavy iron defense crown.', category: 'gear', icon: '🪖', weight: 1.80, value: 35, rarity: 'common', maxDurability: 120, attributes: { 'defense': 8 } };
      } else if (item.item_template_id === 5) {
        details = { name: 'Iron Plate Chest', desc: 'Full body protective iron coating.', category: 'gear', icon: '👕', weight: 5.00, value: 90, rarity: 'common', maxDurability: 150, attributes: { 'defense': 25 } };
      } else if (item.item_template_id === 6) {
        details = { name: 'Leather Boots', desc: 'Soft leather speed shoes.', category: 'gear', icon: '🥾', weight: 0.90, value: 25, rarity: 'common', maxDurability: 80, attributes: { 'speed': 0.05 } };
      } else if (item.item_template_id === 7) {
        details = { name: 'Steel Pickaxe', desc: 'Advanced mining pick improving harvest speeds.', category: 'gear', icon: '⛏️', weight: 3.00, value: 60, rarity: 'uncommon', maxDurability: 200, attributes: { 'mining_bonus': 0.15 } };
      }

      // Instance values override
      const currentDurability = item.instance ? item.instance.current_durability : details.maxDurability;
      const maxDurability = item.instance ? item.instance.max_durability : details.maxDurability;

      return {
        id: item.id,
        itemTemplateId: item.item_template_id,
        name: details.name,
        icon: details.icon,
        description: details.desc,
        rarity: details.rarity,
        category: details.category,
        weight: details.weight,
        base_value: details.value,
        quantity: item.quantity,
        isResource: false,
        quality: item.quality,
        currentDurability,
        maxDurability,
        attributes: details.attributes,
        itemInstanceId: item.item_instance_id
      };
    });
  }, [inventory]);

  const allItems = useMemo(() => {
    return [...gatheredItems, ...bagItems];
  }, [gatheredItems, bagItems]);

  // Calculations
  const totalWeight = useMemo(() => allItems.reduce((sum, item) => sum + item.quantity * item.weight, 0), [allItems]);
  const totalValue = useMemo(() => allItems.reduce((sum, item) => sum + item.quantity * item.base_value, 0), [allItems]);
  const maxWeightLimit = 200.0;

  // Search and sort filters
  const filteredItems = useMemo(() => {
    return allItems
      .filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesCategory = activeCategory === 'all';
        if (activeCategory === 'raw') matchesCategory = item.category === 'raw';
        else if (activeCategory === 'refined') matchesCategory = item.category === 'refined';
        else if (activeCategory === 'gear') matchesCategory = item.category === 'gear';
        else if (activeCategory === 'consumable') matchesCategory = item.category === 'consumable';

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (activeSort === 'name') return a.name.localeCompare(b.name);
        if (activeSort === 'quantity') return b.quantity - a.quantity;
        if (activeSort === 'weight') return (b.quantity * b.weight) - (a.quantity * a.weight);
        if (activeSort === 'value') return (b.quantity * b.base_value) - (a.quantity * a.base_value);
        return 0;
      });
  }, [allItems, searchQuery, activeCategory, activeSort]);

  // Damaged items list for Repair Station
  const damagedItems = useMemo(() => {
    return bagItems.filter((i) => i.maxDurability > 0 && i.currentDurability < i.maxDurability);
  }, [bagItems]);

  // Determine slot mapped instances
  const equippedSlots = useMemo(() => {
    const defaultSlots = {
      helmet: null as any,
      chest: null as any,
      legs: null as any,
      boots: null as any,
      gloves: null as any,
      weapon: null as any,
      shield: null as any,
      ring: null as any,
      necklace: null as any,
      backpack: null as any,
      accessory: null as any
    };

    if (equipment) {
      Object.keys(defaultSlots).forEach((slot) => {
        const bindId = (equipment as any)[`${slot}_id`];
        if (bindId) {
          const matchedItem = bagItems.find((i) => i.id === bindId);
          if (matchedItem) {
            (defaultSlots as any)[slot] = matchedItem;
          }
        }
      });
    }
    return defaultSlots;
  }, [equipment, bagItems]);

  // Combined stats from all equipped gear
  const totalEquippedAttributes = useMemo(() => {
    const totals = { attack: 0, defense: 0, speed: 0, mining_bonus: 0 };
    Object.values(equippedSlots).forEach((item) => {
      if (item && item.attributes) {
        Object.keys(totals).forEach((key) => {
          if (item.attributes[key]) {
            totals[key as keyof typeof totals] += item.attributes[key];
          }
        });
      }
    });
    return totals;
  }, [equippedSlots]);

  // Quality multiplier display helper
  const getQualityText = (q: number) => {
    switch(q) {
      case 1: return { text: 'Poor', color: 'text-zinc-500' };
      case 2: return { text: 'Common', color: 'text-zinc-300' };
      case 3: return { text: 'Uncommon', color: 'text-emerald-400 font-bold' };
      case 4: return { text: 'Rare', color: 'text-indigo-400 font-bold' };
      case 5: return { text: 'Epic', color: 'text-purple-400 font-bold font-display animate-pulse' };
      case 6: return { text: 'Legendary', color: 'text-amber-400 font-bold font-display' };
      case 7: return { text: 'Mythic', color: 'text-rose-500 font-black font-display tracking-widest' };
      default: return { text: 'Common', color: 'text-zinc-300' };
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-2 border-zinc-800 bg-zinc-950 shadow-md';
      case 'uncommon': return 'border-2 border-emerald-600 bg-zinc-950/80 text-emerald-455 shadow-[0_0_10px_rgba(16,185,129,0.05)]';
      case 'rare': return 'border-2 border-blue-650 bg-zinc-950/80 text-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.05)]';
      case 'epic': return 'border-2 border-purple-600 bg-zinc-950/80 text-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.05)]';
      case 'legendary': return 'border-2 border-game-gold bg-zinc-950/80 text-game-gold shadow-[0_0_10px_rgba(229,193,88,0.05)]';
      default: return 'border-2 border-zinc-800 bg-zinc-950';
    }
  };

  // Equipping mutations
  const handleEquip = async (itemId: string, slot: string) => {
    setError(null);
    setSuccess(null);
    const res = await equipItem(itemId, slot);
    if (res.success) {
      setSuccess(`Equipped item into ${slot} slot.`);
      setSelectedInventoryItem(null);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to equip item.');
    }
  };

  const handleUnequip = async (slot: string) => {
    setError(null);
    setSuccess(null);
    const res = await unequipItem(slot);
    if (res.success) {
      setSuccess(`Unequipped ${slot} slot.`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to unequip.');
    }
  };

  const handleConsume = async (itemId: string) => {
    setError(null);
    setSuccess(null);
    const res = await consumeItem(itemId);
    if (res.success) {
      setSuccess('Consumable used. Energy restored.');
      setSelectedInventoryItem(null);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to consume item.');
    }
  };

  const handleCraft = async (recipeId: number) => {
    setError(null);
    setSuccess(null);
    const res = await craftItem(recipeId);
    if (res.success) {
      setSuccess('Item crafted successfully! Quality rolled.');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to craft item.');
    }
  };

  const handleRepair = async (itemId: string) => {
    setError(null);
    setSuccess(null);
    const res = await repairItem(itemId);
    if (res.success) {
      setSuccess('Item repaired successfully to max durability.');
      setSelectedInventoryItem(null);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to repair item.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Messages */}
      {error && (
        <div className="rpg-panel-stone border-red-900/60 text-red-400 p-4 flex gap-3 items-center text-sm rounded-none relative">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="rpg-panel-stone border-game-gold/40 text-game-emerald p-4 flex gap-3 items-center text-sm rounded-none relative">
          <Sparkles className="h-5 w-5 shrink-0 text-game-gold-dark" />
          <span>{success}</span>
        </div>
      )}

      {/* Top statistics overview rows */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Weight Cargo load */}
        <div className="rpg-panel-stone p-5 rounded-none flex items-center justify-between gap-4 md:col-span-2 text-left relative shadow-lg">
          <div className="rpg-rivet top-1 left-1" />
          <div className="rpg-rivet top-1 right-1" />
          <div className="rpg-rivet bottom-1 left-1" />
          <div className="rpg-rivet bottom-1 right-1" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-zinc-950 border border-zinc-900 text-zinc-400 rounded-none">
              <Scale className="h-4.5 w-4.5 text-game-gold" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-zinc-300 font-display uppercase tracking-widest">Backpack Cargo Load</span>
              <span className="text-[9px] font-serif text-zinc-500 mt-0.5">Heavy items reduce travel capabilities</span>
            </div>
          </div>

          <div className="flex-1 max-w-[240px] flex flex-col gap-1 items-end relative z-10">
            <div className="w-full bg-zinc-950 border border-game-gold/15 h-3 p-[1px] rounded-none">
              <div
                className="h-full rounded-none transition-all duration-500 bg-gradient-to-r from-game-gold-dark to-game-gold"
                style={{ width: `${Math.min(100, (totalWeight / maxWeightLimit) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold font-pixel text-game-gold tracking-wide">
              {totalWeight.toFixed(2)} kg / {maxWeightLimit} kg
            </span>
          </div>
        </div>

        {/* Est Liquid Cargo Worth */}
        <div className="rpg-panel-stone p-5 rounded-none flex items-center justify-between gap-4 text-left relative shadow-md">
          <div className="rpg-rivet top-1 left-1" />
          <div className="rpg-rivet top-1 right-1" />
          <div className="rpg-rivet bottom-1 left-1" />
          <div className="rpg-rivet bottom-1 right-1" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-zinc-950 border border-zinc-900 text-zinc-400 rounded-none">
              <Coins className="h-4.5 w-4.5 text-game-gold" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-zinc-300 font-display uppercase tracking-widest">Est. Liquid Value</span>
              <span className="text-[9px] font-serif text-zinc-500 mt-0.5">Inventory market worth</span>
            </div>
          </div>
          <span className="text-base font-bold text-game-emerald font-pixel tracking-wide relative z-10 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
            {totalValue.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-[10px] text-zinc-650 font-sans font-bold">LC</span>
          </span>
        </div>

        {/* Cheat Code injection stubs */}
        <div className="rpg-panel-stone p-5 rounded-none flex items-center justify-between gap-4 border-game-gold/25 bg-zinc-950/20 text-left relative shadow-md">
          <div className="rpg-rivet top-1 left-1" />
          <div className="rpg-rivet top-1 right-1" />
          <div className="rpg-rivet bottom-1 left-1" />
          <div className="rpg-rivet bottom-1 right-1" />

          <div className="flex flex-col relative z-10 w-full">
            <span className="text-[11px] font-bold text-game-gold font-display uppercase tracking-widest">Test Cheats Console</span>
            <button
              onClick={handleClaimCheat}
              className="mt-2 w-full text-center rpg-button rounded-none font-display uppercase tracking-widest text-[9px] py-1.5 px-3 select-none"
            >
              Get 10,000 Assets
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Paper Doll (Left) & Right Tabs Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Character Paper Doll equipped slots */}
        <div className="lg:col-span-1 rpg-panel-stone p-5 rounded-none flex flex-col gap-5 text-left border-none shadow-xl relative">
          <div className="rpg-rivet top-1 left-1" />
          <div className="rpg-rivet top-1 right-1" />
          <div className="rpg-rivet bottom-1 left-1" />
          <div className="rpg-rivet bottom-1 right-1" />

          <div className="flex items-center gap-2 border-b-2 border-game-gold/15 pb-3 relative z-10">
            <User className="h-4.5 w-4.5 text-game-gold" />
            <h2 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.8)]">Equipment Slots</h2>
          </div>

          {/* Interactive slots stack */}
          <div className="flex flex-col gap-2.5 relative z-10">
            {([
              { key: 'helmet', name: 'Helmet Slot', label: 'Helmet', icon: '🪖' },
              { key: 'chest', name: 'Chestplate', label: 'Chest Armor', icon: '👕' },
              { key: 'legs', name: 'Leggings', label: 'Legs Plate', icon: '👖' },
              { key: 'boots', name: 'Footwear', label: 'Boots', icon: '🥾' },
              { key: 'gloves', name: 'Hands', label: 'Gloves', icon: '🧤' },
              { key: 'weapon', name: 'Offensive Slot', label: 'Weapon', icon: '⚔️' },
              { key: 'shield', name: 'Defensive Slot', label: 'Shield / Offhand', icon: '🛡️' },
              { key: 'ring', name: 'Ring Slot', label: 'Finger Ring', icon: '💍' },
              { key: 'necklace', name: 'Amulet Slot', label: 'Necklace', icon: '📿' },
              { key: 'backpack', name: 'Cargo Slot', label: 'Backpack Pack', icon: '🎒' },
              { key: 'accessory', name: 'Accessory Slot', label: 'Trinket', icon: '🔮' }
            ] as const).map((slot) => {
              const item = (equippedSlots as any)[slot.key];
              return (
                <div
                  key={slot.key}
                  className={`flex justify-between items-center p-2.5 rounded-none border-2 transition-all duration-100 ${
                    item 
                      ? 'border-game-gold bg-zinc-950/80 shadow-[0_0_10px_rgba(229,193,88,0.08)]' 
                      : 'border-dashed border-zinc-900 bg-zinc-950/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg select-none">{slot.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-game-gold-dark font-display uppercase tracking-widest">{slot.label}</span>
                      <span className={`text-xs font-bold font-display mt-0.5 ${item ? 'text-zinc-100' : 'text-zinc-650'}`}>
                        {item ? item.name : 'Empty Slot'}
                      </span>
                    </div>
                  </div>

                  {item ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-pixel text-zinc-500 tracking-wider">
                        DUR: {item.currentDurability}/{item.maxDurability}
                      </span>
                      <button
                        onClick={() => handleUnequip(slot.key)}
                        className="rpg-button rpg-button-crimson px-2 py-0.5 rounded-none border border-red-800/40 text-[9px] font-display uppercase tracking-widest select-none"
                      >
                        Unequip
                      </button>
                    </div>
                  ) : (
                    <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">Unbound</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Equipped combined attributes breakdown */}
          <div className="mt-4 p-3 bg-zinc-950 border border-zinc-900 rounded-none flex flex-col gap-2.5 relative z-10">
            <span className="text-[9px] text-game-gold-dark font-display uppercase tracking-widest border-b border-zinc-900 pb-2">Combined Equipment Modifiers</span>
            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-450">
              <div className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span>Attack: <b className="text-white font-pixel font-bold">+{totalEquippedAttributes.attack}</b></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>Defense: <b className="text-white font-pixel font-bold">+{totalEquippedAttributes.defense}</b></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Speed: <b className="text-white font-pixel font-bold">+{totalEquippedAttributes.speed * 100}%</b></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-game-emerald shrink-0" />
                <span>Gather: <b className="text-white font-pixel font-bold">+{totalEquippedAttributes.mining_bonus * 100}%</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Controllers & Tabs Panels */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Tab Controller bar - Redesigned folder style book tabs */}
          <div className="flex border-b-2 border-game-gold/30 bg-zinc-950/40 p-0.5 w-full">
            {(['bag', 'craft', 'blueprints', 'repair', 'history'] as const).map((tab) => {
              const isLockedTab = isCraftingLocked && (tab === 'craft' || tab === 'blueprints');
              return (
                <button
                  key={tab}
                  onClick={() => setRightPanelTab(tab)}
                  className={`flex items-center justify-center gap-1 flex-1 py-2.5 px-1 text-[10px] font-bold font-display uppercase tracking-widest transition-all text-center border-t-2 border-l-2 border-r-2 ${
                    rightPanelTab === tab 
                      ? 'bg-game-wood border-game-gold text-game-gold shadow-[0_-2px_5px_rgba(229,193,88,0.1)] translate-y-[2px]' 
                      : 'bg-zinc-950/20 border-transparent text-zinc-500 hover:text-game-gold'
                  }`}
                >
                  <span>{tab === 'bag' ? 'Backpack Bag' : tab === 'craft' ? 'Crafting' : tab === 'repair' ? `Repair (${damagedItems.length})` : tab}</span>
                  {isLockedTab && <Lock className="h-3 w-3 text-zinc-650" />}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Backpack Bag panel */}
          {rightPanelTab === 'bag' && (
            <div className="flex flex-col gap-6">
              
              {/* Category selector row */}
              <div className="rpg-panel-stone p-4 rounded-none flex flex-col sm:flex-row items-center justify-between gap-4 text-left border-none relative shadow-md">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-1 relative z-10">
                  {(['all', 'raw', 'refined', 'gear', 'consumable'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 text-[10px] font-bold font-display uppercase tracking-wider transition-all border ${
                        activeCategory === cat
                          ? 'bg-game-gold border-game-gold text-zinc-950 font-black'
                          : 'bg-zinc-950/60 border-zinc-900 text-zinc-500 hover:text-game-gold hover:border-game-gold/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <select
                  value={activeSort}
                  onChange={(e) => setActiveSort(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-900 rounded-none py-1.5 px-3 text-xs text-zinc-300 focus:outline-none focus:border-game-gold cursor-pointer font-display uppercase tracking-wider relative z-10"
                >
                  <option value="quantity">Sort by Quantity</option>
                  <option value="name">Sort by Name</option>
                  <option value="weight">Sort by Weight</option>
                  <option value="value">Sort by Value</option>
                </select>
              </div>

              {/* Items Grid list */}
              {filteredItems.length === 0 ? (
                <div className="p-16 border-2 border-dashed border-game-gold/25 bg-zinc-950/20 rounded-none flex flex-col items-center justify-center gap-3 text-zinc-500 text-center max-w-sm mx-auto mt-6">
                  <ShoppingBag className="h-8 w-8 text-zinc-700 animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-zinc-400 font-display uppercase tracking-wide">Inventory category empty</p>
                    <p className="text-xs font-serif text-zinc-600 mt-1 leading-normal">
                      No matching items found. Go to world map gathering areas or create blueprints to populate items!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredItems.map((item) => {
                    const qObj = getQualityText(item.quality);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedInventoryItem(item)}
                        className={`p-4 rounded-none flex flex-col justify-between gap-4 transition-all duration-200 hover:scale-[1.01] cursor-pointer text-left ${getRarityColor(
                          item.rarity
                        )}`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2.5">
                            {renderItemIcon(item.name, item.icon, "w-10 h-10")}
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-zinc-200 font-display tracking-wide">{item.name}</span>
                              <span className="text-[10px] text-zinc-500 mt-0.5">Quantity: x{item.quantity}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] font-black font-display uppercase tracking-widest ${qObj.color}`}>{qObj.text}</span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-900 pt-2.5 font-display uppercase tracking-widest">
                          <span>Value: <b className="text-zinc-400">{item.base_value} LC</b></span>
                          {item.maxDurability > 0 && (
                            <span className="font-pixel text-[9px] text-zinc-450">Dur: {item.currentDurability}/{item.maxDurability}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Crafting Center panel */}
          {rightPanelTab === 'craft' && (
            isCraftingLocked ? (
              <div className="rpg-panel-stone p-12 text-center flex flex-col items-center justify-center gap-4">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />
                <div className="h-14 w-14 border border-zinc-800 rounded-full flex items-center justify-center bg-zinc-950 text-zinc-650 shadow-inner">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-display text-zinc-400 uppercase tracking-widest">
                    Crafting Sealed
                  </h3>
                  <p className="text-xs text-zinc-500 font-serif mt-1.5 max-w-xs mx-auto">
                    Blacksmith forges are currently locked. Reach Commander Level 8 to unlock weapon crafting and blueprint smelting recipes.
                  </p>
                </div>
              </div>
            ) : (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-6 text-left border-none shadow-xl relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-md font-bold text-game-gold font-display uppercase tracking-widest flex items-center gap-2 relative z-10 filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.8)]">
                <Hammer className="h-4.5 w-4.5 text-game-gold" />
                Forge & Crafting Center
              </h2>

              <div className="flex flex-col gap-4 relative z-10">
                {recipes.map((recipe) => {
                  const template = DEFAULT_ITEM_TEMPLATES.find((t) => t.id === recipe.result_template_id);
                  const isLocked = recipe.is_blueprint_required && !blueprints.some((b) => b.recipe_id === recipe.id);
                  
                  return (
                    <div key={recipe.id} className="p-4 rounded-none border border-zinc-900 bg-zinc-950/40 flex flex-col gap-4">
                      
                      {/* Recipe Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-zinc-200 font-display tracking-wide">{template?.name || `Product #${recipe.result_template_id}`}</span>
                          <span className="text-[10px] font-serif text-zinc-550 leading-relaxed mt-0.5">{template?.description}</span>
                        </div>
                        {isLocked ? (
                          <span className="px-2 py-0.5 border border-red-900/60 bg-red-950/20 text-red-400 font-bold font-display text-[9px] uppercase tracking-wider">
                            Locked Blueprint
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 border border-game-gold/30 bg-zinc-950 text-game-gold font-bold font-display text-[9px] uppercase tracking-wider">
                            Required Lvl: {recipe.required_level}
                          </span>
                        )}
                      </div>

                      {/* Ingredients & Actions */}
                      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-t border-zinc-900/80 pt-3 text-xs">
                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-display">Crafting Inputs:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {recipe.inputs?.map((inItem: ItemRecipeInput, idx: number) => {
                              const stock = playerResources.find((r) => r.resource_id === inItem.resource_id)?.quantity || 0;
                              const matches = stock >= inItem.quantity;
                              return (
                                <span
                                  key={idx}
                                  className={`px-2.5 py-1 text-[10px] font-display uppercase tracking-wide border ${
                                    matches
                                      ? 'border-zinc-900 bg-game-wood/40 text-zinc-300'
                                      : 'border-red-950/45 bg-red-950/10 text-red-450'
                                  }`}
                                >
                                  {inItem.resource_name || `Resource #${inItem.resource_id}`} ({stock}/{inItem.quantity})
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          disabled={isLocked}
                          onClick={() => handleCraft(recipe.id)}
                          className={`px-4 py-2 rounded-none font-bold text-xs uppercase tracking-widest font-display transition-all shrink-0 w-full sm:w-auto select-none ${
                            isLocked 
                              ? 'bg-zinc-950/80 text-zinc-600 cursor-not-allowed border border-zinc-900 font-display' 
                              : 'rpg-button'
                          }`}
                        >
                          Craft Item
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Tab 3: Blueprints Library panel */}
          {rightPanelTab === 'blueprints' && (
            isCraftingLocked ? (
              <div className="rpg-panel-stone p-12 text-center flex flex-col items-center justify-center gap-4">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />
                <div className="h-14 w-14 border border-zinc-800 rounded-full flex items-center justify-center bg-zinc-950 text-zinc-650 shadow-inner">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-display text-zinc-400 uppercase tracking-widest">
                    Blueprints Sealed
                  </h3>
                  <p className="text-xs text-zinc-550 font-serif mt-1.5 max-w-xs mx-auto">
                    Weapon and gear blueprints are locked. Reach Commander Level 8 to unlock this panel.
                  </p>
                </div>
              </div>
            ) : (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 text-left border-none shadow-xl relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest flex items-center gap-2 relative z-10 filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.8)]">
                <Scroll className="h-4.5 w-4.5 text-game-gold" />
                Blueprint unlocks
              </h2>
              {blueprints.length === 0 ? (
                <span className="text-xs font-serif text-zinc-500 py-4 relative z-10">No blueprint recipes unlocked. Collect blueprint items in the world to unlock special manufacturing options.</span>
              ) : (
                <div className="flex flex-col gap-2 relative z-10">
                  {blueprints.map((bp) => {
                    const r = recipes.find((x) => x.id === bp.recipe_id);
                    const temp = DEFAULT_ITEM_TEMPLATES.find((t) => t.id === r?.result_template_id);
                    return (
                      <div key={bp.recipe_id} className="p-3 bg-zinc-950/60 border border-zinc-900 flex justify-between items-center text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-200 font-display tracking-wide">{temp?.name || 'Special Recipe'}</span>
                          <span className="text-[10px] text-zinc-550 font-serif mt-0.5">Unlocked: {new Date(bp.unlocked_at).toLocaleDateString()}</span>
                        </div>
                        <span className="px-2 py-0.5 border border-game-gold/30 bg-zinc-950 text-game-gold font-bold font-display text-[9px] uppercase tracking-wider">
                          Unlocked
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Tab 4: Repair Station panel */}
          {rightPanelTab === 'repair' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 text-left border-none shadow-xl relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest flex items-center gap-2 relative z-10 filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.8)]">
                <Wrench className="h-4.5 w-4.5 text-game-gold" />
                Durability Maintenance Station
              </h2>

              {damagedItems.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 font-serif text-xs border-2 border-dashed border-zinc-900 bg-zinc-950/20 relative z-10">
                  All equipment instances in your bag are at 100% full durability. No maintenance needed!
                </div>
              ) : (
                <div className="flex flex-col gap-3 relative z-10">
                  {damagedItems.map((item) => {
                    const missingDur = item.maxDurability - item.currentDurability;
                    const repairCostVal = missingDur * 1.50;
                    return (
                      <div key={item.id} className="p-4 bg-zinc-950/40 border border-zinc-900 flex justify-between items-center gap-4 text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-200 font-display tracking-wide">{item.name}</span>
                          <span className="text-[10px] text-rose-500 font-pixel font-bold mt-1 tracking-wider">
                            Durability: {item.currentDurability}/{item.maxDurability} (-{missingDur} pts)
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Repair Cost:</span>
                            <span className="font-bold font-pixel text-game-emerald text-sm">{repairCostVal.toFixed(2)} LC</span>
                          </div>
                          <button
                            onClick={() => handleRepair(item.id)}
                            className="rpg-button px-3.5 py-2 text-xs font-display uppercase tracking-widest select-none"
                          >
                            Repair
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Forensic Trail Logs */}
          {rightPanelTab === 'history' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 text-left border-none shadow-xl relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-sm font-bold text-game-gold font-display uppercase tracking-widest flex items-center gap-2 relative z-10 filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.8)]">
                <SlidersHorizontal className="h-4.5 w-4.5 text-game-gold" />
                Item History Logs
              </h2>
              {itemHistory.length === 0 ? (
                <span className="text-xs font-serif text-zinc-500 py-4 relative z-10">No item history logs available. Actions like crafting, equipping, consuming, or repairing will log here.</span>
              ) : (
                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1 relative z-10">
                  {itemHistory.map((h) => {
                    const temp = DEFAULT_ITEM_TEMPLATES.find((t) => t.id === h.item_template_id);
                    return (
                      <div key={h.id} className="p-3 bg-zinc-950/40 border border-zinc-900 flex justify-between items-center text-xs">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-game-gold font-display uppercase tracking-widest">{h.action}</span>
                          <span className="font-bold text-zinc-200 font-display mt-0.5">{temp?.name || `Item #${h.item_template_id}`}</span>
                        </div>
                        <span className="text-[9px] font-pixel text-zinc-500 tracking-wider">{new Date(h.created_at).toLocaleTimeString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Item Detail Comparison Panel Overlay */}
      {selectedInventoryItem && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-hidden">
          
          {/* Immersive Fire Embers */}
          <div className="rpg-embers-container">
            <div className="rpg-ember" style={{ left: '20%', animationDelay: '0s', animationDuration: '10s' }} />
            <div className="rpg-ember" style={{ left: '50%', animationDelay: '2s', animationDuration: '12s' }} />
            <div className="rpg-ember" style={{ left: '80%', animationDelay: '4s', animationDuration: '8s' }} />
          </div>

          <div className="w-full max-w-2xl rpg-panel-stone border-2 border-game-gold p-6 md:p-8 flex flex-col gap-6 text-left shadow-2xl relative rounded-none z-10 animate-scale-up">
            <div className="rpg-rivet top-1.5 left-1.5" />
            <div className="rpg-rivet top-1.5 right-1.5" />
            <div className="rpg-rivet bottom-1.5 left-1.5" />
            <div className="rpg-rivet bottom-1.5 right-1.5" />
            
            <button
              onClick={() => setSelectedInventoryItem(null)}
              className="absolute top-5 right-5 rpg-button rpg-button-crimson px-3 py-1 font-display uppercase tracking-widest text-[9px] rounded-none select-none"
            >
              ✕ Close
            </button>

            {/* Header info */}
            <div className="flex items-center gap-3 border-b-2 border-game-gold/15 pb-4">
              {renderItemIcon(selectedInventoryItem.name, selectedInventoryItem.icon, "w-14 h-14")}
              <div>
                <h2 className="text-xl font-bold text-game-gold font-display uppercase tracking-widest">{selectedInventoryItem.name}</h2>
                <span className="text-[10px] text-zinc-500 font-display uppercase tracking-wider capitalize">{selectedInventoryItem.category} Asset</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-400 font-serif leading-relaxed bg-zinc-950/60 p-4 border border-zinc-900 rounded-none">
              {selectedInventoryItem.description || 'No description seeded for this commodity template.'}
            </p>

            {/* Compare panel layout (If item is gear slot item) */}
            {selectedInventoryItem.category === 'gear' && (() => {
              // Find matching slot currently equipped
              let slotName = 'weapon';
              if (selectedInventoryItem.itemTemplateId === 4) slotName = 'helmet';
              else if (selectedInventoryItem.itemTemplateId === 5) slotName = 'chest';
              else if (selectedInventoryItem.itemTemplateId === 6) slotName = 'boots';
              else if (selectedInventoryItem.itemTemplateId === 7) slotName = 'tool';

              const equipped = (equippedSlots as any)[slotName];

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/80 p-5 border border-zinc-900 rounded-none">
                  
                  {/* Selected Item */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] text-game-gold font-display uppercase tracking-widest">Selected Item</span>
                    <span className="text-xs font-bold font-display text-zinc-200">{selectedInventoryItem.name}</span>
                    <div className="flex flex-col gap-1 mt-2 text-xs text-zinc-400">
                      <div className="font-pixel text-[11px] text-zinc-300">Durability: <b>{selectedInventoryItem.currentDurability}/{selectedInventoryItem.maxDurability}</b></div>
                      {selectedInventoryItem.attributes && Object.entries(selectedInventoryItem.attributes).map(([k, v]) => (
                        <div key={k} className="capitalize font-display text-[10px] tracking-wide text-zinc-400">{k}: <b className="text-game-emerald font-pixel text-[11px]">+{v as number}</b></div>
                      ))}
                    </div>
                  </div>

                  {/* Equipped Item slot */}
                  <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-zinc-900/60 pt-4 md:pt-0 md:pl-6">
                    <span className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Equipped ({slotName})</span>
                    {equipped ? (
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold font-display text-zinc-300">{equipped.name}</span>
                        <div className="flex flex-col gap-1 text-xs text-zinc-555">
                          <div className="font-pixel text-[11px] text-zinc-400">Durability: <b>{equipped.currentDurability}/{equipped.maxDurability}</b></div>
                          {equipped.attributes && Object.entries(equipped.attributes).map(([k, v]) => (
                            <div key={k} className="capitalize font-display text-[10px] tracking-wide text-zinc-400">{k}: <b className="font-pixel text-[11px]">+{v as number}</b></div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-650 font-serif italic mt-2">Empty slot</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Actions triggers */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end mt-2">
              {selectedInventoryItem.category === 'gear' && (() => {
                let slotName = 'weapon';
                if (selectedInventoryItem.itemTemplateId === 4) slotName = 'helmet';
                else if (selectedInventoryItem.itemTemplateId === 5) slotName = 'chest';
                else if (selectedInventoryItem.itemTemplateId === 6) slotName = 'boots';
                else if (selectedInventoryItem.itemTemplateId === 7) slotName = 'tool';

                return (
                  <button
                    onClick={() => handleEquip(selectedInventoryItem.id, slotName)}
                    className="rpg-button px-5 py-3 rounded-none font-display uppercase tracking-widest text-xs select-none"
                  >
                    Equip Item
                  </button>
                );
              })()}

              {selectedInventoryItem.category === 'consumable' && (
                <button
                  onClick={() => handleConsume(selectedInventoryItem.id)}
                  className="rpg-button px-5 py-3 rounded-none font-display uppercase tracking-widest text-xs select-none"
                >
                  Consume Item
                </button>
              )}

              {selectedInventoryItem.maxDurability > 0 && selectedInventoryItem.currentDurability < selectedInventoryItem.maxDurability && (
                <button
                  onClick={() => handleRepair(selectedInventoryItem.id)}
                  className="rpg-button rpg-button-gold px-5 py-3 rounded-none font-display uppercase tracking-widest text-xs border border-game-gold select-none"
                >
                  Repair (Durability)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
