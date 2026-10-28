import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useLogistics } from '../context/LogisticsContext';
import { GoodsCategory } from '../types';
import { calculateSoloVsPooledCost } from '../services/costEngine';
import { getShelfLifeInfo } from '../services/perishableService';
import { 
  Sprout, 
  Layers, 
  TrendingDown, 
  Clock, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Snowflake, 
  Store, 
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Timer,
  RotateCcw,
  AlertTriangle,
  X
} from 'lucide-react';

import { useGaadiSahayak } from '../context/GaadiSahayakContext';

interface FarmerDashboardProps {
  onNavigate: (tab: any) => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ onNavigate }) => {
  const { t, formatNumber } = useLanguage();
  const { currentUser } = useAuth();
  const { prefilledBooking, clearPrefilledBooking } = useGaadiSahayak();
  const { createShipment, pools, shipments, returnTrips, honestMetrics, reportShipmentProblem } = useLogistics();

  const [formData, setFormData] = useState({
    farmerName: currentUser.name,
    farmName: currentUser.organizationName || 'Deshmukh Organic Agro',
    cropName: 'Export Grade Thompson Seedless Grapes',
    category: 'FRUITS' as GoodsCategory,
    weightKg: 350,
    crateCount: 35,
    harvestDate: new Date().toISOString().split('T')[0],
    requiresColdChain: true,
    mandiDestination: 'Nashik Central APMC Subzi & Fruit Yard',
    collectionPoint: 'Janori Farm Gate No. 42 (Dindori Cluster)'
  });

  useEffect(() => {
    if (prefilledBooking) {
      setFormData(prev => ({
        ...prev,
        cropName: prefilledBooking.productName || prev.cropName,
        category: prefilledBooking.goodsCategory || prev.category,
        weightKg: prefilledBooking.weightKg !== undefined ? prefilledBooking.weightKg : prev.weightKg,
        mandiDestination: prefilledBooking.destination || prev.mandiDestination
      }));
      clearPrefilledBooking();
    }
  }, [prefilledBooking, clearPrefilledBooking]);

  const [transportMode, setTransportMode] = useState<'SOLO' | 'POOLED' | 'RETURN'>('POOLED');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Dispute Report Modal State
  const [reportingShipmentId, setReportingShipmentId] = useState<string | null>(null);
  const [disputeType, setDisputeType] = useState<'DAMAGED' | 'DELAY' | 'WRONG_WEIGHT' | 'OTHER'>('DAMAGED');
  const [disputeNotes, setDisputeNotes] = useState<string>('');
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);

  // Perishable & Freshness Deadline
  const shelfLifeInfo = getShelfLifeInfo(formData.category);
  const [countdownMinutes, setCountdownMinutes] = useState<number>(() => {
    if (shelfLifeInfo.shelfLifeHours === 4) return 228;
    if (shelfLifeInfo.shelfLifeHours === 12) return 695;
    return 4300;
  });

  useEffect(() => {
    if (shelfLifeInfo.shelfLifeHours === 4) setCountdownMinutes(228);
    else if (shelfLifeInfo.shelfLifeHours === 12) setCountdownMinutes(695);
    else setCountdownMinutes(4300);
  }, [formData.category]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownMinutes(prev => (prev > 0 ? prev - 1 : 0));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (mins: number) => {
    if (mins <= 0) return 'Unlimited';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  };

  const costEst = calculateSoloVsPooledCost({
    weightKg: formData.weightKg,
    distanceKm: 34,
    category: formData.category,
    destinationType: 'MANDI_APMC'
  });

  // Check matching return trip
  const returnMatch = returnTrips.find(r => r.status === 'AVAILABLE') || returnTrips[0];

  const handleFarmerSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCost = transportMode === 'SOLO'
      ? costEst.soloCost
      : transportMode === 'RETURN'
      ? costEst.returnTripCost
      : costEst.pooledCost;

    const created = createShipment({
      senderName: formData.farmerName,
      senderOrg: formData.farmName,
      senderPhone: currentUser.phone,
      senderRole: 'FARMER',
      productName: formData.cropName,
      category: formData.category,
      weightKg: Number(formData.weightKg),
      packageCount: Number(formData.crateCount),
      requiresColdChain: formData.requiresColdChain,
      origin: {
        name: formData.collectionPoint,
        district: 'Nashik',
        taluka: 'Dindori',
        village: 'Janori',
        address: 'Janori Agro Feeder Hub',
        coordinates: { lat: 20.2014, lng: 73.8344 }
      },
      destination: {
        name: formData.mandiDestination,
        district: 'Nashik',
        taluka: 'Nashik',
        address: 'Panchavati APMC Yard, Nashik',
        type: 'MANDI_APMC',
        coordinates: { lat: 19.9975, lng: 73.7898 }
      },
      estimatedSoloCost: costEst.soloCost,
      estimatedPooledCost: finalCost,
      estimatedReturnCost: costEst.returnTripCost,
      potentialSavings: costEst.soloCost - finalCost,
      savingsPercent: Math.round(((costEst.soloCost - finalCost) / costEst.soloCost) * 100),
      shelfLifeHours: shelfLifeInfo.shelfLifeHours,
      urgencyBadge: shelfLifeInfo.urgency,
      isReturnTrip: transportMode === 'RETURN',
      transportType: transportMode
    });

    setBookingSuccess(`Agri Produce registered under #${created.trackingNumber}! Joined Dindori Harvest Pool with ${transportMode} transport.`);
    setTimeout(() => setBookingSuccess(null), 6000);
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reportingShipmentId) {
      reportShipmentProblem(reportingShipmentId, {
        type: disputeType,
        notes: disputeNotes || `Dispute filed on harvest shipment ${reportingShipmentId}`
      });
      setDisputeSuccess(`Problem registered. Support ticket #GL-AGRI-${Math.floor(1000 + Math.random() * 9000)} generated.`);
      setReportingShipmentId(null);
      setDisputeNotes('');
      setTimeout(() => setDisputeSuccess(null), 6000);
    }
  };

  const getTimelineStage = (status: string) => {
    switch (status) {
      case 'ORDER_CREATED':
      case 'POOL_SEARCHING':
      case 'POOL_CONFIRMED':
      case 'TRANSPORTER_ASSIGNED':
        return 1;
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 2;
      case 'DELIVERED':
        return 4;
      default:
        return 2;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Farmer Profile */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rural-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#E7EBD9] text-forest border border-rural-border">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy font-display">
              Farmer Agri-Logistics Portal
            </h1>
            <p className="text-xs sm:text-sm text-rural-muted mt-0.5">
              Grower: <span className="text-forest font-semibold">{currentUser.name}</span> ({currentUser.organizationName || 'Sahyadri Farmers Producer Co.'}) • {currentUser.village}, {currentUser.taluka}, {currentUser.district}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('markets')}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-cream text-navy border border-rural-border text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          <Store className="w-4 h-4 text-forest" />
          <span>View APMC Mandi Rates</span>
        </button>
      </div>

      {bookingSuccess && (
        <div className="p-4 rounded-2xl bg-soft-green border border-forest/30 text-forest text-sm font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-forest shrink-0" />
          <span>{bookingSuccess}</span>
        </div>
      )}

      {disputeSuccess && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-semibold flex items-center gap-2 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <span>{disputeSuccess}</span>
        </div>
      )}

      {/* Top KPIS for Farmers (Honest Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-xs">
          <span className="text-xs text-rural-muted block font-semibold">Total Cargo Moved</span>
          <div className="text-3xl font-black text-navy font-display mt-2">
            {honestMetrics.totalWeightMovedKg} kg
          </div>
          <span className="text-[12px] text-forest mt-1 block font-medium">Thompson Grapes & Farm Produce</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-xs">
          <span className="text-xs text-rural-muted block font-semibold">Empty KM Avoided</span>
          <div className="text-3xl font-black text-forest font-display mt-2">
            {honestMetrics.emptyKmAvoided} km
          </div>
          <span className="text-[12px] text-rural-muted mt-1 block">
            {honestMetrics.co2ReducedKg} kg CO₂ saved (0.25 kg/km)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-xs">
          <span className="text-xs text-rural-muted block font-semibold">Cold Chain Transit</span>
          <div className="text-3xl font-black text-forest font-display mt-2">100% Active</div>
          <span className="text-[12px] text-forest mt-1 block font-medium">Preserving perishable shelf life</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-xs">
          <span className="text-xs text-rural-muted block font-semibold">Total Savings</span>
          <div className="text-3xl font-black text-gold font-display mt-2">
            ₹{honestMetrics.totalMoneySaved.toLocaleString('en-IN')}
          </div>
          <span className="text-[12px] text-rural-muted mt-1 block">
            {honestMetrics.avgSavingsPercent}% average reduction
          </span>
        </div>
      </div>

      {/* Return-Trip Backhaul Notice */}
      {returnMatch && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-soft-green to-cream border border-forest/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-5 h-5 text-forest shrink-0" />
            <div>
              <span className="px-2 py-0.5 rounded-full bg-forest text-white font-bold text-[10px] uppercase">
                Return Trip • Save 40%
              </span>
              <span className="ml-2 font-bold text-navy">
                Backhaul vehicle available on {returnMatch.originHub} → {returnMatch.destinationVillage}
              </span>
            </div>
          </div>
          <button
            onClick={() => setTransportMode('RETURN')}
            className="px-3 py-1.5 rounded-xl bg-forest hover:bg-forest-dark text-white font-bold"
          >
            Select Return Rate (₹{costEst.returnTripCost})
          </button>
        </div>
      )}

      {/* Two Column Grid: Booking Form + 3-Option Cost Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Schedule Farm Produce Dispatch */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-rural-border pb-3">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <Sprout className="w-5 h-5 text-forest" />
              <span>Schedule Farm Harvest Dispatch</span>
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-soft-green text-forest border border-forest/20">
              Farmgate Pooling
            </span>
          </div>

          <form onSubmit={handleFarmerSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-rural-muted mb-1.5">Farmer Name / FPO</label>
                <input
                  type="text"
                  required
                  value={formData.farmerName}
                  onChange={e => setFormData({ ...formData, farmerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-rural-border text-navy text-sm focus:border-forest outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-rural-muted mb-1.5">Crop / Produce Name</label>
                <input
                  type="text"
                  required
                  value={formData.cropName}
                  onChange={e => setFormData({ ...formData, cropName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-rural-border text-navy text-sm focus:border-forest outline-none transition"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block font-bold text-rural-muted mb-1.5">Produce Category (Perishable Priority)</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as GoodsCategory })}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-rural-border text-navy text-sm focus:border-forest outline-none transition"
              >
                <option value="FRUITS">Fresh Fruits (Grapes, Mango) — 12h Limit</option>
                <option value="VEGETABLES">Fresh Vegetables & Onion — 12h Limit</option>
                <option value="PERISHABLE_AGRI">Perishable Agri / Kokum — 12h Limit</option>
                <option value="DAIRY">Dairy & Milk — 12h Limit</option>
                <option value="FISHERIES">Fisheries / Marine Fish — 4h Strict Limit</option>
                <option value="PROCESSED_FOOD">Processed Food & Sweets — 3 Days</option>
                <option value="HANDICRAFTS">Handicrafts & Dry — Unlimited</option>
              </select>
            </div>

            {/* FRESHNESS DEADLINE COUNTDOWN & URGENCY BADGE */}
            <div className={`p-4 rounded-xl border space-y-2 ${shelfLifeInfo.badgeClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Freshness Deadline:
                  </span>
                  <span className="font-mono font-black text-sm">
                    {shelfLifeInfo.shelfLifeHours ? `${formatCountdown(countdownMinutes)} remaining` : 'Unlimited Shelf-Life'}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase border ${
                  shelfLifeInfo.urgency === 'URGENT' 
                    ? 'bg-red-600 text-white border-red-700' 
                    : shelfLifeInfo.urgency === 'TODAY' 
                    ? 'bg-amber-600 text-white border-amber-700' 
                    : 'bg-emerald-600 text-white border-emerald-700'
                }`}>
                  ● {shelfLifeInfo.badgeLabel}
                </span>
              </div>

              <p className="text-[11px] opacity-90">
                {shelfLifeInfo.spoilageRiskText}
              </p>

              {/* Spoilage Risk Suggestion Alert */}
              <div className="pt-2 border-t border-current/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold">
                  Freshness Advisory: If shared pool will not fill in time:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTransportMode('SOLO')}
                    className={`px-2.5 py-1 rounded-lg font-bold border transition ${
                      transportMode === 'SOLO' ? 'bg-white text-navy border-navy' : 'bg-black/10 text-current'
                    }`}
                  >
                    Go solo (₹907)
                  </button>
                  <span>or</span>
                  <button
                    type="button"
                    onClick={() => setTransportMode('POOLED')}
                    className={`px-2.5 py-1 rounded-lg font-bold border transition ${
                      transportMode === 'POOLED' ? 'bg-white text-navy border-navy' : 'bg-black/10 text-current'
                    }`}
                  >
                    Wait for pool (₹363), risk: spoilage
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-rural-muted mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  min="20"
                  max="5000"
                  required
                  value={formData.weightKg}
                  onChange={e => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-rural-border text-navy text-sm font-mono font-bold focus:border-forest outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-rural-muted mb-1.5">Crates / Bags</label>
                <input
                  type="number"
                  required
                  value={formData.crateCount}
                  onChange={e => setFormData({ ...formData, crateCount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-rural-border text-navy text-sm font-mono focus:border-forest outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-rural-muted mb-1.5">Target APMC Mandi / Market</label>
                <input
                  type="text"
                  required
                  value={formData.mandiDestination}
                  onChange={e => setFormData({ ...formData, mandiDestination: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-rural-border text-navy text-sm focus:border-forest outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-rural-muted mb-1.5">Harvest Pickup Date</label>
                <input
                  type="date"
                  value={formData.harvestDate}
                  onChange={e => setFormData({ ...formData, harvestDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-rural-border text-navy text-sm focus:border-forest outline-none transition"
                />
              </div>
            </div>

            {/* Cold Chain Checkbox */}
            <div className="p-4 rounded-xl bg-[#E7EBD9] border border-rural-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Snowflake className="w-5 h-5 text-forest" />
                <div>
                  <span className="font-bold text-navy text-sm">Ventilated / Cold Truck Required</span>
                  <span className="text-xs text-rural-muted block">Maintains 4°C - 8°C for delicate fruits</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.requiresColdChain}
                onChange={e => setFormData({ ...formData, requiresColdChain: e.target.checked })}
                className="w-5 h-5 rounded text-forest focus:ring-forest border-rural-border"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-forest hover:bg-forest-dark text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span>
                Join Harvest Dispatch ({transportMode === 'SOLO' ? 'Solo Dedicated' : transportMode === 'RETURN' ? 'Return-Trip Backhaul' : 'Pooled Shared'})
                {' '}— ₹{transportMode === 'SOLO' ? costEst.soloCost : transportMode === 'RETURN' ? costEst.returnTripCost : costEst.pooledCost}
              </span>
            </button>
          </form>
        </div>

        {/* Right Panel: 3 Options Side by Side Calculator */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-rural-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-rural-border pb-3">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-forest" />
                <span>Harvest Transport Cost (3 Options)</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-soft-green text-forest border border-forest/20">
                Live Estimation
              </span>
            </div>

            <div className="space-y-3">
              {/* Option 1: Solo */}
              <div 
                onClick={() => setTransportMode('SOLO')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  transportMode === 'SOLO' ? 'border-navy bg-cream/70 ring-1 ring-navy' : 'border-rural-border bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-navy text-xs">1. Solo Dedicated Tempo</span>
                    <span className="block text-[11px] text-rural-muted">Instant dispatch alone</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-navy text-base">₹{costEst.soloCost}</span>
                  </div>
                </div>
              </div>

              {/* Option 2: Pooled */}
              <div 
                onClick={() => setTransportMode('POOLED')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  transportMode === 'POOLED' ? 'border-forest bg-soft-green/30 ring-1 ring-forest' : 'border-rural-border bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-forest text-xs">2. Pooled Shared Vehicle</span>
                    <span className="block text-[11px] text-rural-muted">Shared with Dindori grape cluster</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-forest text-lg">₹{costEst.pooledCost}</span>
                    <span className="block text-[10px] text-forest font-bold">Save {costEst.savingsPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Option 3: Return-Trip */}
              <div 
                onClick={() => setTransportMode('RETURN')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  transportMode === 'RETURN' ? 'border-gold bg-amber-50/50 ring-1 ring-gold' : 'border-rural-border bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-amber-900 text-xs">3. Return-Trip (Backhaul)</span>
                    <span className="block text-[11px] text-rural-muted">Load returning empty Bolero/Ace</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-gold text-lg">₹{costEst.returnTripCost}</span>
                    <span className="block text-[10px] text-amber-800 font-bold">Save {costEst.returnSavingsPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Farm Harvest Pool Preview */}
          <div className="bg-white p-6 rounded-2xl border border-rural-border shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-navy flex items-center gap-1.5 border-b border-rural-border pb-2">
              <Layers className="w-4 h-4 text-forest" />
              <span>Active Harvest Pool #GL-2048</span>
            </h4>
            <div className="space-y-1 text-rural-muted">
              <div className="flex justify-between">
                <span>Route:</span>
                <strong className="text-navy">Janori → Nashik Central APMC</strong>
              </div>
              <div className="flex justify-between">
                <span>Vehicle Assigned:</span>
                <strong className="text-navy">Suresh Bhosale (Bolero Pickup)</strong>
              </div>
              <div className="flex justify-between">
                <span>Driver Trust:</span>
                <strong className="text-forest">Verified, 312 trips, 0 disputes</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MY HARVEST SHIPMENTS TIMELINE TABLE */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-xs space-y-4">
        <h3 className="text-base font-bold text-navy">My Harvest Shipments & Proof of Delivery Timeline</h3>
        <div className="space-y-3">
          {shipments.map(s => {
            const currentStage = getTimelineStage(s.status);
            return (
              <div key={s.id} className="p-4 rounded-2xl border border-rural-border bg-cream/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-forest text-sm">{s.trackingNumber}</span>
                    <span className="ml-2 font-bold text-navy text-xs">{s.productName} ({s.weightKg} kg)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-rural-border text-navy">
                      Verified, 184 trips, 0 disputes
                    </span>
                    <button
                      onClick={() => setReportingShipmentId(s.id)}
                      className="text-[11px] text-red-700 underline font-semibold"
                    >
                      Report problem
                    </button>
                  </div>
                </div>

                {/* 4-Stage Timeline: Booked > Picked up > At Hub > Delivered */}
                <div className="grid grid-cols-4 gap-2 text-xs pt-1">
                  <div className={`p-2 rounded-xl border ${currentStage >= 1 ? 'bg-white border-forest font-bold text-navy' : 'bg-cream text-rural-muted'}`}>
                    <div className="text-[10px] text-rural-muted">1. {t('stageBooked')}</div>
                    <div className="text-[11px]">{t('status_ORDER_CREATED')}</div>
                  </div>
                  <div className={`p-2 rounded-xl border ${currentStage >= 2 ? 'bg-white border-forest font-bold text-navy' : 'bg-cream text-rural-muted'}`}>
                    <div className="text-[10px] text-rural-muted">2. {t('stagePickedUp')}</div>
                    <div className="text-[11px]">OTP: {formatNumber(s.pickupOtp || '4821')}</div>
                  </div>
                  <div className={`p-2 rounded-xl border ${currentStage >= 3 ? 'bg-white border-forest font-bold text-navy' : 'bg-cream text-rural-muted'}`}>
                    <div className="text-[10px] text-rural-muted">3. {t('stageAtHub')}</div>
                    <div className="text-[11px]">Consolidation</div>
                  </div>
                  <div className={`p-2 rounded-xl border ${currentStage >= 4 ? 'bg-soft-green border-forest font-bold text-forest' : 'bg-cream text-rural-muted'}`}>
                    <div className="text-[10px] text-forest">4. {t('stageDelivered')}</div>
                    <div className="text-[11px]">{currentStage >= 4 ? 'OTP ✓' : 'Pending OTP'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DISPUTE REPORT MODAL */}
      {reportingShipmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-rural-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-rural-border pb-3">
              <h3 className="text-base font-bold text-navy flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Report Problem / Grievance</span>
              </h3>
              <button onClick={() => setReportingShipmentId(null)}>
                <X className="w-5 h-5 text-rural-muted" />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-navy mb-1">Problem Category:</label>
                <select
                  value={disputeType}
                  onChange={e => setDisputeType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-rural-border text-navy outline-none font-bold"
                >
                  <option value="DAMAGED">Damaged Produce / Broken Crates</option>
                  <option value="DELAY">Excessive Delay in Pickup/Mandi Arrival</option>
                  <option value="WRONG_WEIGHT">Incorrect Harvest Weight Measured</option>
                  <option value="OTHER">Other Grievance</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Details:</label>
                <textarea
                  rows={3}
                  value={disputeNotes}
                  onChange={e => setDisputeNotes(e.target.value)}
                  placeholder="Describe the issue with the harvest consignment..."
                  className="w-full p-2.5 rounded-xl border border-rural-border text-navy outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReportingShipmentId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-cream border border-rural-border font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-700 text-white font-bold"
                >
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
