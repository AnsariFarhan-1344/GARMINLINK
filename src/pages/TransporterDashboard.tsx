import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useLogistics } from '../context/LogisticsContext';
import { useUserLocation } from '../context/LocationContext';
import { 
  Truck, 
  MapPin, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  DollarSign, 
  RotateCcw, 
  ArrowRight, 
  Navigation, 
  ShieldCheck, 
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  Gauge,
  Power,
  Radio,
  Play,
  Pause,
  Plus,
  Camera,
  Star,
  X,
  Upload,
  Check
} from 'lucide-react';

import { Vehicle, Shipment } from '../types';
import { liveTrackingManager, TrackingState } from '../services/trackingService';

interface TransporterDashboardProps {
  onNavigate: (tab: any) => void;
}

export const TransporterDashboard: React.FC<TransporterDashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { 
    vehicles, 
    shipments,
    pools, 
    returnTrips, 
    activeRoute, 
    acceptTransporterTrip, 
    claimReturnTrip,
    postEmptyReturnTrip,
    verifyPickupWithOtp,
    verifyDeliveryWithOtp,
    honestMetrics,
    connectionStatus 
  } = useLogistics();

  const {
    isSharingTransporterGps,
    activeSharingVehicleId,
    toggleTransporterGpsShare
  } = useUserLocation();

  // Driver vehicle
  const myVehicle = vehicles.find(v => v.driverId === currentUser.id) || vehicles[0];
  const [selectedVehicleId, setSelectedVehicleId] = useState(myVehicle?.id || 'veh-1');
  const [selectedShipmentId, setSelectedShipmentId] = useState(shipments[0]?.id || '');
  const [isAvailable, setIsAvailable] = useState(true);
  const [earningsTab, setEarningsTab] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Return trip posting modal state
  const [showPostReturnModal, setShowPostReturnModal] = useState<boolean>(false);
  const [returnPostForm, setReturnPostForm] = useState({
    originHub: 'Khed Taluka Consolidation Hub (APMC Area)',
    destinationVillage: 'Dapoli Village Center (Gimhavane)',
    pickupWindow: 'Today, 01:30 PM - 03:00 PM',
    weightKg: 200,
    additionalEarnings: 480,
    cargoDescription: 'Empty returning Tata Ace bed available for bio-fertilizer, seed sacks or retail supplies'
  });

  // Proof of Delivery state
  const [podStep, setPodStep] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [pickupOtpInput, setPickupOtpInput] = useState<string>('');
  const [pickupPhotoMock, setPickupPhotoMock] = useState<string | null>(null);
  const [deliveryOtpInput, setDeliveryOtpInput] = useState<string>('');
  const [deliveryPhotoMock, setDeliveryPhotoMock] = useState<string | null>(null);
  const [driverRatingInput, setDriverRatingInput] = useState<number>(5);

  // Live GPS tracking state
  const [trackingState, setTrackingState] = useState<TrackingState>(liveTrackingManager.getState());

  useEffect(() => {
    const unsubscribe = liveTrackingManager.subscribe((state) => {
      setTrackingState(state);
    });
    return () => unsubscribe();
  }, []);

  const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) || myVehicle;
  const activeShipment = shipments.find(s => s.id === selectedShipmentId) || shipments[0];

  // Driver Controls: Start Trip
  const handleStartTrip = async () => {
    setActionSuccessMsg('Requesting GPS permission from device...');
    const result = await liveTrackingManager.startTrip(
      selectedVehicleId,
      currentUser.id || activeVehicle.driverId,
      selectedShipmentId
    );

    if (result.success) {
      setActionSuccessMsg('Real GPS Tracking ACTIVE! Live telemetry streaming to GraminLink.');
    } else {
      setActionSuccessMsg(result.error || 'Failed to start GPS');
    }
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  // Driver Controls: Pause Tracking
  const handlePauseTracking = () => {
    liveTrackingManager.pauseTracking();
    setActionSuccessMsg('⏸️ GPS tracking paused.');
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Driver Controls: Resume Tracking
  const handleResumeTracking = () => {
    liveTrackingManager.resumeTracking();
    setActionSuccessMsg('▶️ GPS tracking resumed.');
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Driver Controls: End Trip
  const handleEndTrip = () => {
    liveTrackingManager.endTrip();
    setActionSuccessMsg('🏁 Trip Completed! Final telemetry coordinates recorded.');
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  const handleAcceptRequest = (poolId: string) => {
    acceptTransporterTrip(myVehicle.id, poolId);
    setActionSuccessMsg(`Trip accepted for Pool ${poolId}! Dispatched route loaded.`);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const handleClaimReturn = (oppId: string) => {
    claimReturnTrip(oppId);
    setActionSuccessMsg(`Return load secured! Added to your reverse route.`);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const handlePostReturnTrip = (e: React.FormEvent) => {
    e.preventDefault();
    postEmptyReturnTrip({
      originHub: returnPostForm.originHub,
      destinationVillage: returnPostForm.destinationVillage,
      pickupWindow: returnPostForm.pickupWindow,
      weightKg: Number(returnPostForm.weightKg),
      additionalEarnings: Number(returnPostForm.additionalEarnings),
      cargoDescription: returnPostForm.cargoDescription
    });
    setActionSuccessMsg(`Empty return trip posted successfully! Village shippers can now book your backhaul at a discount.`);
    setShowPostReturnModal(false);
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  const handleVerifyPickup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;
    const res = verifyPickupWithOtp(activeShipment.id, pickupOtpInput || '4821', pickupPhotoMock || undefined);
    if (res.success) {
      setActionSuccessMsg(`✅ ${res.message}`);
      setPickupOtpInput('');
      setPickupPhotoMock(null);
    } else {
      setActionSuccessMsg(`⚠️ ${res.message}`);
    }
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  const handleVerifyDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;
    const res = verifyDeliveryWithOtp(activeShipment.id, deliveryOtpInput || '7392', deliveryPhotoMock || undefined, driverRatingInput);
    if (res.success) {
      setActionSuccessMsg(`✅ ${res.message}`);
      setDeliveryOtpInput('');
      setDeliveryPhotoMock(null);
    } else {
      setActionSuccessMsg(`⚠️ ${res.message}`);
    }
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  const occupiedPercent = Math.round((myVehicle.currentPayloadKg / myVehicle.maxPayloadKg) * 100);

  // Return trips calculations
  const availableReturnTrips = returnTrips.filter(r => r.status === 'AVAILABLE');
  const returnTripsCount = availableReturnTrips.length;
  const potentialEarnings = availableReturnTrips.reduce((acc, r) => acc + r.additionalEarnings, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title & Transporter Profile + Big Availability Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D9DED0] bg-white p-6 rounded-3xl border shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#E7EBD9] text-[#556B2F] border border-[#D9DED0]">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#263238] font-display">
                Transporter Partner Hub
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E7EBD9] text-[#556B2F] border border-[#D9DED0] font-bold">
                Verified Driver
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#60706A] mt-0.5">
              Driver: <strong className="text-[#556B2F] font-bold">{myVehicle.driverName}</strong> • Vehicle: <span className="font-mono text-[#60706A] font-bold">{myVehicle.vehicleNumber}</span> ({myVehicle.makeModel}) • Rating: <strong className="text-[#C59D5F]">4.9★</strong>
            </p>
          </div>
        </div>

        {/* Big Obvious Availability Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 border shadow-xs min-h-[46px] ${
              isAvailable
                ? 'bg-[#E7EBD9] text-[#556B2F] border-[#556B2F] hover:bg-[#556B2F] hover:text-white'
                : 'bg-[#F0F2E8] text-[#60706A] border-[#D9DED0] hover:bg-[#E7EBD9]'
            }`}
          >
            <Power className="w-4 h-4 text-[#556B2F]" />
            <span className="text-[#556B2F]">{isAvailable ? 'AVAILABLE FOR TRIPS' : 'NOT AVAILABLE'}</span>
          </button>

          <button
            onClick={() => onNavigate('live_map')}
            className="px-4 py-3 rounded-2xl bg-white hover:bg-[#F0F2E8] text-[#556B2F] text-xs font-bold border border-[#556B2F] transition flex items-center gap-2 shadow-xs min-h-[46px]"
          >
            <Navigation className="w-4 h-4 text-[#556B2F]" />
            <span>Open Live Map</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-[#E7EBD9] border border-[#556B2F] text-[#556B2F] text-sm font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-[#556B2F] shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ================================================================== */}
      {/* 1. MAIN USP: RETURN-LOAD (BACKHAUL) MATCHING HERO CARD              */}
      {/* ================================================================== */}
      <div className="bg-gradient-to-r from-[#263238] to-[#37474F] text-white p-6 sm:p-7 rounded-3xl shadow-sm border border-[#263238] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-[#C59D5F] text-white shadow-xs">
              <RotateCcw className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C59D5F] text-white uppercase tracking-wider">
                  Our Main USP • Zero Deadhead
                </span>
                <span className="text-xs text-[#D9DED0]">
                  Avoid Empty Return Trips
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display mt-1 text-[#F5F3EA]">
                Your empty return trips: {returnTripsCount}, earn ₹{potentialEarnings} by filling them
              </h2>
              <p className="text-xs text-[#D9DED0] mt-1 max-w-2xl leading-relaxed">
                Don't drive home empty! GraminLink connects your return route with village fertilizer, seeds, feed, and consumer cargo so every kilometer generates revenue.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPostReturnModal(true)}
              className="px-5 py-3 rounded-xl bg-[#556B2F] hover:bg-[#688239] text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Post Empty Return Trip</span>
            </button>
          </div>
        </div>

        {/* Counter readout: Empty km avoided */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs flex items-center justify-between">
            <span className="text-[#D9DED0]">Empty KM Avoided:</span>
            <span className="font-mono font-black text-lg text-[#C59D5F]">
              {honestMetrics.emptyKmAvoided} km avoided
            </span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs flex items-center justify-between">
            <span className="text-[#D9DED0]">CO₂ Emissions Offset:</span>
            <span className="font-mono font-black text-lg text-emerald-400">
              {honestMetrics.co2ReducedKg} kg saved
            </span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs flex items-center justify-between">
            <span className="text-[#D9DED0]">Backhaul Bonus Earned:</span>
            <span className="font-mono font-black text-lg text-[#F5F3EA]">
              ₹{myVehicle.completedTrips * 350 + 450} total
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* REAL-TIME VEHICLE GPS TRIP CONTROLLER (Hardware Geolocation API)   */}
      {/* ================================================================== */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#D9DED0] shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9DED0] pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border shadow-xs ${
              trackingState.isWatching 
                ? 'bg-[#E7EBD9] text-[#556B2F] border-[#556B2F]' 
                : 'bg-[#E7EBD9] text-[#556B2F] border-[#D9DED0]'
            }`}>
              <Radio className={`w-6 h-6 text-[#556B2F] ${trackingState.isWatching && !trackingState.isPaused ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-[#263238] font-display">
                  Live GPS Trip Controller
                </h2>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  trackingState.isWatching && !trackingState.isPaused
                    ? 'bg-[#E7EBD9] text-[#556B2F] border-[#556B2F] animate-pulse'
                    : trackingState.isPaused
                    ? 'bg-[#F5F3EA] text-[#C59D5F] border-[#C59D5F]'
                    : 'bg-[#E7EBD9] text-[#556B2F] border-[#556B2F]'
                }`}>
                  {trackingState.isWatching && !trackingState.isPaused 
                    ? 'GPS STREAMING ACTIVE' 
                    : trackingState.isPaused 
                    ? 'TRACKING PAUSED' 
                    : 'READY TO START'}
                </span>
              </div>
              <p className="text-xs text-[#60706A] mt-0.5">
                Transmits real-time coordinates to village shippers, consolidation hubs, and state monitoring dashboards.
              </p>
            </div>
          </div>

          {/* Network & Offline Status - Stable Live Simulated */}
          <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#F5F3EA] border border-[#D9DED0]">
            <span className="text-[#60706A]">Server Link:</span>
            <span className="text-[#556B2F] font-bold">
              ● Live (Simulated)
            </span>
            {trackingState.queuedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-[#E7EBD9] text-[#556B2F] text-[10px] font-bold">
                {trackingState.queuedCount} queued
              </span>
            )}
          </div>
        </div>

        {/* Live GPS Broadcast Toggle Card */}
        <div className="p-4 rounded-2xl bg-[#E7EBD9] border border-[#556B2F]/30 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 text-[#556B2F] ${isSharingTransporterGps ? 'animate-pulse' : ''}`} />
              <span className="font-bold text-[#263238] text-xs">Share My Live Location (Broadcast Device GPS)</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isSharingTransporterGps ? 'bg-[#2E7D32] text-white animate-pulse' : 'bg-[#D9DED0] text-[#60706A]'}`}>
                {isSharingTransporterGps ? 'LIVE (GPS) BROADCASTING' : 'IDLE / SIMULATED'}
              </span>
            </div>
            <p className="text-[11px] text-[#60706A] mt-0.5">
              Broadcasts this vehicle's device GPS across tabs so producers see this vehicle moving in real-time.
            </p>
          </div>
          <button
            onClick={() => toggleTransporterGpsShare(selectedVehicleId)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 min-h-[40px] ${
              isSharingTransporterGps
                ? 'bg-[#B84A3A] hover:bg-[#9B3C2E] text-white'
                : 'bg-[#556B2F] hover:bg-[#3F5023] text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isSharingTransporterGps ? 'Stop Sharing GPS' : 'Share My Live Location'}</span>
          </button>
        </div>

        {/* Trip Configuration & Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Select Assigned Vehicle */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-[#263238] uppercase tracking-wider block">
              1. Select Assigned Vehicle:
            </label>
            <select
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value)}
              disabled={trackingState.isWatching}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#D9DED0] text-xs font-bold text-[#263238] focus:border-[#556B2F] focus:ring-1 focus:ring-[#556B2F] outline-none disabled:opacity-60"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber} ({v.driverName} — {v.category.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Select Active Shipment */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-[#263238] uppercase tracking-wider block">
              2. Select Active Shipment:
            </label>
            <select
              value={selectedShipmentId}
              onChange={e => setSelectedShipmentId(e.target.value)}
              disabled={trackingState.isWatching}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#D9DED0] text-xs font-bold text-[#263238] focus:border-[#556B2F] focus:ring-1 focus:ring-[#556B2F] outline-none disabled:opacity-60"
            >
              {shipments.map(s => (
                <option key={s.id} value={s.id}>
                  {s.trackingNumber} — {s.productName} ({s.origin.village} → {s.destination.taluka})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-4 flex flex-wrap gap-2">
            {!trackingState.isWatching ? (
              <button
                onClick={handleStartTrip}
                className="w-full py-2.5 px-4 rounded-xl bg-[#556B2F] hover:bg-[#3F5023] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 min-h-[42px]"
              >
                <Play className="w-4 h-4 fill-current text-white" />
                <span>START TRIP (ENABLE REAL GPS)</span>
              </button>
            ) : (
              <div className="w-full flex gap-2">
                {!trackingState.isPaused ? (
                  <button
                    onClick={handlePauseTracking}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#C59D5F] hover:bg-[#B38D4F] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResumeTracking}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#556B2F] hover:bg-[#3F5023] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume</span>
                  </button>
                )}

                <button
                  onClick={handleEndTrip}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#B84A3A] hover:bg-[#9B3C2E] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>End Trip</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live GPS Telemetry Readout Box */}
        {trackingState.isWatching && (
          <div className="p-4 rounded-2xl bg-cream border border-rural-border space-y-3 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rural-border pb-2 text-xs">
              <span className="font-bold text-navy flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-forest" />
                <span>Live Hardware Sensor Telemetry</span>
              </span>
              <span className="text-[11px] text-rural-muted">
                Trip ID: <code className="font-mono text-navy font-bold">{trackingState.tripId}</code>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-rural-border">
                <span className="text-rural-muted text-[10px] block">Coordinates</span>
                <span className="font-mono font-bold text-navy">
                  {trackingState.currentLat ? `${trackingState.currentLat.toFixed(5)}, ${trackingState.currentLng?.toFixed(5)}` : 'Acquiring fix...'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-rural-border">
                <span className="text-rural-muted text-[10px] block">GPS Accuracy</span>
                <span className="font-bold text-forest">
                  {trackingState.accuracy ? `±${trackingState.accuracy} meters` : 'Calibrating...'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-rural-border">
                <span className="text-rural-muted text-[10px] block">Speed</span>
                <span className="font-bold text-navy">
                  {trackingState.speedKmh !== null ? `${trackingState.speedKmh} km/h` : '0 km/h'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-rural-border">
                <span className="text-rural-muted text-[10px] block">Geofence Status</span>
                <span className="font-bold text-gold">
                  {trackingState.geofenceStatus ? trackingState.geofenceStatus.replace(/_/g, ' ') : 'Monitoring zone...'}
                </span>
              </div>
            </div>

            {trackingState.lastGeofenceAlert && (
              <div className="p-3 rounded-xl bg-soft-green border border-forest text-forest-dark text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                <span>{trackingState.lastGeofenceAlert.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* 2. PROOF OF DELIVERY (PoD) TERMINAL: OTP + PHOTO VERIFICATION      */}
      {/* ================================================================== */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-rural-border shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rural-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-soft-green text-forest border border-rural-border">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-navy">Proof of Delivery (PoD) Terminal</h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-soft-green text-forest-dark border border-forest/20 uppercase">
                  Digital Handover
                </span>
              </div>
              <p className="text-xs text-rural-muted mt-0.5">
                Verify cargo pickup with producer 4-digit OTP & photo, and complete delivery with receiver OTP & rating.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-cream p-1 rounded-xl border border-rural-border text-xs">
            <button
              onClick={() => setPodStep('PICKUP')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                podStep === 'PICKUP' ? 'bg-forest text-white shadow-xs' : 'text-navy hover:text-forest'
              }`}
            >
              1. Pickup PoD
            </button>
            <button
              onClick={() => setPodStep('DELIVERY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                podStep === 'DELIVERY' ? 'bg-forest text-white shadow-xs' : 'text-navy hover:text-forest'
              }`}
            >
              2. Delivery PoD
            </button>
          </div>
        </div>

        {activeShipment && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Shipment Summary */}
            <div className="md:col-span-5 bg-cream p-4 rounded-2xl border border-rural-border space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-rural-border pb-2">
                <span className="font-mono font-bold text-forest text-sm">{activeShipment.trackingNumber}</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-navy font-semibold border border-rural-border text-[10px]">
                  {activeShipment.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-navy font-bold text-sm">{activeShipment.productName}</div>
                <div className="text-rural-muted">Weight: {activeShipment.weightKg} kg • {activeShipment.packageCount} pkgs</div>
                <div className="text-rural-muted">Sender: {activeShipment.senderName} ({activeShipment.senderOrg})</div>
                <div className="text-forest font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Pickup: {activeShipment.origin.village}, {activeShipment.origin.district}</span>
                </div>
                <div className="text-navy font-semibold flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-forest" />
                  <span>Destination: {activeShipment.destination.name}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-rural-border flex justify-between text-[11px] text-rural-muted">
                <span>Sender Pickup OTP: <strong className="font-mono text-forest">{activeShipment.pickupOtp || '4821'}</strong></span>
                <span>Receiver Delivery OTP: <strong className="font-mono text-navy">{activeShipment.deliveryOtp || '7392'}</strong></span>
              </div>
            </div>

            {/* Interactive Form for Pickup or Delivery */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-rural-border space-y-4">
              {podStep === 'PICKUP' ? (
                <form onSubmit={handleVerifyPickup} className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-navy flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-forest" />
                      <span>Step 1: Producer Pickup Verification</span>
                    </h4>
                    <span className="text-[10px] text-forest font-bold bg-soft-green px-2 py-0.5 rounded">
                      Demo OTP: {activeShipment.pickupOtp || '4821'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-rural-muted mb-1">
                      Enter 4-Digit Pickup OTP (from Sender):
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={pickupOtpInput}
                      onChange={e => setPickupOtpInput(e.target.value)}
                      placeholder="e.g. 4821"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-rural-border text-navy font-mono font-bold text-base tracking-widest focus:border-forest outline-none"
                    />
                  </div>

                  {/* Photo Upload Mock */}
                  <div>
                    <label className="block text-xs font-semibold text-rural-muted mb-1">
                      Cargo Photo at Loading (Mock Upload):
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPickupPhotoMock('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=60')}
                        className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition ${
                          pickupPhotoMock 
                            ? 'bg-soft-green text-forest border-forest' 
                            : 'bg-cream hover:bg-cream-darker text-navy border-rural-border'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        <span>{pickupPhotoMock ? 'Photo Captured ✓' : 'Take / Upload Mock Cargo Photo'}</span>
                      </button>
                      {pickupPhotoMock && (
                        <span className="text-[11px] text-forest font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Photo logged
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-forest hover:bg-forest-dark text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Pickup & Update Shipment Status</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyDelivery} className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-navy flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-forest" />
                      <span>Step 2: Receiver Delivery Verification</span>
                    </h4>
                    <span className="text-[10px] text-navy font-bold bg-cream px-2 py-0.5 rounded">
                      Demo OTP: {activeShipment.deliveryOtp || '7392'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-rural-muted mb-1">
                      Enter 4-Digit Delivery OTP (from Receiver at Hub/Mandi):
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={deliveryOtpInput}
                      onChange={e => setDeliveryOtpInput(e.target.value)}
                      placeholder="e.g. 7392"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-rural-border text-navy font-mono font-bold text-base tracking-widest focus:border-forest outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-rural-muted mb-1">
                        Optional Handover Photo:
                      </label>
                      <button
                        type="button"
                        onClick={() => setDeliveryPhotoMock('https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=300&auto=format&fit=crop&q=60')}
                        className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                          deliveryPhotoMock ? 'bg-soft-green text-forest border-forest' : 'bg-cream text-navy border-rural-border'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        <span>{deliveryPhotoMock ? 'Photo Attached ✓' : 'Upload Proof Photo'}</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-rural-muted mb-1">
                        Driver Rating:
                      </label>
                      <div className="flex items-center gap-1 py-1.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setDriverRatingInput(star)}
                            className="p-1 text-gold transition hover:scale-110"
                          >
                            <Star className={`w-5 h-5 ${star <= driverRatingInput ? 'fill-current' : 'text-slate-300'}`} />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-navy ml-1.5">{driverRatingInput}.0★</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-forest hover:bg-forest-dark text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Delivery (OTP Verified)</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TOP KPIS (Clean Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Today's Trips */}
        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-xs">
          <span className="text-xs text-rural-muted block font-medium">Today's Trips</span>
          <div className="text-2xl font-black text-navy font-display mt-1">3 Trips</div>
          <span className="text-xs text-forest mt-0.5 block font-semibold">2 completed, 1 active</span>
        </div>

        {/* Available Capacity */}
        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-xs">
          <span className="text-xs text-rural-muted block font-medium">Available Space</span>
          <div className="text-2xl font-black text-forest font-display mt-1">
            {myVehicle.availablePayloadKg} kg
          </div>
          <span className="text-xs text-rural-muted mt-0.5 block font-medium">
            of {myVehicle.maxPayloadKg} kg max capacity
          </span>
        </div>

        {/* Earnings */}
        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-xs">
          <span className="text-xs text-rural-muted block font-medium">Today's Earnings</span>
          <div className="text-2xl font-black text-gold font-display mt-1">₹1,850</div>
          <span className="text-xs text-forest-dark mt-0.5 block font-semibold">+₹450 return cargo</span>
        </div>

        {/* Empty KM Avoided */}
        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-xs">
          <span className="text-xs text-rural-muted block font-medium">Empty KM Avoided</span>
          <div className="text-2xl font-black text-forest font-display mt-1">
            {honestMetrics.emptyKmAvoided} km
          </div>
          <span className="text-xs text-rural-muted mt-0.5 block font-medium">{honestMetrics.co2ReducedKg} kg CO₂ offset</span>
        </div>

        {/* Completed Trips */}
        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-xs">
          <span className="text-xs text-rural-muted block font-medium">Driver Record</span>
          <div className="text-2xl font-black text-navy font-display mt-1">{myVehicle.completedTrips} Trips</div>
          <span className="text-xs text-forest mt-0.5 block font-semibold">0 Disputes • 4.9★</span>
        </div>
      </div>

      {/* VEHICLE CAPACITY VISUAL BAR */}
      <div className="bg-white p-6 rounded-3xl border border-rural-border shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-forest" />
            <h3 className="text-sm font-bold text-navy">Vehicle Capacity Utilization</h3>
          </div>
          <div className="text-xs font-semibold text-navy">
            <span className="text-forest font-bold">{myVehicle.currentPayloadKg} kg occupied</span> / {myVehicle.maxPayloadKg} kg max
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-soft-green text-forest-dark border border-forest/20 text-xs">
              {myVehicle.availablePayloadKg} kg available space
            </span>
          </div>
        </div>

        <div className="w-full h-5 bg-cream rounded-xl overflow-hidden p-1 border border-rural-border flex gap-1">
          <div 
            className="h-full bg-forest rounded-lg transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white"
            style={{ width: `${occupiedPercent}%` }}
          >
            {occupiedPercent}%
          </div>
          <div 
            className="h-full bg-cream rounded-lg flex items-center justify-center text-[10px] font-bold text-rural-muted"
            style={{ width: `${100 - occupiedPercent}%` }}
          >
            {100 - occupiedPercent}% Free
          </div>
        </div>
      </div>

      {/* SECTION D: RETURN CARGO MATCHING (Avoid Empty Return Trips) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-rural-border shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rural-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-soft-green text-forest border border-rural-border">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-navy">Find Return Cargo</h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-soft-green text-forest-dark border border-forest/20 uppercase">
                  Avoid Empty Return Trips
                </span>
              </div>
              <p className="text-xs text-rural-muted mt-0.5">
                Load fertilizers, seeds, agricultural inputs or retail cargo on your return route back to village
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPostReturnModal(true)}
            className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-dark text-white font-bold text-xs shadow-xs transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Post Empty Return Trip</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {returnTrips.map(opp => (
            <div 
              key={opp.id}
              className="p-4 rounded-2xl bg-cream border border-rural-border hover:border-forest transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gold uppercase font-mono">RETURN LOAD</span>
                <span className="text-sm font-extrabold text-gold font-display">
                  +₹{opp.additionalEarnings} Extra Earnings
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-navy">{opp.originHub} → {opp.destinationVillage}</h4>
                <p className="text-xs text-rural-muted mt-1 leading-relaxed">{opp.cargoDescription}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-navy py-1.5 border-t border-rural-border">
                <span>Weight: <strong>{opp.weightKg} kg</strong></span>
                <span>Time: <strong>{opp.pickupWindow}</strong></span>
              </div>

              <button
                onClick={() => handleClaimReturn(opp.id)}
                disabled={opp.status === 'CLAIMED'}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[40px] ${
                  opp.status === 'CLAIMED'
                    ? 'bg-cream-darker text-rural-muted cursor-not-allowed border border-rural-border'
                    : 'bg-gold hover:bg-[#B38D4F] text-white shadow-xs font-bold'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{opp.status === 'CLAIMED' ? 'Claimed by Driver' : 'Accept Return Cargo'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* POST EMPTY RETURN TRIP MODAL */}
      {showPostReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-rural-border shadow-xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-rural-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-soft-green text-forest">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Post Empty Return Trip</h3>
                  <p className="text-xs text-rural-muted">Make your vehicle available for backhaul goods</p>
                </div>
              </div>
              <button
                onClick={() => setShowPostReturnModal(false)}
                className="p-1.5 rounded-xl hover:bg-cream text-rural-muted hover:text-navy transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostReturnTrip} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">From (Origin Hub):</label>
                  <input
                    type="text"
                    required
                    value={returnPostForm.originHub}
                    onChange={e => setReturnPostForm({ ...returnPostForm, originHub: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-rural-border text-navy outline-none"
                    placeholder="e.g. Khed APMC Hub"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">To (Destination Village):</label>
                  <input
                    type="text"
                    required
                    value={returnPostForm.destinationVillage}
                    onChange={e => setReturnPostForm({ ...returnPostForm, destinationVillage: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-rural-border text-navy outline-none"
                    placeholder="e.g. Dapoli Village Center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Departure Time Window:</label>
                  <input
                    type="text"
                    required
                    value={returnPostForm.pickupWindow}
                    onChange={e => setReturnPostForm({ ...returnPostForm, pickupWindow: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-rural-border text-navy outline-none"
                    placeholder="e.g. Today 02:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Available Payload (kg):</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={myVehicle.maxPayloadKg}
                    value={returnPostForm.weightKg}
                    onChange={e => setReturnPostForm({ ...returnPostForm, weightKg: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-rural-border text-navy outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Target Earnings (₹):</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={returnPostForm.additionalEarnings}
                    onChange={e => setReturnPostForm({ ...returnPostForm, additionalEarnings: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-rural-border text-navy outline-none font-bold text-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Cargo Description / Space Notes:</label>
                <textarea
                  rows={2}
                  value={returnPostForm.cargoDescription}
                  onChange={e => setReturnPostForm({ ...returnPostForm, cargoDescription: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-rural-border text-navy outline-none"
                  placeholder="e.g. Empty covered bed available for fertilizers, retail cartons, dry goods..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostReturnModal(false)}
                  className="flex-1 py-3 rounded-xl bg-cream border border-rural-border font-bold text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-forest hover:bg-forest-dark text-white font-bold transition shadow-sm"
                >
                  Publish Return Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
