import React from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  User,
  Camera,
  Check
} from 'lucide-react';
import { 
  TempoTruckIcon, 
  KajuIcon, 
  VillageHubIcon, 
  MandiBazaarIcon 
} from '../common/RuralIcons';

export const SimulationBanner: React.FC = () => {
  const { 
    simulation, 
    startLogisticsSimulation, 
    pauseLogisticsSimulation, 
    resetLogisticsSimulation,
    jumpToSimulationStep 
  } = useLogistics();
  const { language } = useLanguage();

  if (simulation.currentStep === 0) return null;

  // The explicit requested scripted story
  const storyScenes = [
    {
      num: 1,
      titleMr: 'सुनिताने काजू बुक केले',
      titleEn: 'Sunita books kaju',
      captionMr: 'दापोलीच्या सुनिता पाटील (प्रेरणा बचत गट) यांनी ३५ किलो प्रक्रिया केलेले काजू मुंबईच्या बाजारासाठी सकाळी १० वाजता नोंदवले. (एकट्याने टेम्पोचे भाडे ₹६५० होते).',
      captionEn: 'Sunita Patil (Prerna SHG, Dapoli) books 35 kg processed cashew nuts for wholesale delivery. (Solo tempo hire would cost ₹650).',
      badge: 'Scene 1: Booking',
      icon: <KajuIcon size={18} className="text-[#B45309]" />
    },
    {
      num: 2,
      titleMr: 'जवळचा पूल तयार झाला',
      titleEn: 'Pool forms',
      captionMr: 'प्रणालीने २५ किमी परिघात आनंद खातूंचे हापूस आंबे आणि कोकम सरबत शोधून एकत्र जोडले. एकाच गाडीत ५५ किलोचा संयुक्त पूल तयार झाला.',
      captionEn: 'System pools nearby mangoes and kokum within 25 km. A combined 55 kg pool forms, dropping cost to ₹260 (60% saved).',
      badge: 'Scene 2: Pooling',
      icon: <Sparkles className="w-4 h-4 text-[#556B2F]" />
    },
    {
      num: 3,
      titleMr: 'रमेशचा परतीचा टेम्पो जुळला',
      titleEn: "Ramesh's tempo matched",
      captionMr: 'खेडहून दापोलीकडे रिकामा परतणारा रमेश कदम यांचा टाटा एस (MH-08-E-4219) टेम्पो जुळला. रिकामी फेरी वाचल्याने ४०% परतीची थेट सूट मिळाली.',
      captionEn: "Ramesh Kadam's Tata Ace (MH-08-E-4219) returning empty toward Dapoli is matched with 94% fit, unlocking a 40% backhaul discount.",
      badge: 'Scene 3: Transporter',
      icon: <TempoTruckIcon size={18} className="text-[#556B2F]" />
    },
    {
      num: 4,
      titleMr: 'पिकअप व ४-अंकी ओटीपी',
      titleEn: 'Pickup OTP',
      captionMr: 'रमेश दापोलीत पोहोचले. सुनिताने ४-अंकी ओटीपी (4821) दिला, गोणीचा फोटो नोंदवला आणि टेम्पो खेडच्या दिशेने निघाला.',
      captionEn: 'Ramesh arrives at Dapoli. Sunita verifies 4-digit pickup OTP 4821, uploads cargo verification photo, and trip starts.',
      badge: 'Scene 4: Pickup Proof',
      icon: <ShieldCheck className="w-4 h-4 text-[#556B2F]" />
    },
    {
      num: 5,
      titleMr: 'खेड तालुका हब आगमन',
      titleEn: 'At Hub',
      captionMr: 'टेम्पो वेळेत खेड एपीएमसी संकलन हबवर पोहोचला. इतर २ तालुक्यांच्या मालासोबत पुढील मोठ्या गाडीत सुरक्षित एकत्रिकरण झाले.',
      captionEn: 'Tempo reaches Khed APMC consolidation hub on schedule. Cargo consolidated with regional loads for onward trunk movement.',
      badge: 'Scene 5: Hub Consolidation',
      icon: <VillageHubIcon size={18} className="text-[#B45309]" />
    },
    {
      num: 6,
      titleMr: 'वाशी मंडईत सुरक्षित वितरण',
      titleEn: 'Delivered',
      captionMr: 'वाशी घाऊक बाजारात खरेदीदाराने डिलिव्हरी ओटीपी (8204) दिल्यावर माल स्वाधीन झाला. सुनिताच्या खात्यात पैसे जमा, शून्य वाद, शून्य नासाडी!',
      captionEn: 'At Vashi Mandi wholesale yard, receiver enters delivery OTP 8204 to accept cargo. Zero dispute, fresh condition, zero empty km wasted!',
      badge: 'Scene 6: Delivery Handover',
      icon: <MandiBazaarIcon size={18} className="text-[#3B4B20]" />
    }
  ];

  // Map 1-9 simulation step into 1-6 narrative scene
  const currentSceneIndex = Math.min(storyScenes.length - 1, Math.max(0, Math.floor((simulation.currentStep - 1) * (storyScenes.length / 9))));
  const activeScene = storyScenes[currentSceneIndex] || storyScenes[0];

  return (
    <div className="bg-[#E7EBD9] border-b-2 border-[#CAD4B3] p-4 sm:p-5 shadow-md">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#556B2F] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#3B4B20]">
                  {language === 'mr' ? 'थेट प्रात्यक्षिक कथा (Scripted Live Story)' : 'Scripted Live Story Simulation'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#556B2F] border border-[#CAD4B3]">
                  {activeScene.badge}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#263238] font-display mt-0.5">
                {language === 'mr' ? activeScene.titleMr : activeScene.titleEn}
              </h3>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={simulation.isRunning ? pauseLogisticsSimulation : startLogisticsSimulation}
              className={`tap-target px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                simulation.isRunning
                  ? 'bg-[#E5A93C] text-white'
                  : 'bg-[#556B2F] hover:bg-[#3B4B20] text-white'
              }`}
            >
              {simulation.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{simulation.isRunning ? 'थांबवा (Pause)' : 'सुरू ठेवा (Play)'}</span>
            </button>

            <button
              onClick={resetLogisticsSimulation}
              className="tap-target px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#F5F2E9] text-[#263238] border border-[#DCD8C8] transition flex items-center gap-1 shadow-2xs"
              title="पुन्हा सुरू करा"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#5A6A64]" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Big On-Screen Story Narrative Caption */}
        <div className="p-4 rounded-2xl bg-white border border-[#CAD4B3] shadow-xs">
          <p className="text-sm sm:text-base font-semibold text-[#263238] leading-relaxed">
            {language === 'mr' ? activeScene.captionMr : activeScene.captionEn}
          </p>
        </div>

        {/* 6 Scripted Story Milestones Breadcrumb */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {storyScenes.map((scene, idx) => {
            const isDone = currentSceneIndex > idx;
            const isCurrent = currentSceneIndex === idx;

            return (
              <button
                key={scene.num}
                onClick={() => jumpToSimulationStep(Math.round(((idx + 1) / storyScenes.length) * 9))}
                className={`tap-target p-2.5 rounded-xl text-left transition-all text-xs flex flex-col justify-between border ${
                  isCurrent
                    ? 'bg-[#556B2F] text-white border-[#3B4B20] shadow-sm font-bold'
                    : isDone
                    ? 'bg-white text-[#263238] border-[#CAD4B3]'
                    : 'bg-white/60 text-[#5A6A64] border-[#DCD8C8]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono ${isCurrent ? 'text-white/80' : 'text-[#5A6A64]'}`}>
                    0{scene.num}
                  </span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-[#556B2F]" />}
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-[#E5A93C] animate-ping" />}
                </div>
                <div className="truncate font-semibold text-[11px]">
                  {language === 'mr' ? scene.titleMr : scene.titleEn}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
