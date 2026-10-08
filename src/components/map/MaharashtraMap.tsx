import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import L from 'leaflet';
import { Vehicle, Hub, Shipment } from '../../types';
import { useLogistics } from '../../context/LogisticsContext';
import { useLanguage } from '../../context/LanguageContext';
import { useUserLocation, MAHARASHTRA_VILLAGES } from '../../context/LocationContext';
import { calculateDistanceKm } from '../../services/transporterMatcher';
import { 
  Truck, 
  MapPin, 
  Sparkles, 
  ChevronRight,
  Layers,
  Building2,
  Navigation,
  Compass,
  Maximize2,
  Minimize2,
  Route as RouteIcon,
  HelpCircle,
  Clock,
  Package,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LocateFixed,
  Radio,
  WifiOff
} from 'lucide-react';

// Maharashtra geographic boundaries
const MAHARASHTRA_BOUNDS = {
  north: 22.2,
  south: 15.6,
  west: 72.4,
  east: 81.0
};

// Helper: Generates realistic road-like curved polylines between waypoints
function createRoadPolyline(points: [number, number][]): [number, number][] {
  if (points.length < 2) return points;
  const result: [number, number][] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    result.push(p1);

    const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.max(3, Math.min(10, Math.round(dist * 75)));
    
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const perpX = -dy;
    const perpY = dx;
    const norm = Math.hypot(perpX, perpY) || 1;

    for (let step = 1; step < steps; step++) {
      const t = step / steps;
      const baseLat = p1[0] + dx * t;
      const baseLng = p1[1] + dy * t;
      const bend = Math.sin(t * Math.PI) * 0.003 * Math.sin(t * Math.PI * 2 + i * 1.5);
      const curvedLat = baseLat + (perpX / norm) * bend;
      const curvedLng = baseLng + (perpY / norm) * bend;
      result.push([curvedLat, curvedLng]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

// Vehicle status color mapping
const getVehicleStatusColor = (status: Vehicle['status']): string => {
  switch (status) {
    case 'IN_TRANSIT':
      return '#2E7D32'; // Forest / Olive Green
    case 'ASSIGNED':
    case 'EN_ROUTE_PICKUP':
      return '#C59D5F'; // Warm Gold
    case 'DELIVERED':
      return '#263238'; // Charcoal
    case 'IDLE':
    case 'RETURNING':
    default:
      return '#556B2F'; // Olive
  }
};

// Custom SVG Icons
function getTruckSvgUri(color: string, heading: number, vehicleNumber: string, isSelected: boolean): string {
  const size = isSelected ? 48 : 40;
  const shortNum = vehicleNumber.split('-').slice(0, 2).join('-');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 16}" viewBox="0 0 ${size} ${size + 16}">
    <g transform="translate(${size/2}, ${size/2}) rotate(${heading}) translate(-${size/2}, -${size/2})">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="${isSelected ? '#C59D5F' : '#FFFFFF'}" stroke-width="${isSelected ? 3 : 2}"/>
      <g transform="translate(${(size - 20)/2}, ${(size - 20)/2}) scale(0.85)" stroke="#FFFFFF" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
        <path d="M15 18H9"/>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
        <circle cx="17" cy="18" r="2" fill="#FFFFFF"/>
        <circle cx="7" cy="18" r="2" fill="#FFFFFF"/>
      </g>
    </g>
    <rect x="${(size - 36)/2}" y="${size + 1}" width="36" height="13" rx="3" fill="#263238" stroke="#D9DED0" stroke-width="0.8"/>
    <text x="${size/2}" y="${size + 10.5}" fill="#F5F3EA" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">${shortNum}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function getShipmentSvgUri(isSelected: boolean, isDelivered: boolean): string {
  const color = isDelivered ? '#263238' : '#C59D5F';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
    <path d="M17 0 C7.6 0 0 7.6 0 17 C0 29.7 17 42 17 42 C17 42 34 29.7 34 17 C34 7.6 26.4 0 17 0 Z" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
    <g transform="translate(8, 7) scale(0.75)" stroke="#FFFFFF" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m7.5 4.27 9 5.15"/>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.3 7 8.7 5 8.7-5"/>
      <path d="M12 22V12"/>
    </g>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function getHubSvgUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect x="2" y="2" width="28" height="28" rx="6" fill="#263238" stroke="#FFFFFF" stroke-width="2"/>
    <g transform="translate(6, 6) scale(0.83)" stroke="#C59D5F" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v8h4"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/>
      <path d="M10 6h4"/>
      <path d="M10 10h4"/>
      <path d="M10 14h4"/>
      <path d="M10 18h4"/>
    </g>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function getUserSvgUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#1A73E8" fill-opacity="0.25"/>
    <circle cx="16" cy="16" r="8" fill="#1A73E8" stroke="#FFFFFF" stroke-width="2.5"/>
    <circle cx="16" cy="16" r="3" fill="#FFFFFF"/>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

// In-memory Directions cache
const directionsCache = new Map<string, { lat: number; lng: number }[]>();

interface MaharashtraMapProps {
  height?: string;
  isFullScreenMode?: boolean;
  selectedVehicleId?: string;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  selectedShipmentId?: string;
  onSelectShipment?: (shipment: Shipment) => void;
  filterStatus?: string;
  filterVillage?: string;
  searchQuery?: string;
}

export const MaharashtraMap: React.FC<MaharashtraMapProps> = ({
  height = '580px',
  isFullScreenMode = false,
  selectedVehicleId,
  onSelectVehicle,
  selectedShipmentId,
  onSelectShipment,
  filterStatus = 'ALL',
  filterVillage = 'ALL',
  searchQuery = ''
}) => {
  const { vehicles, hubs, shipments, activeRoute } = useLogistics();
  const { t } = useLanguage();
  const {
    userLocation,
    locationMode,
    locationName,
    accuracyMeters,
    setShowPermissionModal,
    setVillage,
    setDemoDapoli,
    broadcastTransporters
  } = useUserLocation();

  // Engine state
  const [mapEngine, setMapEngine] = useState<'LOADING' | 'GOOGLE' | 'LEAFLET'>('LOADING');
  const [googleLoadError, setGoogleLoadError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [hasTileErrorOffline, setHasTileErrorOffline] = useState(false);

  // Network listener for map offline fallback
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setHasTileErrorOffline(false);
      if (lMapRef.current) {
        lMapRef.current.invalidateSize();
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Layer Visibility
  const [showVehicles, setShowVehicles] = useState(true);
  const [showHubs, setShowHubs] = useState(true);
  const [showShipments, setShowShipments] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(isFullScreenMode);

  // Moving simulated vehicle interpolation state
  const [animatedVehicles, setAnimatedVehicles] = useState<Vehicle[]>(vehicles);

  // Containers
  const googleMapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapContainerRef = useRef<HTMLDivElement>(null);

  // Google Maps references
  const gMapRef = useRef<google.maps.Map | null>(null);
  const gClustererRef = useRef<MarkerClusterer | null>(null);
  const gMarkersRef = useRef<google.maps.Marker[]>([]);
  const gPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const gUserMarkerRef = useRef<google.maps.Marker | null>(null);
  const gUserAccuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const gPoolZoneCircleRef = useRef<google.maps.Circle | null>(null);
  const gDirectionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const gInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Leaflet references
  const lMapRef = useRef<L.Map | null>(null);
  const lMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const lRoutesGroupRef = useRef<L.LayerGroup | null>(null);
  const lUserLayerRef = useRef<L.LayerGroup | null>(null);

  // Pool zone statistics (within 5 km of user pickup point)
  const poolZoneStats = useMemo(() => {
    const vehiclesInside = vehicles.filter((v) => {
      const d = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        v.currentLocation.coordinates.lat,
        v.currentLocation.coordinates.lng
      );
      return d <= 5.0;
    });

    const shipmentsInside = shipments.filter((s) => {
      const d = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        s.origin.coordinates.lat,
        s.origin.coordinates.lng
      );
      return d <= 5.0;
    });

    return {
      vehiclesCount: vehiclesInside.length,
      shipmentsCount: shipmentsInside.length
    };
  }, [userLocation, vehicles, shipments]);

  // Smooth movement interpolation ticker for simulated vehicles (25 to 45 km/h)
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedVehicles((prevList) => {
        return prevList.map((veh) => {
          // If this vehicle is broadcasting real device GPS, prioritize it
          const liveBroadcast = broadcastTransporters[veh.id];
          if (liveBroadcast && liveBroadcast.isRealGps) {
            return {
              ...veh,
              currentLocation: {
                ...veh.currentLocation,
                coordinates: liveBroadcast.coordinates
              },
              speedKmh: liveBroadcast.speedKmh,
              heading: liveBroadcast.heading,
              lastLocationUpdate: new Date(liveBroadcast.timestamp).toISOString()
            };
          }

          // Otherwise, simulate smooth road-following drift if moving
          if (veh.status === 'IN_TRANSIT' || veh.status === 'RETURNING') {
            const speed = veh.speedKmh || 34;
            // Advance delta by ~0.00015 lat/lng based on heading
            const rad = ((veh.heading || 60) * Math.PI) / 180;
            const step = (speed / 3600) * 0.006;
            const newLat = veh.currentLocation.coordinates.lat + Math.cos(rad) * step;
            const newLng = veh.currentLocation.coordinates.lng + Math.sin(rad) * step;

            // Constrain within Maharashtra
            const lat = Math.max(16.0, Math.min(21.5, newLat));
            const lng = Math.max(72.8, Math.min(79.0, newLng));

            return {
              ...veh,
              currentLocation: {
                ...veh.currentLocation,
                coordinates: { lat, lng }
              }
            };
          }

          return veh;
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [broadcastTransporters]);

  // Sync state when master vehicles change
  useEffect(() => {
    setAnimatedVehicles((prev) =>
      vehicles.map((v) => {
        const found = prev.find((p) => p.id === v.id);
        return found ? { ...v, currentLocation: found.currentLocation, heading: found.heading } : v;
      })
    );
  }, [vehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return animatedVehicles.filter((v) => {
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'AVAILABLE' && v.status !== 'IDLE' && v.status !== 'RETURNING') return false;
        if (filterStatus === 'IN_TRANSIT' && v.status !== 'IN_TRANSIT') return false;
        if (filterStatus === 'ASSIGNED' && v.status !== 'ASSIGNED' && v.status !== 'EN_ROUTE_PICKUP') return false;
        if (filterStatus === 'DELIVERED' && v.status !== 'DELIVERED') return false;
      }
      if (filterVillage !== 'ALL') {
        const matchLoc =
          v.currentLocation.village?.toLowerCase() === filterVillage.toLowerCase() ||
          v.currentLocation.taluka?.toLowerCase() === filterVillage.toLowerCase() ||
          v.currentLocation.district?.toLowerCase() === filterVillage.toLowerCase();
        if (!matchLoc) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          v.vehicleNumber.toLowerCase().includes(q) ||
          v.driverName.toLowerCase().includes(q) ||
          v.currentLocation.name.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [animatedVehicles, filterStatus, filterVillage, searchQuery]);

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      if (filterVillage !== 'ALL') {
        const originMatch =
          s.origin.village?.toLowerCase() === filterVillage.toLowerCase() ||
          s.origin.taluka?.toLowerCase() === filterVillage.toLowerCase();
        const destMatch =
          s.destination.village?.toLowerCase() === filterVillage.toLowerCase() ||
          s.destination.taluka?.toLowerCase() === filterVillage.toLowerCase();
        if (!originMatch && !destMatch) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          s.trackingNumber.toLowerCase().includes(q) ||
          s.productName.toLowerCase().includes(q) ||
          s.senderName.toLowerCase().includes(q) ||
          s.origin.name.toLowerCase().includes(q) ||
          s.destination.name.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [shipments, filterVillage, searchQuery]);

  // =========================================================================
  // INITIALIZATION: Load Google Maps with Loader or fallback to Leaflet
  // =========================================================================
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'YOUR_GOOGLE_MAPS_API_KEY') {
      // Key missing: automatic fallback to Leaflet with CARTO Voyager tiles
      setMapEngine('LEAFLET');
      return;
    }

    try {
      setOptions({
        key: apiKey,
        v: 'weekly'
      });

      Promise.all([
        importLibrary('maps'),
        importLibrary('geometry')
      ])
        .then(() => {
          setMapEngine('GOOGLE');
        })
        .catch((err: any) => {
          console.warn('Google Maps API failed to load, falling back to Leaflet:', err);
          setGoogleLoadError(err?.message || 'Failed to load Google Maps script');
          setMapEngine('LEAFLET');
        });
    } catch (err: any) {
      console.warn('Google Maps setOptions error, falling back to Leaflet:', err);
      setGoogleLoadError(err?.message || 'Failed to initialize Google Maps');
      setMapEngine('LEAFLET');
    }
  }, []);

  // =========================================================================
  // GOOGLE MAPS ENGINE SETUP
  // =========================================================================
  useEffect(() => {
    if (mapEngine !== 'GOOGLE' || !googleMapContainerRef.current) return;

    if (!gMapRef.current) {
      const initialCenter = new google.maps.LatLng(userLocation.lat, userLocation.lng);

      const map = new google.maps.Map(googleMapContainerRef.current, {
        center: initialCenter,
        zoom: 11,
        minZoom: 7,
        maxZoom: 17,
        // Disable default clutter
        streetViewControl: false,
        fullscreenControl: false,
        // Keep zoom & map/satellite toggle
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_LEFT
        },
        restriction: {
          latLngBounds: MAHARASHTRA_BOUNDS,
          strictBounds: false
        }
      });

      gMapRef.current = map;
      gDirectionsServiceRef.current = new google.maps.DirectionsService();
      gInfoWindowRef.current = new google.maps.InfoWindow();

      // Setup Marker Clusterer
      gClustererRef.current = new MarkerClusterer({
        map,
        markers: []
      });

      // Fit bounds to user + nearby vehicles + primary hub
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(initialCenter);
      vehicles.slice(0, 3).forEach((v) => {
        bounds.extend(new google.maps.LatLng(v.currentLocation.coordinates.lat, v.currentLocation.coordinates.lng));
      });
      hubs.slice(0, 1).forEach((h) => {
        bounds.extend(new google.maps.LatLng(h.coordinates.lat, h.coordinates.lng));
      });
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [mapEngine]);

  // Update Google Maps markers, user pulsing dot, pool zone, and routes
  useEffect(() => {
    if (mapEngine !== 'GOOGLE' || !gMapRef.current) return;

    const map = gMapRef.current;
    const infoWindow = gInfoWindowRef.current;

    // 1. Clear existing markers and polylines
    if (gClustererRef.current) {
      gClustererRef.current.clearMarkers();
    }
    gMarkersRef.current.forEach((m) => m.setMap(null));
    gMarkersRef.current = [];

    gPolylinesRef.current.forEach((p) => p.setMap(null));
    gPolylinesRef.current = [];

    // 2. User Location Marker & Accuracy Circle
    if (gUserMarkerRef.current) gUserMarkerRef.current.setMap(null);
    if (gUserAccuracyCircleRef.current) gUserAccuracyCircleRef.current.setMap(null);
    if (gPoolZoneCircleRef.current) gPoolZoneCircleRef.current.setMap(null);

    const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);

    // Blue Pulsing User Dot
    const userMarker = new google.maps.Marker({
      position: userLatLng,
      map,
      title: 'You are here (Pickup Point)',
      icon: {
        url: getUserSvgUri(),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      },
      zIndex: 999
    });
    gUserMarkerRef.current = userMarker;

    // Accuracy Circle
    const accuracyRadius = accuracyMeters || 120;
    const accuracyCircle = new google.maps.Circle({
      map,
      center: userLatLng,
      radius: accuracyRadius,
      fillColor: '#1A73E8',
      fillOpacity: 0.12,
      strokeColor: '#1A73E8',
      strokeOpacity: 0.45,
      strokeWeight: 1,
      zIndex: 1
    });
    gUserAccuracyCircleRef.current = accuracyCircle;

    // 5 km Translucent Pool Zone Circle
    const poolCircle = new google.maps.Circle({
      map,
      center: userLatLng,
      radius: 5000, // 5 km
      fillColor: '#556B2F',
      fillOpacity: 0.08,
      strokeColor: '#556B2F',
      strokeOpacity: 0.5,
      strokeWeight: 1.5,
      zIndex: 2
    });
    gPoolZoneCircleRef.current = poolCircle;

    const markersToCluster: google.maps.Marker[] = [];

    // 3. Vehicles
    if (showVehicles) {
      filteredVehicles.forEach((veh) => {
        const isSelected = selectedVehicleId === veh.id;
        const color = getVehicleStatusColor(veh.status);
        const heading = veh.heading || 45;
        const liveGps = broadcastTransporters[veh.id]?.isRealGps;

        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(veh.currentLocation.coordinates.lat, veh.currentLocation.coordinates.lng),
          map: isSelected ? map : undefined, // clustered markers will be added to clusterer
          icon: {
            url: getTruckSvgUri(color, heading, veh.vehicleNumber, isSelected),
            scaledSize: new google.maps.Size(isSelected ? 48 : 40, isSelected ? 64 : 56),
            anchor: new google.maps.Point(isSelected ? 24 : 20, isSelected ? 24 : 20)
          },
          title: `${veh.vehicleNumber} (${veh.driverName})`,
          zIndex: isSelected ? 500 : 200
        });

        marker.addListener('click', () => {
          if (onSelectVehicle) onSelectVehicle(veh);

          const contentString = `
            <div style="font-family: inherit; min-width: 230px; padding: 4px; color: #263238;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #D9DED0; padding-bottom: 6px;">
                <span style="font-weight: 800; font-family: monospace; color: #556B2F; font-size: 14px;">${veh.vehicleNumber}</span>
                <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${liveGps ? '#E7EBD9' : '#FAF6EE'}; color: ${liveGps ? '#2E7D32' : '#C59D5F'}; font-weight: bold;">
                  ${liveGps ? 'LIVE (GPS)' : 'LIVE (Simulated)'}
                </span>
              </div>
              <div style="margin-top: 6px; font-size: 12px; line-height: 1.5;">
                <div><strong>Driver:</strong> ${veh.driverName} (${veh.driverPhone})</div>
                <div><strong>Available:</strong> <span style="color: #C59D5F; font-weight: bold;">${veh.availablePayloadKg} kg</span> / ${veh.maxPayloadKg} kg</div>
                <div><strong>ETA:</strong> ${veh.etaMinutes || 25} mins (${veh.speedKmh || 35} km/h)</div>
                <div><strong>Location:</strong> ${veh.currentLocation.name}</div>
              </div>
              <div style="margin-top: 10px; text-align: right;">
                <button id="gmap-select-btn-${veh.id}" style="background: #556B2F; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer;">
                  Select Vehicle
                </button>
              </div>
            </div>
          `;

          if (infoWindow) {
            infoWindow.setContent(contentString);
            infoWindow.open(map, marker);

            google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
              const btn = document.getElementById(`gmap-select-btn-${veh.id}`);
              if (btn && onSelectVehicle) {
                btn.onclick = () => onSelectVehicle(veh);
              }
            });
          }
        });

        if (isSelected) {
          gMarkersRef.current.push(marker);
        } else {
          markersToCluster.push(marker);
        }
      });
    }

    // 4. Hubs
    if (showHubs) {
      hubs.forEach((hub) => {
        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(hub.coordinates.lat, hub.coordinates.lng),
          icon: {
            url: getHubSvgUri(),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          },
          title: hub.name,
          zIndex: 150
        });

        marker.addListener('click', () => {
          if (infoWindow) {
            infoWindow.setContent(`
              <div style="font-family: inherit; min-width: 220px; padding: 4px; color: #263238;">
                <div style="font-size: 10px; font-weight: bold; color: #607D8B; text-transform: uppercase;">
                  ${hub.type.replace(/_/g, ' ')}
                </div>
                <div style="font-size: 14px; font-weight: bold; color: #263238; margin-top: 2px;">
                  ${hub.name}
                </div>
                <div style="font-size: 12px; color: #60706A; margin-top: 2px;">
                  ${hub.address}
                </div>
                <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #D9DED0; font-size: 12px;">
                  <div><strong>Capacity:</strong> ${hub.currentOccupancyKg} / ${hub.totalCapacityKg} kg</div>
                  <div style="color: #556B2F; font-weight: 600; margin-top: 2px;">Cold Storage: ${hub.hasColdStorage ? 'Available' : 'No'}</div>
                </div>
              </div>
            `);
            infoWindow.open(map, marker);
          }
        });

        markersToCluster.push(marker);
      });
    }

    // 5. Shipments
    if (showShipments) {
      filteredShipments.forEach((shipment) => {
        const isDelivered = shipment.status === 'DELIVERED';
        const isSelected = selectedShipmentId === shipment.id;

        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(shipment.origin.coordinates.lat, shipment.origin.coordinates.lng),
          icon: {
            url: getShipmentSvgUri(isSelected, isDelivered),
            scaledSize: new google.maps.Size(30, 38),
            anchor: new google.maps.Point(15, 38)
          },
          title: `Shipment ${shipment.trackingNumber}`,
          zIndex: 160
        });

        marker.addListener('click', () => {
          if (onSelectShipment) onSelectShipment(shipment);
          if (infoWindow) {
            infoWindow.setContent(`
              <div style="font-family: inherit; min-width: 230px; padding: 4px; color: #263238;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #D9DED0; padding-bottom: 4px;">
                  <span style="font-weight: bold; font-family: monospace; color: #C59D5F; font-size: 13px;">${shipment.trackingNumber}</span>
                  <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #E7EBD9; color: #556B2F; font-weight: bold;">
                    PICKUP
                  </span>
                </div>
                <div style="font-size: 13px; font-weight: bold; color: #263238; margin-top: 6px;">
                  ${shipment.productName} (${shipment.weightKg} kg)
                </div>
                <div style="font-size: 11px; color: #60706A; margin-top: 2px;">
                  <strong>Origin:</strong> ${shipment.origin.village || shipment.origin.name}
                </div>
                <div style="font-size: 11px; color: #60706A;">
                  <strong>Destination:</strong> ${shipment.destination.name}
                </div>
              </div>
            `);
            infoWindow.open(map, marker);
          }
        });

        markersToCluster.push(marker);
      });
    }

    if (gClustererRef.current) {
      gClustererRef.current.addMarkers(markersToCluster);
    }

    // 6. Road Routes (DirectionsService or cached road polyline)
    if (showRoutes) {
      // By default show selected vehicle route; if none selected or all toggled, show key active paths
      const targetVehicles = selectedVehicleId
        ? filteredVehicles.filter((v) => v.id === selectedVehicleId)
        : filteredVehicles.filter((v) => v.status === 'IN_TRANSIT').slice(0, 2);

      targetVehicles.forEach((veh) => {
        const origin = veh.currentLocation.coordinates;
        // Nearest hub or destination
        const dest = hubs[0]?.coordinates || { lat: 17.7167, lng: 73.3833 };

        const cacheKey = `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}->${dest.lat.toFixed(3)},${dest.lng.toFixed(3)}`;
        const cached = directionsCache.get(cacheKey);

        const drawPolyline = (pathPoints: { lat: number; lng: number }[], distanceText?: string) => {
          const polylinePath = pathPoints.map((p) => new google.maps.LatLng(p.lat, p.lng));

          // Outer casing
          const casing = new google.maps.Polyline({
            path: polylinePath,
            map,
            strokeColor: '#263238',
            strokeWeight: 6,
            strokeOpacity: 0.8,
            zIndex: 10
          });
          gPolylinesRef.current.push(casing);

          // Inner solid green (or amber if returning)
          const isReturn = veh.status === 'RETURNING';
          const innerLine = new google.maps.Polyline({
            path: polylinePath,
            map,
            strokeColor: isReturn ? '#D97706' : '#2E7D32',
            strokeWeight: 3.5,
            strokeOpacity: 0.95,
            zIndex: 11
          });
          gPolylinesRef.current.push(innerLine);

          // Midpoint distance and ETA badge
          if (polylinePath.length > 2) {
            const midIndex = Math.floor(polylinePath.length / 2);
            const midCoord = polylinePath[midIndex];
            const distKm = Math.round(calculateDistanceKm(origin.lat, origin.lng, dest.lat, dest.lng));
            const etaMin = Math.round(distKm * 1.8);

            const midMarker = new google.maps.Marker({
              position: midCoord,
              map,
              label: {
                text: `${distKm} km • ${etaMin}m`,
                color: '#263238',
                fontSize: '10px',
                fontWeight: 'bold',
                className: 'gmap-route-badge'
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 0
              },
              zIndex: 25
            });
            gPolylinesRef.current.push(midMarker as any);
          }
        };

        if (cached) {
          drawPolyline(cached);
        } else if (gDirectionsServiceRef.current) {
          gDirectionsServiceRef.current.route(
            {
              origin: new google.maps.LatLng(origin.lat, origin.lng),
              destination: new google.maps.LatLng(dest.lat, dest.lng),
              travelMode: google.maps.TravelMode.DRIVING
            },
            (res: any, status: any) => {
              if (status === 'OK' && res && res.routes && res.routes[0]) {
                const path = res.routes[0].overview_path.map((p: any) => ({ lat: p.lat(), lng: p.lng() }));
                directionsCache.set(cacheKey, path);
                drawPolyline(path, res.routes[0].legs[0]?.distance?.text);
              } else {
                // Fallback to precomputed road polyline
                const fallbackPts = createRoadPolyline([[origin.lat, origin.lng], [dest.lat, dest.lng]]).map(
                  ([lat, lng]) => ({ lat, lng })
                );
                directionsCache.set(cacheKey, fallbackPts);
                drawPolyline(fallbackPts);
              }
            }
          );
        }
      });
    }
  }, [
    mapEngine,
    filteredVehicles,
    filteredShipments,
    hubs,
    showVehicles,
    showHubs,
    showShipments,
    showRoutes,
    selectedVehicleId,
    selectedShipmentId,
    userLocation,
    accuracyMeters
  ]);

  // Sync pan when selectedVehicleId changes on Google Maps
  useEffect(() => {
    if (mapEngine === 'GOOGLE' && gMapRef.current && selectedVehicleId) {
      const match = vehicles.find((v) => v.id === selectedVehicleId);
      if (match) {
        gMapRef.current.panTo(
          new google.maps.LatLng(match.currentLocation.coordinates.lat, match.currentLocation.coordinates.lng)
        );
        gMapRef.current.setZoom(13);
      }
    }
  }, [selectedVehicleId, vehicles, mapEngine]);

  // =========================================================================
  // LEAFLET FALLBACK ENGINE (OpenStreetMap + Esri Fallback)
  // =========================================================================
  useEffect(() => {
    if (mapEngine !== 'LEAFLET' || !leafletMapContainerRef.current) return;

    if (!lMapRef.current) {
      const map = L.map(leafletMapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 11,
        zoomControl: false,
        minZoom: 7,
        maxZoom: 18,
        maxBounds: [
          [MAHARASHTRA_BOUNDS.south, MAHARASHTRA_BOUNDS.west],
          [MAHARASHTRA_BOUNDS.north, MAHARASHTRA_BOUNDS.east]
        ]
      });

      // Primary: OpenStreetMap standard tiles
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abc',
        maxZoom: 19,
        crossOrigin: true
      });

      let fallbackTriggered = false;
      let errorCount = 0;

      osmLayer.on('tileerror', () => {
        errorCount++;
        // Switch automatically to second fallback source if primary fails
        if (!fallbackTriggered && errorCount >= 2 && lMapRef.current) {
          fallbackTriggered = true;
          console.warn('Primary OSM tile failed to load, automatically switching to Esri World Street Map fallback.');
          try {
            lMapRef.current.removeLayer(osmLayer);
            const esriLayer = L.tileLayer(
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
              {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, TomTom',
                maxZoom: 19,
                crossOrigin: true
              }
            );
            esriLayer.on('tileerror', () => {
              if (!navigator.onLine) {
                setHasTileErrorOffline(true);
              }
            });
            esriLayer.addTo(lMapRef.current);
          } catch (err) {
            console.error('Error switching to fallback tiles:', err);
          }
        } else if (!navigator.onLine && errorCount >= 3) {
          setHasTileErrorOffline(true);
        }
      });

      osmLayer.addTo(map);

      // Add Zoom control bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      lRoutesGroupRef.current = L.layerGroup().addTo(map);
      lMarkersGroupRef.current = L.layerGroup().addTo(map);
      lUserLayerRef.current = L.layerGroup().addTo(map);
      lMapRef.current = map;

      // Initial fitBounds: show markers spread across Dapoli-Khed area with padding and maxZoom 12
      const markerCoords: [number, number][] = [
        [userLocation.lat, userLocation.lng],
        ...hubs.map((h) => [h.coordinates.lat, h.coordinates.lng] as [number, number]),
        ...vehicles.map((v) => [v.currentLocation.coordinates.lat, v.currentLocation.coordinates.lng] as [number, number]),
        ...shipments.map((s) => [s.origin.coordinates.lat, s.origin.coordinates.lng] as [number, number])
      ];

      const localCoords = markerCoords.filter(
        ([lat, lng]) => lat >= 17.2 && lat <= 18.2 && lng >= 72.8 && lng <= 73.8
      );

      if (localCoords.length > 0) {
        const bounds = L.latLngBounds(localCoords);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 12 });
      } else {
        const defaultBounds = L.latLngBounds([17.65, 73.15], [17.78, 73.42]);
        map.fitBounds(defaultBounds, { padding: [45, 45], maxZoom: 12 });
      }

      // Ensure invalidateSize runs after layout so no tiles are blank or cropped
      setTimeout(() => {
        if (lMapRef.current) lMapRef.current.invalidateSize();
      }, 150);
      setTimeout(() => {
        if (lMapRef.current) lMapRef.current.invalidateSize();
      }, 500);

      const handleResize = () => {
        if (lMapRef.current) lMapRef.current.invalidateSize();
      };
      window.addEventListener('resize', handleResize);
    }
  }, [mapEngine]);

  // Update Leaflet Layers dynamically
  useEffect(() => {
    if (mapEngine !== 'LEAFLET' || !lMapRef.current || !lMarkersGroupRef.current || !lRoutesGroupRef.current || !lUserLayerRef.current) {
      return;
    }

    const markersGroup = lMarkersGroupRef.current;
    const routesGroup = lRoutesGroupRef.current;
    const userLayer = lUserLayerRef.current;

    markersGroup.clearLayers();
    routesGroup.clearLayers();
    userLayer.clearLayers();

    // 1. User Location Marker & 5 km Pool Zone Circle
    const userIcon = L.divIcon({
      className: 'custom-user-dot',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <span style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: #1A73E8; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <div style="width: 16px; height: 16px; border-radius: 50%; background: #1A73E8; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
    userMarker.bindTooltip('You are here (Pickup Point)', { permanent: false, direction: 'top' });
    userMarker.addTo(userLayer);

    // 5 km Pool Zone Circle
    L.circle([userLocation.lat, userLocation.lng], {
      radius: 5000,
      color: '#556B2F',
      weight: 1.5,
      opacity: 0.6,
      fillColor: '#556B2F',
      fillOpacity: 0.08
    }).addTo(userLayer);

    // 2. Hubs
    if (showHubs) {
      hubs.forEach((hub) => {
        const hubIcon = L.icon({
          iconUrl: getHubSvgUri(),
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        const marker = L.marker([hub.coordinates.lat, hub.coordinates.lng], { icon: hubIcon });
        marker.bindPopup(`
          <div style="font-family: inherit; min-width: 220px; padding: 4px; color: #263238;">
            <div style="font-size: 10px; font-weight: bold; color: #607D8B; text-transform: uppercase;">${hub.type.replace(/_/g, ' ')}</div>
            <div style="font-size: 14px; font-weight: bold; color: #263238; margin-top: 2px;">${hub.name}</div>
            <div style="font-size: 12px; color: #60706A; margin-top: 2px;">${hub.address}</div>
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #D9DED0; font-size: 12px;">
              <div><strong>Capacity:</strong> ${hub.currentOccupancyKg} / ${hub.totalCapacityKg} kg</div>
              <div style="color: #556B2F; font-weight: 600; margin-top: 2px;">Cold Storage: ${hub.hasColdStorage ? 'Available' : 'No'}</div>
            </div>
          </div>
        `);
        marker.addTo(markersGroup);
      });
    }

    // 3. Vehicles
    if (showVehicles) {
      filteredVehicles.forEach((veh) => {
        const isSelected = selectedVehicleId === veh.id;
        const color = getVehicleStatusColor(veh.status);
        const heading = veh.heading || 45;
        const liveGps = broadcastTransporters[veh.id]?.isRealGps;

        const vehIcon = L.icon({
          iconUrl: getTruckSvgUri(color, heading, veh.vehicleNumber, isSelected),
          iconSize: [isSelected ? 48 : 40, isSelected ? 64 : 56],
          iconAnchor: [isSelected ? 24 : 20, isSelected ? 24 : 20],
          popupAnchor: [0, -20]
        });

        const marker = L.marker([veh.currentLocation.coordinates.lat, veh.currentLocation.coordinates.lng], {
          icon: vehIcon,
          zIndexOffset: isSelected ? 500 : 100
        });

        marker.bindPopup(`
          <div style="font-family: inherit; min-width: 230px; padding: 4px; color: #263238;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #D9DED0; padding-bottom: 6px;">
              <span style="font-weight: 800; font-family: monospace; color: #556B2F; font-size: 14px;">${veh.vehicleNumber}</span>
              <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${liveGps ? '#E7EBD9' : '#FAF6EE'}; color: ${liveGps ? '#2E7D32' : '#C59D5F'}; font-weight: bold;">
                ${liveGps ? 'LIVE (GPS)' : 'LIVE (Simulated)'}
              </span>
            </div>
            <div style="margin-top: 6px; font-size: 12px; line-height: 1.5;">
              <div><strong>Driver:</strong> ${veh.driverName} (${veh.driverPhone})</div>
              <div><strong>Available:</strong> <span style="color: #C59D5F; font-weight: bold;">${veh.availablePayloadKg} kg</span> / ${veh.maxPayloadKg} kg</div>
              <div><strong>ETA:</strong> ${veh.etaMinutes || 25} mins (${veh.speedKmh || 35} km/h)</div>
              <div><strong>Location:</strong> ${veh.currentLocation.name}</div>
            </div>
            <div style="margin-top: 10px; text-align: right;">
              <button id="lmap-select-btn-${veh.id}" style="background: #556B2F; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer;">
                Select Vehicle
              </button>
            </div>
          </div>
        `);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`lmap-select-btn-${veh.id}`);
          if (btn && onSelectVehicle) {
            btn.onclick = () => onSelectVehicle(veh);
          }
        });

        if (onSelectVehicle) {
          marker.on('click', () => onSelectVehicle(veh));
        }

        marker.addTo(markersGroup);
      });
    }

    // 4. Shipments
    if (showShipments) {
      filteredShipments.forEach((s) => {
        const isDelivered = s.status === 'DELIVERED';
        const isSelected = selectedShipmentId === s.id;

        const sIcon = L.icon({
          iconUrl: getShipmentSvgUri(isSelected, isDelivered),
          iconSize: [30, 38],
          iconAnchor: [15, 38]
        });

        const marker = L.marker([s.origin.coordinates.lat, s.origin.coordinates.lng], { icon: sIcon });
        marker.bindPopup(`
          <div style="font-family: inherit; min-width: 230px; padding: 4px; color: #263238;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #D9DED0; padding-bottom: 4px;">
              <span style="font-weight: bold; font-family: monospace; color: #C59D5F; font-size: 13px;">${s.trackingNumber}</span>
              <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #E7EBD9; color: #556B2F; font-weight: bold;">
                PICKUP
              </span>
            </div>
            <div style="font-size: 13px; font-weight: bold; color: #263238; margin-top: 6px;">
              ${s.productName} (${s.weightKg} kg)
            </div>
            <div style="font-size: 11px; color: #60706A; margin-top: 2px;">
              <strong>Origin:</strong> ${s.origin.village || s.origin.name}
            </div>
            <div style="font-size: 11px; color: #60706A;">
              <strong>Destination:</strong> ${s.destination.name}
            </div>
          </div>
        `);

        if (onSelectShipment) {
          marker.on('click', () => onSelectShipment(s));
        }
        marker.addTo(markersGroup);
      });
    }

    // 5. Road Routes
    if (showRoutes) {
      const targetVehicles = selectedVehicleId
        ? filteredVehicles.filter((v) => v.id === selectedVehicleId)
        : filteredVehicles.filter((v) => v.status === 'IN_TRANSIT').slice(0, 2);

      targetVehicles.forEach((veh) => {
        const origin = [veh.currentLocation.coordinates.lat, veh.currentLocation.coordinates.lng] as [number, number];
        const dest = [hubs[0]?.coordinates.lat || 17.7167, hubs[0]?.coordinates.lng || 73.3833] as [number, number];
        const roadPoints = createRoadPolyline([origin, dest]);

        // Casing
        L.polyline(roadPoints, {
          color: '#263238',
          weight: 6,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routesGroup);

        // Solid green or amber
        L.polyline(roadPoints, {
          color: veh.status === 'RETURNING' ? '#D97706' : '#2E7D32',
          weight: 3.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routesGroup);
      });
    }
  }, [
    mapEngine,
    filteredVehicles,
    filteredShipments,
    hubs,
    showVehicles,
    showHubs,
    showShipments,
    showRoutes,
    selectedVehicleId,
    selectedShipmentId,
    userLocation
  ]);

  // Leaflet Pan to vehicle
  useEffect(() => {
    if (mapEngine === 'LEAFLET' && lMapRef.current && selectedVehicleId) {
      const match = vehicles.find((v) => v.id === selectedVehicleId);
      if (match) {
        lMapRef.current.flyTo(
          [match.currentLocation.coordinates.lat, match.currentLocation.coordinates.lng],
          12,
          { duration: 1.0 }
        );
      }
    }
  }, [selectedVehicleId, vehicles, mapEngine]);

  // "My Location" Button Click Handler
  const handleFlyToMyLocation = useCallback(() => {
    if (mapEngine === 'GOOGLE' && gMapRef.current) {
      gMapRef.current.panTo(new google.maps.LatLng(userLocation.lat, userLocation.lng));
      gMapRef.current.setZoom(13);
    } else if (mapEngine === 'LEAFLET' && lMapRef.current) {
      lMapRef.current.flyTo([userLocation.lat, userLocation.lng], 13, { duration: 1.0 });
    }
  }, [mapEngine, userLocation]);

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden shadow-sm border border-earth-200 bg-earth-50 transition-all ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''
      }`}
      style={{ height: isFullScreen ? '100vh' : height, minHeight: '420px' }}
    >
      {/* Skeleton loader while loading */}
      {mapEngine === 'LOADING' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-earth-100/90 backdrop-blur-sm animate-pulse space-y-4">
          <div className="p-4 rounded-3xl bg-forest/10 border border-forest/20 text-forest">
            <Radio className="w-8 h-8 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <h4 className="font-bold font-display text-navy text-sm">{t('loadingMap')}</h4>
            <p className="text-xs text-earth-600">OpenStreetMap Maharashtra Logistics Network</p>
          </div>
        </div>
      )}

      {/* Offline without cached tiles fallback view */}
      {isOffline && hasTileErrorOffline && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#F5F2E9] p-6 text-center space-y-4">
          <div className="p-4 rounded-3xl bg-amber-100 border border-amber-300 text-amber-800">
            <WifiOff className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h4 className="font-bold font-display text-navy text-base">{t('mapNeedsInternet')}</h4>
            <p className="text-xs text-[#5A6A64]">
              {t('telemetrySubtitle')}
            </p>
          </div>

          <div className="w-full max-w-md bg-white rounded-2xl border border-[#DCD8C8] p-3 text-left space-y-2 max-h-[220px] overflow-y-auto">
            <div className="text-[11px] font-bold text-[#5A6A64] uppercase tracking-wider pb-1 border-b border-[#DCD8C8]">
              {t('nearbyVehiclesList')} ({filteredVehicles.length})
            </div>
            {filteredVehicles.slice(0, 5).map((v) => (
              <div
                key={v.id}
                onClick={() => onSelectVehicle && onSelectVehicle(v)}
                className="flex items-center justify-between p-2 rounded-xl bg-[#F5F2E9] hover:bg-[#E7EBD9] transition cursor-pointer text-xs"
              >
                <div>
                  <div className="font-mono font-bold text-[#3B4B20]">{v.vehicleNumber}</div>
                  <div className="text-[11px] text-[#5A6A64]">{v.driverName} • {v.currentLocation.name}</div>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-[#556B2F] text-white text-[10px] font-bold"
                >
                  {t('selectVehicle')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback Banner Notice (OpenStreetMap Standard) */}
      {mapEngine === 'LEAFLET' && !hasTileErrorOffline && (
        <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 max-w-md bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cream-300 shadow-md text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-forest shrink-0" />
            <span className="text-earth-700 truncate">
              <strong>OpenStreetMap Standard:</strong> Konkan Telemetry Active
            </span>
          </div>
        </div>
      )}

      {/* Map Containers */}
      <div
        ref={googleMapContainerRef}
        className={`w-full h-full transition-opacity ${mapEngine === 'GOOGLE' ? 'block' : 'hidden'}`}
      />
      <div
        ref={leafletMapContainerRef}
        className={`w-full h-full transition-opacity ${mapEngine === 'LEAFLET' ? 'block' : 'hidden'}`}
      />

      {/* Top Controls Overlay: Village Dropdown & Demo Dapoli */}
      <div className="absolute top-12 sm:top-3 right-3 z-20 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-earth-200/80 shadow-md text-xs">
          <MapPin className="w-3.5 h-3.5 text-forest shrink-0" />
          <select
            value={
              MAHARASHTRA_VILLAGES.find((v) => v.coordinates.lat === userLocation.lat)?.name || 'Dapoli'
            }
            onChange={(e) => setVillage(e.target.value)}
            className="bg-transparent font-semibold text-navy text-xs border-none focus:outline-none cursor-pointer pr-1"
            title="Switch Village Location"
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
          className="bg-white/95 hover:bg-earth-100 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-earth-200/80 shadow-md text-xs font-semibold text-forest flex items-center gap-1 transition"
          title="Reset to Dapoli demo coordinates"
        >
          <span>Demo Dapoli</span>
        </button>

        <button
          onClick={() => setShowPermissionModal(true)}
          className="bg-forest hover:bg-forest-dark text-white px-2.5 py-1.5 rounded-xl shadow-md text-xs font-bold flex items-center gap-1 transition"
          title="Turn on Live GPS from device"
        >
          <Navigation className="w-3.5 h-3.5 text-haldi" />
          <span className="hidden sm:inline">Live GPS</span>
        </button>
      </div>

      {/* 5 km Pool Zone Badge Overlay */}
      <div className="absolute bottom-14 left-3 z-20 bg-forest-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/20 text-xs flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-haldi animate-ping" />
        <span className="font-medium">
          5 km Pool Zone: <strong>{poolZoneStats.vehiclesCount} vehicles</strong> &amp; <strong>{poolZoneStats.shipmentsCount} shipments</strong> inside
        </span>
      </div>

      {/* Floating Action Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-3 z-20 flex flex-col gap-2">
        {/* Custom "My Location" Button */}
        <button
          onClick={handleFlyToMyLocation}
          className="p-2.5 rounded-xl bg-white hover:bg-earth-100 text-forest shadow-md border border-earth-200 transition active:scale-95 flex items-center justify-center group"
          title="Fly to My Location"
          aria-label="My Location"
        >
          <LocateFixed className="w-5 h-5 text-forest group-hover:scale-110 transition" />
        </button>

        {/* Fullscreen Toggle Button */}
        <button
          onClick={() => setIsFullScreen((prev) => !prev)}
          className="p-2.5 rounded-xl bg-white hover:bg-earth-100 text-navy shadow-md border border-earth-200 transition active:scale-95 flex items-center justify-center"
          title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          aria-label="Toggle Fullscreen"
        >
          {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Layer Controls Toggle */}
        <button
          onClick={() => setShowLegend((prev) => !prev)}
          className={`p-2.5 rounded-xl shadow-md border border-earth-200 transition active:scale-95 flex items-center justify-center ${
            showLegend ? 'bg-forest text-white' : 'bg-white text-navy hover:bg-earth-100'
          }`}
          title="Toggle Layers and Legend"
          aria-label="Toggle Layers"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Layers & Legend Flyout Card */}
      {showLegend && (
        <div className="absolute bottom-20 right-3 z-20 w-64 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-earth-200 shadow-xl text-xs space-y-3 animate-fade-in text-navy">
          <div className="flex items-center justify-between border-b border-earth-200 pb-2">
            <span className="font-bold text-navy flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-forest" />
              <span>Map Layers</span>
            </span>
            <span className="text-[10px] text-earth-500 font-mono">Maharashtra</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer hover:bg-earth-50 p-1 rounded-lg">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#2E7D32]" />
                <span>Vehicles ({filteredVehicles.length})</span>
              </span>
              <input
                type="checkbox"
                checked={showVehicles}
                onChange={(e) => setShowVehicles(e.target.checked)}
                className="rounded accent-forest"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:bg-earth-50 p-1 rounded-lg">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#263238]" />
                <span>Taluka Hubs ({hubs.length})</span>
              </span>
              <input
                type="checkbox"
                checked={showHubs}
                onChange={(e) => setShowHubs(e.target.checked)}
                className="rounded accent-forest"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:bg-earth-50 p-1 rounded-lg">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#C59D5F]" />
                <span>Shipments ({filteredShipments.length})</span>
              </span>
              <input
                type="checkbox"
                checked={showShipments}
                onChange={(e) => setShowShipments(e.target.checked)}
                className="rounded accent-forest"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:bg-earth-50 p-1 rounded-lg">
              <span className="flex items-center gap-2">
                <span className="w-3 h-1 bg-[#2E7D32]" />
                <span>Road Routes</span>
              </span>
              <input
                type="checkbox"
                checked={showRoutes}
                onChange={(e) => setShowRoutes(e.target.checked)}
                className="rounded accent-forest"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-earth-200 text-[11px] text-earth-600 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1A73E8]" />
              <span>Blue dot: You are here</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-[#2E7D32]" />
              <span>Solid green: Active trip</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-[#D97706]" />
              <span>Amber: Return load</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaharashtraMap;
