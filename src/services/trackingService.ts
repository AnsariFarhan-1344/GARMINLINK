import { VehicleLocationTelemetry, GeofenceAlert } from '../types';
import { socketService, SocketConnectionState } from './socketService';

export interface TrackingState {
  isWatching: boolean;
  isPaused: boolean;
  vehicleId: string | null;
  driverId: string | null;
  shipmentId: string | null;
  tripId: string | null;
  currentLat: number | null;
  currentLng: number | null;
  accuracy: number | null;
  speedKmh: number | null;
  heading: number | null;
  lastFixTimestamp: number | null;
  error: string | null;
  queuedCount: number;
  connectionStatus: SocketConnectionState;
  geofenceStatus?: string;
  lastGeofenceAlert?: GeofenceAlert | null;
}

// Distance calculation helper
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class LiveTrackingManager {
  private watchId: number | null = null;
  private state: TrackingState = {
    isWatching: false,
    isPaused: false,
    vehicleId: null,
    driverId: null,
    shipmentId: null,
    tripId: null,
    currentLat: null,
    currentLng: null,
    accuracy: null,
    speedKmh: null,
    heading: null,
    lastFixTimestamp: null,
    error: null,
    queuedCount: 0,
    connectionStatus: 'OFFLINE',
    lastGeofenceAlert: null
  };

  private listeners: Set<(state: TrackingState) => void> = new Set();
  private offlineQueue: VehicleLocationTelemetry[] = [];

  // Update thresholds to prevent flooding
  private minTimeBetweenUpdatesMs = 5000; // 5 seconds
  private minDistanceMeters = 20; // 20 meters
  private lastSentLat: number | null = null;
  private lastSentLng: number | null = null;
  private lastSentTime: number = 0;

  constructor() {
    // Listen to network status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkReturn());
      window.addEventListener('offline', () => this.handleNetworkLoss());
    }

    // Bind socket connection changes
    socketService.onConnectionStateChange((status) => {
      this.updateState({ connectionStatus: status });
      if (status === 'LIVE' && this.offlineQueue.length > 0) {
        this.flushOfflineQueue();
      }
    });

    // Listen for geofence alerts
    socketService.on('geofence:alert', (alert: GeofenceAlert) => {
      if (this.state.vehicleId === alert.vehicleId) {
        this.updateState({
          geofenceStatus: alert.type,
          lastGeofenceAlert: alert
        });
      }
    });
  }

  public subscribe(callback: (state: TrackingState) => void): () => void {
    this.listeners.add(callback);
    callback(this.state);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private updateState(partial: Partial<TrackingState>) {
    this.state = { ...this.state, ...partial, queuedCount: this.offlineQueue.length };
    this.listeners.forEach(cb => cb(this.state));
  }

  public getState(): TrackingState {
    return this.state;
  }

  // 1. START TRIP
  public async startTrip(vehicleId: string, driverId: string, shipmentId?: string): Promise<{ success: boolean; error?: string }> {
    if (!('geolocation' in navigator)) {
      const err = 'Device does not support GPS Geolocation API';
      this.updateState({ error: err });
      return { success: false, error: err };
    }

    const tripId = `TRIP-${Date.now()}`;

    this.updateState({
      isWatching: true,
      isPaused: false,
      vehicleId,
      driverId,
      shipmentId: shipmentId || null,
      tripId,
      error: null
    });

    // Notify backend
    socketService.sendTripStart({
      vehicleId,
      driverId,
      shipmentId,
      tripId
    });

    // Start watching position
    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionSuccess(position),
        (error) => this.handlePositionError(error),
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 4000
        }
      );
      return { success: true };
    } catch (e: any) {
      const errMsg = e.message || 'Failed to start GPS tracking';
      this.updateState({ error: errMsg, isWatching: false });
      return { success: false, error: errMsg };
    }
  }

  // 2. PAUSE TRACKING
  public pauseTracking() {
    if (!this.state.isWatching) return;
    this.updateState({ isPaused: true });

    if (this.state.vehicleId && this.state.driverId) {
      socketService.sendTripPause({
        vehicleId: this.state.vehicleId,
        driverId: this.state.driverId,
        tripId: this.state.tripId || undefined
      });
    }
  }

  // 3. RESUME TRACKING
  public resumeTracking() {
    if (!this.state.isWatching) return;
    this.updateState({ isPaused: false });

    if (this.state.vehicleId && this.state.driverId) {
      socketService.sendTripResume({
        vehicleId: this.state.vehicleId,
        driverId: this.state.driverId,
        tripId: this.state.tripId || undefined
      });
    }
  }

  // 4. END TRIP
  public endTrip(): { finalLat: number | null; finalLng: number | null } {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    const finalLat = this.state.currentLat;
    const finalLng = this.state.currentLng;

    if (this.state.vehicleId && this.state.driverId) {
      socketService.sendTripEnd({
        vehicleId: this.state.vehicleId,
        driverId: this.state.driverId,
        tripId: this.state.tripId || undefined,
        shipmentId: this.state.shipmentId || undefined,
        finalLocation: finalLat && finalLng ? { lat: finalLat, lng: finalLng } : undefined
      });
    }

    // Flush any remaining queue
    this.flushOfflineQueue();

    this.updateState({
      isWatching: false,
      isPaused: false,
      tripId: null
    });

    return { finalLat, finalLng };
  }

  private handlePositionSuccess(position: GeolocationPosition) {
    if (this.state.isPaused) return;

    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    const now = Date.now();

    const speedKmh = speed !== null && speed !== undefined && speed >= 0 ? Math.round(speed * 3.6) : 0;
    const headingDeg = heading !== null && heading !== undefined ? Math.round(heading) : 0;

    this.updateState({
      currentLat: latitude,
      currentLng: longitude,
      accuracy: Math.round(accuracy),
      speedKmh,
      heading: headingDeg,
      lastFixTimestamp: now,
      error: null
    });

    // Check throttling rules:
    // Update every 5–10 seconds OR when driver moves >= 20 meters
    const timeElapsed = now - this.lastSentTime;
    let distanceMoved = 0;
    if (this.lastSentLat !== null && this.lastSentLng !== null) {
      distanceMoved = getDistanceMeters(this.lastSentLat, this.lastSentLng, latitude, longitude);
    }

    const shouldSend = 
      this.lastSentTime === 0 || 
      timeElapsed >= this.minTimeBetweenUpdatesMs || 
      distanceMoved >= this.minDistanceMeters;

    if (!shouldSend) {
      return;
    }

    this.lastSentTime = now;
    this.lastSentLat = latitude;
    this.lastSentLng = longitude;

    const telemetryPayload: VehicleLocationTelemetry = {
      vehicleId: this.state.vehicleId || '',
      driverId: this.state.driverId || '',
      shipmentId: this.state.shipmentId || undefined,
      tripId: this.state.tripId || undefined,
      latitude,
      longitude,
      accuracy: Math.round(accuracy),
      speedKmh,
      heading: headingDeg,
      timestamp: new Date().toISOString()
    };

    // If online & socket connected, transmit directly
    if (navigator.onLine && socketService.getConnectionState() === 'LIVE') {
      socketService.sendLocationUpdate(telemetryPayload);
    } else {
      // Offline / poor connection: queue locally (up to 20 records)
      this.offlineQueue.push(telemetryPayload);
      if (this.offlineQueue.length > 20) {
        this.offlineQueue.shift(); // Keep only latest 20
      }
      this.updateState({ queuedCount: this.offlineQueue.length });
    }
  }

  private handlePositionError(error: GeolocationPositionError) {
    let message = 'GPS location error';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location permission denied by user. Please allow GPS access.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'GPS position unavailable. Check device location services.';
        break;
      case error.TIMEOUT:
        message = 'Location acquisition timed out. Retrying...';
        break;
    }
    console.warn('[GPS Tracking]', message);
    this.updateState({ error: message });
  }

  private handleNetworkLoss() {
    this.updateState({ connectionStatus: 'OFFLINE' });
  }

  private handleNetworkReturn() {
    this.updateState({ connectionStatus: 'RECONNECTING' });
    this.flushOfflineQueue();
  }

  private async flushOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    const queuedToSend = [...this.offlineQueue];
    this.offlineQueue = [];
    this.updateState({ queuedCount: 0 });

    try {
      // Send batch to backend REST API or socket
      await fetch('/api/vehicles/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queuedToSend)
      });
      console.log(`[Tracking] Flushed ${queuedToSend.length} queued GPS points to backend.`);
    } catch (e) {
      // Re-queue latest 10 if failed
      this.offlineQueue = queuedToSend.slice(-10);
      this.updateState({ queuedCount: this.offlineQueue.length });
    }
  }
}

export const liveTrackingManager = new LiveTrackingManager();
