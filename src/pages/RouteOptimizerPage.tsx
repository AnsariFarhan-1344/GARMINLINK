import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { optimizeRouteWaypoints } from '../services/routeOptimizer';
import { 
  Route, 
  MapPin, 
  Clock, 
  Fuel, 
  Leaf, 
  DollarSign, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles,
  ArrowRight,
  Truck,
  Building2,
  Store
} from 'lucide-react';
import { Waypoint } from '../types';

export const RouteOptimizerPage: React.FC = () => {
  const { t } = useLanguage();
  const { activeRoute } = useLogistics();

  const [waypoints, setWaypoints] = useState<Waypoint[]>(activeRoute.waypoints);
  const [newStopName, setNewStopName] = useState('');
  const [newStopWeight, setNewStopWeight] = useState(25);
  const [selectedRouteOption, setSelectedRouteOption] = useState<'hub' | 'direct'>('hub');

  const optimizedResult = optimizeRouteWaypoints('custom-pool', 'MH-08-E-4219', waypoints);

  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopName) return;

    const newWp: Waypoint = {
      id: `wp-${Date.now()}`,
      name: newStopName,
      type: 'PICKUP',
      coordinates: { 
        lat: 17.7500 + (Math.random() - 0.5) * 0.05, 
        lng: 73.1800 + (Math.random() - 0.5) * 0.05 
      },
      address: `${newStopName}, Dapoli Area`,
      weightChangeKg: newStopWeight,
      packageNotes: `${newStopWeight} kg Rural Parcel`,
      estimatedArrivalMin: 0,
      isCompleted: false,
      stopSequence: waypoints.length + 1
    };

    setWaypoints(prev => [...prev, newWp]);
    setNewStopName('');
  };

  const handleRemoveStop = (id: string) => {
    if (waypoints.length <= 2) return;
    setWaypoints(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Engine Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rural-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-soft-green text-forest border border-forest/20">
            <Route className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-navy font-display">
                Village–Hub–Market Routing
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-soft-green text-forest border border-forest/20">
                Route Comparison
              </span>
            </div>
            <p className="text-xs sm:text-sm text-rural-muted mt-0.5">
              Compare direct trips against consolidation through rural taluka hubs to cut travel costs and empty kilometers.
            </p>
          </div>
        </div>
      </div>

      {/* CORE ROUTING COMPARISON: OPTION A vs OPTION B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OPTION A: DIRECT ROUTE */}
        <div 
          onClick={() => setSelectedRouteOption('direct')}
          className={`p-6 rounded-2xl border transition cursor-pointer space-y-4 ${
            selectedRouteOption === 'direct'
              ? 'bg-white border-forest ring-2 ring-forest/30 shadow-md'
              : 'bg-white/80 border-rural-border hover:border-forest/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rural-muted uppercase tracking-wider">Option A — Direct Trip</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cream text-rural-muted border border-rural-border">Solo Transit</span>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-navy">
            <span>🏡 Village</span>
            <ArrowRight className="w-4 h-4 text-rural-muted" />
            <span>🏪 APMC Market</span>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-cream/60 border border-rural-border text-xs">
            <div>
              <span className="text-rural-muted block text-[11px]">Total Distance</span>
              <span className="font-bold text-navy text-sm">62 km</span>
            </div>
            <div>
              <span className="text-rural-muted block text-[11px]">Estimated Cost</span>
              <span className="font-bold text-navy text-sm">₹1,400</span>
            </div>
          </div>

          <p className="text-xs text-rural-muted">
            Direct dedicated hire without cargo pooling. Fast, but higher cost and empty return travel.
          </p>
        </div>

        {/* OPTION B: HUB ROUTE (RECOMMENDED) */}
        <div 
          onClick={() => setSelectedRouteOption('hub')}
          className={`p-6 rounded-2xl border transition cursor-pointer space-y-4 relative ${
            selectedRouteOption === 'hub'
              ? 'bg-soft-green/30 border-forest ring-2 ring-forest shadow-md'
              : 'bg-white border-rural-border hover:border-forest/40'
          }`}
        >
          <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-forest text-white text-[11px] font-bold shadow-sm">
            RECOMMENDED • LOWER ESTIMATED COST
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-forest uppercase tracking-wider">Option B — Hub Consolidation</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-soft-green text-forest font-bold border border-forest/20">
              Save 36%
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-navy">
            <span>🏡 Village</span>
            <ArrowRight className="w-4 h-4 text-forest" />
            <span className="text-forest">🏢 Rural Hub</span>
            <ArrowRight className="w-4 h-4 text-forest" />
            <span>🏪 APMC Market</span>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-forest/30 text-xs">
            <div>
              <span className="text-rural-muted block text-[11px]">Optimized Distance</span>
              <span className="font-bold text-forest text-sm">48 km (-14 km)</span>
            </div>
            <div>
              <span className="text-rural-muted block text-[11px]">Shared Cost</span>
              <span className="font-bold text-forest text-sm">₹890 (Shared Fare)</span>
            </div>
          </div>

          <p className="text-xs text-forest font-medium">
            Goods drop off at the nearby taluka hub and join a larger scheduled vehicle going to market.
          </p>
        </div>
      </div>

      {/* COMPARISON METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block">Direct Distance</span>
          <div className="text-lg font-bold text-rural-muted mt-1 line-through">
            {optimizedResult.rawDistanceKm} km
          </div>
          <span className="text-[11px] text-rural-muted mt-0.5 block">Unpooled trips</span>
        </div>

        <div className="bg-soft-green p-4 rounded-2xl border border-forest/30 shadow-sm">
          <span className="text-xs text-forest font-bold block">Optimized Route</span>
          <div className="text-2xl font-black text-forest font-display mt-1">
            {optimizedResult.optimizedDistanceKm} km
          </div>
          <span className="text-[11px] text-forest/90 mt-0.5 block font-semibold">
            -{optimizedResult.distanceSavedKm} km saved
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block">Time Saved</span>
          <div className="text-2xl font-black text-navy font-display mt-1">
            {optimizedResult.timeSavedMins} mins
          </div>
          <span className="text-[11px] text-rural-muted mt-0.5 block">Faster delivery</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block">Diesel Saved</span>
          <div className="text-2xl font-black text-gold font-display mt-1">
            {optimizedResult.fuelSavedLitres} L
          </div>
          <span className="text-[11px] text-rural-muted mt-0.5 block">Reduced consumption</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block">Cost Saved</span>
          <div className="text-2xl font-black text-gold font-display mt-1">
            ₹{optimizedResult.costSavedRs}
          </div>
          <span className="text-[11px] text-forest mt-0.5 block font-semibold">Per pooled run</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rural-border shadow-sm">
          <span className="text-xs text-rural-muted block">Carbon Offset</span>
          <div className="text-2xl font-black text-forest font-display mt-1">
            {optimizedResult.carbonOffsetKg} kg
          </div>
          <span className="text-[11px] text-rural-muted mt-0.5 block">Greener rural transport</span>
        </div>
      </div>

      {/* TWO COLUMN: WAYPOINT SEQUENCE + ADD STOP SANDBOX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-rural-border pb-3">
            <h3 className="text-base font-bold text-navy flex items-center gap-2">
              <Route className="w-5 h-5 text-forest" />
              <span>Optimized Stop Sequence ({optimizedResult.waypoints.length} Stops)</span>
            </h3>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-soft-green text-forest border border-forest/20">
              Optimal Sequence
            </span>
          </div>

          <div className="space-y-3">
            {optimizedResult.waypoints.map(wp => (
              <div 
                key={wp.id}
                className="p-3.5 rounded-xl bg-cream border border-rural-border flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-forest text-white font-bold flex items-center justify-center text-xs">
                    {wp.stopSequence}
                  </span>
                  <div>
                    <h4 className="font-bold text-navy text-sm">{wp.name}</h4>
                    <p className="text-[11px] text-rural-muted">{wp.address} • {wp.packageNotes}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-rural-muted block">ETA</span>
                    <span className="font-bold text-forest">+{wp.estimatedArrivalMin} min</span>
                  </div>

                  {waypoints.length > 2 && (
                    <button
                      onClick={() => handleRemoveStop(wp.id)}
                      className="p-1.5 text-rural-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Remove stop"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Custom Stop Sandbox Form */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-2xl border border-rural-border shadow-sm space-y-4">
          <div className="border-b border-rural-border pb-3">
            <h3 className="text-base font-bold text-navy flex items-center gap-2">
              <Plus className="w-5 h-5 text-forest" />
              <span>Add Village Stop</span>
            </h3>
            <p className="text-xs text-rural-muted mt-0.5">Test adding an additional pickup point on the route</p>
          </div>

          <form onSubmit={handleAddStop} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-rural-muted mb-1.5">Village Name / Landmark</label>
              <input
                type="text"
                required
                value={newStopName}
                onChange={e => setNewStopName(e.target.value)}
                placeholder="e.g. Karde Beach Village SHG"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-rural-border text-navy text-sm focus:border-forest focus:ring-1 focus:ring-forest outline-none transition"
              />
            </div>

            <div>
              <label className="block font-bold text-rural-muted mb-1.5">Goods Weight (kg)</label>
              <input
                type="number"
                min="5"
                max="500"
                required
                value={newStopWeight}
                onChange={e => setNewStopWeight(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-rural-border text-navy text-sm font-mono font-bold focus:border-forest focus:ring-1 focus:ring-forest outline-none transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-forest hover:bg-forest-dark text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Add Stop & Re-Calculate Route</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
