import { GoodsCategory } from '../types';

export interface ShelfLifeInfo {
  category: GoodsCategory;
  shelfLifeHours: number | null; // null for unlimited
  formattedDuration: string;
  urgency: 'URGENT' | 'TODAY' | 'FLEXIBLE';
  badgeLabel: string;
  badgeClass: string;
  spoilageRiskText: string;
  recommendedSoloCost: number;
  recommendedWaitCost: number;
}

/**
 * Shelf-life rules per prompt specification:
 * - Fish: 4h
 * - Fresh produce: 12h
 * - Processed food: 3 days (72h)
 * - Handicrafts: unlimited
 */
export const SHELF_LIFE_MAP: Record<GoodsCategory, {
  hours: number | null;
  label: string;
  urgency: 'URGENT' | 'TODAY' | 'FLEXIBLE';
}> = {
  FISHERIES: {
    hours: 4,
    label: 'Fish & Marine (4h Shelf-Life)',
    urgency: 'URGENT'
  },
  FRUITS: {
    hours: 12,
    label: 'Fresh Produce (12h Shelf-Life)',
    urgency: 'TODAY'
  },
  VEGETABLES: {
    hours: 12,
    label: 'Fresh Produce (12h Shelf-Life)',
    urgency: 'TODAY'
  },
  PERISHABLE_AGRI: {
    hours: 12,
    label: 'Fresh Produce (12h Shelf-Life)',
    urgency: 'TODAY'
  },
  DAIRY: {
    hours: 12,
    label: 'Fresh Dairy (12h Shelf-Life)',
    urgency: 'TODAY'
  },
  PROCESSED_FOOD: {
    hours: 72,
    label: 'Processed Food (3 Days Shelf-Life)',
    urgency: 'FLEXIBLE'
  },
  SPICES: {
    hours: 72,
    label: 'Processed & Spices (3 Days Shelf-Life)',
    urgency: 'FLEXIBLE'
  },
  HANDICRAFTS: {
    hours: null,
    label: 'Handicrafts (Unlimited Shelf-Life)',
    urgency: 'FLEXIBLE'
  },
  OTHER: {
    hours: null,
    label: 'General Goods (Unlimited Shelf-Life)',
    urgency: 'FLEXIBLE'
  }
};

export function getShelfLifeInfo(category: GoodsCategory): ShelfLifeInfo {
  const config = SHELF_LIFE_MAP[category] || SHELF_LIFE_MAP.OTHER;

  let badgeLabel = 'Flexible (Non-Perishable)';
  let badgeClass = 'bg-[#E7EBD9] text-[#556B2F] border-[#D9DED0]';
  let formattedDuration = 'Unlimited';
  let spoilageRiskText = 'Low risk: Non-perishable shelf-life.';

  if (config.urgency === 'URGENT') {
    badgeLabel = 'Urgent (4h Limit)';
    badgeClass = 'bg-red-50 text-red-700 border-red-200';
    formattedDuration = '4 Hours';
    spoilageRiskText = 'High spoilage risk if pooling departure delayed beyond 2 hours.';
  } else if (config.urgency === 'TODAY') {
    badgeLabel = 'Today (12h Limit)';
    badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
    formattedDuration = '12 Hours';
    spoilageRiskText = 'Moderate risk: Must reach APMC mandi/cooling hub before evening.';
  } else {
    badgeLabel = config.hours ? 'Flexible (3 Days)' : 'Flexible (Unlimited)';
    badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    formattedDuration = config.hours ? '3 Days (72h)' : 'Unlimited';
    spoilageRiskText = 'Low spoilage risk: Safe to wait for high-utilization pools.';
  }

  return {
    category,
    shelfLifeHours: config.hours,
    formattedDuration,
    urgency: config.urgency,
    badgeLabel,
    badgeClass,
    spoilageRiskText,
    recommendedSoloCost: 907,
    recommendedWaitCost: 363
  };
}
