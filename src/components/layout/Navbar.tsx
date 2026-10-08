import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { 
  Home,
  PlusCircle, 
  Package, 
  Truck, 
  MapPin, 
  ChevronDown,
  Layers, 
  Route, 
  Warehouse, 
  Store, 
  BarChart3, 
  Search,
  MoreHorizontal
} from 'lucide-react';
import { 
  TempoTruckIcon, 
  VillageHubIcon, 
  MandiBazaarIcon, 
  ProduceIcon 
} from '../common/RuralIcons';

export type NavTab = 
  | 'landing'
  | 'dashboard'
  | 'book_pickup'
  | 'pooling'
  | 'transporters'
  | 'live_map'
  | 'route_optimizer'
  | 'hubs'
  | 'markets'
  | 'analytics'
  | 'tracking';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { language, t } = useLanguage();
  const { currentRole } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Maximum 4 role-specific primary items
  const getRolePrimaryTabs = (role: UserRole): { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] => {
    switch (role) {
      case 'ENTREPRENEUR_SHG':
        return [
          { 
            id: 'landing', 
            label: t('navHome'), 
            icon: <Home className="w-4 h-4" /> 
          },
          { 
            id: 'book_pickup', 
            label: t('navSendCargo'), 
            icon: <PlusCircle className="w-4 h-4 text-[#556B2F]" />,
            badge: t('badgeEasy')
          },
          { 
            id: 'dashboard', 
            label: t('navMyShipments'), 
            icon: <Package className="w-4 h-4" /> 
          },
          { 
            id: 'transporters', 
            label: t('navFindTransport'), 
            icon: <TempoTruckIcon size={16} className="text-[#556B2F]" /> 
          },
        ];

      case 'FARMER':
        return [
          { 
            id: 'landing', 
            label: t('navHome'), 
            icon: <Home className="w-4 h-4" /> 
          },
          { 
            id: 'book_pickup', 
            label: t('navBookPickup'), 
            icon: <PlusCircle className="w-4 h-4 text-[#C85A32]" /> 
          },
          { 
            id: 'dashboard', 
            label: t('navMyHarvest'), 
            icon: <ProduceIcon size={16} className="text-[#C85A32]" /> 
          },
          { 
            id: 'transporters', 
            label: t('navLocalVehicles'), 
            icon: <TempoTruckIcon size={16} className="text-[#556B2F]" /> 
          },
        ];

      case 'TRANSPORTER_DRIVER':
        return [
          { 
            id: 'landing', 
            label: t('navHome'), 
            icon: <Home className="w-4 h-4" /> 
          },
          { 
            id: 'dashboard', 
            label: t('navMyTrips'), 
            icon: <TempoTruckIcon size={16} className="text-[#556B2F]" />,
            badge: t('badgeReturn')
          },
          { 
            id: 'pooling', 
            label: t('navAvailableCargo'), 
            icon: <Layers className="w-4 h-4 text-[#556B2F]" /> 
          },
          { 
            id: 'live_map', 
            label: t('navLiveMap'), 
            icon: <MapPin className="w-4 h-4 text-[#C85A32]" /> 
          },
        ];

      case 'HUB_MANAGER':
        return [
          { 
            id: 'landing', 
            label: t('navHome'), 
            icon: <Home className="w-4 h-4" /> 
          },
          { 
            id: 'dashboard', 
            label: t('navHubStorage'), 
            icon: <VillageHubIcon size={16} className="text-[#B45309]" /> 
          },
          { 
            id: 'pooling', 
            label: t('navSmartPools'), 
            icon: <Layers className="w-4 h-4 text-[#556B2F]" /> 
          },
          { 
            id: 'live_map', 
            label: t('navVehicles'), 
            icon: <MapPin className="w-4 h-4 text-[#556B2F]" /> 
          },
        ];

      case 'MARKET_BUYER':
        return [
          { 
            id: 'landing', 
            label: t('navHome'), 
            icon: <Home className="w-4 h-4" /> 
          },
          { 
            id: 'dashboard', 
            label: t('navIncomingGoods'), 
            icon: <Package className="w-4 h-4 text-[#556B2F]" /> 
          },
          { 
            id: 'markets', 
            label: t('navApmcMandis'), 
            icon: <MandiBazaarIcon size={16} className="text-[#556B2F]" /> 
          },
          { 
            id: 'tracking', 
            label: t('navTrackGoods'), 
            icon: <Search className="w-4 h-4 text-[#C85A32]" /> 
          },
        ];

      case 'ADMIN':
        return [
          { 
            id: 'landing', 
            label: t('navHome'), 
            icon: <Home className="w-4 h-4" /> 
          },
          { 
            id: 'dashboard', 
            label: t('navStateOps'), 
            icon: <Store className="w-4 h-4 text-[#556B2F]" /> 
          },
          { 
            id: 'live_map', 
            label: t('navLiveMap'), 
            icon: <MapPin className="w-4 h-4 text-[#C85A32]" /> 
          },
          { 
            id: 'analytics', 
            label: t('navAnalytics'), 
            icon: <BarChart3 className="w-4 h-4 text-[#556B2F]" /> 
          },
        ];

      default:
        return [
          { id: 'landing', label: t('navHome'), icon: <Home className="w-4 h-4" /> },
          { id: 'book_pickup', label: t('navSendCargo'), icon: <PlusCircle className="w-4 h-4" /> },
          { id: 'dashboard', label: t('navMyShipments'), icon: <Package className="w-4 h-4" /> },
          { id: 'transporters', label: t('navFindTransport'), icon: <TempoTruckIcon size={16} /> },
        ];
    }
  };

  const primaryTabs = getRolePrimaryTabs(currentRole);

  // All other tools go into "More" (अधिक सेवा)
  const moreTabs: { id: NavTab; label: string; desc: string; icon: React.ReactNode }[] = [
    { 
      id: 'pooling', 
      label: t('navPooling'), 
      desc: t('featurePoolingDesc'), 
      icon: <Layers className="w-4 h-4 text-[#556B2F]" /> 
    },
    { 
      id: 'tracking', 
      label: t('trackShipment'), 
      desc: t('featureTrackingDesc'), 
      icon: <Search className="w-4 h-4 text-[#C85A32]" /> 
    },
    { 
      id: 'live_map', 
      label: t('navLiveMap'), 
      desc: t('telemetrySubtitle'), 
      icon: <MapPin className="w-4 h-4 text-[#556B2F]" /> 
    },
    { 
      id: 'route_optimizer', 
      label: t('navRoutes'), 
      desc: t('featureRouteDesc'), 
      icon: <Route className="w-4 h-4 text-[#E5A93C]" /> 
    },
    { 
      id: 'hubs', 
      label: t('navHubs'), 
      desc: t('hubTaluka'), 
      icon: <Warehouse className="w-4 h-4 text-[#5A6A64]" /> 
    },
    { 
      id: 'markets', 
      label: t('navMarkets'), 
      desc: t('hubMandi'), 
      icon: <Store className="w-4 h-4 text-[#556B2F]" /> 
    },
    { 
      id: 'analytics', 
      label: t('navAnalytics'), 
      desc: t('kpiCostSaved'), 
      icon: <BarChart3 className="w-4 h-4 text-[#263238]" /> 
    },
  ];

  const isMoreActive = moreTabs.some(item => item.id === activeTab && !primaryTabs.some(p => p.id === activeTab));

  return (
    <>
      {/* Desktop & Tablet Top Navigation */}
      <nav className="bg-[#FBF8EE] border-b border-[#DCD8C8] sticky top-18 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-1.5">
            {/* Primary Nav Items (Max 4 Items for Current Role) */}
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1">
              {primaryTabs.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMoreOpen(false);
                    }}
                    className={`tap-target flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all min-h-[48px] ${
                      isActive
                        ? 'bg-[#E7EBD9] text-[#3B4B20] border border-[#CAD4B3] font-bold shadow-xs'
                        : 'text-[#5A6A64] hover:text-[#263238] hover:bg-[#F5F2E9]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isActive 
                          ? 'bg-[#556B2F] text-white' 
                          : 'bg-[#FDF3D8] text-[#B45309] border border-[#F6D58C]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* "More" (अधिक) Dropdown for Rare Tools */}
            <div className="relative">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`tap-target flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition min-h-[48px] ${
                  isMoreActive || isMoreOpen
                    ? 'bg-[#F9EBE6] text-[#7C2E13] border border-[#E4B8A6] font-bold'
                    : 'text-[#5A6A64] hover:text-[#263238] hover:bg-[#F5F2E9] border border-transparent'
                }`}
                title="More Tools"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span>{t('navMore')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMoreOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-[#DCD8C8] shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
                  onMouseLeave={() => setIsMoreOpen(false)}
                >
                  <div className="px-3 py-2 text-[11px] font-bold text-[#5A6A64] uppercase tracking-wider border-b border-[#DCD8C8]">
                    {t('navMore')}
                  </div>
                  <div className="space-y-1 mt-1.5 max-h-[380px] overflow-y-auto">
                    {moreTabs.map(item => {
                      const isSubActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onTabChange(item.id);
                            setIsMoreOpen(false);
                          }}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition ${
                            isSubActive
                              ? 'bg-[#E7EBD9] text-[#3B4B20] font-bold'
                              : 'text-[#263238] hover:bg-[#F5F2E9]'
                          }`}
                        >
                          <div className="mt-0.5 p-1.5 rounded-lg bg-white border border-[#DCD8C8]">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[#263238] text-xs">{item.label}</div>
                            <div className="text-[11px] text-[#5A6A64] truncate">{item.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Fixed Bottom Navigation (Min 48px Tap Targets, Icon + Label) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#DCD8C8] z-50 px-2 py-1 shadow-lg">
        <div className="grid grid-cols-4 gap-1">
          {primaryTabs.slice(0, 4).map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`tap-target flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-semibold transition ${
                  isActive
                    ? 'text-[#3B4B20] font-bold bg-[#E7EBD9]'
                    : 'text-[#5A6A64] hover:text-[#263238]'
                }`}
              >
                <div className="mb-0.5">{item.icon}</div>
                <span className="truncate max-w-[70px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
