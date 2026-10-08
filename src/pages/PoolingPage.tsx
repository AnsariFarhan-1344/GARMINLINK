import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { 
  Layers, 
  Sparkles, 
  Truck, 
  TrendingDown, 
  CheckCircle2, 
  Plus, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  Package, 
  Clock, 
  Gauge 
} from 'lucide-react';
import { ShipmentPool } from '../types';

interface PoolingPageProps {
  onNavigate: (tab: any) => void;
}

export const PoolingPage: React.FC<PoolingPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { pools, shipments, joinPoolWithShipment, createPoolFromSelection } = useLogistics();

  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const toggleShipmentSelection = (id: string) => {
    setSelectedShipmentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCreateNewPool = () => {
    if (selectedShipmentIds.length === 0) return;
    const pool = createPoolFromSelection(selectedShipmentIds);
    setSuccessNotice(`New Pool ${pool.poolCode} successfully formed with ${selectedShipmentIds.length} shipments!`);
    setSelectedShipmentIds([]);
    setTimeout(() => setSuccessNotice(null), 6000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Engine Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rural-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-soft-green text-forest border border-forest/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-navy font-display">
                Smart Shipment Pooling
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-soft-green text-forest border border-forest/20">
                Shared Transport
              </span>
            </div>
            <p className="text-xs sm:text-sm text-rural-muted mt-0.5">
              Combine small shipments from neighboring villages heading in the same direction to cut travel costs.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('book_pickup')}
          className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-deep text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Shipment</span>
        </button>
      </div>

      {successNotice && (
        <div className="p-4 rounded-2xl bg-soft-green border border-forest/30 text-forest text-sm font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-forest shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ACTIVE POOLING OPPORTUNITIES / CLUSTERS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-forest" />
            <span>Active Shared Pooling Groups in Maharashtra</span>
          </h2>
          <span className="text-xs text-rural-muted">
            {pools.length} active vehicle pools
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pools.map(pool => (
            <div 
              key={pool.id}
              className="bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-5"
            >
              {/* Pool Header */}
              <div className="flex items-start justify-between border-b border-rural-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-forest">{pool.poolCode}</span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      pool.status === 'IN_TRANSIT'
                        ? 'bg-[#E7EBD9] text-forest border border-forest'
                        : 'bg-[#E7EBD9] text-forest border border-rural-border'
                    }`}>
                      {pool.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-navy mt-1.5">{pool.originArea} → {pool.destinationArea}</h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-rural-muted block">Combined Savings</span>
                  <span className="text-lg font-black text-gold font-display">
                    +₹{pool.totalSavingsAmount} ({pool.savingsPercent}%)
                  </span>
                </div>
              </div>

              {/* Members in Pool */}
              <div>
                <h4 className="text-xs font-bold text-navy mb-2.5">
                  Pooled Producers ({pool.members.length} Shipments combined):
                </h4>
                <div className="space-y-2">
                  {pool.members.map((m, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-cream border border-rural-border flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-navy">{m.senderName} ({m.senderOrg || m.originVillage})</div>
                        <div className="text-[11px] text-rural-muted">{m.productName}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-forest block text-sm">₹{m.allocatedCost}</span>
                        <span className="text-[10px] text-rural-muted line-through">₹{m.individualCost} solo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="p-3.5 rounded-xl bg-[#F5F3EA] border border-rural-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-rural-muted">Assigned Vehicle:</span>
                  <span className="font-bold text-navy">{pool.recommendedVehicleCategory.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rural-muted">Vehicle Capacity Used:</span>
                  <span className="font-semibold text-navy">{pool.totalWeightKg} / {pool.vehicleCapacityKg} kg ({pool.utilizationPercent}%)</span>
                </div>
                <div className="w-full h-2.5 bg-[#D9DED0] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-forest rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, pool.utilizationPercent)}%` }}
                  />
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => {
                  if (shipments[0]) {
                    joinPoolWithShipment(shipments[0].id, pool.id);
                    setSuccessNotice(`Successfully joined ${pool.poolCode}!`);
                    setTimeout(() => setSuccessNotice(null), 5000);
                  }
                }}
                className="w-full py-3 rounded-xl bg-forest hover:bg-forest-dark text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Join This Pool & Share Trip Cost</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* UNPOOLED STANDALONE SHIPMENTS SELECTOR (CREATE NEW POOL) */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rural-border pb-3">
          <div>
            <h3 className="text-base font-bold text-navy">Combine Shipments to Form a New Vehicle Pool</h3>
            <p className="text-xs text-rural-muted">Select 2 or more compatible village shipments to automatically calculate shared savings</p>
          </div>

          <button
            onClick={handleCreateNewPool}
            disabled={selectedShipmentIds.length < 2}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              selectedShipmentIds.length >= 2
                ? 'bg-forest hover:bg-forest-dark text-white shadow-sm'
                : 'bg-cream text-rural-muted cursor-not-allowed border border-rural-border'
            }`}
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span>Pool Selected Shipments ({selectedShipmentIds.length})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {shipments.map(ship => {
            const isSelected = selectedShipmentIds.includes(ship.id);
            return (
              <div
                key={ship.id}
                onClick={() => toggleShipmentSelection(ship.id)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-soft-green border-forest shadow-sm'
                    : 'bg-white border-rural-border hover:border-forest/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-forest">{ship.trackingNumber}</span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 text-forest rounded border-rural-border"
                  />
                </div>

                <h4 className="text-sm font-bold text-navy truncate">{ship.productName}</h4>
                <div className="text-xs text-rural-muted mt-0.5">{ship.senderName} • {ship.origin.village}</div>

                <div className="flex items-center justify-between text-xs text-navy mt-3 pt-2 border-t border-rural-border/50">
                  <span>Weight: <strong className="text-forest">{ship.weightKg} kg</strong></span>
                  <span>Dest: <strong className="text-navy">{ship.destination.name}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
