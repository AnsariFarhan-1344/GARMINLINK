import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface VillageOption {
  name: string;
  district: string;
  taluka: string;
  coordinates: GeoPoint;
}

export const MAHARASHTRA_VILLAGES: VillageOption[] = [
  { name: 'Dapoli', district: 'Ratnagiri', taluka: 'Dapoli', coordinates: { lat: 17.7584, lng: 73.1867 } },
  { name: 'Harnai', district: 'Ratnagiri', taluka: 'Dapoli', coordinates: { lat: 17.8142, lng: 73.0985 } },
  { name: 'Khed', district: 'Ratnagiri', taluka: 'Khed', coordinates: { lat: 17.7167, lng: 73.3833 } },
  { name: 'Chiplun', district: 'Ratnagiri', taluka: 'Chiplun', coordinates: { lat: 17.5323, lng: 73.5186 } },
  { name: 'Mandangad', district: 'Ratnagiri', taluka: 'Mandangad', coordinates: { lat: 17.9822, lng: 73.2508 } },
  { name: 'Panvel', district: 'Raigad', taluka: 'Panvel', coordinates: { lat: 18.9894, lng: 73.1175 } },
  { name: 'APMC Vashi', district: 'Thane / Navi Mumbai', taluka: 'Vashi', coordinates: { lat: 19.0760, lng: 73.0033 } },
  { name: 'Nashik', district: 'Nashik', taluka: 'Nashik', coordinates: { lat: 19.9975, lng: 73.7898 } },
  { name: 'APMC Nashik', district: 'Nashik', taluka: 'Panchavati', coordinates: { lat: 19.9730, lng: 73.7910 } },
];

export interface TransporterGpsBroadcast {
  vehicleId: string;
  coordinates: GeoPoint;
  speedKmh: number;
  heading: number;
  timestamp: number;
  isRealGps: boolean;
}

interface LocationContextType {
  userLocation: GeoPoint;
  locationName: string;
  accuracyMeters: number | null;
  locationMode: 'REAL_GPS' | 'VILLAGE_FALLBACK' | 'DEMO_DAPOLI';
  permissionStatus: 'PROMPT' | 'LOCATING' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE';
  showPermissionModal: boolean;
  setShowPermissionModal: (show: boolean) => void;
  requestLiveGps: () => void;
  setVillage: (villageName: string) => void;
  setDemoDapoli: () => void;
  // Transporter Real GPS Sharing
  isSharingTransporterGps: boolean;
  activeSharingVehicleId: string | null;
  toggleTransporterGpsShare: (vehicleId: string) => void;
  broadcastTransporters: Record<string, TransporterGpsBroadcast>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'graminlink_transporter_gps';
const LOCALSTORAGE_GPS_KEY = 'graminlink_live_gps_broadcast';

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Dapoli (17.7584, 73.1867)
  const [userLocation, setUserLocation] = useState<GeoPoint>({ lat: 17.7584, lng: 73.1867 });
  const [locationName, setLocationName] = useState<string>('Dapoli (Demo Location)');
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [locationMode, setLocationMode] = useState<'REAL_GPS' | 'VILLAGE_FALLBACK' | 'DEMO_DAPOLI'>('DEMO_DAPOLI');
  const [permissionStatus, setPermissionStatus] = useState<'PROMPT' | 'LOCATING' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE'>('PROMPT');
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);

  // Transporter sharing state
  const [isSharingTransporterGps, setIsSharingTransporterGps] = useState<boolean>(false);
  const [activeSharingVehicleId, setActiveSharingVehicleId] = useState<string | null>(null);
  const [broadcastTransporters, setBroadcastTransporters] = useState<Record<string, TransporterGpsBroadcast>>({});

  const watchIdRef = useRef<number | null>(null);
  const transporterWatchIdRef = useRef<number | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Setup BroadcastChannel for cross-tab GPS communication
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data && event.data.vehicleId) {
          const payload: TransporterGpsBroadcast = event.data;
          setBroadcastTransporters((prev) => ({
            ...prev,
            [payload.vehicleId]: payload
          }));
        }
      };
    }

    // Storage event fallback for older browsers
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCALSTORAGE_GPS_KEY && e.newValue) {
        try {
          const payload: TransporterGpsBroadcast = JSON.parse(e.newValue);
          setBroadcastTransporters((prev) => ({
            ...prev,
            [payload.vehicleId]: payload
          }));
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
      window.removeEventListener('storage', handleStorage);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (transporterWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(transporterWatchIdRef.current);
      }
    };
  }, []);

  // Request Live GPS
  const requestLiveGps = () => {
    setShowPermissionModal(false);
    if (!navigator.geolocation) {
      setPermissionStatus('UNAVAILABLE');
      setLocationMode('VILLAGE_FALLBACK');
      setLocationName('Dapoli (Fallback)');
      return;
    }

    setPermissionStatus('LOCATING');

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        // Verify coordinates are on land in Maharashtra
        const isWithinMaharashtra = latitude >= 15.5 && latitude <= 22.5 && longitude >= 72.5 && longitude <= 81.0;
        
        setUserLocation({ lat: latitude, lng: longitude });
        setAccuracyMeters(accuracy ? Math.round(accuracy) : 25);
        setLocationMode('REAL_GPS');
        setPermissionStatus('GRANTED');
        setLocationName(isWithinMaharashtra ? 'Your Live Location (GPS)' : 'Live Location');
      },
      (error) => {
        console.warn('Geolocation denied or error:', error.message);
        setPermissionStatus(error.code === error.PERMISSION_DENIED ? 'DENIED' : 'UNAVAILABLE');
        setLocationMode('VILLAGE_FALLBACK');
        setUserLocation({ lat: 17.7584, lng: 73.1867 });
        setLocationName('Using village location (Dapoli)');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000
      }
    );
  };

  // Switch to specific village fallback
  const setVillage = (villageName: string) => {
    const match = MAHARASHTRA_VILLAGES.find((v) => v.name.toLowerCase() === villageName.toLowerCase()) || MAHARASHTRA_VILLAGES[0];
    setUserLocation(match.coordinates);
    setAccuracyMeters(null);
    setLocationMode('VILLAGE_FALLBACK');
    setLocationName(`Using village location (${match.name})`);
  };

  // Reset to Demo Dapoli
  const setDemoDapoli = () => {
    setUserLocation({ lat: 17.7584, lng: 73.1867 });
    setAccuracyMeters(null);
    setLocationMode('DEMO_DAPOLI');
    setLocationName('Dapoli (Demo Location)');
  };

  // Transporter Role: Share My Live Location Toggle
  const toggleTransporterGpsShare = (vehicleId: string) => {
    if (isSharingTransporterGps) {
      // Turn off
      if (transporterWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(transporterWatchIdRef.current);
        transporterWatchIdRef.current = null;
      }
      setIsSharingTransporterGps(false);
      setActiveSharingVehicleId(null);
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not available on this device');
      return;
    }

    setIsSharingTransporterGps(true);
    setActiveSharingVehicleId(vehicleId);

    transporterWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const broadcast: TransporterGpsBroadcast = {
          vehicleId,
          coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          speedKmh: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 38,
          heading: pos.coords.heading || 65,
          timestamp: Date.now(),
          isRealGps: true
        };

        // Broadcast to channel
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage(broadcast);
        }
        // Local storage backup
        try {
          localStorage.setItem(LOCALSTORAGE_GPS_KEY, JSON.stringify(broadcast));
        } catch (_) {}

        setBroadcastTransporters((prev) => ({
          ...prev,
          [vehicleId]: broadcast
        }));
      },
      (err) => {
        console.error('Transporter GPS watch error:', err);
        setIsSharingTransporterGps(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    );
  };

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        locationName,
        accuracyMeters,
        locationMode,
        permissionStatus,
        showPermissionModal,
        setShowPermissionModal,
        requestLiveGps,
        setVillage,
        setDemoDapoli,
        isSharingTransporterGps,
        activeSharingVehicleId,
        toggleTransporterGpsShare,
        broadcastTransporters
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useUserLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useUserLocation must be used within a LocationProvider');
  }
  return context;
};
