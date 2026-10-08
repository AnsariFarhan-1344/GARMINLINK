import { Vehicle, TransporterMatch, LocationInfo } from '../types';
import { mockVehicles } from '../data/mockData';

// Vehicle type rate in Rs/km
export const VEHICLE_TYPE_RATES: Record<string, number> = {
  AUTO: 12,
  E_RICKSHAW_CARGO: 10,
  TATA_ACE: 16,
  PICKUP: 20,
  MINI_TRUCK: 24,
  TRUCK: 30
};

// Helper: Haversine distance in KM
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export function matchTransportersForShipment(
  pickupLocation: LocationInfo,
  destinationLocation: LocationInfo,
  totalWeightKg: number,
  allVehicles: Vehicle[] = mockVehicles
): TransporterMatch[] {
  const matches: TransporterMatch[] = [];

  // Route distance between pickup & destination
  const routeDistance = calculateDistanceKm(
    pickupLocation.coordinates.lat,
    pickupLocation.coordinates.lng,
    destinationLocation.coordinates.lat,
    destinationLocation.coordinates.lng
  );

  for (const vehicle of allVehicles) {
    // 1. Check capacity fit
    const availableCap = vehicle.maxPayloadKg - vehicle.currentPayloadKg;
    const capacityFits = availableCap >= totalWeightKg;

    // 2. Distance to pickup point
    const distToPickup = calculateDistanceKm(
      vehicle.currentLocation.coordinates.lat,
      vehicle.currentLocation.coordinates.lng,
      pickupLocation.coordinates.lat,
      pickupLocation.coordinates.lng
    );

    // 3. Vehicle Type Rate
    const vehicleRate = VEHICLE_TYPE_RATES[vehicle.category] || 16;

    // 4. Estimated Cost = (distance_to_pickup + route_distance) x vehicle_type_rate
    const estimatedCostRs = Math.round((distToPickup + routeDistance) * vehicleRate);

    // 5. Match Score visible formula:
    // Distance (40%) + Payload Fit (30%) + Driver Rating (20%) + Return-Route Bonus (10%)
    const reasons: string[] = [];

    // Distance 40%:
    let distanceScore = 0;
    if (distToPickup <= 5) {
      distanceScore = 40;
      reasons.push(`Within 5 km radius of pickup (${distToPickup} km)`);
    } else if (distToPickup <= 15) {
      distanceScore = 34;
      reasons.push(`Nearby taluka area (${distToPickup} km)`);
    } else if (distToPickup <= 25) {
      distanceScore = 28;
      reasons.push(`Standard service zone (${distToPickup} km)`);
    } else if (distToPickup <= 50) {
      distanceScore = 18;
      reasons.push(`Wider district perimeter (${distToPickup} km)`);
    } else if (distToPickup <= 100) {
      distanceScore = 8;
      reasons.push(`Long haul deadhead distance (${distToPickup} km)`);
    } else {
      distanceScore = 0;
      reasons.push(`Excessive distance (>100 km, ineligible for best match)`);
    }

    // Payload Fit 30%:
    let payloadScore = 0;
    if (capacityFits) {
      const fitRatio = (vehicle.currentPayloadKg + totalWeightKg) / vehicle.maxPayloadKg;
      if (fitRatio >= 0.35 && fitRatio <= 0.95) {
        payloadScore = 30;
        reasons.push(`Ideal payload fit (${Math.round(fitRatio * 100)}% utilization)`);
      } else {
        payloadScore = 22;
        reasons.push(`Available payload: ${availableCap} kg fits requirement`);
      }
    } else {
      payloadScore = 5;
      reasons.push(`Insufficient capacity (${availableCap} kg available, requires ${totalWeightKg} kg)`);
    }

    // Driver Rating 20%:
    const ratingScore = Math.min(20, Math.max(0, Math.round((vehicle.rating / 5) * 20)));
    if (vehicle.rating >= 4.8) {
      reasons.push(`Top-rated rural driver (${vehicle.rating}★, ${vehicle.completedTrips} trips)`);
    }

    // Return-Route Bonus 10%:
    const isReturnTrip = vehicle.status === 'RETURNING' || 
      vehicle.currentLocation.taluka === destinationLocation.taluka ||
      (vehicle.status === 'IDLE' && distToPickup <= 15);
    const returnBonusScore = isReturnTrip ? 10 : 0;
    if (isReturnTrip) {
      reasons.push(`Return-route backhaul bonus active (+10 pts)`);
    }

    const matchScore = Math.min(100, Math.max(10, distanceScore + payloadScore + ratingScore + returnBonusScore));
    const estimatedPickupEtaMin = Math.max(8, Math.round(distToPickup * 2.2));

    matches.push({
      transporter: vehicle,
      matchScore,
      scoreBreakdown: {
        distanceScore,
        payloadScore,
        ratingScore,
        returnBonusScore
      },
      distanceToPickupKm: distToPickup,
      capacityFits,
      availableCapacityKg: availableCap,
      estimatedCostRs,
      estimatedPickupEtaMin,
      rating: vehicle.rating,
      reasons,
      vehicleRate,
      isReturnTrip
    });
  }

  // Sort descending by match score
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}
