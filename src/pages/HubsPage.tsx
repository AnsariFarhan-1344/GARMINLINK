import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { 
  Warehouse, 
  MapPin, 
  Snowflake, 
  Phone, 
  Clock, 
  Search, 
  Gauge, 
  Building2, 
  CheckCircle2 
} from 'lucide-react';
import { HubType } from '../types';
import { StaticMapEmbed } from '../components/map/StaticMapEmbed';

export const HubsPage: React.FC = () => {
  const { t } = useLanguage();
  const { hubs } = useLogistics();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredHubs = hubs.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.taluka.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || h.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Hub Network Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rural-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-soft-green text-forest border border-forest/20">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy font-display">
              Rural Logistics Hub Network
            </h1>
            <p className="text-xs sm:text-sm text-rural-muted mt-0.5">
              Village collection centers, taluka consolidation hubs, and APMC cold-chain yards across Maharashtra.
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-rural-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search district or hub..."
              className="pl-9 pr-4 py-2.5 rounded-xl bg-white border border-rural-border text-xs text-navy focus:ring-2 focus:ring-forest outline-none shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* HUB CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHubs.map(hub => {
          const occPct = Math.round((hub.currentOccupancyKg / hub.totalCapacityKg) * 100);

          return (
            <div
              key={hub.id}
              className="bg-white p-6 rounded-2xl border border-rural-border shadow-sm space-y-4 hover:border-forest/40 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono font-bold text-forest px-2.5 py-0.5 rounded-full bg-soft-green border border-forest/20">
                    {hub.code}
                  </span>
                  <h3 className="text-base font-bold text-navy mt-2">{hub.name}</h3>
                  <div className="text-xs text-rural-muted flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-forest shrink-0" />
                    <span>{hub.address}</span>
                  </div>
                </div>

                {hub.hasColdStorage && (
                  <span className="p-2 rounded-xl bg-[#E7EBD9] text-forest border border-rural-border" title="Cold Storage Available">
                    <Snowflake className="w-4 h-4" />
                  </span>
                )}
              </div>

              {/* Capacity Bar */}
              <div className="p-3.5 rounded-xl bg-cream border border-rural-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-rural-muted">Current Occupancy:</span>
                  <span className="font-semibold text-navy">{hub.currentOccupancyKg} / {hub.totalCapacityKg} kg</span>
                </div>
                <div className="w-full h-2.5 bg-[#D9DED0] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-forest rounded-full"
                    style={{ width: `${occPct}%` }}
                  />
                </div>
              </div>

              {/* Location Map Preview */}
              <div className="pt-1">
                <StaticMapEmbed 
                  address={`${hub.address}, ${hub.taluka}, ${hub.district}, Maharashtra`} 
                  title={hub.name} 
                  height={130} 
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-rural-muted pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-rural-muted block uppercase">Manager</span>
                  <span className="font-semibold text-navy">{hub.managerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rural-muted block uppercase">Hours</span>
                  <span className="font-semibold text-navy">{hub.operatingHours}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
