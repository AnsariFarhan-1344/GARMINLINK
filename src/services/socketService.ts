import { io, Socket } from 'socket.io-client';
import { Vehicle, Shipment, VehicleLocationTelemetry, GeofenceAlert } from '../types';

export type SocketConnectionState = 'LIVE' | 'RECONNECTING' | 'OFFLINE';

class SocketService {
  private socket: Socket | null = null;
  private connectionState: SocketConnectionState = 'OFFLINE';
  private listeners: Map<string, Set<Function>> = new Map();
  private stateChangeListeners: Set<(state: SocketConnectionState) => void> = new Set();

  constructor() {
    // Determine socket endpoint
    // In browser, Vite proxy forwards /socket.io to backend on port 5001. Fallback directly to 5001.
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const socketUrl = isLocalhost ? 'http://localhost:5001' : window.location.origin;

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🟢 [Socket.IO] Connected to GraminLink Telemetry Backend:', this.socket?.id);
      this.setConnectionState('LIVE');
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔴 [Socket.IO] Disconnected:', reason);
      this.setConnectionState('OFFLINE');
    });

    this.socket.on('connect_error', (error) => {
      console.warn('🟡 [Socket.IO] Connection error (Reconnecting):', error.message);
      this.setConnectionState('RECONNECTING');
    });

    this.socket.on('reconnect_attempt', () => {
      this.setConnectionState('RECONNECTING');
    });

    this.socket.on('reconnect', () => {
      console.log('🟢 [Socket.IO] Reconnected successfully');
      this.setConnectionState('LIVE');
    });

    // Handle incoming telemetry broadcasts
    this.socket.on('vehicle:location:update', (data) => {
      this.emitInternal('vehicle:location:update', data);
    });

    this.socket.on('vehicle:trip:start', (data) => {
      this.emitInternal('vehicle:trip:start', data);
    });

    this.socket.on('vehicle:trip:pause', (data) => {
      this.emitInternal('vehicle:trip:pause', data);
    });

    this.socket.on('vehicle:trip:resume', (data) => {
      this.emitInternal('vehicle:trip:resume', data);
    });

    this.socket.on('vehicle:trip:end', (data) => {
      this.emitInternal('vehicle:trip:end', data);
    });

    this.socket.on('shipment:status:update', (data) => {
      this.emitInternal('shipment:status:update', data);
    });

    this.socket.on('geofence:alert', (data: GeofenceAlert) => {
      this.emitInternal('geofence:alert', data);
    });

    this.socket.on('init:state', (data) => {
      this.emitInternal('init:state', data);
    });
  }

  private setConnectionState(newState: SocketConnectionState) {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.stateChangeListeners.forEach(listener => listener(newState));
    }
  }

  public getConnectionState(): SocketConnectionState {
    return this.connectionState;
  }

  public onConnectionStateChange(callback: (state: SocketConnectionState) => void): () => void {
    this.stateChangeListeners.add(callback);
    callback(this.connectionState);
    return () => {
      this.stateChangeListeners.delete(callback);
    };
  }

  // Subscribe to socket events
  public on<T = any>(event: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emitInternal(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in socket event handler for ${event}:`, e);
        }
      });
    }
  }

  // Outgoing driver events
  public sendLocationUpdate(data: VehicleLocationTelemetry) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('vehicle:location:update', data);
      return true;
    }
    return false;
  }

  public sendTripStart(data: { vehicleId: string; driverId: string; shipmentId?: string; tripId?: string }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('vehicle:trip:start', data);
      return true;
    }
    return false;
  }

  public sendTripPause(data: { vehicleId: string; driverId: string; tripId?: string }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('vehicle:trip:pause', data);
      return true;
    }
    return false;
  }

  public sendTripResume(data: { vehicleId: string; driverId: string; tripId?: string }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('vehicle:trip:resume', data);
      return true;
    }
    return false;
  }

  public sendTripEnd(data: { vehicleId: string; driverId: string; tripId?: string; shipmentId?: string; finalLocation?: { lat: number; lng: number } }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('vehicle:trip:end', data);
      return true;
    }
    return false;
  }
}

export const socketService = new SocketService();
