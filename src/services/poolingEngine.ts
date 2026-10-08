import { Shipment, ShipmentPool, VehicleCategory } from '../types';
import { calculateDistanceKm } from './transporterMatcher';
import { calculateDetailedPoolCostAllocation } from './costEngine';
import { mockVehicles } from '../data/mockData';

/**
 * Smart Demand Pooling Engine for Rural Maharashtra
 */

export interface PoolMatchResult {
  compatiblePools: ShipmentPool[];
  compatibleShipments: Shipment[];
  canFormNewPool: boolean;
  recommendedVehicleCategory: VehicleCategory;
  estimatedSharedCostPerMember: number;
  totalPooledCost: number;
  potentialSavingsPercent: number;
}

export function findCompatiblePools(
  targetShipment: Shipment,
  existingPools: ShipmentPool[],
  availableShipments: Shipment[]
): PoolMatchResult {
  const compatiblePools: ShipmentPool[] = [];

  // 1. Check existing open / forming pools
  for (const pool of existingPools) {
    if (pool.status === 'FORMING' || pool.status === 'MATCHED') {
      const remainingCap = pool.vehicleCapacityKg - pool.totalWeightKg;
      
      // Match destination district & taluka proximity
      const isDestMatch = 
        pool.destinationArea.toLowerCase().includes(targetShipment.destination.district.toLowerCase()) ||
        pool.destinationArea.toLowerCase().includes(targetShipment.destination.taluka.toLowerCase()) ||
        targetShipment.destination.type === 'TALUKA_HUB' ||
        targetShipment.destination.type === 'MANDI_APMC';

      if (isDestMatch && remainingCap >= targetShipment.weightKg) {
        compatiblePools.push(pool);
      }
    }
  }

  // 2. Search other standalone unpooled shipments in the same belt (within 20 km)
  const compatibleShipments = availableShipments.filter(s => {
    if (s.id === targetShipment.id || s.poolId) return false;

    // Geographic pickup proximity
    const pickupDist = calculateDistanceKm(
      targetShipment.origin.coordinates.lat,
      targetShipment.origin.coordinates.lng,
      s.origin.coordinates.lat,
      s.origin.coordinates.lng
    );

    // Destination proximity
    const destDist = calculateDistanceKm(
      targetShipment.destination.coordinates.lat,
      targetShipment.destination.coordinates.lng,
      s.destination.coordinates.lat,
      s.destination.coordinates.lng
    );

    const isPickupNear = pickupDist <= 25; // 25 km cluster radius
    const isDestNear = destDist <= 30;

    return isPickupNear && isDestNear;
  });

  // 3. Recommended vehicle category based on total combined weight
  const candidateWeight = targetShipment.weightKg + compatibleShipments.reduce((sum, s) => sum + s.weightKg, 0);
  
  let recommendedCat: VehicleCategory = 'AUTO';
  let capKg = 450;

  if (candidateWeight > 1200) {
    recommendedCat = 'MINI_TRUCK';
    capKg = 2500;
  } else if (candidateWeight > 700) {
    recommendedCat = 'PICKUP';
    capKg = 1250;
  } else if (candidateWeight > 300) {
    recommendedCat = 'TATA_ACE';
    capKg = 750;
  } else if (candidateWeight > 150) {
    recommendedCat = 'E_RICKSHAW_CARGO';
    capKg = 550;
  }

  // 4. Calculate cost metrics for the combined pool
  const memberInputs = [
    {
      senderName: targetShipment.senderName,
      product: targetShipment.productName,
      weightKg: targetShipment.weightKg,
      distanceKm: calculateDistanceKm(
        targetShipment.origin.coordinates.lat,
        targetShipment.origin.coordinates.lng,
        targetShipment.destination.coordinates.lat,
        targetShipment.destination.coordinates.lng
      )
    },
    ...compatibleShipments.map(s => ({
      senderName: s.senderName,
      product: s.productName,
      weightKg: s.weightKg,
      distanceKm: calculateDistanceKm(
        s.origin.coordinates.lat,
        s.origin.coordinates.lng,
        s.destination.coordinates.lat,
        s.destination.coordinates.lng
      )
    }))
  ];

  const totalVehicleTripCost = Math.round(450 + (candidateWeight * 1.2) + (memberInputs.length * 90));
  const costBreakdown = calculateDetailedPoolCostAllocation(totalVehicleTripCost, memberInputs);

  const avgSharedCost = memberInputs.length > 0 
    ? Math.round(costBreakdown.totalPooledCost / memberInputs.length) 
    : targetShipment.estimatedPooledCost;

  return {
    compatiblePools,
    compatibleShipments,
    canFormNewPool: compatibleShipments.length > 0,
    recommendedVehicleCategory: recommendedCat,
    estimatedSharedCostPerMember: avgSharedCost,
    totalPooledCost: costBreakdown.totalPooledCost,
    potentialSavingsPercent: costBreakdown.overallSavingsPercent || 50
  };
}

export function createNewPoolFromShipments(
  shipmentsToPool: Shipment[],
  poolCodePrefix: string = 'POOL-MH'
): ShipmentPool {
  const totalWeight = shipmentsToPool.reduce((sum, s) => sum + s.weightKg, 0);
  const poolId = `pool-${Date.now()}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const poolCode = `${poolCodePrefix}-${randomSuffix}`;

  let vehicleCat: VehicleCategory = 'TATA_ACE';
  let capacity = 750;

  if (totalWeight > 1200) {
    vehicleCat = 'MINI_TRUCK';
    capacity = 2500;
  } else if (totalWeight > 700) {
    vehicleCat = 'PICKUP';
    capacity = 1250;
  } else if (totalWeight <= 300) {
    vehicleCat = 'AUTO';
    capacity = 450;
  }

  const memberInputs = shipmentsToPool.map(s => ({
    senderName: s.senderName,
    product: s.productName,
    weightKg: s.weightKg,
    distanceKm: calculateDistanceKm(
      s.origin.coordinates.lat,
      s.origin.coordinates.lng,
      s.destination.coordinates.lat,
      s.destination.coordinates.lng
    )
  }));

  const totalVehicleCost = Math.round(400 + (totalWeight * 1.1) + (shipmentsToPool.length * 80));
  const costAllocation = calculateDetailedPoolCostAllocation(totalVehicleCost, memberInputs);

  const originCluster = `${shipmentsToPool[0].origin.taluka} Belt (${shipmentsToPool.map(s => s.origin.village || s.origin.taluka).slice(0, 3).join(', ')})`;
  const destCluster = `${shipmentsToPool[0].destination.name} / ${shipmentsToPool[0].destination.district}`;

  const members = shipmentsToPool.map((s, idx) => {
    const allocated = costAllocation.members[idx];
    return {
      shipmentId: s.id,
      senderName: s.senderName,
      senderOrg: s.senderOrg,
      productName: `${s.productName} (${s.weightKg} kg)`,
      category: s.category,
      weightKg: s.weightKg,
      originVillage: s.origin.village || s.origin.taluka,
      allocatedCost: allocated?.allocatedCost || s.estimatedPooledCost,
      individualCost: allocated?.soloCost || s.estimatedSoloCost,
      savings: allocated?.savings || s.potentialSavings,
      status: 'PENDING' as const
    };
  });

  return {
    id: poolId,
    poolCode,
    originArea: originCluster,
    destinationArea: destCluster,
    destinationHubId: shipmentsToPool[0].destination.type?.includes('HUB') ? 'hub-khed' : undefined,
    totalWeightKg: totalWeight,
    recommendedVehicleCategory: vehicleCat,
    vehicleCapacityKg: capacity,
    utilizationPercent: parseFloat(((totalWeight / capacity) * 100).toFixed(1)),
    totalSoloCost: costAllocation.totalSoloCost,
    estimatedPooledCost: costAllocation.totalPooledCost,
    totalSavingsAmount: costAllocation.totalSaved,
    savingsPercent: costAllocation.overallSavingsPercent,
    status: 'FORMING',
    members,
    scheduledDeparture: 'Today, within 2 hours',
    estimatedArrival: 'Today, afternoon'
  };
}
