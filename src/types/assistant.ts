import { Vehicle, GoodsCategory, DestinationType } from './index';

export type AssistantLanguage = 'mr' | 'hi' | 'en';
export type SpeechLangCode = 'mr-IN' | 'hi-IN' | 'en-IN';

export interface ExtractedCargoRequest {
  product: string | null;
  product_original?: string;
  weight_kg: number | null;
  destination: string | null;
  pickup_village: string | null;
  urgency: 'URGENT' | 'TODAY' | 'FLEXIBLE' | null;
  language: AssistantLanguage;
  category?: GoodsCategory;
  shelf_life_hours?: number | null;
  missing_fields?: ('product' | 'weight_kg' | 'destination')[];
  follow_up_question?: string | null;
  follow_up_key?: string;
  follow_up_params?: Record<string, string | number>;
  is_fallback?: boolean;
  is_unrelated?: boolean;
}

export interface RecommendedVehicleCard {
  vehicle: Vehicle;
  driverName: string;
  vehicleType: string;
  freeKg: number;
  distanceKm: number;
  etaMin: number;
  estimatedCostRs: number;
  soloCostRs: number;
  pooledCostRs: number;
  savingsPercent: number;
  isReturnTrip: boolean;
  returnTripDiscountTag?: string;
  matchScore: number;
}

export interface RecommendationAlternative {
  title: string;
  desc: string;
  cost?: number;
  type: 'SOLO_HIRE' | 'WAIT_RETURN' | 'NEARBY_HUB';
}

export interface RecommendationResult {
  destination: string;
  destinationTownKey?: string;
  pickupLocation: string;
  weightKg: number;
  product: string;
  productKey?: string;
  category: GoodsCategory;
  matchedVehicles: RecommendedVehicleCard[];
  topCheapest: RecommendedVehicleCard | null;
  spokenKey?: string;
  spokenParams?: Record<string, string | number>;
  spokenText: string;
  isPerishable: boolean;
  freshnessDeadlineText?: string;
  priorityText?: string;
  hasAlternativeSuggestions: boolean;
  alternatives?: RecommendationAlternative[];
}

export interface AssistantChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  userText?: string;
  key?: string;
  params?: Record<string, string | number>;
  text?: string; // Optional legacy / fallback text
  timestamp: string;
  extractedData?: ExtractedCargoRequest;
  recommendation?: RecommendationResult;
  isFallback?: boolean;
  awaitingConfirmation?: boolean;
  confirmedVehicle?: RecommendedVehicleCard;
}

export interface PrefilledBookingData {
  productName: string;
  goodsCategory: GoodsCategory;
  weightKg: number;
  destination: string;
  destinationType: DestinationType;
  vehicleId?: string;
  driverName?: string;
  estimatedCost?: number;
  pickupVillage?: string;
}
