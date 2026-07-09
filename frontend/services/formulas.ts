/**
 * Aegis Kingdoms Game Design Formulas & Balancing Engine
 */

/**
 * Calculates the experience points required to level up.
 * Formula: Required EXP = Level^2.2 * 120
 */
export function getRequiredExp(level: number): number {
  if (level < 1) return 120;
  return Math.floor(Math.pow(level, 2.2) * 120);
}

/**
 * Checks if the player can level up, and returns the updated level and remainder experience.
 */
export function checkLevelUp(
  currentLevel: number,
  currentExp: number,
  gainedExp: number
): { level: number; experience: number; leveledUp: boolean } {
  let level = currentLevel;
  let experience = currentExp + gainedExp;
  let leveledUp = false;

  while (true) {
    const required = getRequiredExp(level);
    if (experience >= required) {
      experience -= required;
      level += 1;
      leveledUp = true;
    } else {
      break;
    }
  }

  return { level, experience, leveledUp };
}

/**
 * Calculates the output quantity for working at a company.
 * Formula: productivity = base * (1 + workSkill * 0.05) * abundance * infraLevel
 */
export function calculateProductivity(
  base: number,
  workSkill: number,
  abundance: number,
  infraLevel: number = 1
): number {
  return base * (1 + workSkill * 0.05) * abundance * infraLevel;
}

/**
 * Calculates the military damage dealt during combat hits.
 * Formula: damage = 10 * (1 + strength / 100) * weaponModifier * rankModifier
 */
export function calculateCombatDamage(
  strength: number,
  weaponQuality: number = 0, // 0 = unarmed, 1-5 = weapon qualities
  rankModifier: number = 1.0
): number {
  const weaponModifier = weaponQuality === 0 ? 1.0 : 1.0 + weaponQuality * 0.25;
  const baseDamage = 10;
  const strengthMultiplier = 1 + strength / 100;
  
  return Math.floor(baseDamage * strengthMultiplier * weaponModifier * rankModifier);
}

/**
 * Calculates energy regeneration per tick.
 * Formula: Regen = 10 * (1 + level * 0.02)
 */
export function calculateEnergyRegen(level: number): number {
  return Math.min(10 + Math.floor(level * 0.2), 30);
}

/**
 * Calculates the repair cost of an item.
 * Cost = (MaxDurability - CurrentDurability) * BaseValue * RarityMultiplier * 0.02
 */
export function calculateRepairCost(
  baseValue: number,
  currentDurability: number,
  maxDurability: number,
  rarity: string = 'common'
): number {
  if (currentDurability >= maxDurability) return 0;
  const wear = maxDurability - currentDurability;
  let rarityMult = 1.0;
  if (rarity === 'uncommon') rarityMult = 1.5;
  else if (rarity === 'rare') rarityMult = 2.2;
  else if (rarity === 'epic') rarityMult = 3.5;
  else if (rarity === 'legendary') rarityMult = 5.0;

  return Math.floor(wear * baseValue * rarityMult * 0.02);
}

/**
 * Calculates travel cost and cooldowns based on distance.
 */
export function calculateTravelCost(
  distance: number,
  transportType: 'foot' | 'horse' | 'train' = 'foot'
): { cost: number; cooldown: number } {
  let costMult = 1.0;
  let speedMult = 1.0;

  if (transportType === 'horse') {
    costMult = 1.5;
    speedMult = 0.6; // 40% faster
  } else if (transportType === 'train') {
    costMult = 4.0;
    speedMult = 0.2; // 80% faster
  }

  const baseCost = Math.floor(distance * 2 * costMult);
  const baseCooldown = Math.floor(distance * 10 * speedMult);

  return {
    cost: Math.max(baseCost, 2),
    cooldown: Math.max(baseCooldown, 10)
  };
}

/**
 * Calculates marketplace transaction taxes.
 */
export function calculateMarketTax(
  price: number,
  baseTaxRate: number = 5.0, // 5%
  regionTaxRate: number = 2.0 // 2%
): number {
  const rate = (baseTaxRate + regionTaxRate) / 100;
  return Math.max(Number((price * rate).toFixed(2)), 0.01);
}

/**
 * Calculates war declarations costs.
 */
export function calculateWarCost(
  distance: number,
  regionPopulation: number
): number {
  // Base cost scaled by travel distance and region popularity
  return Math.floor(1000 + (distance * 150) + (regionPopulation * 2.5));
}

/**
 * Calculates guild upgrade material costs.
 */
export function calculateGuildUpgradeCost(level: number): { gold: number; wood: number; iron: number } {
  return {
    gold: Math.floor(Math.pow(level, 1.8) * 100),
    wood: Math.floor(Math.pow(level, 1.6) * 50),
    iron: Math.floor(Math.pow(level, 1.5) * 30)
  };
}

/**
 * High-Fidelity Economic Simulation Agent Engine
 * Models market transactions, inflation index, and gold sink structures.
 */
export interface SimResult {
  inflationRate: number;
  priceStabilityIndex: number;
  marketPriceTrends: number[];
  logs: string[];
}

export function runEconomicSimulation(
  playersCount: number = 100,
  ticks: number = 50
): SimResult {
  const logs: string[] = [];
  const marketPriceTrends: number[] = [];
  
  // State variables for agents
  let goldReserve = playersCount * 500; // Total currency pool
  let activeOffersCount = 0;
  let currentAveragePrice = 10.0;
  let totalTradesExecuted = 0;
  let inflationRate = 0.0;

  logs.push(`[SIM] Initializing simulation with ${playersCount} players, starting total supply: ${goldReserve} gold.`);

  for (let t = 1; t <= ticks; t++) {
    // 1. Production Phase: players gather resource
    const productionVolume = Math.floor(playersCount * 2.5 * (1 + Math.sin(t / 5) * 0.1));
    
    // 2. Marketplace Phase: Supply & Demand price matching
    // As t advances, demand surges, simulated by a sinusoidal curve
    const demandVolume = Math.floor(playersCount * 2.0 * (1 + Math.cos(t / 4) * 0.15));
    
    let priceShift = 1.0;
    if (productionVolume > demandVolume) {
      // Over-supply -> Price drop
      priceShift = 0.95;
    } else {
      // Under-supply -> Price surge
      priceShift = 1.06;
    }

    currentAveragePrice = Number((currentAveragePrice * priceShift).toFixed(2));
    marketPriceTrends.push(currentAveragePrice);

    // 3. Transactions & Gold Sink deductions
    const trades = Math.min(productionVolume, demandVolume);
    totalTradesExecuted += trades;
    
    // Taxes (gold sink)
    const taxesCollected = trades * currentAveragePrice * 0.05;
    goldReserve -= taxesCollected;

    if (t % 10 === 0) {
      logs.push(`[Tick ${t}] Avg Price: ${currentAveragePrice} LC | Tax Sink: ${taxesCollected.toFixed(1)} LC | Pool Reserve: ${goldReserve.toFixed(0)} LC`);
    }
  }

  const initialPrice = 10.0;
  inflationRate = Number((((currentAveragePrice - initialPrice) / initialPrice) * 100).toFixed(2));
  
  // Stability calculated as standard deviation mapping
  const dev = marketPriceTrends.reduce((sum, p) => sum + Math.abs(p - currentAveragePrice), 0) / ticks;
  const priceStabilityIndex = Math.max(Number((100 - dev * 5).toFixed(2)), 0.0);

  logs.push(`[SIM] Completed. Total trades: ${totalTradesExecuted} | Final Avg Price: ${currentAveragePrice} LC | Cumulative Inflation: ${inflationRate}%`);

  return {
    inflationRate,
    priceStabilityIndex,
    marketPriceTrends,
    logs
  };
}
