import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLogistics } from '../../context/LogisticsContext';
import { UserRole } from '../../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Bell, 
  Globe, 
  ChevronDown,
  Wifi,
  WifiOff,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { 
  TempoTruckIcon, 
  RuralWomanIcon, 
  FarmerIcon, 
  VillageHubIcon, 
  MandiBazaarIcon 
} from '../common/RuralIcons';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenSimulationLab?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const { currentRole, switchRole } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { simulation, startLogisticsSimulation, pauseLogisticsSimulation, resetLogisticsSimulation, notifications } = useLogistics();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Live network status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ENTREPRENEUR_SHG':
        return <RuralWomanIcon size={18} className="text-[#556B2F]" />;
      case 'FARMER':
        return <FarmerIcon size={18} className="text-[#C85A32]" />;
      case 'TRANSPORTER_DRIVER':
        return <TempoTruckIcon size={18} className="text-[#556B2F]" />;
      case 'HUB_MANAGER':
        return <VillageHubIcon size={18} className="text-[#B45309]" />;
      case 'MARKET_BUYER':
        return <MandiBazaarIcon size={18} className="text-[#556B2F]" />;
      case 'ADMIN':
        return <UserCheck size={18} className="text-[#263238]" />;
      default:
        return <RuralWomanIcon size={18} className="text-[#556B2F]" />;
    }
  };

  const roleColors: Record<UserRole, string> = {
    ENTREPRENEUR_SHG: 'text-[#3B4B20] bg-[#E7EBD9] border-[#CAD4B3]',
    FARMER: 'text-[#7C2E13] bg-[#F9EBE6] border-[#E4B8A6]',
    TRANSPORTER_DRIVER: 'text-[#3B4B20] bg-[#E7EBD9] border-[#CAD4B3]',
    HUB_MANAGER: 'text-[#78350F] bg-[#FDF3D8] border-[#F6D58C]',
    MARKET_BUYER: 'text-[#3B4B20] bg-[#E7EBD9] border-[#CAD4B3]',
    ADMIN: 'text-[#263238] bg-white border-[#DCD8C8]',
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F5F2E9] border-b border-[#DCD8C8] shadow-xs">
      {/* Simulation Live Top Progress Bar */}
      {simulation.currentStep > 0 && (
        <div className="w-full bg-[#EAE6D8] h-1.5 overflow-hidden">
          <div 
            className="h-full bg-[#556B2F] transition-all duration-500"
            style={{ width: `${simulation.progressPercent}%` }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3 py-2">
        {/* Brand Logo & Rural Konkan Identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#556B2F] flex items-center justify-center shadow-xs text-white shrink-0">
            <TempoTruckIcon size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#556B2F] font-display">
                {t('brandName')}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E7EBD9] text-[#556B2F] border border-[#CAD4B3] uppercase tracking-wide">
                {t('stateBadge')}
              </span>
            </div>
            <p className="text-xs text-[#5A6A64] hidden sm:block truncate max-w-md font-medium">
              {t('headerTagline')}
            </p>
          </div>
        </div>

        {/* Action Controls: Network Status, Live Story Demo, Persona, Language, Notifications */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Network Status Indicator & Clear Offline Badge */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold ${
              isOnline 
                ? 'bg-[#E7EBD9]/60 text-[#3B4B20] border-[#CAD4B3]' 
                : 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400'
            }`}
            title={isOnline ? 'Online with live GPS & cloud sync' : 'Offline Mode: Bookings saved locally to device'}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#556B2F] animate-pulse" />
                <Wifi className="w-3.5 h-3.5 text-[#556B2F]" />
                <span className="hidden sm:inline">{t('online')}</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <WifiOff className="w-4 h-4 text-amber-700" />
                <span className="font-extrabold text-amber-900">{t('offline')}</span>
              </>
            )}
          </div>

          {/* Scripted Story "Run Live Demo" Button */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-[#DCD8C8] shadow-2xs">
            <button
              onClick={simulation.isRunning ? pauseLogisticsSimulation : startLogisticsSimulation}
              className={`tap-target px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                simulation.isRunning
                  ? 'bg-[#E5A93C] text-white shadow-xs'
                  : 'bg-[#556B2F] hover:bg-[#3B4B20] text-white shadow-xs'
              }`}
            >
              {simulation.isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>{t('pause')}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t('runLiveDemo')}</span>
                </>
              )}
            </button>

            {simulation.currentStep > 0 && (
              <button
                onClick={resetLogisticsSimulation}
                className="p-1.5 text-[#5A6A64] hover:text-[#263238] rounded-lg hover:bg-[#F5F2E9] transition"
                title="Reset Simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Persona / Role Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className={`tap-target flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${roleColors[currentRole]}`}
            >
              <span>{renderRoleIcon(currentRole)}</span>
              <span className="hidden md:inline font-medium max-w-[130px] truncate">
                {t(`role_${currentRole}`)}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isRoleDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#DCD8C8] shadow-xl p-2 z-50"
                onMouseLeave={() => setIsRoleDropdownOpen(false)}
              >
                <div className="px-3 py-2 text-[11px] font-bold text-[#5A6A64] uppercase tracking-wider border-b border-[#DCD8C8]">
                  {t('switchPersona')}
                </div>
                <div className="space-y-1 mt-1.5">
                  {(['ENTREPRENEUR_SHG', 'FARMER', 'TRANSPORTER_DRIVER', 'HUB_MANAGER', 'MARKET_BUYER', 'ADMIN'] as UserRole[]).map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        switchRole(role);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition ${
                        currentRole === role
                          ? 'bg-[#E7EBD9] text-[#3B4B20] font-bold border border-[#CAD4B3]'
                          : 'text-[#263238] hover:bg-[#F5F2E9]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span>{renderRoleIcon(role)}</span>
                        <div>
                          <div className="font-semibold text-[#263238]">{t(`role_${role}`)}</div>
                          <div className="text-[10px] text-[#5A6A64]">
                            {role === 'ENTREPRENEUR_SHG' && 'Sunita Patil (Prerna SHG - Dapoli)'}
                            {role === 'FARMER' && 'Santosh Deshmukh (Nashik Agro)'}
                            {role === 'TRANSPORTER_DRIVER' && 'Ramesh Kadam (Tata Ace - Khed)'}
                            {role === 'HUB_MANAGER' && 'Vilas Shinde (Khed APMC Hub)'}
                            {role === 'MARKET_BUYER' && 'Rajesh Mehta (Vashi Wholesale)'}
                            {role === 'ADMIN' && 'Dr. Anjali Joshi (State Mission)'}
                          </div>
                        </div>
                      </div>
                      {currentRole === role && (
                        <span className="w-2 h-2 rounded-full bg-[#556B2F]"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Multilingual Switcher (EN / MR / HI) */}
          <div className="relative">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="tap-target flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5F2E9] border border-[#DCD8C8] text-xs font-semibold text-[#263238] transition"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#556B2F]" />
              <span className="uppercase font-bold">{language}</span>
              <ChevronDown className="w-3 h-3 text-[#5A6A64]" />
            </button>

            {isLangDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-36 rounded-xl bg-white border border-[#DCD8C8] shadow-xl p-1.5 z-50 text-xs"
                onMouseLeave={() => setIsLangDropdownOpen(false)}
              >
                <button
                  onClick={() => { setLanguage('en'); setIsLangDropdownOpen(false); }}
                  className={`w-full px-3 py-2 rounded-lg text-left flex items-center justify-between ${
                    language === 'en' ? 'bg-[#E7EBD9] text-[#3B4B20] font-bold' : 'text-[#263238] hover:bg-[#F5F2E9]'
                  }`}
                >
                  <span>English</span>
                  {language === 'en' && '✓'}
                </button>
                <button
                  onClick={() => { setLanguage('mr'); setIsLangDropdownOpen(false); }}
                  className={`w-full px-3 py-2 rounded-lg text-left flex items-center justify-between ${
                    language === 'mr' ? 'bg-[#E7EBD9] text-[#3B4B20] font-bold' : 'text-[#263238] hover:bg-[#F5F2E9]'
                  }`}
                >
                  <span>मराठी</span>
                  {language === 'mr' && '✓'}
                </button>
                <button
                  onClick={() => { setLanguage('hi'); setIsLangDropdownOpen(false); }}
                  className={`w-full px-3 py-2 rounded-lg text-left flex items-center justify-between ${
                    language === 'hi' ? 'bg-[#E7EBD9] text-[#3B4B20] font-bold' : 'text-[#263238] hover:bg-[#F5F2E9]'
                  }`}
                >
                  <span>हिंदी</span>
                  {language === 'hi' && '✓'}
                </button>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="tap-target relative p-2 rounded-xl bg-white hover:bg-[#F5F2E9] border border-[#DCD8C8] text-[#263238] transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-[#263238]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C85A32] text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
