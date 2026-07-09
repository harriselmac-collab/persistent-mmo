import { describe, it, expect, beforeAll } from 'vitest';
import {
  getRequiredExp,
  checkLevelUp,
  calculateProductivity,
  calculateCombatDamage,
  calculateEnergyRegen,
  calculateRepairCost,
  calculateTravelCost,
  calculateMarketTax,
  calculateWarCost,
  calculateGuildUpgradeCost,
  runEconomicSimulation,
} from './formulas';
import { MockGameRepository } from './repository/MockGameRepository';

// Setup mock window & localStorage for Node testing environment
const storageMock: Record<string, string> = {};
beforeAll(() => {
  const localStorageMock = {
    getItem: (key: string) => storageMock[key] || null,
    setItem: (key: string, val: string) => {
      storageMock[key] = val;
    },
    removeItem: (key: string) => {
      delete storageMock[key];
    },
    clear: () => {
      for (const k in storageMock) delete storageMock[k];
    },
    length: 0,
    key: (i: number) => null,
  };
  global.window = {
    localStorage: localStorageMock,
  } as any;
  global.localStorage = localStorageMock as any;
});

// Offline energy simulation helper
function calculateOfflineRegen(
  currentEnergy: number,
  lastUpdatedAt: string,
  currentTimeMs: number
): { energy: number; ticks: number } {
  const lastUpdate = new Date(lastUpdatedAt).getTime();
  const elapsedSecs = (currentTimeMs - lastUpdate) / 1000;
  const tickInterval = 360; // 6 minutes
  const ticks = Math.floor(elapsedSecs / tickInterval);
  
  if (ticks <= 0 || currentEnergy >= 100) {
    return { energy: currentEnergy, ticks: 0 };
  }
  
  const newEnergy = Math.min(100, currentEnergy + ticks * 5);
  return { energy: newEnergy, ticks };
}

// Yield quantity helper
function calculateGatherYield(workSkill: number, spawnWeight: number, productionBonus: number): number {
  return Math.floor(1 + workSkill * 0.05 * spawnWeight * productionBonus);
}

describe('Game Design Formulas Unit Tests', () => {
  
  describe('Leveling & Thresholds', () => {
    it('should calculate required experience points based on level config', () => {
      expect(getRequiredExp(1)).toBe(120);
      expect(getRequiredExp(2)).toBe(551);
      expect(getRequiredExp(3)).toBe(1345);
      expect(getRequiredExp(10)).toBe(19018);
    });

    it('should handle level ups correctly', () => {
      const res = checkLevelUp(1, 40, 100);
      expect(res.level).toBe(2);
      expect(res.experience).toBe(20);
      expect(res.leveledUp).toBe(true);
    });

    it('should rollover remainder experience', () => {
      const res = checkLevelUp(1, 50, 150);
      expect(res.level).toBe(2);
      expect(res.experience).toBe(80);
      expect(res.leveledUp).toBe(true);
    });
  });

  describe('Offline Energy Ticks & Spend Validations', () => {
    it('should not regenerate energy if elapsed time is less than 6 minutes', () => {
      const lastUpdate = new Date().toISOString();
      const now = Date.now() + 5 * 60 * 1000; // 5 minutes later
      
      const res = calculateOfflineRegen(50, lastUpdate, now);
      expect(res.ticks).toBe(0);
      expect(res.energy).toBe(50);
    });

    it('should regenerate +5 energy for every 6 minute interval elapsed', () => {
      const lastUpdate = new Date().toISOString();
      const now = Date.now() + 13 * 60 * 1000; // 13 minutes
      
      const res = calculateOfflineRegen(50, lastUpdate, now);
      expect(res.ticks).toBe(2);
      expect(res.energy).toBe(60);
    });

    it('should cap regenerated energy at the maximum threshold of 100', () => {
      const lastUpdate = new Date().toISOString();
      const now = Date.now() + 24 * 60 * 60 * 1000; // 24 hours later
      
      const res = calculateOfflineRegen(95, lastUpdate, now);
      expect(res.energy).toBe(100);
    });
  });

  describe('Resource Extraction Yield Math', () => {
    it('should return base yield of 1 at starting work skill levels', () => {
      const yieldAmt = calculateGatherYield(1.0, 1.0, 1.0);
      expect(yieldAmt).toBe(1);
    });

    it('should scale yields higher with labor work skill progression', () => {
      const yieldAmt = calculateGatherYield(20.0, 1.2, 1.2);
      expect(yieldAmt).toBe(2);
    });
  });

  describe('Legacy Formula Backwards Compatibility', () => {
    it('should calculate company productivity correctly', () => {
      expect(calculateProductivity(10, 0, 1.0, 1)).toBe(10);
      expect(calculateProductivity(10, 10, 1.5, 1)).toBe(22.5);
    });

    it('should calculate combat damage multipliers correctly', () => {
      expect(calculateCombatDamage(0, 0, 1.0)).toBe(10);
      expect(calculateCombatDamage(100, 1, 1.0)).toBe(25);
      expect(calculateCombatDamage(100, 5, 1.0)).toBe(45);
    });
  });

  describe('Industrial System Transactions Integration', () => {
    const repo = new MockGameRepository();
    const testUserId = 'test-player-1234';

    it('should incorporate a company with unique name and owner permissions', async () => {
      // 1. Create company
      const createRes = await repo.createCompany(testUserId, 'Genesis Bakery Co', 1, 14); // Bakery template is 14
      expect(createRes.success).toBe(true);
      expect(createRes.companyId).not.toBeNull();

      // Verify name uniqueness
      const dupeRes = await repo.createCompany(testUserId, 'Genesis Bakery Co', 1, 14);
      expect(dupeRes.success).toBe(false);
      expect(dupeRes.error).toContain('already exists');
    });

    it('should manage cash vaults and prevent negative balances', async () => {
      const comps = await repo.getMyCompanies(testUserId);
      const compId = comps[0].id;

      // Deposit
      const depRes = await repo.vaultCashTransaction(testUserId, compId, 100, true);
      expect(depRes.success).toBe(true);

      const vault = await repo.getCompanyVault(compId);
      expect(vault?.local_currency).toBe(100);

      // Prevent withdraw in excess of vault reserves
      const overRes = await repo.vaultCashTransaction(testUserId, compId, 500, false);
      expect(overRes.success).toBe(false);
      expect(overRes.error).toContain('Insufficient');
    });

    it('should queue production recipes and consume raw ingredients from storage', async () => {
      const comps = await repo.getMyCompanies(testUserId);
      const compId = comps[0].id;

      // Deposit raw resources (Bake Bread needs 2 Grains (id 5), 1 Water (id 7), 1 Coal (id 4))
      await repo.vaultResourceTransaction(testUserId, compId, 5, 10, true); // Deposit 10 grains
      await repo.vaultResourceTransaction(testUserId, compId, 7, 5, true);  // Deposit 5 water
      await repo.vaultResourceTransaction(testUserId, compId, 4, 5, true);  // Deposit 5 coal

      // Queue 2 Breads (requires 4 grains, 2 water, 2 coal)
      const qRes = await repo.queueProduction(testUserId, compId, 1, 2);
      expect(qRes.success).toBe(true);

      // Verify recipe inputs were deducted from company vault
      const vaultStock = await repo.getCompanyInventory(compId);
      const grainStock = vaultStock.find((item) => item.resource_id === 5);
      expect(grainStock?.quantity).toBe(6); // 10 - 4 = 6
    });

    it('should complete manufacturing shifts and pay salaries out of vault currency', async () => {
      const comps = await repo.getMyCompanies(testUserId);
      const compId = comps[0].id;

      // Adjust shift salary of player in member list to 15 LC
      await repo.setEmployeeSalary(testUserId, compId, testUserId, 15);

      // Execute shift (advances bread queue, pays salary, consumes energy)
      const shiftRes = await repo.executeCompanyWorkShift(testUserId, compId);
      expect(shiftRes.success).toBe(true);
      expect(shiftRes.salaryEarned).toBe(15);
      expect(shiftRes.newEnergy).toBe(90); // 100 - 10 = 90
    });
  });

  describe('Marketplace Engine & Double-Auction clearing', () => {
    const repo = new MockGameRepository();
    const sellerId = 'seller-user-999';
    const buyerId = 'buyer-user-888';

    it('should lock assets in escrow and deduct them from player inventories', async () => {
      // Seed seller with 50 Steel (Resource ID 11)
      const mockStorage = (global as any).localStorage;
      mockStorage.setItem('mmo_player_resources', JSON.stringify([
        { profile_id: sellerId, resource_id: 11, quantity: 50 }
      ]));

      // Create sell listing for 20 Steel at 10 LC
      const listRes = await repo.createMarketListing(sellerId, null, 'resource', 11, null, 20, 10, 'local');
      expect(listRes.success).toBe(true);

      // Verify listing locks steel inside escrow and seller stock drops to 30
      const activeListings = await repo.getMarketListings();
      expect(activeListings.length).toBe(1);
      expect(activeListings[0].quantity).toBe(20);

      const sellerStock = JSON.parse(mockStorage.getItem('mmo_player_resources'));
      expect(sellerStock[0].quantity).toBe(30); // 50 - 20 = 30
    });

    it('should refund escrow assets upon active listing cancellation', async () => {
      const activeListings = await repo.getMarketListings();
      const listingId = activeListings[0].id;

      // Cancel listing
      const cancelRes = await repo.cancelMarketListing(sellerId, listingId);
      expect(cancelRes.success).toBe(true);

      // Verify listings collection is cleared and seller stock returned to 50
      const updatedListings = await repo.getMarketListings();
      expect(updatedListings.length).toBe(0);

      const mockStorage = (global as any).localStorage;
      const sellerStock = JSON.parse(mockStorage.getItem('mmo_player_resources'));
      expect(sellerStock[0].quantity).toBe(50);
    });

    it('should clear matching bids/asks, calculate VAT (5%) + system fee (2%), and pay net to seller', async () => {
      const mockStorage = (global as any).localStorage;

      // Re-seed: Seller has 50 Steel, Buyer has 1000 LC
      mockStorage.setItem('mmo_player_resources', JSON.stringify([
        { profile_id: sellerId, resource_id: 11, quantity: 50 }
      ]));
      mockStorage.setItem('mmo_currencies', JSON.stringify({
        [sellerId]: { profile_id: sellerId, gold: 0, local_currency_balance: 100, updated_at: new Date().toISOString() },
        [buyerId]: { profile_id: buyerId, gold: 0, local_currency_balance: 1000, updated_at: new Date().toISOString() }
      }));

      // 1. Seller lists 10 Steel for sale at 10 LC each (gross 100 LC)
      await repo.createMarketListing(sellerId, null, 'resource', 11, null, 10, 10, 'local');

      // 2. Buyer places buy order for 10 Steel at 10 LC each (gross 100 LC)
      const bidRes = await repo.createMarketOrder(buyerId, null, 'resource', 11, null, 10, 10, 'local');
      expect(bidRes.success).toBe(true);

      // Match engine triggers. Seller payout (under Country 1's 10% VAT): gross (100) - VAT (10) - fee (2) = 88 LC.
      const currencies = JSON.parse(mockStorage.getItem('mmo_currencies'));
      expect(currencies[buyerId].local_currency_balance).toBe(900); // 1000 - 100 = 900
      expect(currencies[sellerId].local_currency_balance).toBe(188); // 100 + 88 = 188

      // Buyer receives 10 Steel
      const buyerStock = JSON.parse(mockStorage.getItem('mmo_player_resources')).find((r: any) => r.profile_id === buyerId);
      expect(buyerStock.quantity).toBe(10);
    });

    it('should handle partial fills correctly and keep remainder active on exchange', async () => {
      const mockStorage = (global as any).localStorage;

      // Re-seed: Seller has 40 Steel, Buyer has 500 LC
      mockStorage.setItem('mmo_player_resources', JSON.stringify([
        { profile_id: sellerId, resource_id: 11, quantity: 40 }
      ]));
      mockStorage.setItem('mmo_currencies', JSON.stringify({
        [sellerId]: { profile_id: sellerId, gold: 0, local_currency_balance: 0, updated_at: new Date().toISOString() },
        [buyerId]: { profile_id: buyerId, gold: 0, local_currency_balance: 500, updated_at: new Date().toISOString() }
      }));

      // Seller lists 10 Steel at 10 LC (quantity 10)
      await repo.createMarketListing(sellerId, null, 'resource', 11, null, 10, 10, 'local');

      // Buyer bids for 4 Steel at 10 LC (quantity 4)
      await repo.createMarketOrder(buyerId, null, 'resource', 11, null, 4, 10, 'local');

      // Verify 4 units trade. Listing has 6 units remaining. Buy order is fully completed.
      const activeListings = await repo.getMarketListings();
      expect(activeListings.length).toBe(1);
      expect(activeListings[0].quantity).toBe(6);

      const activeOrders = await repo.getMarketOrders();
      expect(activeOrders.length).toBe(0); // Fully filled

      // Seller payout (under Country 1's 10% VAT): gross (40) - VAT (4) - fee (0.8) = 35.2 LC net.
      const currencies = JSON.parse(mockStorage.getItem('mmo_currencies'));
      expect(currencies[sellerId].local_currency_balance).toBe(35.2);
    });

  });

  describe('Advanced Item Mechanics: Crafting, Equipment & Durability Repairs', () => {
    const repo = new MockGameRepository();
    const testUserId = 'test-character-111';

    it('should deduct ingredients, consume energy, award experience, and craft item', async () => {
      const mockStorage = (global as any).localStorage;

      // Seed resources (2 Grain = id 5, 1 Water = id 7) and stats (100 energy, Level 1)
      mockStorage.setItem('mmo_player_resources', JSON.stringify([
        { profile_id: testUserId, resource_id: 5, quantity: 10 },
        { profile_id: testUserId, resource_id: 7, quantity: 5 }
      ]));
      mockStorage.setItem('mmo_player_stats', JSON.stringify({
        [testUserId]: { profile_id: testUserId, level: 1, experience: 0, energy: 100, strength: 1.0, work_skill: 1.0 }
      }));
      mockStorage.setItem('mmo_inventories', JSON.stringify([]));

      // Craft Wheat Bread (Recipe ID 1, energy cost 5, exp reward 10)
      const craftRes = await repo.craftItem(testUserId, 1);
      expect(craftRes.success).toBe(true);

      // Verify stats: 95 energy, 10 experience
      const statsMap = JSON.parse(mockStorage.getItem('mmo_player_stats'));
      expect(statsMap[testUserId].energy).toBe(95);
      expect(statsMap[testUserId].experience).toBe(10);

      // Verify materials spent: 8 Grain, 4 Water
      const playerResources = JSON.parse(mockStorage.getItem('mmo_player_resources'));
      const grainStock = playerResources.find((r: any) => r.resource_id === 5);
      const waterStock = playerResources.find((r: any) => r.resource_id === 7);
      expect(grainStock.quantity).toBe(8);
      expect(waterStock.quantity).toBe(4);

      // Verify bread created
      const inventories = JSON.parse(mockStorage.getItem('mmo_inventories'));
      expect(inventories.length).toBe(1);
      expect(inventories[0].item_template_id).toBe(1); // Wheat Bread
      expect(inventories[0].quantity).toBe(1);
    });

    it('should consume food and restore energy on player stats', async () => {
      const mockStorage = (global as any).localStorage;

      // Seed stats with 80 energy
      const statsMap = JSON.parse(mockStorage.getItem('mmo_player_stats'));
      statsMap[testUserId].energy = 80;
      mockStorage.setItem('mmo_player_stats', JSON.stringify(statsMap));

      // Get inventories item id
      const inventories = JSON.parse(mockStorage.getItem('mmo_inventories'));
      const breadItemId = inventories[0].id;

      // Consume item (restores 10 energy)
      const consumeRes = await repo.consumeItem(testUserId, breadItemId);
      expect(consumeRes.success).toBe(true);
      expect(consumeRes.newEnergy).toBe(90);

      // Verify item was removed from inventory
      const updatedInventories = JSON.parse(mockStorage.getItem('mmo_inventories'));
      expect(updatedInventories.length).toBe(0);
    });

    it('should equip item and bind it to character equipment slots sheet', async () => {
      const mockStorage = (global as any).localStorage;

      // Create an Iron Sword instance (Template 2)
      const ironSwordId = 'sword-inv-123';
      const ironSwordInstId = 'sword-inst-123';
      mockStorage.setItem('mmo_inventories', JSON.stringify([
        {
          id: ironSwordId,
          owner_id: testUserId,
          item_template_id: 2,
          quantity: 1,
          quality: 2,
          item_instance_id: ironSwordInstId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]));

      // Equip item in weapon slot
      const equipRes = await repo.equipItem(testUserId, ironSwordId, 'weapon');
      expect(equipRes.success).toBe(true);

      // Verify equipment slot has bound weapon id
      const equipment = await repo.getEquipment(testUserId);
      expect(equipment?.weapon_id).toBe(ironSwordId);
    });

    it('should pay currency fee and repair item durability to full', async () => {
      const mockStorage = (global as any).localStorage;

      // Setup damaged iron sword (60/100 durability) and 100 LC in wallet
      const instances = [
        {
          id: 'sword-inst-123',
          template_id: 2,
          quality: 2,
          current_durability: 60,
          max_durability: 100,
          enchantment_level: 0,
          sockets_json: [],
          modifiers_json: [],
          metadata: {},
          created_at: new Date().toISOString()
        }
      ];
      mockStorage.setItem('mmo_instances', JSON.stringify(instances));
      mockStorage.setItem('mmo_currencies', JSON.stringify({
        [testUserId]: { profile_id: testUserId, gold: 0, local_currency_balance: 100, updated_at: new Date().toISOString() }
      }));

      // Repair iron sword (costs: 40 points missing * 1.5 LC = 60 LC)
      const repairRes = await repo.repairItem(testUserId, 'sword-inv-123');
      expect(repairRes.success).toBe(true);
      expect(repairRes.costPaid).toBe(60);

      // Verify durability is restored to 100
      const updatedInstances = JSON.parse(mockStorage.getItem('mmo_instances'));
      expect(updatedInstances[0].current_durability).toBe(100);

      // Verify currency was deducted: 100 - 60 = 40 LC
      const currenciesMap = JSON.parse(mockStorage.getItem('mmo_currencies'));
      expect(currenciesMap[testUserId].local_currency_balance).toBe(40);
    });
  });

  describe('Phase 13 Gameplay Balancing & Economic Simulation Formulas', () => {
    it('should calculate level-scaled energy regeneration caps', () => {
      expect(calculateEnergyRegen(1)).toBe(10);
      expect(calculateEnergyRegen(10)).toBe(12);
      expect(calculateEnergyRegen(100)).toBe(30); // capped at 30
    });

    it('should calculate tier and rarity-adjusted repair costs', () => {
      // 20 wear points * base value 50 * rarity epic (3.5) * 0.02 = 70 LC
      const cost = calculateRepairCost(50, 80, 100, 'epic');
      expect(cost).toBe(70);
    });

    it('should calculate transport speed and fare cost travel parameters', () => {
      const travelFoot = calculateTravelCost(20, 'foot');
      expect(travelFoot.cost).toBe(40);
      expect(travelFoot.cooldown).toBe(200);

      const travelTrain = calculateTravelCost(20, 'train');
      expect(travelTrain.cost).toBe(160);
      expect(travelTrain.cooldown).toBe(40);
    });

    it('should calculate gross transaction fees and taxes for marketplace asks', () => {
      // 100 LC * (5% base + 2% regional) = 7 LC
      const tax = calculateMarketTax(100, 5, 2);
      expect(tax).toBe(7);
    });

    it('should calculate distance and region scale declaration war costs', () => {
      const cost = calculateWarCost(50, 1000);
      expect(cost).toBe(11000);
    });

    it('should calculate exponential material scales for guild level upgrades', () => {
      const materials = calculateGuildUpgradeCost(5);
      expect(materials.gold).toBe(1811);
      expect(materials.wood).toBe(656);
      expect(materials.iron).toBe(335);
    });

    it('should execute player-agent economic simulation loops and calculate inflation index', () => {
      const result = runEconomicSimulation(100, 20);
      expect(result.inflationRate).toBeDefined();
      expect(result.priceStabilityIndex).toBeDefined();
      expect(result.marketPriceTrends.length).toBe(20);
      expect(result.logs.length).toBeGreaterThan(0);
    });
  });

  describe('Milestone 5: Geopolitics & Governance Behavioral Lifecycle', () => {
    it('should handle political party creation and joining', async () => {
      const repo = new MockGameRepository();
      const originalParties = await repo.getPoliticalParties();
      
      const partyName = `Test party ${Date.now()}`;
      const createRes = await repo.createPoliticalParty(partyName, 'Test platform description');
      expect(createRes.success).toBe(true);
      expect(createRes.partyId).toBeDefined();

      const parties = await repo.getPoliticalParties();
      expect(parties.length).toBeGreaterThan(originalParties.length);
      
      const joinedRes = await repo.joinPoliticalParty(createRes.partyId!);
      expect(joinedRes.success).toBe(true);
    });

    it('should handle candidate registration and voting', async () => {
      const repo = new MockGameRepository();
      const elections = await repo.getElections();
      expect(elections.length).toBeGreaterThan(0);
      const election = elections[0];
      
      const registerRes = await repo.registerAsCandidate(election.id);
      expect(registerRes.success).toBe(true);

      const candidates = await repo.getCandidates(election.id);
      const candidate = candidates.find(c => c.candidate_id === 'test-user');
      expect(candidate).toBeDefined();
      
      const voteRes = await repo.voteForCandidate(election.id, candidate!.candidate_id);
      expect(voteRes.success).toBe(true);
      
      const candidatesAfter = await repo.getCandidates(election.id);
      const candidateAfter = candidatesAfter.find(c => c.candidate_id === 'test-user');
      expect(candidateAfter!.votes_received).toBe(1);
    });

    it('should resolve expired elections and bills on simulation tick and update matching tax rate', async () => {
      const repo = new MockGameRepository();
      const countries = await repo.getCountries();
      const targetCountry = countries[0];
      const initialVat = targetCountry.vat_rate;

      // 1. Propose and vote on a tax_change bill
      const newVat = initialVat === 15 ? 10 : 15;
      const proposeRes = await repo.proposeBill(
        'Adjust VAT Tax Rate',
        'Modifying tax rates to test dynamic checkout shifts',
        'tax_change',
        { vat_rate: newVat, income_tax_rate: newVat }
      );
      expect(proposeRes.success).toBe(true);
      const billId = proposeRes.billId!;

      const voteRes = await repo.voteOnBill(billId, 'yes');
      expect(voteRes.success).toBe(true);

      // Register candidate in election to verify election transition as well
      const elections = await repo.getElections();
      const election = elections[0];
      await repo.registerAsCandidate(election.id);

      // 2. Make election & bill expire
      const bills = await repo.getBills();
      const createdBill = bills.find((b: any) => b.id === billId);
      if (createdBill) {
        createdBill.ends_at = new Date(Date.now() - 10000).toISOString();
        repo.setStorageItem('mmo_bills', bills);
      }
      
      const electionsList = await repo.getElections();
      const activeElection = electionsList.find((e: any) => e.id === election.id);
      if (activeElection) {
        activeElection.ends_at = new Date(Date.now() - 10000).toISOString();
        repo.setStorageItem('mmo_elections', electionsList);
      }

      // 3. Trigger simulation tick
      const tickRes = await repo.executeSimulationTick();
      expect(tickRes.success).toBe(true);

      // 4. Verify bill passed and country VAT rate updated
      const countriesAfter = await repo.getCountries();
      const targetCountryAfter = countriesAfter.find(c => c.id === targetCountry.id);
      expect(targetCountryAfter!.vat_rate).toBe(newVat);

      // 5. Verify election completed and president set
      const electionsAfter = await repo.getElections();
      const electionAfter = electionsAfter.find(e => e.id === election.id);
      expect(electionAfter!.status).toBe('completed');
    });
  });

});
