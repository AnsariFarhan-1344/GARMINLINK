import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useLogistics } from '../context/LogisticsContext';
import { GoodsCategory, DestinationType } from '../types';
import { calculateSoloVsPooledCost } from '../services/costEngine';
import { getShelfLifeInfo } from '../services/perishableService';
import { saveOfflineShipment, getOfflineShipments, OfflineQueuedShipment } from '../services/offlineSync';
import { 
  Package, 
  Layers, 
  TrendingDown, 
  Clock, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Calendar, 
  AlertCircle, 
  HelpCircle, 
  Users, 
  RotateCcw, 
  AlertTriangle, 
  X, 
  Timer, 
  Star,
  Mic,
  MicOff,
  WifiOff,
  Plus,
  Minus,
  Check
} from 'lucide-react';
import { 
  TempoTruckIcon, 
  KajuIcon, 
  FishCatchIcon, 
  MangoIcon, 
  ProduceIcon, 
  HandicraftPotIcon, 
  VillageHubIcon, 
  MandiBazaarIcon 
} from '../components/common/RuralIcons';

import { useGaadiSahayak } from '../context/GaadiSahayakContext';

interface EntrepreneurDashboardProps {
  onNavigate: (tab: any) => void;
  onTrackShipment?: (trackingNumber: string) => void;
}

export const EntrepreneurDashboard: React.FC<EntrepreneurDashboardProps> = ({ onNavigate }) => {
  const { language, t, formatNumber } = useLanguage();
  const { currentUser } = useAuth();
  const { prefilledBooking, clearPrefilledBooking } = useGaadiSahayak();
  const { 
    shipments, 
    pools, 
    returnTrips, 
    vehicles, 
    createShipment, 
    joinPoolWithShipment, 
    honestMetrics, 
    reportShipmentProblem 
  } = useLogistics();

  const bookingSectionRef = useRef<HTMLDivElement>(null);

  // Offline queued bookings tracking
  const [offlineQueued, setOfflineQueued] = useState<OfflineQueuedShipment[]>(() => getOfflineShipments());

  useEffect(() => {
    const updateList = () => {
      setOfflineQueued(getOfflineShipments());
    };
    window.addEventListener('offline-shipment-updated', updateList);
    window.addEventListener('online', updateList);
    return () => {
      window.removeEventListener('offline-shipment-updated', updateList);
      window.removeEventListener('online', updateList);
    };
  }, []);

  // Easy Mode vs Standard Mode Toggle
  const [isEasyMode, setIsEasyMode] = useState<boolean>(true);
  const [easyStep, setEasyStep] = useState<1 | 2 | 3>(1);

  // Voice Input (Web Speech API) State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    entrepreneurName: currentUser.organizationName || currentUser.name,
    district: 'Ratnagiri',
    taluka: 'Dapoli',
    village: 'Gimhavane',
    pickupLocation: 'Near Gram Panchayat Office, Gimhavane',
    goodsCategory: 'PROCESSED_FOOD' as GoodsCategory,
    productName: 'काजू आणि काजू कतली (Cashews)',
    weightKg: 35,
    packageCount: 3,
    pickupDate: new Date().toISOString().split('T')[0],
    preferredTime: '10:00 AM - 12:00 PM',
    destination: 'Khed Taluka Consolidation Hub',
    destinationType: 'TALUKA_HUB' as DestinationType
  });

  // Selected Transport Mode: Solo / Pooled / Return-trip
  const [selectedTransportMode, setSelectedTransportMode] = useState<'SOLO' | 'POOLED' | 'RETURN'>('POOLED');

  // Sync prefilled data from Gaadi Sahayak voice assistant
  useEffect(() => {
    if (prefilledBooking) {
      setFormData(prev => ({
        ...prev,
        productName: prefilledBooking.productName || prev.productName,
        goodsCategory: prefilledBooking.goodsCategory || prev.goodsCategory,
        weightKg: prefilledBooking.weightKg !== undefined ? prefilledBooking.weightKg : prev.weightKg,
        destination: prefilledBooking.destination || prev.destination,
        destinationType: prefilledBooking.destinationType || prev.destinationType
      }));

      // Focus / scroll smoothly to booking form
      setTimeout(() => {
        bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);

      clearPrefilledBooking();
    }
  }, [prefilledBooking, clearPrefilledBooking]);

  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Dispute Report Modal State
  const [reportingShipmentId, setReportingShipmentId] = useState<string | null>(null);
  const [disputeType, setDisputeType] = useState<'DAMAGED' | 'DELAY' | 'WRONG_WEIGHT' | 'OTHER'>('DAMAGED');
  const [disputeNotes, setDisputeNotes] = useState<string>('');
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState<string | null>(null);

  // Freshness Deadline Countdown
  const shelfLifeInfo = getShelfLifeInfo(formData.goodsCategory);
  const [countdownMinutes, setCountdownMinutes] = useState<number>(() => {
    if (shelfLifeInfo.shelfLifeHours === 4) return 228; // ~3h 48m
    if (shelfLifeInfo.shelfLifeHours === 12) return 695; // ~11h 35m
    if (shelfLifeInfo.shelfLifeHours === 72) return 4300; // ~71h 40m
    return 0;
  });

  useEffect(() => {
    if (shelfLifeInfo.shelfLifeHours === 4) setCountdownMinutes(228);
    else if (shelfLifeInfo.shelfLifeHours === 12) setCountdownMinutes(695);
    else if (shelfLifeInfo.shelfLifeHours === 72) setCountdownMinutes(4300);
    else setCountdownMinutes(0);
  }, [formData.goodsCategory]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownMinutes(prev => (prev > 0 ? prev - 1 : 0));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (mins: number) => {
    if (mins <= 0) return language === 'mr' ? 'अमर्याद' : 'Unlimited';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  };

  // Live Cost Estimation
  const costEstimate = calculateSoloVsPooledCost({
    weightKg: Number(formData.weightKg) || 10,
    distanceKm: 28, // Dapoli to Khed default distance
    category: formData.goodsCategory,
    destinationType: formData.destinationType
  });

  // Check for return vehicles heading towards Dapoli / user's area
  const matchingReturnTrip = returnTrips.find(r => 
    r.status === 'AVAILABLE' && 
    (r.destinationVillage.toLowerCase().includes('dapoli') || r.destinationVillage.toLowerCase().includes('gimhavane'))
  ) || returnTrips[0];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Web Speech API Mic Feature (mr-IN / hi-IN / en-IN)
  const handleStartVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceFeedback(language === 'mr' ? 'या ब्राउझरमध्ये व्हॉइस इनपुट उपलब्ध नाही' : 'Voice input not supported');
      setTimeout(() => setVoiceFeedback(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      setVoiceFeedback(language === 'mr' ? 'ऐकत आहे... बोला (उदा. "३५ किलो काजू")' : 'Listening... speak cargo & weight');

      recognition.onresult = (event: any) => {
        setIsListening(false);
        const transcript = event.results[0][0].transcript.toLowerCase();
        setVoiceFeedback(`समजले: "${transcript}"`);
        setTimeout(() => setVoiceFeedback(null), 5000);

        // Detect weight number in transcript
        const numMatch = transcript.match(/\d+/);
        if (numMatch) {
          const parsedWeight = parseInt(numMatch[0], 10);
          if (!isNaN(parsedWeight) && parsedWeight > 0) {
            handleInputChange('weightKg', parsedWeight);
          }
        }

        // Detect product / category in transcript
        if (transcript.includes('काजू') || transcript.includes('cashew') || transcript.includes('kaju')) {
          handleInputChange('goodsCategory', 'PROCESSED_FOOD');
          handleInputChange('productName', 'काजू (Cashew Nuts)');
        } else if (transcript.includes('मासे') || transcript.includes('मासळी') || transcript.includes('fish') || transcript.includes('सुरमई')) {
          handleInputChange('goodsCategory', 'FISHERIES');
          handleInputChange('productName', 'ताजी मासळी (Fresh Fish)');
        } else if (transcript.includes('आंबा') || transcript.includes('हापूस') || transcript.includes('mango')) {
          handleInputChange('goodsCategory', 'FRUITS');
          handleInputChange('productName', 'हापूस आंबा (Alphonso Mango)');
        } else if (transcript.includes('भाजी') || transcript.includes('vegetable')) {
          handleInputChange('goodsCategory', 'VEGETABLES');
          handleInputChange('productName', 'ताजी भाजीपाला (Fresh Vegetables)');
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceFeedback(language === 'mr' ? 'आवाज ऐकू आला नाही, पुन्हा प्रयत्न करा' : 'Voice not recognized, try again');
        setTimeout(() => setVoiceFeedback(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      setVoiceFeedback('Microphone permission required');
      setTimeout(() => setVoiceFeedback(null), 4000);
    }
  };

  const handleBookPickup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Check offline mode
    if (!isOnline) {
      saveOfflineShipment({
        trackingNumber: `GL-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`,
        productName: formData.productName,
        weightKg: Number(formData.weightKg),
        pickupLocation: formData.pickupLocation,
        destination: formData.destination,
        category: formData.goodsCategory,
        senderName: formData.entrepreneurName
      });
      setOfflineNotice(t('offlineSavedNotice'));
      setTimeout(() => setOfflineNotice(null), 8000);
      return;
    }

    const created = createShipment({
      senderName: currentUser.name,
      senderOrg: formData.entrepreneurName,
      senderPhone: currentUser.phone,
      productName: formData.productName,
      category: formData.goodsCategory,
      weightKg: Number(formData.weightKg),
      packageCount: Number(formData.packageCount),
      origin: {
        name: `${formData.village} Village Center`,
        district: formData.district,
        taluka: formData.taluka,
        village: formData.village,
        address: formData.pickupLocation,
        coordinates: { lat: 17.7420, lng: 73.1950 }
      },
      destination: {
        name: formData.destination,
        district: 'Ratnagiri',
        taluka: 'Khed',
        address: `${formData.destination}, APMC Yard`,
        coordinates: { lat: 17.7200, lng: 73.3900 }
      },
      transportType: selectedTransportMode,
      isReturnTrip: selectedTransportMode === 'RETURN'
    });

    setBookingSuccessMsg(`${created.trackingNumber} ${t('status_ORDER_CREATED')} • OTP: ${created.pickupOtp}`);
    setTimeout(() => setBookingSuccessMsg(null), 8000);
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reportingShipmentId) {
      reportShipmentProblem(reportingShipmentId, {
        type: disputeType,
        notes: disputeNotes || `Dispute logged on shipment ${reportingShipmentId}`
      });
      setDisputeSuccessMsg(`Ticket #GL-DISP-${Math.floor(1000 + Math.random() * 9000)} • ${t('disputeModalTitle')}`);
      setReportingShipmentId(null);
      setDisputeNotes('');
      setTimeout(() => setDisputeSuccessMsg(null), 6000);
    }
  };

  // Helper for 4-stage timeline
  const getTimelineStage = (status: string) => {
    switch (status) {
      case 'ORDER_CREATED':
      case 'POOL_SEARCHING':
      case 'POOL_CONFIRMED':
      case 'TRANSPORTER_ASSIGNED':
        return 1; // Booked
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 2; // Picked up
      case 'DELIVERED':
        return 4; // Delivered (OTP verified)
      default:
        return 2;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. TOP HEADER & GREETING */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#DCD8C8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-[#263238] font-display">
              {t('shgWorkspaceTitle')}
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E7EBD9] text-[#3B4B20] border border-[#CAD4B3]">
              {currentUser.village}, {currentUser.taluka}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5A6A64] mt-0.5">
            {currentUser.name} • {currentUser.organizationName || 'Prerna SHG'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('pooling')}
            className="tap-target px-4 py-2 rounded-xl bg-white hover:bg-[#F5F2E9] text-[#263238] border border-[#DCD8C8] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Layers className="w-4 h-4 text-[#556B2F]" />
            <span>{t('activePoolsCount', { count: pools.length })}</span>
          </button>
          <button
            onClick={() => onNavigate('tracking')}
            className="tap-target px-4 py-2 rounded-xl bg-white hover:bg-[#F5F2E9] text-[#263238] border border-[#DCD8C8] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Package className="w-4 h-4 text-[#C85A32]" />
            <span>{t('navTrackGoods')}</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY ACTION BUTTON */}
      <button
        onClick={() => {
          bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="tap-target w-full p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-[#556B2F] via-[#3B4B20] to-[#556B2F] hover:from-[#3B4B20] hover:to-[#263238] text-white shadow-lg transition-all transform hover:-translate-y-0.5 flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-[#CAD4B3]"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <TempoTruckIcon size={32} className="text-white" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold text-[#FDF3D8] uppercase tracking-wider block">
              {t('instantBookingBadge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
              {t('sendCargoTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-white/80">
              {t('sendCargoSub')}
            </p>
          </div>
        </div>

        <div className="tap-target px-6 py-3.5 rounded-2xl bg-[#E5A93C] hover:bg-[#F59E0B] text-[#263238] font-black text-sm uppercase tracking-wide flex items-center gap-2 shadow-sm shrink-0">
          <span>{t('bookNowBtn')}</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>

      {/* 3. HONEST STATS BELOW THE PRIMARY BUTTON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Shipments */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCD8C8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A6A64]">{t('kpiActiveShipments')}</span>
            <div className="p-1.5 rounded-xl bg-[#E7EBD9] text-[#556B2F]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#556B2F] font-display mt-2">
            {formatNumber(shipments.filter(s => s.status !== 'DELIVERED').length)}
          </div>
          <span className="text-[11px] text-[#556B2F] font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('liveTrackingOn')}
          </span>
        </div>

        {/* Empty KM Avoided */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCD8C8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A6A64]">{t('emptyKmSaved')}</span>
            <div className="p-1.5 rounded-xl bg-[#E7EBD9] text-[#556B2F]">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#263238] font-display mt-2">
            {formatNumber(honestMetrics.emptyKmAvoided)} km
          </div>
          <span className="text-[11px] text-[#5A6A64] mt-1 block font-medium">
            {formatNumber(honestMetrics.co2ReducedKg)} {t('co2Reduced')}
          </span>
        </div>

        {/* Pooled Shipments */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCD8C8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A6A64]">{t('pooledParcels')}</span>
            <div className="p-1.5 rounded-xl bg-[#FDF3D8] text-[#B45309]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#B45309] font-display mt-2">
            {formatNumber(shipments.filter(s => s.transportType === 'POOLED' || s.transportType === 'RETURN').length)}
          </div>
          <span className="text-[11px] text-[#5A6A64] mt-1 block font-medium">
            {t('sharedWithShgs', { count: honestMetrics.villageProducersCount })}
          </span>
        </div>

        {/* Money Saved */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCD8C8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A6A64]">{t('moneySaved')}</span>
            <div className="p-1.5 rounded-xl bg-[#F9EBE6] text-[#C85A32]">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#C85A32] font-display mt-2">
            ₹{formatNumber(honestMetrics.totalMoneySaved)}
          </div>
          <span className="text-[11px] text-[#556B2F] font-bold mt-1 block">
            {formatNumber(honestMetrics.avgSavingsPercent)}% {t('avgSavings')}
          </span>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {bookingSuccessMsg && (
        <div className="p-4 rounded-2xl bg-[#E7EBD9] border border-[#CAD4B3] text-[#3B4B20] text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#556B2F] shrink-0" />
            <span>{bookingSuccessMsg}</span>
          </div>
          <button 
            onClick={() => onNavigate('tracking')}
            className="tap-target px-4 py-2 bg-[#556B2F] text-white rounded-xl font-bold text-xs"
          >
            ट्रॅक करा
          </button>
        </div>
      )}

      {offlineNotice && (
        <div className="p-4 rounded-2xl bg-[#FDF3D8] border border-[#F6D58C] text-[#B45309] text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs">
          <WifiOff className="w-5 h-5 shrink-0 text-[#B45309]" />
          <span>{offlineNotice}</span>
        </div>
      )}

      {disputeSuccessMsg && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <span>{disputeSuccessMsg}</span>
        </div>
      )}

      {/* 4. RETURN-LOAD MATCHING BANNER (USP with 40% discount) */}
      {matchingReturnTrip && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#E7EBD9] via-[#FDF3D8] to-[#F5F2E9] border border-[#CAD4B3] flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#556B2F] text-white flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#556B2F] text-white font-bold text-[10px] uppercase tracking-wider">
                  {t('returnDiscountBadge')}
                </span>
                <span className="text-xs font-bold text-[#263238]">
                  {t('returnTempoAvailable')}
                </span>
              </div>
              <p className="text-xs text-[#5A6A64] mt-0.5">
                {t('routeLabel')}: <strong className="text-[#263238]">{matchingReturnTrip.originHub} → {matchingReturnTrip.destinationVillage}</strong> • {t('remainingSpace')}: {formatNumber(matchingReturnTrip.weightKg)} kg ({matchingReturnTrip.pickupWindow}).
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedTransportMode('RETURN')}
            className={`tap-target px-5 py-2.5 rounded-2xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 ${
              selectedTransportMode === 'RETURN'
                ? 'bg-[#3B4B20] text-white ring-2 ring-[#E5A93C]'
                : 'bg-[#556B2F] hover:bg-[#3B4B20] text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('applyReturnRate', { cost: formatNumber(costEstimate.returnTripCost) })}</span>
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/* 5. MAIN WORKSPACE: EASY MODE 3-STEP WIZARD + COST CALCULATOR       */}
      {/* ================================================================== */}
      <div ref={bookingSectionRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Easy Mode Wizard / Standard Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#DCD8C8] shadow-sm space-y-6">
          {/* Header & Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCD8C8] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E7EBD9] text-[#556B2F] flex items-center justify-center">
                <TempoTruckIcon size={22} className="text-[#556B2F]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#263238] font-display">
                  {isEasyMode ? t('easyBookingTitle') : t('standardBookingTitle')}
                </h3>
                <p className="text-xs text-[#5A6A64]">{t('perishablePrioritySub')}</p>
              </div>
            </div>

            {/* Easy Mode Toggle Button */}
            <div className="flex items-center gap-1.5 bg-[#F5F2E9] p-1 rounded-2xl border border-[#DCD8C8]">
              <button
                type="button"
                onClick={() => setIsEasyMode(true)}
                className={`tap-target px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  isEasyMode 
                    ? 'bg-[#556B2F] text-white shadow-xs' 
                    : 'text-[#5A6A64] hover:text-[#263238]'
                }`}
              >
                {t('easyModeButton')}
              </button>
              <button
                type="button"
                onClick={() => setIsEasyMode(false)}
                className={`tap-target px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  !isEasyMode 
                    ? 'bg-[#556B2F] text-white shadow-xs' 
                    : 'text-[#5A6A64] hover:text-[#263238]'
                }`}
              >
                {t('standardModeButton')}
              </button>
            </div>
          </div>

          {/* Web Speech API Microphone Banner */}
          <div className="p-3.5 rounded-2xl bg-[#FDF3D8] border border-[#F6D58C] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleStartVoiceInput}
                className={`tap-target w-10 h-10 rounded-full flex items-center justify-center transition shadow-xs ${
                  isListening 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : 'bg-[#B45309] text-white hover:bg-[#78350F]'
                }`}
                title={t('voiceAssistantTitle')}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div>
                <span className="text-xs font-bold text-[#78350F] block">
                  {t('voiceAssistantTitle')}:
                </span>
                <span className="text-[11px] text-[#78350F]/80">
                  {voiceFeedback || t('voicePrompt')}
                </span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* EASY MODE: 3-STEP WIZARD (What? > How much? > Where?)         */}
          {/* ------------------------------------------------------------- */}
          {isEasyMode ? (
            <div className="space-y-6">
              {/* Step Navigation Indicator */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { step: 1, title: t('easyStep1Title') },
                  { step: 2, title: t('easyStep2Title') },
                  { step: 3, title: t('easyStep3Title') },
                ].map(item => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setEasyStep(item.step as any)}
                    className={`tap-target p-2 rounded-2xl text-center border text-xs font-bold transition ${
                      easyStep === item.step
                        ? 'bg-[#E7EBD9] border-[#556B2F] text-[#3B4B20] ring-1 ring-[#556B2F]'
                        : easyStep > item.step
                        ? 'bg-white border-[#CAD4B3] text-[#556B2F]'
                        : 'bg-[#F5F2E9] border-[#DCD8C8] text-[#5A6A64]'
                    }`}
                  >
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>

              {/* STEP 1: WHAT? (काय पाठवायचे आहे?) */}
              {easyStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-[#263238]">{t('selectCargoPrompt')}</h4>
                    <p className="text-xs text-[#5A6A64]">{t('selectCargoSub')}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { 
                        id: 'PROCESSED_FOOD', 
                        label: t('cat_PROCESSED_FOOD'), 
                        sub: `3 ${t('hoursLeft', 'days')}`, 
                        icon: <KajuIcon size={28} className="text-[#B45309]" />,
                        cat: 'PROCESSED_FOOD',
                        prod: 'Cashews & Kokum'
                      },
                      { 
                        id: 'FISHERIES', 
                        label: t('cat_FISHERIES'), 
                        sub: `4 ${t('hoursLeft')}`, 
                        icon: <FishCatchIcon size={28} className="text-[#C85A32]" />,
                        cat: 'FISHERIES',
                        prod: 'Fresh Fish'
                      },
                      { 
                        id: 'FRUITS', 
                        label: t('cat_FRUITS'), 
                        sub: `12 ${t('hoursLeft')}`, 
                        icon: <MangoIcon size={28} className="text-[#E5A93C]" />,
                        cat: 'FRUITS',
                        prod: 'Alphonso Mango'
                      },
                      { 
                        id: 'VEGETABLES', 
                        label: t('cat_VEGETABLES'), 
                        sub: `12 ${t('hoursLeft')}`, 
                        icon: <ProduceIcon size={28} className="text-[#556B2F]" />,
                        cat: 'VEGETABLES',
                        prod: 'Fresh Vegetables'
                      },
                      { 
                        id: 'HANDICRAFTS', 
                        label: t('cat_HANDICRAFTS'), 
                        sub: t('unlimited'), 
                        icon: <HandicraftPotIcon size={28} className="text-[#263238]" />,
                        cat: 'HANDICRAFTS',
                        prod: 'Handicrafts'
                      },
                      { 
                        id: 'SPICES', 
                        label: t('cat_SPICES'), 
                        sub: `3 ${t('hoursLeft', 'days')}`, 
                        icon: <Package className="w-7 h-7 text-[#556B2F]" />,
                        cat: 'SPICES',
                        prod: 'Spices & Pickles'
                      },
                    ].map(item => {
                      const isSelected = formData.goodsCategory === item.cat;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            handleInputChange('goodsCategory', item.cat);
                            handleInputChange('productName', item.prod);
                          }}
                          className={`tap-target flex flex-col items-center justify-between p-4 rounded-2xl border text-center transition ${
                            isSelected
                              ? 'bg-[#E7EBD9] border-2 border-[#556B2F] shadow-sm'
                              : 'bg-white border-[#DCD8C8] hover:bg-[#F5F2E9]'
                          }`}
                        >
                          <div className="mb-2">{item.icon}</div>
                          <div>
                            <div className="font-bold text-xs text-[#263238]">{item.label}</div>
                            <div className="text-[10px] text-[#5A6A64] mt-0.5">{item.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setEasyStep(2)}
                      className="tap-target px-6 py-2.5 rounded-2xl bg-[#556B2F] hover:bg-[#3B4B20] text-white text-xs font-bold flex items-center gap-2"
                    >
                      <span>{t('nextSelectWeight')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: HOW MUCH? (किती वजन?) */}
              {easyStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-[#263238]">{t('approxWeightPrompt')}</h4>
                    <p className="text-xs text-[#5A6A64]">{t('approxWeightSub')}</p>
                  </div>

                  {/* Weight Quick Selector Chips */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {[20, 35, 50, 100, 200].map(wt => {
                      const isSelected = Number(formData.weightKg) === wt;
                      return (
                        <button
                          key={wt}
                          type="button"
                          onClick={() => handleInputChange('weightKg', wt)}
                          className={`tap-target p-3 rounded-2xl border text-center font-bold text-sm transition ${
                            isSelected
                              ? 'bg-[#556B2F] text-white border-[#556B2F] shadow-sm'
                              : 'bg-white text-[#263238] border-[#DCD8C8] hover:bg-[#F5F2E9]'
                          }`}
                        >
                          {formatNumber(wt)} kg
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Weight & Package Count */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-[#5A6A64] mb-1">{t('orExactWeight')}</label>
                      <input
                        type="number"
                        min="5"
                        max="2000"
                        value={formData.weightKg}
                        onChange={e => handleInputChange('weightKg', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F2E9] border border-[#DCD8C8] text-[#263238] font-bold text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5A6A64] mb-1">{t('packageBoxes')}</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.packageCount}
                        onChange={e => handleInputChange('packageCount', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F2E9] border border-[#DCD8C8] text-[#263238] font-bold text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setEasyStep(1)}
                      className="tap-target px-4 py-2.5 rounded-2xl border border-[#DCD8C8] text-[#263238] text-xs font-bold"
                    >
                      {t('backBtn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEasyStep(3)}
                      className="tap-target px-6 py-2.5 rounded-2xl bg-[#556B2F] hover:bg-[#3B4B20] text-white text-xs font-bold flex items-center gap-2"
                    >
                      <span>{t('nextSelectDest')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: WHERE? (कुठे पाठवायचे?) */}
              {easyStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-[#263238]">{t('whereToSendPrompt')}</h4>
                    <p className="text-xs text-[#5A6A64]">{t('whereToSendSub')}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { 
                        name: 'Khed Taluka Consolidation Hub', 
                        type: 'TALUKA_HUB', 
                        desc: `28 km • ${t('dest_TALUKA_HUB')}` 
                      },
                      { 
                        name: 'Chiplun Central Hub', 
                        type: 'DISTRICT_HUB', 
                        desc: `46 km • ${t('dest_DISTRICT_HUB')}` 
                      },
                      { 
                        name: 'Vashi Mandi APMC', 
                        type: 'MANDI_APMC', 
                        desc: `210 km • ${t('dest_MANDI_APMC')}` 
                      },
                      { 
                        name: 'Direct Commercial Buyer', 
                        type: 'BUYER', 
                        desc: t('dest_BUYER') 
                      },
                    ].map(dest => {
                      const isSelected = formData.destination === dest.name;
                      return (
                        <button
                          key={dest.name}
                          type="button"
                          onClick={() => {
                            handleInputChange('destination', dest.name);
                            handleInputChange('destinationType', dest.type);
                          }}
                          className={`tap-target flex flex-col items-start p-4 rounded-2xl border text-left transition ${
                            isSelected
                              ? 'bg-[#E7EBD9] border-2 border-[#556B2F] shadow-sm'
                              : 'bg-white border-[#DCD8C8] hover:bg-[#F5F2E9]'
                          }`}
                        >
                          <div className="font-bold text-xs text-[#263238]">{dest.name}</div>
                          <div className="text-[10px] text-[#5A6A64] mt-0.5">{dest.desc}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setEasyStep(2)}
                      className="tap-target px-4 py-2.5 rounded-2xl border border-[#DCD8C8] text-[#263238] text-xs font-bold"
                    >
                      {t('backBtn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBookPickup()}
                      className="tap-target px-7 py-3 rounded-2xl bg-[#556B2F] hover:bg-[#3B4B20] text-white text-sm font-bold flex items-center gap-2 shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      <span>{t('confirmBookingBtn')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ----------------------------------------------------------- */
            /* STANDARD DETAILED FORM                                      */
            /* ----------------------------------------------------------- */
            <form onSubmit={handleBookPickup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5A6A64] mb-1">
                  {t('entrepreneurName')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.entrepreneurName}
                  onChange={e => handleInputChange('entrepreneurName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F2E9] border border-[#DCD8C8] text-[#263238] text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#5A6A64] mb-1">{t('goodsCategory')}</label>
                  <select
                    value={formData.goodsCategory}
                    onChange={e => handleInputChange('goodsCategory', e.target.value as GoodsCategory)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F2E9] border border-[#DCD8C8] text-[#263238] text-sm outline-none"
                  >
                    <option value="FISHERIES">{t('cat_FISHERIES')} (4h)</option>
                    <option value="FRUITS">{t('cat_FRUITS')} (12h)</option>
                    <option value="VEGETABLES">{t('cat_VEGETABLES')} (12h)</option>
                    <option value="PROCESSED_FOOD">{t('cat_PROCESSED_FOOD')} (3d)</option>
                    <option value="HANDICRAFTS">{t('cat_HANDICRAFTS')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5A6A64] mb-1">{t('productName')}</label>
                  <input
                    type="text"
                    required
                    value={formData.productName}
                    onChange={e => handleInputChange('productName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F2E9] border border-[#DCD8C8] text-[#263238] text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#5A6A64] mb-1">{t('weightKg')}</label>
                  <input
                    type="number"
                    required
                    min="5"
                    value={formData.weightKg}
                    onChange={e => handleInputChange('weightKg', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F2E9] border border-[#DCD8C8] text-[#263238] text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5A6A64] mb-1">{t('packageCount')}</label>
                  <input
                    type="number"
                    required
                    value={formData.packageCount}
                    onChange={e => handleInputChange('packageCount', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F2E9] border border-[#DCD8C8] text-[#263238] text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A6A64] mb-1">{t('destination')}</label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={e => handleInputChange('destination', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F2E9] border border-[#DCD8C8] text-[#263238] text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                className="tap-target w-full py-3.5 rounded-2xl bg-[#556B2F] hover:bg-[#3B4B20] text-white font-bold text-sm shadow-md transition"
              >
                {t('confirmBookingBtn')}
              </button>
            </form>
          )}

          {/* PERISHABLE FRESHNESS DEADLINE ALERT */}
          <div className={`p-4 rounded-2xl border space-y-2 ${shelfLifeInfo.badgeClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 shrink-0" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  {t('freshnessCountdown')}:
                </span>
                <span className="font-mono font-black text-sm">
                  {shelfLifeInfo.shelfLifeHours ? `${formatCountdown(countdownMinutes)}` : t('unlimited')}
                </span>
              </div>

              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                shelfLifeInfo.urgency === 'URGENT' 
                  ? 'bg-red-600 text-white border-red-700' 
                  : shelfLifeInfo.urgency === 'TODAY' 
                  ? 'bg-amber-600 text-white border-amber-700' 
                  : 'bg-emerald-600 text-white border-emerald-700'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>{shelfLifeInfo.urgency === 'URGENT' ? '4h Urgent' : shelfLifeInfo.urgency === 'TODAY' ? '12h Today' : 'Flexible'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 3-Option Cost Calculator (Solo vs Pooled vs Return-trip) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-[#DCD8C8] shadow-sm space-y-5">
          <div className="border-b border-[#DCD8C8] pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6A64]">
              {t('costComparisonSub')}
            </span>
            <h3 className="text-lg font-black text-[#263238] font-display mt-0.5">
              {t('costComparisonTitle')}
            </h3>
          </div>

          <div className="space-y-3">
            {/* Option 1: Solo */}
            <div 
              onClick={() => setSelectedTransportMode('SOLO')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                selectedTransportMode === 'SOLO'
                  ? 'bg-[#F9EBE6] border-[#C85A32] shadow-xs'
                  : 'bg-white border-[#DCD8C8] hover:bg-[#F5F2E9]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#263238] block">{t('soloVehicleOption')}</span>
                  <span className="text-[11px] text-[#5A6A64]">{t('soloVehicleSub')}</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#263238] font-display">₹{formatNumber(costEstimate.soloCost)}</span>
                  <span className="text-[10px] text-red-700 block font-semibold">{t('fullFareBadge')}</span>
                </div>
              </div>
            </div>

            {/* Option 2: Pooled */}
            <div 
              onClick={() => setSelectedTransportMode('POOLED')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                selectedTransportMode === 'POOLED'
                  ? 'bg-[#E7EBD9] border-2 border-[#556B2F] shadow-sm ring-1 ring-[#556B2F]'
                  : 'bg-white border-[#DCD8C8] hover:bg-[#F5F2E9]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#3B4B20]">{t('pooledOption')}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#556B2F] text-white text-[9px] font-bold">
                      {formatNumber(58)}% {t('avgSavings')}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#5A6A64]">{t('pooledOptionSub')}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#556B2F] font-display">₹{formatNumber(costEstimate.pooledCost)}</span>
                  <span className="text-[10px] text-[#556B2F] block font-bold">+₹{formatNumber(costEstimate.potentialSavings)}</span>
                </div>
              </div>
            </div>

            {/* Option 3: Return-Trip (Backhaul) */}
            <div 
              onClick={() => setSelectedTransportMode('RETURN')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                selectedTransportMode === 'RETURN'
                  ? 'bg-[#FDF3D8] border-2 border-[#E5A93C] shadow-sm ring-1 ring-[#E5A93C]'
                  : 'bg-white border-[#DCD8C8] hover:bg-[#F5F2E9]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#B45309]">{t('returnBackhaulOption')}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#E5A93C] text-[#263238] text-[9px] font-black">
                      {t('extraDiscountBadge')}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#5A6A64]">{t('returnBackhaulSub')}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#B45309] font-display">₹{formatNumber(costEstimate.returnTripCost)}</span>
                  <span className="text-[10px] text-[#B45309] block font-bold">{t('bestSavingsBadge')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F5F2E9] border border-[#DCD8C8] text-xs text-[#5A6A64]">
            💡 {t('guaranteeNote')}
          </div>
        </div>
      </div>

      {/* 6. MY SHIPMENTS & 4-STAGE TIMELINE (Booked > Picked up > At Hub > Delivered) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DCD8C8] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#DCD8C8] pb-3">
          <div>
            <h3 className="text-lg font-black text-[#263238] font-display">{t('myBookedParcels')}</h3>
            <p className="text-xs text-[#5A6A64]">{t('myBookedSub')}</p>
          </div>
          <span className="text-xs font-bold text-[#556B2F] bg-[#E7EBD9] px-3 py-1 rounded-full">
            {formatNumber(shipments.length + offlineQueued.filter(q => q.syncStatus === 'PENDING_OFFLINE').length)} {t('parcelsRegistered')}
          </span>
        </div>

        {shipments.length === 0 && offlineQueued.filter(q => q.syncStatus === 'PENDING_OFFLINE').length === 0 ? (
          <div className="text-center py-12 text-[#5A6A64]">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-30 text-[#556B2F]" />
            <p className="text-sm font-bold">{t('noParcelsBooked')}</p>
            <p className="text-xs text-[#5A6A64] mt-1">{t('bookFirstPrompt')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Render offline queued bookings first */}
            {offlineQueued.filter(q => q.syncStatus === 'PENDING_OFFLINE').map(off => (
              <div 
                key={off.id}
                className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/50 space-y-4 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-900 text-sm">{off.trackingNumber}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300 font-bold text-[10px]">
                        {t('pendingSync')}
                      </span>
                    </div>
                    <h4 className="font-bold text-[#263238] text-sm mt-1">{off.productName} ({formatNumber(off.weightKg)} kg)</h4>
                    <div className="flex items-center gap-1.5 text-xs text-[#5A6A64] mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-700" />
                      <span>{off.pickupLocation} → {off.destination}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-amber-800">
                      {t('offlineSavedNotice')}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Render active online shipments */}
            {shipments.slice(0, 5).map(ship => {
              const currentStage = getTimelineStage(ship.status);

              return (
                <div 
                  key={ship.id}
                  className="p-5 rounded-2xl border border-[#DCD8C8] hover:border-[#556B2F] transition space-y-4 bg-white shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-[#556B2F] text-sm">{ship.trackingNumber}</span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E7EBD9] text-[#3B4B20]">
                          {t('status_' + ship.status)}
                        </span>
                        {ship.isReturnTrip && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF3D8] text-[#B45309]">
                            {t('badgeReturn')}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-[#263238] text-sm mt-1">{ship.productName} ({formatNumber(ship.weightKg)} kg)</h4>
                      <div className="flex items-center gap-1.5 text-xs text-[#5A6A64] mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#556B2F]" />
                        <span>{ship.origin.village} → {ship.destination.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-[#5A6A64] block">{t('totalFare')}</span>
                        <span className="text-lg font-black text-[#556B2F]">₹{formatNumber(ship.estimatedPooledCost)}</span>
                      </div>

                      <button
                        onClick={() => setReportingShipmentId(ship.id)}
                        className="tap-target px-3 py-1.5 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold transition flex items-center gap-1"
                        title={t('reportIssue')}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{t('reportIssue')}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4-STAGE TIMELINE: Booked > Picked up > At Hub > Delivered */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    {/* Stage 1: Booked */}
                    <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      currentStage >= 1 ? 'bg-[#E7EBD9] border-[#CAD4B3] text-[#3B4B20]' : 'bg-[#F5F2E9] text-[#5A6A64]'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold">{formatNumber(1)}</span>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${currentStage >= 1 ? 'text-[#556B2F]' : 'text-slate-300'}`} />
                      </div>
                      <div className="font-bold text-xs">{t('stageBooked')}</div>
                      <div className="text-[10px] text-[#5A6A64] mt-0.5">{ship.createdAt || '08:15 AM'}</div>
                    </div>

                    {/* Stage 2: Picked up */}
                    <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      currentStage >= 2 ? 'bg-[#E7EBD9] border-[#CAD4B3] text-[#3B4B20]' : 'bg-[#F5F2E9] text-[#5A6A64]'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold">{formatNumber(2)}</span>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${currentStage >= 2 ? 'text-[#556B2F]' : 'text-slate-300'}`} />
                      </div>
                      <div className="font-bold text-xs">{t('stagePickedUp')}</div>
                      <div className="text-[10px] text-[#556B2F] mt-0.5">OTP: {formatNumber(ship.pickupOtp || '4821')}</div>
                    </div>

                    {/* Stage 3: At Hub */}
                    <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      currentStage >= 3 ? 'bg-[#E7EBD9] border-[#CAD4B3] text-[#3B4B20]' : 'bg-[#F5F2E9] text-[#5A6A64]'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold">{formatNumber(3)}</span>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${currentStage >= 3 ? 'text-[#556B2F]' : 'text-slate-300'}`} />
                      </div>
                      <div className="font-bold text-xs">{t('stageAtHub')}</div>
                      <div className="text-[10px] text-[#5A6A64] mt-0.5">Khed APMC Hub</div>
                    </div>

                    {/* Stage 4: Delivered */}
                    <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      currentStage >= 4 ? 'bg-[#E7EBD9] border-[#CAD4B3] text-[#556B2F] font-bold' : 'bg-[#F5F2E9] text-[#5A6A64]'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold">{formatNumber(4)}</span>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${currentStage >= 4 ? 'text-[#556B2F]' : 'text-slate-300'}`} />
                      </div>
                      <div className="font-bold text-xs">{t('stageDelivered')}</div>
                      <div className="text-[10px] text-[#556B2F] mt-0.5">
                        {currentStage >= 4 ? 'OTP ✓' : `OTP: ${formatNumber(ship.deliveryOtp || '8204')}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#DCD8C8] text-xs">
                    <div className="text-[#5A6A64]">
                      {t('role_TRANSPORTER_DRIVER')}: <strong className="text-[#263238]">{ship.assignedTransporterName || 'Ramesh Kadam (Tata Ace)'}</strong>
                    </div>
                    <button
                      onClick={() => onNavigate('tracking')}
                      className="tap-target px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5F2E9] border border-[#DCD8C8] font-bold text-[#263238] flex items-center gap-1"
                    >
                      <span>{t('trackShipment')}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#5A6A64]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* REPORT PROBLEM MODAL */}
      {reportingShipmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#DCD8C8] shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#DCD8C8] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-[#263238]">{t('disputeModalTitle')}</h3>
              </div>
              <button
                onClick={() => setReportingShipmentId(null)}
                className="tap-target p-1 rounded-lg hover:bg-[#F5F2E9] text-[#5A6A64]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#263238] mb-1.5">{t('disputeModalTitle')}:</label>
                <select
                  value={disputeType}
                  onChange={e => setDisputeType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F2E9] border border-[#DCD8C8] text-[#263238] font-bold outline-none"
                >
                  <option value="DAMAGED">{t('disputeTypeDamaged')}</option>
                  <option value="DELAY">{t('disputeTypeDelay')}</option>
                  <option value="WRONG_WEIGHT">{t('disputeTypeWeight')}</option>
                  <option value="OTHER">{t('disputeTypeOther')}</option>
                </select>
              </div>

              <div>
                <textarea
                  rows={3}
                  value={disputeNotes}
                  onChange={e => setDisputeNotes(e.target.value)}
                  placeholder="Details..."
                  className="w-full p-2.5 rounded-xl border border-[#DCD8C8] text-[#263238] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingShipmentId(null)}
                  className="tap-target flex-1 py-2.5 rounded-xl bg-[#F5F2E9] border border-[#DCD8C8] font-bold text-[#263238]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="tap-target flex-1 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#A44320] text-white font-bold transition shadow-sm"
                >
                  {t('submitReport')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
