import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogisticsProvider, useLogistics } from './context/LogisticsContext';
import { LocationProvider } from './context/LocationContext';
import { LocationPermissionModal } from './components/location/LocationPermissionModal';
import { Header } from './components/layout/Header';
import { Navbar, NavTab } from './components/layout/Navbar';
import { SimulationBanner } from './components/simulation/SimulationBanner';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { GaadiSahayakProvider } from './context/GaadiSahayakContext';
import { FloatingMicButton } from './components/assistant/FloatingMicButton';
import { GaadiSahayakModal } from './components/assistant/GaadiSahayakModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { EntrepreneurDashboard } from './pages/EntrepreneurDashboard';
import { FarmerDashboard } from './pages/FarmerDashboard';
import { TransporterDashboard } from './pages/TransporterDashboard';
import { HubDashboard } from './pages/HubDashboard';
import { MarketBuyerDashboard } from './pages/MarketBuyerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { PoolingPage } from './pages/PoolingPage';
import { TransportersPage } from './pages/TransportersPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { RouteOptimizerPage } from './pages/RouteOptimizerPage';
import { HubsPage } from './pages/HubsPage';
import { MarketsPage } from './pages/MarketsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TrackingPage } from './pages/TrackingPage';

const MainLayout: React.FC = () => {
  const { currentRole } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<NavTab>('landing');
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);

  const renderDashboardByRole = () => {
    switch (currentRole) {
      case 'ENTREPRENEUR_SHG':
        return <EntrepreneurDashboard onNavigate={setActiveTab} />;
      case 'FARMER':
        return <FarmerDashboard onNavigate={setActiveTab} />;
      case 'TRANSPORTER_DRIVER':
        return <TransporterDashboard onNavigate={setActiveTab} />;
      case 'HUB_MANAGER':
        return <HubDashboard onNavigate={setActiveTab} />;
      case 'MARKET_BUYER':
        return <MarketBuyerDashboard onNavigate={setActiveTab} />;
      case 'ADMIN':
        return <AdminDashboard onNavigate={setActiveTab} />;
      default:
        return <EntrepreneurDashboard onNavigate={setActiveTab} />;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingPage onNavigate={setActiveTab} />;
      case 'dashboard':
        return renderDashboardByRole();
      case 'book_pickup':
        return <EntrepreneurDashboard onNavigate={setActiveTab} />;
      case 'pooling':
        return <PoolingPage onNavigate={setActiveTab} />;
      case 'transporters':
        return <TransportersPage onNavigate={setActiveTab} />;
      case 'live_map':
        return <LiveMapPage />;
      case 'route_optimizer':
        return <RouteOptimizerPage />;
      case 'hubs':
        return <HubsPage />;
      case 'markets':
        return <MarketsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'tracking':
        return <TrackingPage />;
      default:
        return <LandingPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream text-navy selection:bg-forest selection:text-white">
      {/* Header with Role & Language Switcher + Simulation Button */}
      <Header onOpenNotifications={() => setIsNotifOpen(true)} />

      {/* Main Navigation Bar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Live Simulation Top Step Banner (if simulation is active) */}
      <SimulationBanner />

      {/* Main Content View with mobile bottom nav spacing */}
      <main className="flex-1 pb-20 md:pb-0">
        {renderContent()}
      </main>

      {/* Notification Drawer Modal */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />

      {/* Gaadi Sahayak Voice AI Assistant (Bottom-Right 56px Mic & Modal Sheet) */}
      <FloatingMicButton />
      <GaadiSahayakModal onNavigateTab={setActiveTab} />

      {/* Footer */}
      <footer className="bg-[#F5F2E9] border-t border-[#DCD8C8] py-8 text-center text-xs text-[#5A6A64]">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="font-bold text-[#263238] font-display text-sm">{t('brandName')}</span>
            <span>•</span>
            <span className="text-[#556B2F] font-semibold">{t('footerTagline')}</span>
          </div>
          <p className="text-[12px] text-[#5A6A64] max-w-2xl mx-auto font-medium">
            {t('footerPrototypeNote')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <LocationProvider>
          <LogisticsProvider>
            <GaadiSahayakProvider>
              <MainLayout />
              <LocationPermissionModal />
            </GaadiSahayakProvider>
          </LogisticsProvider>
        </LocationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
