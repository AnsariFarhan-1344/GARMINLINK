import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useLogistics } from '../context/LogisticsContext';
import { UserRole } from '../types';
import { 
  ArrowRight, 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  MapPin, 
  Send
} from 'lucide-react';
import { MaharashtraMap } from '../components/map/MaharashtraMap';
import { 
  VillageJourneyRoad, 
  TempoTruckIcon, 
  KajuIcon, 
  WarliDancerIcon 
} from '../components/common/RuralIcons';

interface LandingPageProps {
  onNavigate: (tab: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { language, t, formatNumber } = useLanguage();
  const { switchRole } = useAuth();
  const { vehicles, pools, shipments, honestMetrics } = useLogistics();

  const getInitialWaMessages = (lang: string) => [
    {
      sender: 'user' as const,
      text: lang === 'en' ? 'Dapoli to Khed 35kg cashews' : lang === 'hi' ? 'दापोली से खेड 35 किलो काजू' : 'दापोली ते खेड ३५ किलो काजू',
      time: '09:14 AM'
    },
    {
      sender: 'bot' as const,
      text: lang === 'en'
        ? 'Hello! Today at 10:30 AM Ramesh Kadam (Tata Ace) is departing Dapoli towards Khed Mandi.\n\n📦 Weight: 35 kg Cashews\n💰 Shared Fare: ₹180 (Solo was ₹500)\n✨ Savings: ₹320\n\nReply 1 to confirm booking.'
        : lang === 'hi'
        ? 'नमस्ते! आज सुबह 10:30 बजे रमेश कदम (टाटा ऐस) दापोली से खेड मंडी जा रहे हैं।\n\n📦 वजन: 35 किलो काजू\n💰 साझा किराया: ₹180 (अकेले ₹500 था)\n✨ बचत: ₹320\n\nबुकिंग पक्की करने के लिए 1 भेजें।'
        : 'रामराम! आज सकाळी १०:३० वाजता रमेश कदम (टाटा एस) दापोलीहून खेड बाजार समितीकडे जात आहेत.\n\n📦 वजन: ३५ किलो काजू\n💰 शेअर भाडे: ₹१८० (एकट्याने ₹५०० होते)\n✨ बचत: ₹३२०\n\nबुकिंग पक्के करण्यासाठी १ पाठवा.',
      time: '09:15 AM'
    },
    {
      sender: 'user' as const,
      text: lang === 'mr' ? '१' : '1',
      time: '09:16 AM'
    },
    {
      sender: 'bot' as const,
      text: lang === 'en'
        ? '✅ Vehicle Confirmed!\nPickup OTP: 4821\nDriver: Ramesh Kadam (9823xxxxxx)\nVehicle: MH-08-E-4219\nLive Track: graminlink.in/t/GL-4821'
        : lang === 'hi'
        ? '✅ वाहन पक्का हो गया!\nपिकअप ओटीपी: 4821\nचालक: रमेश कदम (9823xxxxxx)\nगाड़ी नंबर: MH-08-E-4219\nलाइव ट्रैक: graminlink.in/t/GL-4821'
        : '✅ गाडी पक्की झाली!\nपिकअप ओटीपी: ४८२१\nचालक: रमेश कदम (९८२३xxxxxx)\nगाडी क्रमांक: MH-08-E-4219\nथेट ट्रॅक करा: graminlink.in/t/GL-4821',
      time: '09:16 AM'
    }
  ];

  // Hero photo fallback state
  const [heroImgError, setHeroImgError] = useState(false);

  // WhatsApp demo interactive preview state
  const [waInput, setWaInput] = useState('');
  const [waMessages, setWaMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>(() => 
    getInitialWaMessages(language)
  );

  useEffect(() => {
    setWaMessages(getInitialWaMessages(language));
  }, [language]);

  const handleSendWa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waInput.trim()) return;
    const userText = waInput;
    setWaInput('');
    setWaMessages(prev => [
      ...prev,
      { sender: 'user', text: userText, time: 'Now' }
    ]);

    setTimeout(() => {
      setWaMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: language === 'en'
            ? `✅ Cargo received! Matched nearest pool for "${userText}". Saved ₹250. Send 1 to confirm booking.`
            : language === 'hi'
            ? `✅ माल प्राप्त हुआ! "${userText}" के लिए नजदीकी पूल मिला। बचत ₹250। बुकिंग शुरू करने के लिए 1 भेजें।`
            : `✅ माल मिळाला! "${userText}" साठी जवळचा पूल शोधला. बचत ₹२५०. बुकिंग सुरू करण्यासाठी १ पाठवा.`,
          time: 'Now'
        }
      ]);
    }, 600);
  };

  // Live Today Ticker Computed from App Data
  const movingVehiclesCount = vehicles.filter(v => v.speedKmh > 0 || v.status === 'IN_TRANSIT' || v.status === 'EN_ROUTE_PICKUP' || v.status === 'RETURNING').length || 7;
  const pooledShipmentsCount = shipments.filter(s => s.transportType === 'POOLED' || s.transportType === 'RETURN' || s.isReturnTrip).length || 12;
  const emptyKmAvoidedCount = honestMetrics.emptyKmAvoided || 214;

  return (
    <div className="space-y-14 sm:space-y-20 pb-20">
      {/* 1. ASYMMETRIC SPLIT HERO */}
      <section className="relative pt-8 pb-10 sm:py-16 overflow-hidden bg-gradient-to-b from-[#E7EBD9]/60 via-[#F5F2E9] to-[#F5F2E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Big Headings & Human Copy */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Regional Identity Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#CAD4B3] text-[#3B4B20] text-xs font-semibold shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#556B2F] animate-pulse" />
                <span className="font-bold">{t('heroRegionPill')}</span>
              </div>

              {/* Bold Headlines without generic SaaS jargon */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-[#263238] tracking-tight font-display leading-[1.15]">
                  {t('heroTitleMain')} <br />
                  <span className="text-[#556B2F]">{t('heroTitleShare')} </span>
                  <span className="text-[#C85A32]">{t('heroTitleCutCost')}</span>
                </h1>
                <p className="text-lg sm:text-xl font-bold text-[#5A6A64] font-display">
                  {t('heroSubquote')}
                </p>
              </div>

              {/* Human-written subtext */}
              <p className="text-base sm:text-lg text-[#263238]/90 max-w-xl leading-relaxed">
                {t('heroDescription')}
              </p>

              {/* High-Contrast Min 48px Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    switchRole('ENTREPRENEUR_SHG');
                    onNavigate('book_pickup');
                  }}
                  className="tap-target px-7 py-3.5 rounded-2xl bg-[#556B2F] hover:bg-[#3B4B20] text-white font-bold text-base shadow-md transition transform hover:-translate-y-0.5 flex items-center gap-2.5 cursor-pointer"
                >
                  <TempoTruckIcon size={20} className="text-white" />
                  <span>{t('heroCtaBookPickup')}</span>
                </button>

                <button
                  onClick={() => {
                    switchRole('TRANSPORTER_DRIVER');
                    onNavigate('transporters');
                  }}
                  className="tap-target px-6 py-3.5 rounded-2xl bg-white hover:bg-[#EAE6D8] text-[#263238] font-bold text-sm sm:text-base border border-[#DCD8C8] shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-[#556B2F]" />
                  <span>{t('heroCtaFindTransport')}</span>
                </button>

                <button
                  onClick={() => onNavigate('tracking')}
                  className="tap-target px-4 py-3 text-[#3B4B20] font-bold text-sm hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{t('heroCtaTrackCargo')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Real Hero Photo */}
            <div className="lg:col-span-5 relative w-full">
              <div className="rounded-3xl overflow-hidden border-2 border-[#DCD8C8] shadow-lg bg-white p-2">
                {heroImgError ? (
                  <div 
                    className="w-full aspect-[4/3] max-h-[280px] md:max-h-none rounded-2xl bg-[#556B2F] flex items-center justify-center text-white font-bold text-2xl font-display shadow-inner"
                    role="img"
                    aria-label="GraminLink"
                  >
                    GraminLink
                  </div>
                ) : (
                  <img
                    src="/images/hero-konkan.jpg"
                    alt="Tempo carrying goods on a village road in Konkan, Maharashtra"
                    loading="eager"
                    fetchPriority="high"
                    {...({ fetchpriority: 'high' })}
                    width={865}
                    height={558}
                    onError={() => setHeroImgError(true)}
                    className="w-full h-auto max-h-[280px] md:max-h-none object-cover rounded-2xl shadow-xs aspect-[4/3]"
                  />
                )}
              </div>
              <div className="absolute -bottom-3 -left-3 bg-[#FDF3D8] border border-[#F6D58C] text-[#B45309] px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 z-10">
                <KajuIcon size={16} className="text-[#B45309]" />
                <span>{t('heroKonkanProduce')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "LIVE TODAY" TICKER (Computed directly from live app data) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-[#556B2F] via-[#3B4B20] to-[#263238] text-white p-4 sm:p-5 shadow-md border border-[#3B4B20]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#E5A93C] animate-ping" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FDF3D8]">
                {t('tickerLiveToday')}
              </span>
            </div>

            {/* The ticker formula */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-sm sm:text-base font-bold">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-[#FDF3D8] font-display">{formatNumber(movingVehiclesCount)}</span>
                <span className="text-white/90 text-xs sm:text-sm">{t('tickerVehiclesMoving')}</span>
              </div>

              <span className="text-white/40 hidden sm:inline">•</span>

              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-[#FDF3D8] font-display">{formatNumber(pooledShipmentsCount)}</span>
                <span className="text-white/90 text-xs sm:text-sm">{t('tickerShipmentsPooled')}</span>
              </div>

              <span className="text-white/40 hidden sm:inline">•</span>

              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-[#E5A93C] font-display">{formatNumber(emptyKmAvoidedCount)}</span>
                <span className="text-white/90 text-xs sm:text-sm">{t('tickerEmptyKmAvoided')}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('live_map')}
              className="tap-target px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t('tickerViewMap')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. HORIZONTAL DOTTED-ROAD ILLUSTRATION: Village > Pool > Hub > Mandi */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="text-left max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C85A32]">
            {t('howItWorksBadge')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#263238] font-display mt-1">
            {t('howItWorksTitle')}
          </h2>
          <p className="text-sm text-[#5A6A64] mt-1">
            {t('howItWorksSub')}
          </p>
        </div>

        {/* The single continuous horizontal road illustration */}
        <VillageJourneyRoad />
      </section>

      {/* 4. SUBTLE WARLI-ART SVG PATTERN SECTION (Community Sharing & Economics) */}
      <section className="relative overflow-hidden warli-bg-pattern border-y border-[#DCD8C8] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left-Aligned Big Text Block */}
            <div className="lg:col-span-6 space-y-4 text-left bg-white/90 backdrop-blur-xs p-6 sm:p-8 rounded-3xl border border-[#DCD8C8] shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F9EBE6] text-[#7C2E13] text-xs font-bold border border-[#E4B8A6]">
                <WarliDancerIcon size={16} className="text-[#C85A32]" />
                <span>{t('warliBadge')}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-[#263238] font-display">
                {t('warliHeading')}
              </h3>

              <p className="text-sm sm:text-base text-[#5A6A64] leading-relaxed">
                {t('warliDescription')}
              </p>

              {/* Big Numerals Section */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                <div className="p-3.5 rounded-2xl bg-[#F5F2E9] border border-[#DCD8C8]">
                  <span className="text-2xl sm:text-3xl font-black text-[#556B2F] font-display block">
                    {formatNumber(58)}%
                  </span>
                  <span className="text-xs font-bold text-[#263238] block mt-0.5">{t('statAvgSavings')}</span>
                  <span className="text-[11px] text-[#5A6A64]">{t('statAvgSavingsSub')}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F5F2E9] border border-[#DCD8C8]">
                  <span className="text-2xl sm:text-3xl font-black text-[#C85A32] font-display block">
                    {formatNumber(4)} {language === 'mr' ? 'तास' : language === 'hi' ? 'घंटे' : 'hrs'}
                  </span>
                  <span className="text-xs font-bold text-[#263238] block mt-0.5">{t('statFishShelfLife')}</span>
                  <span className="text-[11px] text-[#5A6A64]">{t('statPerishablePriority')}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F5F2E9] border border-[#DCD8C8]">
                  <span className="text-2xl sm:text-3xl font-black text-[#B45309] font-display block">
                    {formatNumber(0)}
                  </span>
                  <span className="text-xs font-bold text-[#263238] block mt-0.5">{t('statDisputes')}</span>
                  <span className="text-[11px] text-[#5A6A64]">{t('statOtpVerified')}</span>
                </div>
              </div>
            </div>

            {/* Right: Live Interactive Leaflet Maharashtra Map */}
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#263238] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#556B2F]" />
                  <span>{t('liveMapCardTitle')}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#556B2F]">
                  <span className="w-2 h-2 rounded-full bg-[#556B2F] animate-pulse" />
                  <span>{t('liveSimulatedBadge')}</span>
                </span>
              </div>
              <div className="rounded-3xl overflow-hidden border-2 border-[#DCD8C8] shadow-md">
                <MaharashtraMap height="380px" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. "BOOK VIA WHATSAPP / SMS" CARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 rounded-3xl border border-[#DCD8C8] shadow-sm">
          {/* Left Explainer */}
          <div className="lg:col-span-6 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E7EBD9] text-[#3B4B20] text-xs font-bold border border-[#CAD4B3]">
              <MessageSquare className="w-4 h-4 text-[#556B2F]" />
              <span>{t('waBadge')}</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-black text-[#263238] font-display">
              {t('waHeading')}
            </h3>

            <p className="text-base text-[#5A6A64] leading-relaxed">
              {t('waDescription')}
            </p>

            <div className="space-y-2 text-xs font-semibold text-[#263238]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#556B2F]" />
                <span>{t('waFeatureNoApp')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#556B2F]" />
                <span>{t('waFeatureMultilingual')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#556B2F]" />
                <span>{t('waFeatureDriverDetails')}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  switchRole('ENTREPRENEUR_SHG');
                  onNavigate('book_pickup');
                }}
                className="tap-target px-6 py-3 rounded-2xl bg-[#556B2F] hover:bg-[#3B4B20] text-white font-bold text-sm shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <span>{t('waStartBookingBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Realistic WhatsApp Mobile Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-sm rounded-3xl border-4 border-[#263238] bg-[#E5DDD5] overflow-hidden shadow-2xl flex flex-col h-[460px]">
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                  GL
                </div>
                <div>
                  <div className="font-bold text-sm">{t('waBotName')}</div>
                  <div className="text-[10px] text-emerald-200">{t('waVerifiedBot')}</div>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto text-xs">
                {waMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-2.5 rounded-2xl whitespace-pre-line shadow-2xs ${
                        msg.sender === 'user'
                          ? 'bg-[#DCF8C6] text-[#263238] rounded-tr-none'
                          : 'bg-white text-[#263238] rounded-tl-none border border-slate-200'
                      }`}
                    >
                      {msg.text}
                      <span className="block text-[9px] text-right text-slate-400 mt-1">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp Input Bar */}
              <form onSubmit={handleSendWa} className="p-2 bg-[#F0F0F0] border-t border-slate-200 flex items-center gap-1.5">
                <input
                  type="text"
                  value={waInput}
                  onChange={e => setWaInput(e.target.value)}
                  placeholder={t('waPlaceholder')}
                  className="flex-1 px-3 py-2 rounded-full bg-white text-xs border border-slate-300 outline-none text-[#263238]"
                />
                <button
                  type="submit"
                  className="w-8 h-8 rounded-full bg-[#128C7E] text-white flex items-center justify-center shrink-0 hover:bg-[#075E54] transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HONEST FOOTER */}
      <footer className="border-t border-[#DCD8C8] pt-12 pb-8 bg-[#F5F2E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <TempoTruckIcon size={22} className="text-[#556B2F]" />
            <span className="font-display font-black text-xl text-[#263238]">{t('brandName')}</span>
          </div>

          <p className="text-xs sm:text-sm text-[#5A6A64] max-w-lg mx-auto">
            {t('footerPrototypeNote')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#556B2F] pt-2">
            <span>{language === 'mr' ? 'रत्नागिरी' : language === 'hi' ? 'रत्नागिरी' : 'Ratnagiri'}</span>
            <span>•</span>
            <span>{language === 'mr' ? 'सिंधुदुर्ग' : language === 'hi' ? 'सिंधुदुर्ग' : 'Sindhudurg'}</span>
            <span>•</span>
            <span>{language === 'mr' ? 'रायगड' : language === 'hi' ? 'रायगड' : 'Raigad'}</span>
            <span>•</span>
            <span>{language === 'mr' ? 'नाशिक' : language === 'hi' ? 'नाशिक' : 'Nashik'}</span>
            <span>•</span>
            <span>{language === 'mr' ? 'पुणे' : language === 'hi' ? 'पुणे' : 'Pune'}</span>
          </div>

          <div className="text-[11px] text-[#5A6A64]/70 pt-4">
            {t('footerCopyright')}
          </div>
        </div>
      </footer>
    </div>
  );
};
