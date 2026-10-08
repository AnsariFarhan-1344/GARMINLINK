import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { MaharashtraMap } from '../components/map/MaharashtraMap';
import { Vehicle, Shipment } from '../types';
import { 
  Radio, 
  Search, 
  Truck, 
  Package, 
  RotateCcw, 
  Play, 
  Pause, 
  CheckCircle2,
  MapPin,
  Navigation,
  LocateFixed
} from 'lucide-react';
import { useUserLocation, MAHARASHTRA_VILLAGES } from '../context/LocationContext';

export const LiveMapPage: React.FC = () => {
  const { t, formatNumber } = useLanguage();
  const { 
    vehicles, 
    shipments, 
    connectionStatus, 
    simulation, 
    startLogisticsSimulation, 
    pauseLogisticsSimulation, 
    resetLogisticsSimulation 
  } = useLogistics();

  const {
    userLocation,
    locationMode,
    locationName,
    accuracyMeters,
    setVillage,
    setDemoDapoli,
    setShowPermissionModal,
    broadcastTransporters
  } = useUserLocation();

  // State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(vehicles[0]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | undefined>(shipments[0]);
  const [activeTab, setActiveTab] = useState<'VEHICLES' | 'SHIPMENTS'>('VEHICLES');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');

  // Real-time counter for seconds since last update
  const [secondsAgo, setSecondsAgo] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(prev => (prev >= 60 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync selected vehicle with updated state from socket
  useEffect(() => {
    if (selectedVehicle) {
      const updated = vehicles.find(v => v.id === selectedVehicle.id);
      if (updated) {
        setSelectedVehicle(updated);
      }
    }
  }, [vehicles]);

  // Extract list of unique villages
  const uniqueVillages = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach(v => {
      if (v.currentLocation.village) set.add(v.currentLocation.village);
      if (v.currentLocation.taluka) set.add(v.currentLocation.taluka);
    });
    shipments.forEach(s => {
      if (s.origin.village) set.add(s.origin.village);
      if (s.origin.taluka) set.add(s.origin.taluka);
      if (s.destination.village) set.add(s.destination.village);
      if (s.destination.taluka) set.add(s.destination.taluka);
    });
    return Array.from(set).sort();
  }, [vehicles, shipments]);

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'AVAILABLE' && v.status !== 'IDLE' && v.status !== 'RETURNING') return false;
        if (statusFilter === 'IN_TRANSIT' && v.status !== 'IN_TRANSIT') return false;
        if (statusFilter === 'ASSIGNED' && v.status !== 'ASSIGNED' && v.status !== 'EN_ROUTE_PICKUP') return false;
        if (statusFilter === 'DELIVERED' && v.status !== 'DELIVERED') return false;
      }
      if (villageFilter !== 'ALL') {
        const matches = v.currentLocation.village?.toLowerCase() === villageFilter.toLowerCase() ||
                        v.currentLocation.taluka?.toLowerCase() === villageFilter.toLowerCase() ||
                        v.currentLocation.district?.toLowerCase() === villageFilter.toLowerCase();
        if (!matches) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = v.vehicleNumber.toLowerCase().includes(q) ||
                      v.driverName.toLowerCase().includes(q) ||
                      v.currentLocation.name.toLowerCase().includes(q) ||
                      v.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [vehicles, statusFilter, villageFilter, searchQuery]);

  // Filter shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'IN_TRANSIT' && s.status !== 'IN_TRANSIT') return false;
        if (statusFilter === 'ASSIGNED' && s.status !== 'TRANSPORTER_ASSIGNED') return false;
        if (statusFilter === 'DELIVERED' && s.status !== 'DELIVERED') return false;
      }
      if (villageFilter !== 'ALL') {
        const matches = s.origin.village?.toLowerCase() === villageFilter.toLowerCase() ||
                        s.origin.taluka?.toLowerCase() === villageFilter.toLowerCase() ||
                        s.destination.village?.toLowerCase() === villageFilter.toLowerCase() ||
                        s.destination.taluka?.toLowerCase() === villageFilter.toLowerCase();
        if (!matches) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = s.trackingNumber.toLowerCase().includes(q) ||
                      s.productName.toLowerCase().includes(q) ||
                      s.senderName.toLowerCase().includes(q) ||
                      s.origin.name.toLowerCase().includes(q) ||
                      s.destination.name.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [shipments, statusFilter, villageFilter, searchQuery]);

  // Status badge helper
  const renderStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E7EBD9] text-[#556B2F] border border-[#556B2F]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#556B2F] animate-pulse"></span>
            {t('status_IN_TRANSIT')}
          </span>
        );
      case 'ASSIGNED':
      case 'EN_ROUTE_PICKUP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FAF6EE] text-[#C59D5F] border border-[#C59D5F]/30">
            {t('status_ASSIGNED')}
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F0F2E8] text-[#263238] border border-[#D9DED0]">
            {t('status_DELIVERED')}
          </span>
        );
      case 'IDLE':
      case 'RETURNING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E7EBD9] text-[#556B2F] border border-[#556B2F]/20">
            {t('status_AVAILABLE')}
          </span>
        );
    }
  };

  // Live status indicator helper - Badge: "LIVE (GPS)" for real data, "LIVE (Simulated)" for demo vehicles. Never show "RECONNECTING".
  const renderLiveIndicator = (vehicle: Vehicle) => {
    const isRealGps = vehicle && broadcastTransporters[vehicle.id]?.isRealGps;

    if (isRealGps) {
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#2E7D32]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] animate-ping"></span>
          <span>LIVE (GPS)</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#556B2F]">
        <span className="w-2 h-2 rounded-full bg-[#556B2F]"></span>
        <span>LIVE (Simulated)</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ==================================================================== */}
      {/* TOP HEADER: RURAL PREMIUM LOGISTICS SPECIFICATION                   */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D9DED0] bg-white p-6 rounded-3xl border shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[#E7EBD9] text-[#556B2F] border border-[#D9DED0] shadow-xs">
            <Radio className="w-7 h-7 animate-pulse text-[#556B2F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#263238] tracking-tight font-display">
                Live Logistics Tracking
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E7EBD9] text-[#556B2F] border border-[#556B2F]/20 uppercase tracking-wide">
                Maharashtra State Telemetry
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#60706A] mt-0.5 font-medium">
              Real-time GPS vehicle coordination, rural SHG cargo tracking, and geofenced hub telemetry across Maharashtra.
            </p>
          </div>
        </div>

        {/* Live Indicator Banner & Simulation Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-[#F5F3EA] border border-[#D9DED0] text-xs flex items-center gap-2 shadow-xs">
            {renderLiveIndicator(selectedVehicle)}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={simulation.isRunning ? pauseLogisticsSimulation : startLogisticsSimulation}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs min-h-[42px] ${
                simulation.isRunning
                  ? 'bg-[#C59D5F] hover:bg-[#A98448] text-white'
                  : 'bg-[#556B2F] hover:bg-[#3F5023] text-white'
              }`}
            >
              {simulation.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{simulation.isRunning ? 'Pause Sim' : 'Live Sim'}</span>
            </button>

            <button
              onClick={resetLogisticsSimulation}
              className="p-2.5 rounded-2xl bg-white hover:bg-[#F5F3EA] text-[#263238] border border-[#D9DED0] shadow-xs transition"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4 text-[#60706A]" />
            </button>
          </div>
        </div>
      </div>

      {/* LOCATION & VILLAGE STATUS BAR */}
      <div className="bg-[#F5F3EA] p-3 sm:p-4 rounded-2xl border border-[#D9DED0] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-white border border-[#D9DED0] text-[#556B2F]">
            <LocateFixed className="w-4 h-4 text-[#556B2F]" />
          </div>
          <div>
            <span className="font-bold text-[#263238] block">
              {locationMode === 'REAL_GPS' ? '📍 Live GPS Active' : '📍 ' + locationName}
            </span>
            <span className="text-[11px] text-[#60706A]">
              {locationMode === 'REAL_GPS'
                ? `High accuracy fix (±${accuracyMeters || 20}m) • Default pickup location`
                : 'Using village location as pickup point for vehicle matching'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Village fallback dropdown */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#D9DED0] shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-[#556B2F] shrink-0" />
            <select
              value={
                MAHARASHTRA_VILLAGES.find((v) => v.coordinates.lat === userLocation.lat)?.name || 'Dapoli'
              }
              onChange={(e) => setVillage(e.target.value)}
              className="bg-transparent font-semibold text-[#263238] text-xs border-none focus:outline-none cursor-pointer"
              title="Select Village Location"
            >
              {MAHARASHTRA_VILLAGES.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.taluka})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={setDemoDapoli}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#E7EBD9] border border-[#D9DED0] text-[#556B2F] font-bold shadow-xs transition"
          >
            Use demo location (Dapoli)
          </button>

          <button
            onClick={() => setShowPermissionModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#556B2F] hover:bg-[#3F5023] text-white font-bold shadow-xs transition flex items-center gap-1"
          >
            <Navigation className="w-3.5 h-3.5 text-[#C59D5F]" />
            <span>Enable Device GPS</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MAIN TWO-COLUMN WORKSPACE: LEFT PANEL + LIVE LEAFLET MAP             */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================================================================== */}
        {/* LEFT / SIDE PANEL: SEARCH, FILTERS, LISTS                          */}
        {/* ================================================================== */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#D9DED0] shadow-xs p-5 space-y-4">
          
          {/* Tabs: Active Vehicles vs Active Shipments */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F5F3EA] rounded-2xl border border-[#D9DED0] text-xs font-bold">
            <button
              onClick={() => setActiveTab('VEHICLES')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'VEHICLES'
                  ? 'bg-white text-[#556B2F] shadow-xs font-extrabold border border-[#D9DED0]'
                  : 'text-[#60706A] hover:text-[#263238]'
              }`}
            >
              <Truck className="w-4 h-4 text-[#556B2F]" />
              <span>Vehicles ({vehicles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('SHIPMENTS')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'SHIPMENTS'
                  ? 'bg-white text-[#556B2F] shadow-xs font-extrabold border border-[#D9DED0]'
                  : 'text-[#60706A] hover:text-[#263238]'
              }`}
            >
              <Package className="w-4 h-4 text-[#C59D5F]" />
              <span>Shipments ({shipments.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A918B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'VEHICLES' ? 'Search vehicle ID, driver, town...' : 'Search tracking #, sender, product...'}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-white border border-[#D9DED0] text-xs text-[#263238] placeholder:text-[#8A918B] focus:outline-none focus:ring-2 focus:ring-[#556B2F] focus:border-[#556B2F] shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A918B] hover:text-[#263238]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters: Status & Village */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#60706A] block mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#D9DED0] text-xs text-[#263238] font-semibold focus:outline-none focus:ring-1 focus:ring-[#556B2F]"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available / Idle</option>
                <option value="IN_TRANSIT">In Transit (Live)</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#60706A] block mb-1">
                Filter by Village
              </label>
              <select
                value={villageFilter}
                onChange={e => setVillageFilter(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#D9DED0] text-xs text-[#263238] font-semibold focus:outline-none focus:ring-1 focus:ring-[#556B2F]"
              >
                <option value="ALL">All Villages</option>
                {uniqueVillages.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List Content: Vehicles or Shipments */}
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {activeTab === 'VEHICLES' ? (
              filteredVehicles.length === 0 ? (
                <div className="py-12 text-center text-[#60706A] text-xs">
                  No vehicles found matching filters.
                </div>
              ) : (
                filteredVehicles.map(vehicle => {
                  const isSelected = selectedVehicle.id === vehicle.id;
                  const activeShipment = shipments.find(s => s.assignedVehicleId === vehicle.id || s.id === vehicle.activeShipmentId);

                  return (
                    <div
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs space-y-2.5 ${
                        isSelected
                          ? 'bg-[#E7EBD9] border-[#556B2F] shadow-xs ring-1 ring-[#556B2F]/30'
                          : 'bg-white border-[#D9DED0] hover:border-[#556B2F]/50 hover:bg-[#F5F3EA]'
                      }`}
                    >
                      {/* Vehicle Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-[#556B2F] text-sm">
                              {vehicle.vehicleNumber}
                            </span>
                            {renderStatusBadge(vehicle.status)}
                          </div>
                          <div className="text-[11px] text-[#60706A] mt-0.5">
                            Driver: <strong className="text-[#263238]">{vehicle.driverName}</strong> • {vehicle.makeModel}
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-[#60706A]">
                          {vehicle.speedKmh} km/h
                        </span>
                      </div>

                      {/* Location & Capacity */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#D9DED0]">
                        <div>
                          <span className="text-[#60706A] block text-[10px]">Current Location:</span>
                          <span className="font-semibold text-[#263238] truncate block">
                            {vehicle.currentLocation.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#60706A] block text-[10px]">Capacity:</span>
                          <span className="font-semibold text-[#C59D5F]">
                            {vehicle.availablePayloadKg} kg avail / {vehicle.maxPayloadKg} kg
                          </span>
                        </div>
                      </div>

                      {/* Shipment & Last Updated */}
                      <div className="flex items-center justify-between text-[10px] text-[#60706A] pt-1 border-t border-[#D9DED0]">
                        <div className="truncate max-w-[170px]">
                          {activeShipment ? (
                            <span className="text-[#556B2F] font-semibold truncate block">
                              📦 {activeShipment.trackingNumber} ({activeShipment.weightKg} kg)
                            </span>
                          ) : (
                            <span className="text-[#8A918B] italic">No assigned cargo</span>
                          )}
                        </div>
                        <div>
                          {renderLiveIndicator(vehicle)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* SHIPMENTS TAB */
              filteredShipments.length === 0 ? (
                <div className="py-12 text-center text-[#60706A] text-xs">
                  No shipments found matching filters.
                </div>
              ) : (
                filteredShipments.map(shipment => {
                  const isSelected = selectedShipment?.id === shipment.id;

                  return (
                    <div
                      key={shipment.id}
                      onClick={() => setSelectedShipment(shipment)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs space-y-2.5 ${
                        isSelected
                          ? 'bg-[#E7EBD9] border-[#556B2F] shadow-xs ring-1 ring-[#556B2F]/30'
                          : 'bg-white border-[#D9DED0] hover:border-[#556B2F]/50 hover:bg-[#F5F3EA]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-black text-[#C59D5F] text-xs">
                            {shipment.trackingNumber}
                          </span>
                          <div className="font-bold text-[#263238] mt-0.5">{shipment.productName}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#E7EBD9] text-[#556B2F]">
                          {shipment.weightKg} kg
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-[#263238] bg-[#F5F3EA] p-2 rounded-xl border border-[#D9DED0]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#C59D5F] shrink-0"></span>
                          <span className="truncate"><strong>Pickup:</strong> {shipment.origin.village || shipment.origin.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#263238] shrink-0"></span>
                          <span className="truncate"><strong>Dest:</strong> {shipment.destination.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#60706A]">
                        <span>Sender: <strong className="text-[#263238]">{shipment.senderName}</strong></span>
                        <span className="font-bold text-[#556B2F]">{shipment.status.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT COLUMN: INTERACTIVE LEAFLET MAP + SELECTED VEHICLE CARD      */}
        {/* ================================================================== */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* THE LEAFLET MAP CONTAINER */}
          <div className="rounded-3xl overflow-hidden border border-[#D9DED0] shadow-xs bg-white">
            <MaharashtraMap
              height="580px"
              selectedVehicleId={selectedVehicle?.id}
              selectedShipmentId={selectedShipment?.id}
              onSelectVehicle={v => setSelectedVehicle(v)}
              onSelectShipment={s => setSelectedShipment(s)}
              filterStatus={statusFilter}
              filterVillage={villageFilter}
              searchQuery={searchQuery}
            />
          </div>

          {/* ACTIVE SELECTED VEHICLE & TELEMETRY CARD */}
          {selectedVehicle && (
            <div className="bg-white p-6 rounded-3xl border border-[#D9DED0] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9DED0] pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#E7EBD9] text-[#556B2F] border border-[#D9DED0]">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-mono font-black text-[#263238]">
                        {selectedVehicle.vehicleNumber}
                      </span>
                      {renderStatusBadge(selectedVehicle.status)}
                    </div>
                    <div className="text-xs text-[#60706A] mt-0.5">
                      {selectedVehicle.makeModel} • Driver: <strong className="text-[#263238]">{selectedVehicle.driverName}</strong> ({selectedVehicle.driverPhone})
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-[#60706A] uppercase tracking-wider">Telemetry Status</div>
                  {renderLiveIndicator(selectedVehicle)}
                </div>
              </div>

              {/* SPECIFICATIONS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F5F3EA] border border-[#D9DED0]">
                  <span className="text-[#60706A] block text-[10px] uppercase font-bold">Current Location</span>
                  <span className="font-bold text-[#263238] text-xs block mt-1">
                    {selectedVehicle.currentLocation.name}
                  </span>
                  <span className="text-[10px] text-[#60706A]">
                    {selectedVehicle.currentLocation.coordinates.lat.toFixed(4)}, {selectedVehicle.currentLocation.coordinates.lng.toFixed(4)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F3EA] border border-[#D9DED0]">
                  <span className="text-[#60706A] block text-[10px] uppercase font-bold">Payload Utilization</span>
                  <span className="font-bold text-[#C59D5F] text-xs block mt-1">
                    {selectedVehicle.currentPayloadKg} / {selectedVehicle.maxPayloadKg} kg
                  </span>
                  <span className="text-[10px] text-[#556B2F] font-semibold">
                    {selectedVehicle.availablePayloadKg} kg free space
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F3EA] border border-[#D9DED0]">
                  <span className="text-[#60706A] block text-[10px] uppercase font-bold">Live Speed</span>
                  <span className="font-black text-[#556B2F] text-base block mt-0.5 font-mono">
                    {selectedVehicle.speedKmh} km/h
                  </span>
                  <span className="text-[10px] text-[#60706A]">
                    Heading: {selectedVehicle.heading || 0}°
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F3EA] border border-[#D9DED0]">
                  <span className="text-[#60706A] block text-[10px] uppercase font-bold">Geofence Proximity</span>
                  <span className="font-bold text-[#556B2F] text-xs block mt-1">
                    {selectedVehicle.geofenceStatus ? selectedVehicle.geofenceStatus.replace(/_/g, ' ') : 'En Route / Active'}
                  </span>
                  <span className="text-[10px] text-[#60706A]">
                    Radius: 200m zone
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
