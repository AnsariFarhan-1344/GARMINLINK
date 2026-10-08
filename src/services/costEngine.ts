import { CostAllocationBreakdown, GoodsCategory } from '../types';

/**
 * Fair Shared Cost Engine for Rural Logistics.
 * 
 * Rather than a naive equal split (which is unfair for smaller farmers / shorter distances),
 * we use a Ton-Kilometer + Handling proportional allocation model:
 * 
 * Base solo cost calculation:
 * Solo Cost = Base_Booking_Fee + (Distance_km * Solo_Rate_Per_Km) + Cargo_Handling_Fee
 * 
 * Pooled cost calculation:
 * Total Vehicle Trip Cost = Fixed_Trip_Base + (Optimized_Route_km * Heavy_Rate_Per_Km) + (Num_Stops * Stop_Charge)
 * Individual Allocated Cost = Stop_Base_Fee + [(Weight_i * Dist_i) / Sum(Weight_j * Dist_j)] * Variable_Trip_Pool
 */

export interface CostCalculationInput {
  weightKg: number;
  distanceKm: number;
  category: GoodsCategory;
  destinationType: string;
}

export function calculateSoloVsPooledCost(input: CostCalculationInput) {
  const { weightKg, distanceKm, category } = input;
  
  // Rate matrix for dedicated solo vehicle hire (Auto/Tempo)
  let soloBaseRate = 350; // Base callout fee
  let soloPerKm = 18; // Solo tempo rate
  let handlingFee = Math.max(50, weightKg * 1.5);
  
  if (category === 'DAIRY' || category === 'FISHERIES' || category === 'PERISHABLE_AGRI') {
    handlingFee += 80; // Cold-care / fast-turnaround
  }
  
  // Solo cost if an individual hires a whole tempo/auto alone
  const soloEstimatedCost = Math.round(soloBaseRate + (distanceKm * soloPerKm) + handlingFee);
  
  // In a pooled vehicle (Tata Ace / Bolero with 3-5 participants), the cost is shared
  // Typical pooled savings ranges between 45% to 65%
  const pooledDiscountFactor = weightKg > 200 ? 0.55 : (weightKg > 80 ? 0.48 : 0.40);
  const pooledEstimatedCost = Math.max(120, Math.round(soloEstimatedCost * pooledDiscountFactor));
  
  // Return-trip (Backhaul) matching: Up to 40% discount on top of backhaul incentive
  // Transporters heading back empty offer substantial savings to avoid running deadhead
  const returnTripCost = Math.max(90, Math.round(pooledEstimatedCost * 0.60));
  const returnSavings = soloEstimatedCost - returnTripCost;
  const returnSavingsPercent = Math.round((returnSavings / soloEstimatedCost) * 100);

  const potentialSavings = soloEstimatedCost - pooledEstimatedCost;
  const savingsPercent = Math.round((potentialSavings / soloEstimatedCost) * 100);

  return {
    soloCost: soloEstimatedCost,
    pooledCost: pooledEstimatedCost,
    potentialSavings,
    savingsPercent,
    returnTripCost,
    returnSavings,
    returnSavingsPercent
  };
}

export function calculateDetailedPoolCostAllocation(
  totalVehicleCost: number,
  members: {
    senderName: string;
    product: string;
    weightKg: number;
    distanceKm: number;
  }[]
): CostAllocationBreakdown {
  if (members.length === 0) {
    return {
      totalVehicleTripCost: totalVehicleCost,
      members: [],
      totalSoloCost: 0,
      totalPooledCost: 0,
      totalSaved: 0,
      overallSavingsPercent: 0
    };
  }

  // 1. Calculate each member's individual solo cost
  const soloCosts = members.map(m => calculateSoloVsPooledCost({
    weightKg: m.weightKg,
    distanceKm: m.distanceKm,
    category: 'PROCESSED_FOOD',
    destinationType: 'TALUKA_HUB'
  }).soloCost);

  const totalSoloCost = soloCosts.reduce((a, b) => a + b, 0);

  // 2. Fixed base stop fee per member (e.g., ₹50 for pickup & drop handling)
  const baseStopFee = 60;
  const totalBaseFees = baseStopFee * members.length;
  const remainingVariablePool = Math.max(0, totalVehicleCost - totalBaseFees);

  // 3. Compute ton-kilometer weight metric: Weight * Distance
  const tonKmWeights = members.map(m => m.weightKg * Math.max(5, m.distanceKm));
  const sumTonKm = tonKmWeights.reduce((a, b) => a + b, 0) || 1;

  // 4. Allocate shared cost
  const calculatedMembers = members.map((m, idx) => {
    const shareRatio = tonKmWeights[idx] / sumTonKm;
    const allocatedCost = Math.round(baseStopFee + (remainingVariablePool * shareRatio));
    const soloCost = soloCosts[idx];
    const savings = Math.max(0, soloCost - allocatedCost);
    const savingsPercent = Math.round((savings / soloCost) * 100);

    return {
      senderName: m.senderName,
      product: m.product,
      weightKg: m.weightKg,
      distanceKm: m.distanceKm,
      soloCost,
      allocatedCost,
      savings,
      savingsPercent
    };
  });

  const totalPooledCost = calculatedMembers.reduce((acc, curr) => acc + curr.allocatedCost, 0);
  const totalSaved = Math.max(0, totalSoloCost - totalPooledCost);
  const overallSavingsPercent = totalSoloCost > 0 ? Math.round((totalSaved / totalSoloCost) * 100) : 0;

  return {
    totalVehicleTripCost: totalVehicleCost,
    members: calculatedMembers,
    totalSoloCost,
    totalPooledCost,
    totalSaved,
    overallSavingsPercent
  };
}
