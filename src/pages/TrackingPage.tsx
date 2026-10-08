import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  QrCode, 
  Layers, 
  ShieldCheck, 
  Navigation,
  ArrowRight,
  PackageCheck,
  AlertTriangle,
  Star,
  Camera,
  RotateCcw,
  Sparkles,
  FileCheck,
  X
} from 'lucide-react';
import { MaharashtraMap } from '../components/map/MaharashtraMap';
import { StaticMapEmbed } from '../components/map/StaticMapEmbed';

export const TrackingPage: React.FC = () => {
  const { t, formatNumber } = useLanguage();
  const { shipments, vehicles, reportShipmentProblem } = useLogistics();

  const [searchQuery, setSearchQuery] = useState('GL-2026-00125');
  const [activeShipment, setActiveShipment] = useState(shipments[0]);
  const [secondsAgo, setSecondsAgo] = useState(4);

  // Dispute / Report Problem state
  const [isReportingProblem, setIsReportingProblem] = useState(false);
  const [disputeType, setDisputeType] = useState<'DAMAGED' | 'DELAY' | 'WRONG_WEIGHT' | 'OTHER'>('DAMAGED');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState<string | null>(null);

  // Driver rating interactive state
  const [userRating, setUserRating] = useState<number>(activeShipment?.deliveryRating || 5);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(prev => (prev >= 60 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (activeShipment?.deliveryRating) {
      setUserRating(activeShipment.deliveryRating);
    }
  }, [activeShipment]);

  const assignedVehicle = vehicles.find(v => 
    v.id === activeShipment?.assignedVehicleId || 
    v.activeShipmentId === activeShipment?.id
  ) || vehicles[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = shipments.find(s => 
      s.trackingNumber.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
    if (matched) {
      setActiveShipment(matched);
    }
  };

  const handleReportProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeShipment) {
      reportShipmentProblem(activeShipment.id, {
        type: disputeType,
        notes: disputeNotes || `Dispute logged for shipment ${activeShipment.trackingNumber}`
      });
      setDisputeSuccessMsg(`Problem report logged with GraminLink resolution desk. Ticket #GL-DISP-${Math.floor(1000 + Math.random() * 9000)}.`);
      setIsReportingProblem(false);
      setDisputeNotes('');
      setTimeout(() => setDisputeSuccessMsg(null), 6000);
    }
  };

  // 4-Stage Timeline: Booked > Picked up > At Hub > Delivered (OTP verified)
  const getTimelineStage = (status: string) => {
    switch (status) {
      case 'ORDER_CREATED':
      case 'POOL_SEARCHING':
      case 'POOL_CONFIRMED':
      case 'TRANSPORTER_ASSIGNED':
      case 'PICKUP_SCHEDULED':
        return 1; // Booked
      case 'PICKED_UP':
        return 2; // Picked up
      case 'IN_TRANSIT':
        return 3; // At Hub / En Route
      case 'DELIVERED':
        return 4; // Delivered (OTP verified)
      default:
        return 2;
    }
  };

  const currentStage = getTimelineStage(activeShipment?.status || 'IN_TRANSIT');

  const timelineSteps = [
    {
      stage: 1,
      title: t('stageBooked'),
      subtext: activeShipment?.createdAt || '08:15 AM',
      note: 'Manifest issued',
      activeColor: 'bg-white border-forest text-navy'
    },
    {
      stage: 2,
      title: t('stagePickedUp'),
      subtext: `OTP: ${formatNumber(activeShipment?.pickupOtp || '4821')}`,
      note: 'Photo logged ✓',
      activeColor: 'bg-white border-forest text-navy'
    },
    {
      stage: 3,
      title: t('stageAtHub'),
      subtext: 'Khed APMC Hub',
      note: 'En route destination',
      activeColor: 'bg-white border-forest text-navy'
    },
    {
      stage: 4,
      title: t('stageDelivered'),
      subtext: currentStage >= 4 ? `OTP: ${formatNumber(activeShipment?.deliveryOtp || '8204')} ✓` : 'Receiver OTP verification',
      note: currentStage >= 4 ? 'Verified by recipient' : 'Pending drop-off',
      activeColor: 'bg-soft-green border-forest text-forest font-bold'
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rural-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-soft-green text-forest border border-forest/20">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy font-display">
              Track Your Goods
            </h1>
            <p className="text-xs sm:text-sm text-rural-muted mt-0.5">
              Live status, milestones, vehicle details, and digital proof for your village shipment.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="e.g. GL-2026-00125"
            className="px-4 py-2.5 rounded-xl bg-white border border-rural-border text-xs font-mono font-bold text-navy focus:ring-2 focus:ring-forest outline-none shadow-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-deep text-white font-bold text-xs shadow-sm transition"
          >
            Track
          </button>
        </form>
      </div>

      {/* Problem Report Success Notification */}
      {disputeSuccessMsg && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-amber-700 shrink-0" />
            <span>{disputeSuccessMsg}</span>
          </div>
          <button onClick={() => setDisputeSuccessMsg(null)} className="text-amber-700 hover:text-amber-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeShipment ? (
        <div className="space-y-8">
          {/* Top Shipment Card */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rural-border pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl font-mono font-black text-forest">
                    {activeShipment.trackingNumber}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-soft-green text-forest border border-forest/20">
                    {t('status_' + activeShipment.status)}
                  </span>

                  {/* Urgency Badge */}
                  {activeShipment.urgencyBadge === 'URGENT' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      <span>URGENT FRESHNESS</span>
                    </span>
                  )}
                  {activeShipment.urgencyBadge === 'TODAY' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span>TODAY DEADLINE</span>
                    </span>
                  )}
                  {activeShipment.urgencyBadge === 'FLEXIBLE' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>FLEXIBLE</span>
                    </span>
                  )}

                  {/* Return Trip Badge */}
                  {(activeShipment.isReturnTrip || activeShipment.transportType === 'RETURN') && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      Return Trip (40% discount)
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-navy mt-1.5">{activeShipment.productName}</h2>
                <div className="text-xs text-rural-muted mt-0.5">
                  Sender: <span className="text-navy font-semibold">{activeShipment.senderName}</span> ({activeShipment.senderOrg || 'SHG'}) • {activeShipment.origin.village}, {activeShipment.origin.district}
                </div>
              </div>

              {/* Digital Manifest QR & Report Action */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsReportingProblem(true)}
                  className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report Problem</span>
                </button>

                <div className="p-3 rounded-xl bg-cream/70 border border-rural-border flex items-center gap-3">
                  <QrCode className="w-8 h-8 text-forest" />
                  <div className="text-right">
                    <span className="text-[10px] text-rural-muted block font-mono">DIGITAL MANIFEST QR</span>
                    <span className="text-xs font-mono font-bold text-navy">{activeShipment.qrCodeToken}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4-STAGE TIMELINE: Booked > Picked up > At Hub > Delivered (OTP verified) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rural-muted">
                  Shipment Progress Timeline
                </h3>
                <span className="text-xs font-semibold text-forest">
                  Stage {currentStage} of 4: {timelineSteps[currentStage - 1]?.title}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {timelineSteps.map(step => {
                  const isCompleted = step.stage < currentStage;
                  const isCurrent = step.stage === currentStage;

                  return (
                    <div
                      key={step.stage}
                      className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between transition ${
                        isCurrent
                          ? 'bg-soft-green/60 border-forest text-navy shadow-sm ring-1 ring-forest/30'
                          : isCompleted
                          ? 'bg-white border-forest/60 text-navy'
                          : 'bg-cream/40 border-rural-border/60 text-rural-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono opacity-80">0{step.stage}</span>
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-forest" />}
                        {isCurrent && <span className="w-2.5 h-2.5 rounded-full bg-forest animate-ping" />}
                        {!isCompleted && !isCurrent && <Clock className="w-3.5 h-3.5 text-rural-muted opacity-40" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-navy">{step.title}</div>
                        <div className="text-[11px] font-medium text-forest mt-0.5">{step.subtext}</div>
                        <div className="text-[10px] text-rural-muted mt-1">{step.note}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ESTIMATED PROGRESS BAR */}
            <div className="p-4 rounded-2xl bg-cream border border-rural-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-navy uppercase text-[11px]">Lifecycle Completion:</span>
                <span className="font-extrabold text-forest">{Math.round((currentStage / 4) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden p-0.5 border border-rural-border">
                <div 
                  className="h-full bg-forest rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.round((currentStage / 4) * 100)}%` }}
                />
              </div>
            </div>

            {/* PROOF OF DELIVERY & TRUST BENCHMARK */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Pickup Verification */}
              <div className="p-4 rounded-xl bg-white border border-rural-border shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-rural-muted font-bold text-[11px] uppercase">Pickup Verification</span>
                  <span className="text-[10px] font-bold text-forest bg-soft-green px-2 py-0.5 rounded-md border border-forest/20">
                    OTP Verified
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-rural-muted block">Sender 4-Digit OTP</span>
                    <span className="text-xl font-mono font-black text-navy">{activeShipment.pickupOtp || '4821'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-rural-muted block">Pickup Photo</span>
                    <span className="text-[11px] font-semibold text-forest flex items-center gap-1 justify-end">
                      <Camera className="w-3.5 h-3.5" /> Uploaded ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Verification */}
              <div className="p-4 rounded-xl bg-white border border-rural-border shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-rural-muted font-bold text-[11px] uppercase">Delivery Handover</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    currentStage >= 4 
                      ? 'text-forest bg-soft-green border-forest/20' 
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    {currentStage >= 4 ? 'Delivered ✓' : 'Pending Drop-off'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-rural-muted block">Receiver Handover OTP</span>
                    <span className="text-xl font-mono font-black text-forest">{activeShipment.deliveryOtp || '8204'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-rural-muted block">Receiver Sign</span>
                    <span className="text-[11px] font-semibold text-navy">
                      {currentStage >= 4 ? 'Confirmed ✓' : 'Awaiting drop-off'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Driver Trust Badge & Star Rating */}
              <div className="p-4 rounded-xl bg-white border border-rural-border shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-rural-muted font-bold text-[11px] uppercase">Driver Trust Score</span>
                  {/* Verified trust badge */}
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest/10 border border-forest/30 text-forest text-[10px] font-extrabold">
                    <ShieldCheck className="w-3 h-3 text-forest" />
                    Verified, 184 trips, 0 disputes
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-rural-muted block">Assigned Driver</span>
                    <span className="font-bold text-navy text-xs">{assignedVehicle ? assignedVehicle.driverName : 'Ramesh Kadam'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-rural-muted block">Driver Rating</span>
                    <div className="flex items-center gap-1 text-gold font-bold text-xs justify-end">
                      <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                      <span>{userRating.toFixed(1)} / 5.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SPECS & DRIVER TELEMETRY */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-cream/60 border border-rural-border space-y-1.5 text-xs">
                <span className="text-rural-muted font-bold block text-[11px] uppercase">Vehicle & Transporter</span>
                <div className="font-mono font-bold text-navy text-sm">
                  {assignedVehicle ? assignedVehicle.vehicleNumber : (activeShipment.assignedVehicleNumber || 'MH-08-E-4219')}
                </div>
                <div className="font-semibold text-forest">
                  {assignedVehicle ? assignedVehicle.driverName : (activeShipment.assignedTransporterName || 'Ramesh Kadam')}
                </div>
                <div className="text-[11px] text-rural-muted">
                  {assignedVehicle ? assignedVehicle.makeModel : 'Tata Ace Gold'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cream/60 border border-rural-border space-y-2 text-xs">
                <span className="text-rural-muted font-bold block text-[11px] uppercase">Pickup & Destination</span>
                <div className="font-bold text-navy flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-forest" />
                  <span>{activeShipment.origin.village || activeShipment.origin.name}</span>
                </div>
                <div className="font-bold text-forest flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-forest" />
                  <span>{activeShipment.destination.name}</span>
                </div>
                <div className="text-[11px] text-rural-muted">District: {activeShipment.origin.district} → {activeShipment.destination.district}</div>
                <div className="pt-1">
                  <StaticMapEmbed 
                    address={`${activeShipment.origin.village || activeShipment.origin.name}, ${activeShipment.origin.district}, Maharashtra`} 
                    title="Pickup Location" 
                    height={110} 
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cream/60 border border-rural-border space-y-1.5 text-xs">
                <span className="text-rural-muted font-bold block text-[11px] uppercase">Live Current Location</span>
                <div className="font-bold text-navy text-sm">
                  {assignedVehicle ? assignedVehicle.currentLocation.name : 'En Route NH-66 Bel-Khed'}
                </div>
                <div className="text-[11px] font-mono text-rural-muted">
                  {assignedVehicle ? `${assignedVehicle.currentLocation.coordinates.lat.toFixed(4)}, ${assignedVehicle.currentLocation.coordinates.lng.toFixed(4)}` : '17.7520, 73.2800'}
                </div>
                <div className="text-[11px] font-bold text-forest">
                  Speed: {assignedVehicle ? assignedVehicle.speedKmh : 38} km/h
                </div>
              </div>

              <div className="p-4 rounded-xl bg-soft-green border border-forest/30 space-y-1.5 text-xs flex flex-col justify-between">
                <div>
                  <span className="text-forest font-bold block text-[11px] uppercase">Transport Fare</span>
                  <div className="text-2xl font-black text-forest font-display">₹{activeShipment.estimatedPooledCost}</div>
                  <div className="text-[11px] text-rural-muted">
                    Solo: <span className="line-through">₹{activeShipment.estimatedSoloCost}</span> (+₹{activeShipment.potentialSavings} saved)
                  </div>
                </div>
                <div className="text-[10px] text-forest font-bold pt-1 border-t border-forest/20">
                  Last updated: {secondsAgo}s ago
                </div>
              </div>
            </div>
          </div>

          {/* LIVE EMBEDDED REAL MAHARASHTRA MAP */}
          <div className="bg-white p-6 rounded-2xl border border-rural-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <Navigation className="w-4 h-4 text-forest" />
                <span>Live Map Telemetry: {activeShipment.trackingNumber}</span>
              </h3>
              <span className="text-xs text-forest font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-forest animate-ping"></span>
                <span>LIVE • Last updated: {secondsAgo}s ago</span>
              </span>
            </div>
            <MaharashtraMap 
              height="450px" 
              selectedVehicleId={assignedVehicle?.id} 
              selectedShipmentId={activeShipment.id}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-rural-muted">
          <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Shipment not found. Please verify tracking ID.</p>
        </div>
      )}

      {/* REPORT PROBLEM MODAL */}
      {isReportingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-rural-border shadow-xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-rural-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-navy text-base">Report Shipment Problem</h3>
              </div>
              <button 
                onClick={() => setIsReportingProblem(false)}
                className="p-1 rounded-lg hover:bg-cream text-rural-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-rural-muted">
              Shipment <strong className="text-navy">{activeShipment?.trackingNumber}</strong> • GraminLink Trust Desk will review dispute evidence within 2 hours.
            </p>

            <form onSubmit={handleReportProblem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">Issue Category</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'DAMAGED', label: 'Damaged Goods' },
                    { id: 'DELAY', label: 'Delayed Delivery' },
                    { id: 'WRONG_WEIGHT', label: 'Wrong Weight' },
                    { id: 'OTHER', label: 'Other Issue' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDisputeType(item.id as any)}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                        disputeType === item.id 
                          ? 'bg-soft-green border-forest text-forest' 
                          : 'bg-white border-rural-border text-navy hover:bg-cream'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Details / Notes</label>
                <textarea
                  rows={3}
                  value={disputeNotes}
                  onChange={e => setDisputeNotes(e.target.value)}
                  placeholder="Describe damage, delay or discrepancies observed..."
                  className="w-full p-3 rounded-xl border border-rural-border text-xs focus:ring-2 focus:ring-forest outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rural-border">
                <button
                  type="button"
                  onClick={() => setIsReportingProblem(false)}
                  className="px-4 py-2 rounded-xl border border-rural-border text-xs font-bold text-navy hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-deep text-white text-xs font-bold shadow-sm"
                >
                  Submit Dispute Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
