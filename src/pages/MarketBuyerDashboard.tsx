import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useLogistics } from '../context/LogisticsContext';
import { 
  Store, 
  Truck, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  X,
  Package
} from 'lucide-react';
import { Shipment } from '../types';

interface MarketBuyerDashboardProps {
  onNavigate: (tab: any) => void;
}

export const MarketBuyerDashboard: React.FC<MarketBuyerDashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { shipments, markShipmentDelivered } = useLogistics();

  const [selectedProducer, setSelectedProducer] = useState<Shipment | null>(null);
  const [confirmedSuccess, setConfirmedSuccess] = useState<string | null>(null);

  const handleConfirmReceipt = (ship: Shipment) => {
    markShipmentDelivered(ship.id);
    setConfirmedSuccess(`Receipt confirmed for ${ship.productName} (${ship.weightKg} kg)! Digital goods receipt issued to ${ship.senderName}.`);
    setTimeout(() => setConfirmedSuccess(null), 5000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Buyer Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rural-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-soft-green text-forest border border-forest/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy font-display">
              Market & Mandi Buyer Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-rural-muted mt-0.5">
              Buyer: <span className="text-forest font-semibold">{currentUser.name}</span> ({currentUser.organizationName || 'Chiplun Fresh Mart Wholesale'}) • {currentUser.taluka}, {currentUser.district}
            </p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-soft-green text-forest border border-forest/20 text-xs font-bold flex items-center gap-1.5 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-forest" />
          <span>FSSAI & APMC Verified Buyer</span>
        </span>
      </div>

      {confirmedSuccess && (
        <div className="p-4 rounded-2xl bg-soft-green border border-forest/30 text-forest text-sm font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-forest shrink-0" />
          <span>{confirmedSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Incoming Dispatches</span>
          <div className="text-3xl font-black text-navy font-display mt-2">
            {shipments.filter(s => s.status === 'IN_TRANSIT').length}
          </div>
          <span className="text-[12px] text-forest font-medium mt-1 block">En-route via pooled transport</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Received This Month</span>
          <div className="text-3xl font-black text-forest font-display mt-2">
            {shipments.filter(s => s.status === 'DELIVERED').length} Consignments
          </div>
          <span className="text-[12px] text-forest font-medium mt-1 block">100% verified weight manifests</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Connected Producers</span>
          <div className="text-3xl font-black text-navy font-display mt-2">18 SHGs & FPOs</div>
          <span className="text-[12px] text-rural-muted mt-1 block">Across Konkan & Western Ghats</span>
        </div>
      </div>

      {/* Incoming Goods Manifest */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-rural-border pb-3">
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <Truck className="w-5 h-5 text-forest" />
            <span>Inbound Cargo Shipments Arriving at APMC</span>
          </h2>
          <span className="text-xs text-rural-muted">Live Arrival Updates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shipments.map(s => (
            <div 
              key={s.id} 
              className="p-5 rounded-xl border border-rural-border bg-cream space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-forest">{s.trackingNumber}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      s.status === 'DELIVERED' ? 'bg-[#E7EBD9] text-forest border border-forest/30' : 'bg-[#E7EBD9] text-forest border border-forest'
                    }`}>
                      {t(`status_${s.status}`) || s.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-navy mt-1">{s.productName}</h3>
                  <div className="text-xs text-rural-muted">{s.senderName} ({s.senderOrg})</div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-base font-bold text-navy">{s.weightKg} kg</span>
                  <span className="text-xs text-rural-muted block">{s.packageCount} crates</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-rural-border text-xs text-navy space-y-1">
                <div className="flex justify-between">
                  <span className="text-rural-muted">Origin:</span>
                  <span className="font-semibold text-navy">{s.origin.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rural-muted">Destination:</span>
                  <span className="font-semibold text-forest">{s.destination.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedProducer(s)}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-cream text-navy border border-rural-border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-forest" />
                  <span>{t('contactProducer')}</span>
                </button>

                <button
                  onClick={() => handleConfirmReceipt(s)}
                  disabled={s.status === 'DELIVERED'}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    s.status === 'DELIVERED'
                      ? 'bg-soft-green text-forest cursor-not-allowed border border-forest/20'
                      : 'bg-forest hover:bg-forest-dark text-white shadow-xs'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{s.status === 'DELIVERED' ? t('status_DELIVERED') : t('confirmReceipt')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTACT PRODUCER MODAL */}
      {selectedProducer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-rural-border rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-rural-border pb-3">
              <h3 className="text-base font-bold text-navy flex items-center gap-2">
                <Phone className="w-4 h-4 text-forest" />
                <span>Contact Rural Producer</span>
              </h3>
              <button 
                onClick={() => setSelectedProducer(null)}
                className="p-1 rounded-lg text-rural-muted hover:text-navy hover:bg-cream"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-cream/60 border border-rural-border space-y-1">
                <div className="text-rural-muted">Producer Name:</div>
                <div className="text-sm font-bold text-navy">{selectedProducer.senderName}</div>
                <div className="text-forest font-semibold">{selectedProducer.senderOrg}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-cream/60 border border-rural-border space-y-1">
                <div className="text-rural-muted">Contact Phone:</div>
                <div className="text-base font-mono font-bold text-navy">{selectedProducer.senderPhone}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-cream/60 border border-rural-border space-y-1">
                <div className="text-rural-muted">Origin Farm / Workshop:</div>
                <div className="text-navy">{selectedProducer.origin.address}</div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <a
                href={`tel:${selectedProducer.senderPhone}`}
                className="flex-1 py-3 rounded-xl bg-forest hover:bg-forest-deep text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Producer</span>
              </a>
              <button
                onClick={() => setSelectedProducer(null)}
                className="px-4 py-3 rounded-xl bg-cream hover:bg-rural-border text-navy text-xs font-bold transition border border-rural-border"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
