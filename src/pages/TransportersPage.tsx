import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { matchTransportersForShipment } from '../services/transporterMatcher';
import { 
  Truck, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Star, 
  DollarSign, 
  Navigation,
  Search,
  Filter,
  HelpCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Info
} from 'lucide-react';
import { VehicleCategory } from '../types';
import { useUserLocation } from '../context/LocationContext';

interface TransportersPageProps {
  onNavigate: (tab: any) => void;
}

export const TransportersPage: React.FC<TransportersPageProps> = ({ onNavigate }) => {
  const { t, formatNumber } = useLanguage();
  const { vehicles, pools, shipments, assignTransporterToPool, reportShipmentProblem } = useLogistics();

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [assignNotice, setAssignNotice] = useState<string | null>(null);
  
  // Requirement: Max pickup radius filter (default 25 km), farther hidden behind toggle
  const [maxPickupRadius, setMaxPickupRadius] = useState<number>(25);
  const [showFartherVehicles, setShowFartherVehicles] = useState<boolean>(false);
  
  // Formula Breakdown Modal / Info state
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  // Problem Report Modal
  const [reportingVehicleId, setReportingVehicleId] = useState<string | null>(null);
  const [problemType, setProblemType] = useState<'DAMAGED' | 'DELAY' | 'WRONG_WEIGHT' | 'OTHER'>('DAMAGED');
  const [problemNotes, setProblemNotes] = useState<string>('');
  const [problemReportSuccess, setProblemReportSuccess] = useState<string | null>(null);

  const { userLocation, locationName } = useUserLocation();

  // Target shipment location: User location is the default pickup point
  const targetPickup = {
    name: locationName || 'Dapoli Pickup Point',
    district: 'Ratnagiri',
    taluka: 'Dapoli',
    address: locationName || 'User Live Location',
    coordinates: userLocation
  };

  const targetDest = {
    name: 'Khed Taluka Consolidation Hub',
    district: 'Ratnagiri',
    taluka: 'Khed',
    address: 'Khed Highway NH-66',
    coordinates: { lat: 17.7167, lng: 73.3833 }
  };

  const matches = matchTransportersForShipment(targetPickup, targetDest, 120, vehicles);

  const categoryFiltered = filterCategory === 'ALL'
    ? matches
    : matches.filter(m => m.transporter.category === filterCategory);

  // Separate nearby (<= maxPickupRadius) vs farther (> maxPickupRadius), sorted by real distance
  const nearbyMatches = [...categoryFiltered]
    .filter(m => m.distanceToPickupKm <= maxPickupRadius)
    .sort((a, b) => a.distanceToPickupKm - b.distanceToPickupKm);
  const fartherMatches = [...categoryFiltered]
    .filter(m => m.distanceToPickupKm > maxPickupRadius)
    .sort((a, b) => a.distanceToPickupKm - b.distanceToPickupKm);

  const displayedMatches = showFartherVehicles
    ? [...nearbyMatches, ...fartherMatches]
    : nearbyMatches;

  // BEST MATCH badge: Vehicle more than 100 km away must NEVER get the "BEST MATCH" badge
  // Only the highest scored vehicle with distance <= 100 km qualifies!
  const bestMatchCandidate = categoryFiltered.find(m => m.distanceToPickupKm <= 100);
  const bestMatchId = bestMatchCandidate?.transporter.id;

  const handleAssign = (vehicleId: string) => {
    assignTransporterToPool('pool-1', vehicleId);
    setAssignNotice(`Transporter successfully assigned! Route manifest sent to driver phone.`);
    setTimeout(() => setAssignNotice(null), 5000);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shipments[0]) {
      reportShipmentProblem(shipments[0].id, {
        type: problemType,
        notes: problemNotes || `Problem reported with vehicle ${reportingVehicleId}`
      });
    }
    setProblemReportSuccess(`Issue report submitted for driver investigation. Ticket #GL-REP-${Math.floor(1000 + Math.random() * 9000)}.`);
    setReportingVehicleId(null);
    setProblemNotes('');
    setTimeout(() => setProblemReportSuccess(null), 6000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Matching Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rural-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-soft-green text-forest border border-forest/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-navy font-display">
                {t('findTransport')}
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-soft-green text-forest border border-forest/20">
                {t('stateBadge')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-rural-muted mt-0.5">
              {t('featureMatchingDesc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Match Score Formula Info Button */}
          <button
            onClick={() => setShowFormulaModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-cream hover:bg-cream-darker text-navy text-xs font-bold border border-rural-border transition flex items-center gap-1.5 shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-forest" />
            <span>How is score calculated?</span>
          </button>

          <button
            onClick={() => onNavigate('live_map')}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-cream text-navy text-xs font-bold border border-rural-border transition flex items-center gap-2 shadow-xs"
          >
            <Navigation className="w-4 h-4 text-forest" />
            <span>{t('navLiveMap')}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {assignNotice && (
        <div className="p-4 rounded-2xl bg-soft-green border border-forest/30 text-forest text-sm font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-forest shrink-0" />
          <span>{assignNotice}</span>
        </div>
      )}

      {problemReportSuccess && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-amber-700 shrink-0" />
          <span>{problemReportSuccess}</span>
        </div>
      )}

      {/* FILTER BAR: CATEGORY & RADIUS CONTROL */}
      <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Vehicle Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {['ALL', 'TATA_ACE', 'PICKUP', 'AUTO', 'E_RICKSHAW_CARGO', 'MINI_TRUCK'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap text-xs ${
                  filterCategory === cat
                    ? 'bg-forest text-white shadow-xs'
                    : 'bg-cream text-navy hover:bg-cream-darker border border-rural-border'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Max Pickup Radius Filter Control */}
          <div className="flex items-center gap-3 text-xs bg-cream px-3 py-1.5 rounded-xl border border-rural-border">
            <span className="text-rural-muted font-bold">Max Pickup Radius:</span>
            <select
              value={maxPickupRadius}
              onChange={e => setMaxPickupRadius(Number(e.target.value))}
              className="bg-white px-2 py-1 rounded-lg border border-rural-border font-bold text-navy outline-none"
            >
              <option value={15}>15 km (Local Taluka)</option>
              <option value={25}>25 km (Default standard)</option>
              <option value={50}>50 km (Extended cluster)</option>
              <option value={100}>100 km (District wide)</option>
            </select>
          </div>
        </div>

        {/* Farther Vehicles Toggle Bar */}
        {fartherMatches.length > 0 && (
          <div className="pt-2 border-t border-rural-border/60 flex items-center justify-between text-xs">
            <span className="text-rural-muted">
              Showing <strong>{nearbyMatches.length}</strong> vehicles within {maxPickupRadius} km radius.
              ({fartherMatches.length} farther vehicle{fartherMatches.length > 1 ? 's' : ''} hidden).
            </span>
            <button
              onClick={() => setShowFartherVehicles(!showFartherVehicles)}
              className="px-3 py-1 rounded-lg bg-cream hover:bg-rural-border text-navy font-bold border border-rural-border transition flex items-center gap-1.5"
            >
              <span>{showFartherVehicles ? 'Hide farther vehicles' : `Show farther vehicles (${fartherMatches.length})`}</span>
              {showFartherVehicles ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* RANKED TRANSPORTERS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedMatches.map((match) => {
          const v = match.transporter;
          // Vehicle > 100 km must never get BEST MATCH badge
          const isBest = v.id === bestMatchId && match.distanceToPickupKm <= 100;
          const isFarther = match.distanceToPickupKm > maxPickupRadius;

          return (
            <div
              key={v.id}
              className={`bg-white p-6 rounded-2xl border transition relative space-y-4 shadow-sm flex flex-col justify-between ${
                isBest
                  ? 'border-forest ring-2 ring-forest/20'
                  : isFarther
                  ? 'border-rural-border opacity-90 bg-cream/30'
                  : 'border-rural-border'
              }`}
            >
              {/* Best Match Ribbon */}
              {isBest && (
                <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-forest text-white text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-gold fill-gold" />
                  <span>BEST MATCH ({match.matchScore}%)</span>
                </div>
              )}

              {/* Top Details */}
              <div className="space-y-4">
                {/* Driver & Vehicle Details */}
                <div className="flex items-start justify-between pt-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-forest">{v.vehicleNumber}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-cream text-navy font-semibold border border-rural-border">
                        {v.category.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-navy mt-1.5">{v.driverName}</h3>
                    <div className="text-xs text-rural-muted">{v.makeModel} • {v.driverPhone}</div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gold text-xs font-bold justify-end">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{v.rating}</span>
                    </div>
                    <span className="text-[11px] text-rural-muted block">{v.completedTrips} village trips</span>
                  </div>
                </div>

                {/* Driver Trust Badge */}
                <div className="p-2.5 rounded-xl bg-soft-green/70 border border-forest/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-forest font-bold">
                    <ShieldCheck className="w-4 h-4 text-forest shrink-0" />
                    <span>Verified, {v.completedTrips || 184} trips, 0 disputes</span>
                  </div>
                  <button
                    onClick={() => setReportingVehicleId(v.id)}
                    className="text-[11px] text-rural-muted hover:text-red-700 underline font-semibold transition"
                    title="Report damaged cargo, delay, or wrong weight"
                  >
                    Report problem
                  </button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-cream p-3.5 rounded-xl border border-rural-border">
                  <div>
                    <span className="text-rural-muted text-[11px] block">Distance to You</span>
                    <span className={`font-bold ${match.distanceToPickupKm > 100 ? 'text-amber-700' : 'text-navy'}`}>
                      {match.distanceToPickupKm} km ({match.estimatedPickupEtaMin} min)
                    </span>
                  </div>
                  <div>
                    <span className="text-rural-muted text-[11px] block">Available Payload</span>
                    <span className="font-bold text-forest">{match.availableCapacityKg} / {v.maxPayloadKg} kg</span>
                  </div>
                  <div>
                    <span className="text-rural-muted text-[11px] block">Match Score</span>
                    <span className="font-bold text-forest">{match.matchScore}% Route Fit</span>
                  </div>
                  <div>
                    <span className="text-rural-muted text-[11px] block">Estimated Cost</span>
                    <span className="font-black text-navy text-sm">
                      ₹{match.estimatedCostRs}
                      <span className="text-[10px] text-rural-muted block font-normal">
                        ({match.vehicleRate} ₹/km rate)
                      </span>
                    </span>
                  </div>
                </div>

                {/* Transparent Score Breakdown */}
                <div className="p-2.5 rounded-xl bg-white border border-rural-border text-[11px] space-y-1">
                  <div className="flex justify-between text-rural-muted">
                    <span className="font-semibold text-navy">Score Breakdown:</span>
                    <span className="font-bold text-forest">{match.matchScore} / 100 pts</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1 border-t border-rural-border/50">
                    <div className="bg-cream rounded p-1">
                      <span className="block text-rural-muted">Dist</span>
                      <strong className="text-navy">{match.scoreBreakdown.distanceScore}/40</strong>
                    </div>
                    <div className="bg-cream rounded p-1">
                      <span className="block text-rural-muted">Fit</span>
                      <strong className="text-navy">{match.scoreBreakdown.payloadScore}/30</strong>
                    </div>
                    <div className="bg-cream rounded p-1">
                      <span className="block text-rural-muted">Rating</span>
                      <strong className="text-navy">{match.scoreBreakdown.ratingScore}/20</strong>
                    </div>
                    <div className="bg-cream rounded p-1">
                      <span className="block text-rural-muted">Return</span>
                      <strong className="text-navy">+{match.scoreBreakdown.returnBonusScore}/10</strong>
                    </div>
                  </div>
                </div>

                {/* Matching Reasons */}
                <div className="space-y-1 text-xs text-navy">
                  {match.reasons.map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-navy">
                      <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0" />
                      <span className="truncate text-xs">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleAssign(v.id)}
                className="w-full py-3 rounded-xl bg-forest hover:bg-forest-dark text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 mt-3"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Select This Vehicle (₹{match.estimatedCostRs})</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* HOW MATCH SCORE IS CALCULATED MODAL */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-rural-border shadow-xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-rural-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-soft-green text-forest">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">How Match Score is Calculated</h3>
                  <p className="text-xs text-rural-muted">100% transparent rural dispatch algorithm</p>
                </div>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="p-1.5 rounded-xl hover:bg-cream text-rural-muted hover:text-navy transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-navy">
                GraminLink uses an objective, verifiable 4-pillar formula so farmers and SHGs always receive the most optimal transporter:
              </p>

              <div className="space-y-2.5">
                {/* 1. Distance Proximity */}
                <div className="p-3 rounded-xl bg-cream border border-rural-border flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-forest text-white font-bold flex items-center justify-center shrink-0">
                    40%
                  </span>
                  <div>
                    <h4 className="font-bold text-navy">Distance to Pickup (Max 40 points)</h4>
                    <p className="text-rural-muted text-[11px] mt-0.5">
                      Proximity of the empty vehicle to village collection point. Vehicles &gt;100 km away receive 0 distance points and are strictly disqualified from the BEST MATCH badge.
                    </p>
                  </div>
                </div>

                {/* 2. Payload Fit */}
                <div className="p-3 rounded-xl bg-cream border border-rural-border flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-forest text-white font-bold flex items-center justify-center shrink-0">
                    30%
                  </span>
                  <div>
                    <h4 className="font-bold text-navy">Payload Capacity Fit (Max 30 points)</h4>
                    <p className="text-rural-muted text-[11px] mt-0.5">
                      Ensures vehicle is neither over capacity nor excessively oversized for small goods, keeping village freight cost efficient.
                    </p>
                  </div>
                </div>

                {/* 3. Driver Rating */}
                <div className="p-3 rounded-xl bg-cream border border-rural-border flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-gold text-white font-bold flex items-center justify-center shrink-0">
                    20%
                  </span>
                  <div>
                    <h4 className="font-bold text-navy">Driver Rating & Record (Max 20 points)</h4>
                    <p className="text-rural-muted text-[11px] mt-0.5">
                      Based on verified star ratings from previous rural village trips, on-time arrivals, and zero cargo dispute history.
                    </p>
                  </div>
                </div>

                {/* 4. Return-route bonus */}
                <div className="p-3 rounded-xl bg-soft-green border border-forest/30 flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-forest text-white font-bold flex items-center justify-center shrink-0">
                    10%
                  </span>
                  <div>
                    <h4 className="font-bold text-forest">Return-Route Bonus (Max 10 points)</h4>
                    <p className="text-rural-muted text-[11px] mt-0.5">
                      Priority bonus for transporters returning on backhaul trips towards your destination, preventing empty return runs and lowering fuel waste.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost formula info */}
              <div className="p-3 rounded-xl bg-[#F5F3EA] border border-rural-border text-[11px] text-navy">
                <strong>Estimated Cost Formula:</strong>
                <div className="font-mono mt-1 text-forest font-bold">
                  (Distance to Pickup + Route Distance) × Vehicle Type Rate
                </div>
                <div className="text-rural-muted mt-0.5">
                  Rates: Auto ₹12/km, Tata Ace ₹16/km, Bolero Pickup ₹20/km, Mini Truck ₹24/km.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowFormulaModal(false)}
              className="w-full py-3 rounded-xl bg-forest hover:bg-forest-dark text-white font-bold text-xs shadow-sm transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* REPORT PROBLEM MODAL */}
      {reportingVehicleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-rural-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-rural-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-navy">Report Problem / Dispute</h3>
              </div>
              <button
                onClick={() => setReportingVehicleId(null)}
                className="p-1 rounded-lg hover:bg-cream text-rural-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">Problem Category:</label>
                <select
                  value={problemType}
                  onChange={e => setProblemType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-cream border border-rural-border text-navy font-bold outline-none"
                >
                  <option value="DAMAGED">Damaged Goods / Packaging</option>
                  <option value="DELAY">Excessive Delay in Pickup or Delivery</option>
                  <option value="WRONG_WEIGHT">Incorrect Weight / Payload Measured</option>
                  <option value="OTHER">Other Operational Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">Issue Details / Remarks:</label>
                <textarea
                  rows={3}
                  value={problemNotes}
                  onChange={e => setProblemNotes(e.target.value)}
                  placeholder="Describe what occurred (e.g., box torn at pickup, driver arrived 2 hours late)..."
                  className="w-full p-2.5 rounded-xl border border-rural-border text-navy outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingVehicleId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-cream border border-rural-border font-bold text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold transition shadow-sm"
                >
                  Submit Dispute Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
