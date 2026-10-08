import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useLogistics } from '../context/LogisticsContext';
import { 
  Warehouse, 
  Truck, 
  PackageCheck, 
  QrCode, 
  ArrowRight, 
  Snowflake, 
  CheckCircle2, 
  Building2, 
  Layers, 
  Clock,
  Gauge,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface HubDashboardProps {
  onNavigate: (tab: any) => void;
}

export const HubDashboard: React.FC<HubDashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { hubs, shipments, vehicles, markShipmentDelivered } = useLogistics();

  const currentHub = hubs[1]; // Khed Taluka Hub
  const [activeTab, setActiveTab] = useState<'INCOMING' | 'OUTGOING' | 'STORAGE'>('INCOMING');
  const [scannedMsg, setScannedMsg] = useState<string | null>(null);

  const occupancyPercent = Math.round((currentHub.currentOccupancyKg / currentHub.totalCapacityKg) * 100);

  const handleVerifyHandover = (shipmentId: string) => {
    markShipmentDelivered(shipmentId);
    setScannedMsg(`QR Handover Verified! Cargo received into Khed Taluka Hub.`);
    setTimeout(() => setScannedMsg(null), 5000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Hub Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rural-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-soft-green text-forest border border-forest/20">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy font-display">
              Rural Hub Operations
            </h1>
            <p className="text-xs sm:text-sm text-rural-muted mt-0.5">
              Hub: <span className="text-forest font-semibold">{currentHub.name}</span> ({currentHub.code}) • Manager: {currentHub.managerName}
            </p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-soft-green text-forest border border-forest/20 text-xs font-bold flex items-center gap-1.5 shadow-sm">
          <Snowflake className="w-4 h-4 text-forest" />
          <span>Cold Storage Operational</span>
        </span>
      </div>

      {scannedMsg && (
        <div className="p-4 rounded-2xl bg-soft-green border border-forest/30 text-forest text-sm font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-forest shrink-0" />
          <span>{scannedMsg}</span>
        </div>
      )}

      {/* TOP KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Current Storage Load</span>
          <div className="text-3xl font-black text-navy font-display mt-2">
            {currentHub.currentOccupancyKg} kg
          </div>
          <span className="text-[12px] text-forest font-medium mt-1 block">of {currentHub.totalCapacityKg} kg capacity</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Inbound Batches</span>
          <div className="text-3xl font-black text-forest font-display mt-2">8 Vehicles</div>
          <span className="text-[12px] text-rural-muted mt-1 block">Dapoli, Chiplun, Guhagar</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Outbound Dispatched</span>
          <div className="text-3xl font-black text-forest font-display mt-2">6 Trucks</div>
          <span className="text-[12px] text-forest font-medium mt-1 block">To Panvel & Pune Mandis</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Average Dwell Time</span>
          <div className="text-3xl font-black text-gold font-display mt-2">1.8 Hours</div>
          <span className="text-[12px] text-rural-muted mt-1 block">Rapid cross-docking</span>
        </div>
      </div>

      {/* HUB HIERARCHY FLOW VISUALIZATION */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-rural-muted">
          Maharashtra Multi-Tier Hub Aggregation Pipeline
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-cream border border-rural-border">
            <span className="text-forest font-bold block">1. Village Point</span>
            <span className="text-[11px] text-navy">Gimhavane & Asud</span>
          </div>

          <div className="p-3.5 rounded-xl bg-soft-green border border-forest/40 shadow-xs">
            <span className="text-forest font-bold block">2. Taluka Hub (Here)</span>
            <span className="text-[11px] text-navy font-semibold">Khed Consolidation</span>
          </div>

          <div className="p-3.5 rounded-xl bg-cream border border-rural-border">
            <span className="text-forest font-bold block">3. District Hub</span>
            <span className="text-[11px] text-navy">Ratnagiri Central Hub</span>
          </div>

          <div className="p-3.5 rounded-xl bg-cream border border-rural-border">
            <span className="text-gold font-bold block">4. APMC Mandi</span>
            <span className="text-[11px] text-navy">Chiplun Market Yard</span>
          </div>

          <div className="p-3.5 rounded-xl bg-cream border border-rural-border">
            <span className="text-forest font-bold block">5. Terminal Gateway</span>
            <span className="text-[11px] text-navy">Panvel Agro Gateway</span>
          </div>
        </div>
      </div>

      {/* INCOMING & OUTGOING SHIPMENTS MANIFEST */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-rural-border pb-3">
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <Truck className="w-5 h-5 text-forest" />
            <span>Active Inbound Logistics Manifest</span>
          </h3>
          <span className="text-xs text-rural-muted">Live Vehicle Arrival</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-navy">
            <thead className="bg-cream text-rural-muted uppercase text-[11px] font-bold tracking-wider border-b border-rural-border">
              <tr>
                <th className="py-3 px-4">Tracking Code</th>
                <th className="py-3 px-4">Producer / SHG</th>
                <th className="py-3 px-4">Cargo & Weight</th>
                <th className="py-3 px-4">Carrier Vehicle</th>
                <th className="py-3 px-4">ETA</th>
                <th className="py-3 px-4 text-right">Handover Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rural-border/60">
              {shipments.map(ship => (
                <tr key={ship.id} className="hover:bg-cream/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-forest">{ship.trackingNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-navy">{ship.senderName} ({ship.senderOrg || 'SHG'})</td>
                  <td className="py-3.5 px-4">{ship.productName} • <strong className="text-forest">{ship.weightKg} kg</strong></td>
                  <td className="py-3.5 px-4 font-mono text-navy">{ship.assignedVehicleNumber || 'MH-08-E-4219'}</td>
                  <td className="py-3.5 px-4 text-forest font-bold">Today, 10:45 AM</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleVerifyHandover(ship.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-forest hover:bg-forest-dark text-white font-bold text-[11px] transition inline-flex items-center gap-1 shadow-xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan Handover</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
