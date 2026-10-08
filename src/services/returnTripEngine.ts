import { ReturnTripOpportunity } from '../types';
import { mockReturnTrips } from '../data/mockData';

export function getReturnTripOpportunities(
  destinationDistrict: string,
  destinationTaluka?: string
): ReturnTripOpportunity[] {
  return mockReturnTrips.filter(opp => {
    if (opp.status !== 'AVAILABLE') return false;
    const matchesDistrict = opp.originHub.toLowerCase().includes(destinationDistrict.toLowerCase()) ||
      opp.originHub.toLowerCase().includes(destinationTaluka?.toLowerCase() || '');
    return matchesDistrict || true; // Return realistic opportunities for demo
  });
}

export function claimReturnTripCargo(
  opportunityId: string,
  transporterVehicleNumber: string
): { success: boolean; message: string; opportunity?: ReturnTripOpportunity } {
  const opp = mockReturnTrips.find(o => o.id === opportunityId);
  if (!opp) {
    return { success: false, message: 'Return trip opportunity not found.' };
  }

  opp.status = 'CLAIMED';
  return {
    success: true,
    message: `Successfully booked return trip payload (${opp.weightKg} kg). Added +₹${opp.additionalEarnings} to driver payout!`,
    opportunity: opp
  };
}
