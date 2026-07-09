# Aegis Kingdoms - Balancing & Formulas Guide

Documentation of the mathematical balancing principles implemented for Closed Alpha.

## 1. Leveling Curve
- Formula: $RequiredEXP = Level^{2.2} \times 120$
- Promotes a steep progression requirement starting at Level 10 to encourage group guild play.

## 2. Energy Mechanics
- Level base: $EnergyRegen = 10 + \lfloor Level \times 0.2 \rfloor$, capped at 30/tick.
- Food consumption: Wheat bread restores 10 energy, raw materials and refined crafts consume 5-15 energy.

## 3. Durability & Repairs
- Every combat round decay cost: $Cost = (MaxDurability - Durability) \times Value \times Rarity \times 0.02$.
- Rarity multipliers: Common (1.0x), Uncommon (1.5x), Rare (2.2x), Epic (3.5x), Legendary (5.0x).

## 4. Marketplace & Taxes
- Transactions tax formula: $Tax = Price \times \frac{BaseTax + RegionTax}{100}$.
- Local region taxes are adjustable by country governments.
