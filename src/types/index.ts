export type UserRole = 
  | 'ENTREPRENEUR_SHG'
  | 'FARMER'
  | 'TRANSPORTER_DRIVER'
  | 'HUB_MANAGER'
  | 'MARKET_BUYER'
  | 'ADMIN';

export type GoodsCategory =
  | 'PERISHABLE_AGRI'
  | 'PROCESSED_FOOD'
  | 'HANDICRAFTS'
  | 'DAIRY'
  | 'FISHERIES'
  | 'FRUITS'
  | 'VEGETABLES'
  | 'SPICES'
  | 'OTHER';

export type DestinationType =
  | 'TALUKA_HUB'
  | 'DISTRICT_HUB'
  | 'MANDI_APMC'
  | 'BUYER'
  | 'WAREHOUSE'
  | 'RETAILER';

export type VehicleCategory =
  | 'AUTO'
  | 'E_RICKSHAW_CARGO'
  | 'TATA_ACE'
  | 'PICKUP'
  | 'MINI_TRUCK'
  | 'TRUCK';

export type ShipmentStatus =
  | 'ORDER_CREATED'
  | 'POOL_SEARCHING'
  | 'POOL_CONFIRMED'
  | 'TRANSPORTER_ASSIGNED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED';

export type HubType =
  | 'VILLAGE_COLLECTION_POINT'
  | 'TALUKA_HUB'
  | 'DISTRICT_HUB'
  | 'MANDI_APMC'
  | 'WAREHOUSE';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  organizationName?: string;
  district: string;
  taluka: string;
  village: string;
  avatarUrl?: string;
  rating?: number;
  isVerified: boolean;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationInfo {
  name: string;
  district: string;
  taluka: string;
  village?: string;
  address: string;
  coordinates: Coordinates;
  type?: DestinationType | HubType;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string; // e.g. "MH-08-E-4219"
  driverName: string;
  driverPhone: string;
  driverId: string;
  category: VehicleCategory;
  makeModel: string;
  maxPayloadKg: number; // e.g. 750
  currentPayloadKg: number; // e.g. 420
  availablePayloadKg: number; // e.g. 330
  currentLocation: LocationInfo;
  speedKmh: number;
  heading?: number;
  rating: number;
  completedTrips: number;
  isAvailable: boolean;
  status: 'IDLE' | 'ASSIGNED' | 'EN_ROUTE_PICKUP' | 'IN_TRANSIT' | 'RETURNING' | 'DELIVERED';
  etaMinutes?: number;
  activeRouteId?: string;
  activeTripId?: string;
  activeShipmentId?: string;
  lastLocationUpdate?: string;
  accuracyMeters?: number;
  isTrackingActive?: boolean;
  isPaused?: boolean;
  geofenceStatus?: string;
  offlineStatus?: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
}

export interface VehicleLocationTelemetry {
  id?: string;
  vehicleId: string;
  driverId: string;
  shipmentId?: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speedKmh?: number;
  heading?: number;
  geofenceStatus?: string;
  timestamp: string; // ISO string
}

export interface GeofenceAlert {
  type: 'ARRIVED_PICKUP' | 'PICKED_UP' | 'ARRIVED_DESTINATION' | 'IN_TRANSIT';
  message: string;
  vehicleId: string;
  shipmentId?: string;
  timestamp: string;
}

export interface Hub {
  id: string;
  name: string;
  code: string;
  type: HubType;
  district: string;
  taluka: string;
  address: string;
  coordinates: Coordinates;
  totalCapacityKg: number;
  currentOccupancyKg: number;
  hasColdStorage: boolean;
  operatingHours: string;
  managerName: string;
  contactNumber: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string; // e.g. "GL-2026-00125"
  senderId: string;
  senderName: string;
  senderOrg?: string;
  senderPhone: string;
  senderRole: UserRole;
  
  productName: string;
  category: GoodsCategory;
  weightKg: number;
  packageCount: number;
  specialInstructions?: string;
  requiresColdChain?: boolean;
  
  origin: LocationInfo;
  destination: LocationInfo;
  
  pickupWindowStart: string; // ISO date/time or formatted
  pickupWindowEnd: string;
  
  estimatedSoloCost: number; // e.g. 650
  estimatedPooledCost: number; // e.g. 390
  potentialSavings: number; // e.g. 260
  savingsPercent: number; // e.g. 40
  
  status: ShipmentStatus;
  poolId?: string;
  assignedVehicleId?: string;
  assignedTransporterName?: string;
  assignedVehicleNumber?: string;
  
  createdAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  qrCodeToken?: string;
  
  // PoD & Verification
  pickupOtp?: string;
  pickupPhotoUrl?: string;
  deliveryOtp?: string;
  deliveryPhotoUrl?: string;
  deliveryRating?: number;
  reportedProblem?: {
    type: 'DAMAGED' | 'DELAY' | 'WRONG_WEIGHT' | 'OTHER';
    notes: string;
    reportedAt: string;
  };
  
  // Perishable & Backhaul
  shelfLifeHours?: number | null;
  freshnessDeadline?: string;
  urgencyBadge?: 'URGENT' | 'TODAY' | 'FLEXIBLE';
  isReturnTrip?: boolean;
  transportType?: 'SOLO' | 'POOLED' | 'RETURN';
  estimatedReturnCost?: number;
}

export interface PoolMember {
  shipmentId: string;
  senderName: string;
  senderOrg?: string;
  productName: string;
  category: GoodsCategory;
  weightKg: number;
  originVillage: string;
  allocatedCost: number;
  individualCost: number;
  savings: number;
  status: 'PENDING' | 'PICKED_UP' | 'DELIVERED';
}

export interface ShipmentPool {
  id: string;
  poolCode: string; // e.g. "#GL-1024"
  originArea: string; // e.g. "Dapoli Cluster"
  destinationArea: string; // e.g. "Khed Market / APMC"
  destinationHubId?: string;
  
  totalWeightKg: number;
  recommendedVehicleCategory: VehicleCategory;
  vehicleCapacityKg: number;
  utilizationPercent: number;
  
  estimatedPooledCost: number;
  totalSoloCost: number;
  totalSavingsAmount: number;
  savingsPercent: number;
  
  status: 'FORMING' | 'MATCHED' | 'DISPATCHED' | 'IN_TRANSIT' | 'COMPLETED';
  members: PoolMember[];
  
  assignedVehicle?: Vehicle;
  scheduledDeparture: string;
  estimatedArrival: string;
}

export interface Waypoint {
  id: string;
  name: string;
  type: 'PICKUP' | 'HUB_STOP' | 'DROP' | 'RETURN_PICKUP';
  coordinates: Coordinates;
  address: string;
  weightChangeKg: number; // + for pickup, - for drop
  packageNotes?: string;
  estimatedArrivalMin: number;
  isCompleted: boolean;
  stopSequence: number;
}

export interface OptimizedRoute {
  id: string;
  poolId: string;
  vehicleNumber: string;
  waypoints: Waypoint[];
  rawDistanceKm: number;
  optimizedDistanceKm: number;
  distanceSavedKm: number;
  timeSavedMins: number;
  fuelSavedLitres: number;
  costSavedRs: number;
  carbonOffsetKg: number;
}

export interface ReturnTripOpportunity {
  id: string;
  sourcePoolId?: string;
  transporterVehicleId?: string;
  driverName?: string;
  driverPhone?: string;
  originHub: string;
  destinationVillage: string;
  cargoDescription: string;
  weightKg: number;
  additionalEarnings: number;
  pickupWindow: string;
  status: 'AVAILABLE' | 'CLAIMED' | 'IN_TRANSIT' | 'COMPLETED';
  emptyReturnReduced: boolean;
  emptyKm?: number;
  discountPercent?: number;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'POOL_MATCH' | 'TRANSPORTER_ASSIGNED' | 'PICKUP_SCHEDULED' | 'VEHICLE_NEARBY' | 'PICKED_UP' | 'DELAYED' | 'DELIVERED' | 'RETURN_LOAD' | 'NEW_OPPORTUNITY';
  isRead: boolean;
  actionUrl?: string;
}

export interface MatchScoreBreakdown {
  distanceScore: number; // 0 to 40
  payloadScore: number;  // 0 to 30
  ratingScore: number;   // 0 to 20
  returnBonusScore: number; // 0 to 10
}

export interface TransporterMatch {
  transporter: Vehicle;
  matchScore: number; // e.g. 94%
  scoreBreakdown: MatchScoreBreakdown;
  distanceToPickupKm: number;
  capacityFits: boolean;
  availableCapacityKg: number;
  estimatedCostRs: number;
  estimatedPickupEtaMin: number;
  rating: number;
  reasons: string[];
  vehicleRate: number;
  isReturnTrip?: boolean;
}

export interface CostAllocationBreakdown {
  totalVehicleTripCost: number;
  members: {
    senderName: string;
    product: string;
    weightKg: number;
    distanceKm: number;
    soloCost: number;
    allocatedCost: number;
    savings: number;
    savingsPercent: number;
  }[];
  totalSoloCost: number;
  totalPooledCost: number;
  totalSaved: number;
  overallSavingsPercent: number;
}

export interface SimulationState {
  isRunning: boolean;
  currentStep: number; // 0 to 9
  stepDescription: string;
  activeShipmentId?: string;
  activePoolId?: string;
  activeVehicleId?: string;
  activeRouteId?: string;
  progressPercent: number;
  logs: { timestamp: string; message: string; badge?: string }[];
}

export type SupportedLanguage = 'en' | 'mr' | 'hi';
