import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface IconProps {
  className?: string;
  size?: number;
}

// 1. Tempo Truck Icon (Tata Ace / Chhota Hathi)
export const TempoTruckIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 13V6a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v7" />
    <path d="M15 8h4l3 3v2h-7V8z" />
    <path d="M2 13h20v2H2z" />
    <circle cx="6.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
    <path d="M9 17.5h6" />
    <path d="M2 17.5h2" />
    <path d="M20 17.5h2" />
  </svg>
);

// 2. Kaju / Cashew Nut & Apple Icon (Konkan Specialty)
export const KajuIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Cashew apple */}
    <path d="M9 4c2.5-1.5 5.5-1.5 8 0 2 1.5 3 4 2.5 7-.6 3.5-3 6.5-6.5 7-3.5-.5-6-3.5-6.5-7-.4-3 .5-5.5 2.5-7z" fill="currentColor" fillOpacity="0.12" />
    {/* Stem */}
    <path d="M13 2c-.5 1-1.2 1.8-2 2" />
    {/* Cashew nut below */}
    <path d="M9.5 17.5c1.2 1.5 1.5 3.5.5 4.5s-3 .2-4-1.2-1.2-3.2-.2-4.2c1.2-1.2 2.8-.5 3.7.9z" fill="currentColor" fillOpacity="0.25" />
  </svg>
);

// 3. Alphonso Mango Icon
export const MangoIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 3c-1 1-1.5 2-1.2 3.2" />
    <path d="M12 3c1.5.5 3.5 1.2 4 3 .8 2.5-.2 4-1 5" />
    <path d="M11 6.5C6.5 8 5 13 7.5 17.5 10 22 16.5 22 19 18c2.8-4.5 1-10.5-4-12-1.5-.5-3-.3-4 .5z" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

// 4. Fish / Marine Catch Icon
export const FishCatchIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 13c3.5-5 11-6.5 16-2 1.5 1.4 3 2.5 4 2.5-1 1-2.5 2.1-4 3.5-5 4.5-12.5 3-16-2z" fill="currentColor" fillOpacity="0.15" />
    <path d="M18 11l4-5v10l-4-5z" />
    <circle cx="6.5" cy="12.5" r="1" fill="currentColor" />
  </svg>
);

// 5. Fresh Produce / Vegetables Icon
export const ProduceIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 21a8 8 0 0 0 8-8c0-4-3-8-8-10-5 2-8 6-8 10a8 8 0 0 0 8 8z" fill="currentColor" fillOpacity="0.12" />
    <path d="M12 3v18" />
    <path d="M12 11c2.5-1 4.5-3 5-5" />
    <path d="M12 15c-2.5-1-4.5-3-5-5" />
  </svg>
);

// 6. APMC Mandi / Bazaar Stall Icon
export const MandiBazaarIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 9l9-6 9 6v2H3V9z" fill="currentColor" fillOpacity="0.15" />
    <path d="M4 11v9h16v-9" />
    <path d="M9 20v-5h6v5" />
    <path d="M2 20h20" />
    <path d="M8 11v3" />
    <path d="M16 11v3" />
  </svg>
);

// 7. Village Collection Point / Hub Icon
export const VillageHubIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 21h18" />
    <path d="M5 21V10l7-5 7 5v11" fill="currentColor" fillOpacity="0.1" />
    <circle cx="12" cy="14" r="2.5" />
    <path d="M12 16.5V19" />
    <path d="M9.5 14H7" />
    <path d="M17 14h-2.5" />
  </svg>
);

// 8. Rural Woman Entrepreneur / SHG Leader Icon
export const RuralWomanIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="7" r="4" fill="currentColor" fillOpacity="0.15" />
    <path d="M6 21v-3a5 5 0 0 1 10 0v3" />
    <path d="M15 5c1 1.5 2.5 1.5 3 0" />
    <circle cx="12" cy="7" r="1" fill="currentColor" />
  </svg>
);

// 9. Rural Farmer Icon
export const FarmerIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 9c2-2 12-2 14 0" />
    <circle cx="12" cy="8" r="3.5" fill="currentColor" fillOpacity="0.15" />
    <path d="M6 21v-4a5 5 0 0 1 10 0v4" />
    <path d="M19 14l2 7" />
    <path d="M18 16h4" />
  </svg>
);

// 10. Handicraft / Pottery Artisan Icon
export const HandicraftPotIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <ellipse cx="12" cy="5" rx="5" ry="2" />
    <path d="M7 5v2c0 2-2 4-2 7 0 4.5 3.1 7 7 7s7-2.5 7-7c0-3-2-5-2-7V5" fill="currentColor" fillOpacity="0.12" />
    <path d="M6 13h12" />
  </svg>
);

// 11. Warli Folk Art Motif (Single Dancing Figure)
export const WarliDancerIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <circle cx="12" cy="4" r="2.2" />
    <polygon points="12,6.5 8,13 16,13" />
    <polygon points="12,13 7.5,19.5 16.5,19.5" />
    <line x1="8" y1="10" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" />
    <line x1="16" y1="10" x2="21" y2="7" stroke="currentColor" strokeWidth="1.5" />
    <line x1="9" y1="19.5" x2="6" y2="23" stroke="currentColor" strokeWidth="1.5" />
    <line x1="15" y1="19.5" x2="18" y2="23" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// ============================================================================
// 12. ASYMMETRIC HERO SVG ILLUSTRATION (Konkan Red Soil Road, Tempo, Cashew Trees, Sahyadri)
// ============================================================================
export const KonkanHeroIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-auto' }) => (
  <svg 
    viewBox="0 0 540 400" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    role="img"
    aria-label="Konkan village logistics illustration"
  >
    {/* Sky with soft morning warmth */}
    <rect width="540" height="400" rx="24" fill="#FBF8EE" />

    {/* Sahyadri Mountains / Hills in background */}
    <path d="M0 240 Q90 150 200 210 T400 180 T540 230 L540 400 L0 400 Z" fill="#E7EBD9" />
    <path d="M0 270 Q140 200 270 250 T540 240 L540 400 L0 400 Z" fill="#D3DCBA" />

    {/* Red Soil Konkan Earth Layer */}
    <path d="M0 310 Q160 270 320 300 T540 290 L540 400 L0 400 Z" fill="#C85A32" fillOpacity="0.25" />

    {/* Winding Village Road (NH-66 / Coastal rural link) */}
    <path d="M40 400 C120 340 180 320 280 310 C380 300 450 285 520 275" stroke="#EAE6D8" strokeWidth="60" strokeLinecap="round" />
    <path d="M40 400 C120 340 180 320 280 310 C380 300 450 285 520 275" stroke="#C85A32" strokeWidth="48" strokeLinecap="round" />
    
    {/* Road center dotted dash line */}
    <path 
      d="M40 400 C120 340 180 320 280 310 C380 300 450 285 520 275" 
      stroke="#FDF3D8" 
      strokeWidth="3" 
      strokeDasharray="10 12" 
      strokeLinecap="round" 
    />

    {/* Coconut Palms / Betelnut (Supari) Trees Left */}
    <g transform="translate(45, 120)">
      {/* Trunk */}
      <path d="M25 150 Q30 70 20 0" stroke="#7C2E13" strokeWidth="5" strokeLinecap="round" />
      {/* Fronds */}
      <path d="M20 0 Q-15 -10 -30 20" stroke="#556B2F" strokeWidth="3" fill="none" />
      <path d="M20 0 Q-5 -30 15 -45" stroke="#556B2F" strokeWidth="3" fill="none" />
      <path d="M20 0 Q40 -35 60 -15" stroke="#556B2F" strokeWidth="3" fill="none" />
      <path d="M20 0 Q55 5 70 30" stroke="#556B2F" strokeWidth="3" fill="none" />
      <path d="M20 0 Q5 -15 -10 -25" stroke="#708A3E" strokeWidth="2.5" fill="none" />
    </g>

    <g transform="translate(85, 150) scale(0.8)">
      <path d="M25 140 Q15 65 20 0" stroke="#7C2E13" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M20 0 Q-20 -15 -35 15" stroke="#556B2F" strokeWidth="3" fill="none" />
      <path d="M20 0 Q20 -40 35 -40" stroke="#556B2F" strokeWidth="3" fill="none" />
      <path d="M20 0 Q55 -20 65 10" stroke="#556B2F" strokeWidth="3" fill="none" />
    </g>

    {/* Cashew (Kaju) Orchard Tree on Right */}
    <g transform="translate(430, 180)">
      {/* Foliage canopy */}
      <ellipse cx="40" cy="40" rx="55" ry="42" fill="#556B2F" />
      <ellipse cx="25" cy="30" rx="35" ry="28" fill="#708A3E" />
      {/* Tree trunk */}
      <path d="M40 70 L40 110" stroke="#5A3E26" strokeWidth="9" strokeLinecap="round" />
      <path d="M36 82 L20 95" stroke="#5A3E26" strokeWidth="4" strokeLinecap="round" />
      {/* Hanging red/yellow Cashew fruits */}
      <circle cx="20" cy="45" r="4.5" fill="#E5A93C" />
      <circle cx="50" cy="52" r="4.5" fill="#C85A32" />
      <circle cx="65" cy="38" r="4.5" fill="#E5A93C" />
    </g>

    {/* Small Konkan Clay Tile Hut (Kaularu Ghar) */}
    <g transform="translate(350, 220)">
      <polygon points="35,0 70,22 0,22" fill="#C85A32" />
      <rect x="8" y="22" width="54" height="28" fill="#FDF3D8" stroke="#DCD8C8" strokeWidth="1" />
      <rect x="28" y="32" width="14" height="18" fill="#7C2E13" />
      <rect x="14" y="27" width="8" height="8" fill="#E5A93C" />
    </g>

    {/* Tata Ace Tempo Truck Moving on the Road */}
    <g transform="translate(160, 280)">
      {/* Vehicle Body Shadow */}
      <ellipse cx="90" cy="72" rx="85" ry="10" fill="#263238" fillOpacity="0.25" />

      {/* Cargo Bay (Olive Green with Wooden Side Railings) */}
      <rect x="0" y="10" width="105" height="42" rx="4" fill="#556B2F" />
      <line x1="0" y1="24" x2="105" y2="24" stroke="#3B4B20" strokeWidth="2.5" />
      <line x1="0" y1="38" x2="105" y2="38" stroke="#3B4B20" strokeWidth="2.5" />

      {/* Crates of Kaju & Mangoes in Bay */}
      <rect x="8" y="-6" width="26" height="18" rx="2" fill="#E5A93C" stroke="#B45309" strokeWidth="1.5" />
      <rect x="36" y="-12" width="30" height="24" rx="2" fill="#D3DCBA" stroke="#556B2F" strokeWidth="1.5" />
      <rect x="68" y="-4" width="28" height="16" rx="2" fill="#C85A32" stroke="#7C2E13" strokeWidth="1.5" />

      {/* "GraminLink" text badge on side of tempo */}
      <rect x="18" y="27" width="68" height="14" rx="2" fill="#FFFFFF" />
      <text x="24" y="38" fill="#556B2F" fontSize="8" fontWeight="bold" fontFamily="sans-serif">GRAMINLINK</text>

      {/* Driver Cabin */}
      <path d="M105 15 L145 15 Q158 15 162 26 L168 38 Q170 42 170 48 L170 52 L105 52 Z" fill="#FDF3D8" stroke="#DCD8C8" strokeWidth="1.5" />
      {/* Front Windshield */}
      <path d="M125 19 L146 19 L156 36 L125 36 Z" fill="#B0C4DE" />
      {/* Driver Silhouette */}
      <circle cx="135" cy="28" r="4.5" fill="#263238" />
      {/* Headlight */}
      <circle cx="166" cy="45" r="3.5" fill="#E5A93C" />
      <path d="M169 45 L195 40 L195 52 Z" fill="#FDF3D8" fillOpacity="0.4" />

      {/* Wheels */}
      <circle cx="36" cy="55" r="14" fill="#263238" />
      <circle cx="36" cy="55" r="6" fill="#DCD8C8" />
      <circle cx="140" cy="55" r="14" fill="#263238" />
      <circle cx="140" cy="55" r="6" fill="#DCD8C8" />

      {/* Motion Wind Lines */}
      <path d="M-15 22 L-35 22" stroke="#556B2F" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
      <path d="M-10 36 L-45 36" stroke="#C85A32" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
    </g>

    {/* Subtle Warli decorative border bottom */}
    <g transform="translate(20, 385)">
      {[0, 45, 90, 135, 180, 225, 270, 315, 360, 405, 450, 495].map((x) => (
        <polygon key={x} points={`${x},0 ${x+8},6 ${x},12`} fill="#C85A32" fillOpacity="0.35" />
      ))}
    </g>
  </svg>
);

// ============================================================================
// 13. HORIZONTAL DOTTED-ROAD ILLUSTRATION (Village > Pool > Hub > Mandi)
// ============================================================================
export const VillageJourneyRoad: React.FC<{ className?: string }> = ({ className = 'w-full' }) => {
  const { t } = useLanguage();

  return (
    <div className={`p-6 sm:p-8 rounded-3xl bg-white border border-[#DCD8C8] shadow-xs ${className}`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
        {/* Connecting Dotted Road Line on Desktop */}
        <div className="hidden md:block absolute top-12 left-16 right-16 h-1 border-t-2 border-dashed border-[#556B2F]/40 -z-0" />

        {/* Step 1: Village */}
        <div className="flex flex-col items-center text-center relative z-10 w-full md:w-1/4">
          <div className="w-16 h-16 rounded-2xl bg-[#F9EBE6] border-2 border-[#C85A32] flex items-center justify-center text-[#C85A32] shadow-sm mb-3">
            <VillageHubIcon size={28} className="text-[#C85A32]" />
          </div>
          <span className="text-[11px] font-mono font-bold text-[#C85A32] uppercase tracking-wider">{t('roadStep1Pill')}</span>
          <h4 className="font-bold text-base text-[#263238] mt-0.5">{t('roadStep1Title')}</h4>
          <p className="text-xs text-[#5A6A64] mt-1 max-w-[190px]">
            {t('roadStep1Desc')}
          </p>
        </div>

        {/* Step 2: Pool */}
        <div className="flex flex-col items-center text-center relative z-10 w-full md:w-1/4">
          <div className="w-16 h-16 rounded-2xl bg-[#FDF3D8] border-2 border-[#E5A93C] flex items-center justify-center text-[#B45309] shadow-sm mb-3">
            <ProduceIcon size={28} className="text-[#B45309]" />
          </div>
          <span className="text-[11px] font-mono font-bold text-[#B45309] uppercase tracking-wider">{t('roadStep2Pill')}</span>
          <h4 className="font-bold text-base text-[#263238] mt-0.5">{t('roadStep2Title')}</h4>
          <p className="text-xs text-[#5A6A64] mt-1 max-w-[190px]">
            {t('roadStep2Desc')}
          </p>
        </div>

        {/* Step 3: Hub */}
        <div className="flex flex-col items-center text-center relative z-10 w-full md:w-1/4">
          <div className="w-16 h-16 rounded-2xl bg-[#E7EBD9] border-2 border-[#556B2F] flex items-center justify-center text-[#556B2F] shadow-sm mb-3">
            <TempoTruckIcon size={28} className="text-[#556B2F]" />
          </div>
          <span className="text-[11px] font-mono font-bold text-[#556B2F] uppercase tracking-wider">{t('roadStep3Pill')}</span>
          <h4 className="font-bold text-base text-[#263238] mt-0.5">{t('roadStep3Title')}</h4>
          <p className="text-xs text-[#5A6A64] mt-1 max-w-[190px]">
            {t('roadStep3Desc')}
          </p>
        </div>

        {/* Step 4: Mandi */}
        <div className="flex flex-col items-center text-center relative z-10 w-full md:w-1/4">
          <div className="w-16 h-16 rounded-2xl bg-[#E7EBD9] border-2 border-[#3B4B20] flex items-center justify-center text-[#3B4B20] shadow-sm mb-3">
            <MandiBazaarIcon size={28} className="text-[#3B4B20]" />
          </div>
          <span className="text-[11px] font-mono font-bold text-[#3B4B20] uppercase tracking-wider">{t('roadStep4Pill')}</span>
          <h4 className="font-bold text-base text-[#263238] mt-0.5">{t('roadStep4Title')}</h4>
          <p className="text-xs text-[#5A6A64] mt-1 max-w-[190px]">
            {t('roadStep4Desc')}
          </p>
        </div>
      </div>
    </div>
  );
};
