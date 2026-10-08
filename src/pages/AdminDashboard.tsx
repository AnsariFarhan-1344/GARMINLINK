import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useLogistics } from '../context/LogisticsContext';
import { MaharashtraMap } from '../components/map/MaharashtraMap';
import { 
  Activity, 
  Truck, 
  Layers, 
  MapPin, 
  TrendingUp, 
  Users, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Radio, 
  Gauge, 
  ArrowUpRight,
  TrendingDown,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { mockDistrictAnalytics } from '../data/mockData';

interface AdminDashboardProps {
  onNavigate: (tab: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { vehicles, shipments, pools, returnTrips, honestMetrics } = useLogistics();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(vehicles[0]?.id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Command Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rural-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-soft-green text-forest border border-forest/20">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-navy font-display">
                State Logistics Operations
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-soft-green text-forest border border-forest/20 uppercase">
                Maharashtra Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-rural-muted mt-0.5">
              Statewide Rural Logistics Network • Administrator: <span className="text-forest font-semibold">{currentUser.name}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('analytics')}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-cream text-navy border border-rural-border text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          <TrendingUp className="w-4 h-4 text-forest" />
          <span>Full Analytics Dashboard</span>
        </button>
      </div>

      {/* TOP COMMAND KPIS (Computed Live from Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Registered Producers</span>
          <div className="text-2xl font-black text-navy font-display mt-1">{honestMetrics.villageProducersCount}+</div>
          <span className="text-[11px] text-forest font-semibold">SHGs & smallholders</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Active Transporters</span>
          <div className="text-2xl font-black text-forest font-display mt-1">{honestMetrics.activeTransportersCount} Fleet</div>
          <span className="text-[11px] text-forest font-semibold">100% verified</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Empty Km Avoided</span>
          <div className="text-2xl font-black text-navy font-display mt-1">{honestMetrics.emptyKmAvoided} km</div>
          <span className="text-[11px] text-rural-muted font-semibold">Backhaul & shared</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Cargo Transported</span>
          <div className="text-2xl font-black text-navy font-display mt-1">{(honestMetrics.totalWeightMovedKg / 1000).toFixed(1)} Ton</div>
          <span className="text-[11px] text-rural-muted font-semibold">{honestMetrics.totalShipmentsCount} shipments</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">Rural Cost Saved</span>
          <div className="text-2xl font-black text-gold font-display mt-1">₹{honestMetrics.totalMoneySaved.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-forest font-semibold">{honestMetrics.avgSavingsPercent}% avg savings</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block font-semibold">CO₂ Reduced (0.25 kg/km)</span>
          <div className="text-2xl font-black text-forest font-display mt-1">{honestMetrics.co2ReducedKg} kg</div>
          <span className="text-[11px] text-forest font-semibold">Carbon offset</span>
        </div>
      </div>

      {/* LARGE LIVE MAHARASHTRA MAP + FLEET TELEMETRY SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <MapPin className="w-4 h-4 text-forest" />
              <span>Real-Time Maharashtra Telemetry & Route Grid</span>
            </h3>
            <span className="text-xs text-rural-muted">Live OpenStreetMap Telemetry</span>
          </div>
          <MaharashtraMap height="540px" selectedVehicleId={selectedVehicleId} />
        </div>

        {/* Transporter Fleet Live Feed Sidebar */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-rural-border shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-rural-border pb-3">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <Truck className="w-4 h-4 text-forest" />
                <span>Live Fleet Vehicles</span>
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-soft-green text-forest font-bold border border-forest/20">
                {vehicles.length} Online
              </span>
            </div>

            <div className="space-y-2.5 mt-3 max-h-[440px] overflow-y-auto pr-1">
              {vehicles.map(v => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    selectedVehicleId === v.id
                      ? 'bg-soft-green/60 border-forest shadow-sm'
                      : 'bg-white border-rural-border hover:border-forest/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-forest">{v.vehicleNumber}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      v.status === 'IN_TRANSIT' ? 'bg-[#E7EBD9] text-forest border border-forest' : 'bg-soft-green text-forest border border-forest/20'
                    }`}>
                      {v.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-navy mt-1 font-semibold">{v.driverName} • {v.makeModel}</div>
                  
                  <div className="flex items-center justify-between text-xs text-rural-muted mt-2 pt-2 border-t border-rural-border/50">
                    <span>Speed: <strong className="text-navy">{v.speedKmh} km/h</strong></span>
                    <span>Load: <strong className="text-forest">{v.currentPayloadKg}/{v.maxPayloadKg} kg</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DISTRICT PERFORMANCE MATRIX */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-rural-border pb-3">
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <Building2 className="w-5 h-5 text-forest" />
            <span>District-Wise Logistics Performance Across Maharashtra</span>
          </h3>
          <span className="text-xs text-rural-muted">Live Coordinated Dispatch Impact</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-navy">
            <thead className="bg-cream text-rural-muted uppercase text-[11px] font-bold tracking-wider border-b border-rural-border">
              <tr>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Consolidated Shipments</th>
                <th className="py-3 px-4">Weight Moved</th>
                <th className="py-3 px-4">Total Cost Saved</th>
                <th className="py-3 px-4">Vehicle Utilization</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rural-border/60">
              {mockDistrictAnalytics.map(d => (
                <tr key={d.district} className="hover:bg-cream/40 transition">
                  <td className="py-3.5 px-4 font-bold text-navy">{d.district}</td>
                  <td className="py-3.5 px-4 font-mono">{d.shipments} shipments</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-navy">{d.weightMovedTon} Tons</td>
                  <td className="py-3.5 px-4 font-bold text-gold text-sm">₹{(d.costSavedRs).toLocaleString()}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-[#D9DED0] rounded-full overflow-hidden">
                        <div className="h-full bg-forest rounded-full" style={{ width: `${d.utilizationPct}%` }} />
                      </div>
                      <span className="font-mono font-bold text-navy">{d.utilizationPct}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-soft-green text-forest text-[11px] font-bold border border-forest/20">
                      OPTIMIZED
                    </span>
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
