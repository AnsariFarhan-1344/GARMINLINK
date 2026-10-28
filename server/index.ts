import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { mockVehicles, mockShipments, mockHubs, mockUsers } from '../src/data/mockData';
import { Vehicle, Shipment, VehicleLocationTelemetry, GeofenceAlert } from '../src/types';

const app = express();
const server = http.createServer(app);

// CORS configuration for local Vite development and external access
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-Memory Database State (Ready for PostgreSQL/Supabase replication)
let vehiclesState: Vehicle[] = JSON.parse(JSON.stringify(mockVehicles));
let shipmentsState: Shipment[] = JSON.parse(JSON.stringify(mockShipments));
let telemetryHistory: VehicleLocationTelemetry[] = [];

// Geofence Radius in meters
const GEOFENCE_RADIUS_METERS = 200;

// Haversine formula to compute distance between two GPS coordinates in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Evaluate Geofences for an active shipment
function evaluateGeofence(
  lat: number, 
  lng: number, 
  vehicle: Vehicle, 
  shipment?: Shipment
): { geofenceStatus: string; alert?: GeofenceAlert } {
  if (!shipment) {
    return { geofenceStatus: 'IN_TRANSIT' };
  }

  const pickupCoords = shipment.origin.coordinates;
  const destCoords = shipment.destination.coordinates;

  const distToPickup = calculateDistanceMeters(lat, lng, pickupCoords.lat, pickupCoords.lng);
  const distToDest = calculateDistanceMeters(lat, lng, destCoords.lat, destCoords.lng);

  // Check Destination Proximity First
  if (distToDest <= GEOFENCE_RADIUS_METERS) {
    const alert: GeofenceAlert = {
      type: 'ARRIVED_DESTINATION',
      message: `Vehicle ${vehicle.vehicleNumber} arrived at Destination Hub: ${shipment.destination.name} (${Math.round(distToDest)}m away).`,
      vehicleId: vehicle.id,
      shipmentId: shipment.id,
      timestamp: new Date().toISOString()
    };
    return { geofenceStatus: 'ARRIVED_DESTINATION', alert };
  }

  // Check Pickup Proximity
  if (distToPickup <= GEOFENCE_RADIUS_METERS) {
    const alert: GeofenceAlert = {
      type: 'ARRIVED_PICKUP',
      message: `Vehicle ${vehicle.vehicleNumber} arrived at Pickup Location: ${shipment.origin.name} (${Math.round(distToPickup)}m away).`,
      vehicleId: vehicle.id,
      shipmentId: shipment.id,
      timestamp: new Date().toISOString()
    };
    return { geofenceStatus: 'ARRIVED_PICKUP', alert };
  }

  // If vehicle was at pickup and now moved away (> 250m)
  if (vehicle.geofenceStatus === 'ARRIVED_PICKUP' && distToPickup > (GEOFENCE_RADIUS_METERS + 50)) {
    const alert: GeofenceAlert = {
      type: 'PICKED_UP',
      message: `Vehicle ${vehicle.vehicleNumber} departed pickup location with cargo. En route to ${shipment.destination.name}.`,
      vehicleId: vehicle.id,
      shipmentId: shipment.id,
      timestamp: new Date().toISOString()
    };
    return { geofenceStatus: 'PICKED_UP', alert };
  }

  return { geofenceStatus: 'IN_TRANSIT' };
}

// Verification helper: Validate that driver is assigned to vehicle
function verifyDriverAndVehicle(vehicleId: string, driverId: string): { valid: boolean; vehicle?: Vehicle; error?: string } {
  const vehicle = vehiclesState.find(v => v.id === vehicleId);
  if (!vehicle) {
    return { valid: false, error: 'Vehicle not found' };
  }

  // In real system verify driver ownership. Support demo/test by checking matching driverId or assigned
  if (vehicle.driverId && driverId && vehicle.driverId !== driverId) {
    // Check if user exists
    const driver = mockUsers.find(u => u.id === driverId);
    if (!driver || driver.role !== 'TRANSPORTER_DRIVER') {
      return { valid: false, error: 'Unauthorized: Driver is not assigned to this vehicle' };
    }
  }

  return { valid: true, vehicle };
}

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    platform: 'GRAMINLINK Maharashtra Rural Logistics Telemetry Server',
    activeVehicles: vehiclesState.length,
    activeShipments: shipmentsState.length,
    connectedClients: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// Gaadi Sahayak Voice AI Assistant endpoint
app.post('/api/assistant', async (req: Request, res: Response) => {
  try {
    const handler = (await import('../api/assistant')).default;
    return handler(req, res);
  } catch (err: any) {
    res.status(200).json({ fallback: true, error: err?.message || 'Local handler error' });
  }
});

// Get all vehicles with live coordinates
app.get('/api/vehicles', (req: Request, res: Response) => {
  res.json(vehiclesState);
});

// Get single vehicle
app.get('/api/vehicles/:id', (req: Request, res: Response) => {
  const vehicle = vehiclesState.find(v => v.id === req.params.id);
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }
  res.json(vehicle);
});

// Get trip history / GPS breadcrumbs for vehicle
app.get('/api/vehicles/:id/history', (req: Request, res: Response) => {
  const history = telemetryHistory
    .filter(t => t.vehicleId === req.params.id)
    .slice(-100); // Last 100 points
  res.json(history);
});

// Get all shipments
app.get('/api/shipments', (req: Request, res: Response) => {
  res.json(shipmentsState);
});

// Get single shipment
app.get('/api/shipments/:id', (req: Request, res: Response) => {
  const shipment = shipmentsState.find(s => s.id === req.params.id || s.trackingNumber === req.params.id);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  res.json(shipment);
});

// Start Trip REST Endpoint
app.post('/api/trips/start', (req: Request, res: Response) => {
  const { vehicleId, driverId, shipmentId, tripId } = req.body;
  const verification = verifyDriverAndVehicle(vehicleId, driverId);
  if (!verification.valid || !verification.vehicle) {
    return res.status(403).json({ error: verification.error });
  }

  const generatedTripId = tripId || `TRIP-${Date.now()}`;
  const vehicle = verification.vehicle;

  vehicle.status = 'IN_TRANSIT';
  vehicle.activeTripId = generatedTripId;
  vehicle.activeShipmentId = shipmentId;
  vehicle.isTrackingActive = true;
  vehicle.isPaused = false;
  vehicle.offlineStatus = 'LIVE';
  vehicle.lastLocationUpdate = new Date().toISOString();

  // If a shipment was linked, mark as IN_TRANSIT
  if (shipmentId) {
    const shipment = shipmentsState.find(s => s.id === shipmentId);
    if (shipment) {
      shipment.status = 'IN_TRANSIT';
      shipment.assignedVehicleId = vehicleId;
      shipment.assignedVehicleNumber = vehicle.vehicleNumber;
      shipment.assignedTransporterName = vehicle.driverName;
      io.emit('shipment:status:update', shipment);
    }
  }

  io.emit('vehicle:trip:start', {
    vehicleId,
    driverId,
    shipmentId,
    tripId: generatedTripId,
    vehicle
  });

  res.json({ success: true, tripId: generatedTripId, vehicle });
});

// Pause Tracking REST Endpoint
app.post('/api/trips/pause', (req: Request, res: Response) => {
  const { vehicleId, driverId, tripId } = req.body;
  const verification = verifyDriverAndVehicle(vehicleId, driverId);
  if (!verification.valid || !verification.vehicle) {
    return res.status(403).json({ error: verification.error });
  }

  const vehicle = verification.vehicle;
  vehicle.isPaused = true;
  vehicle.speedKmh = 0;

  io.emit('vehicle:trip:pause', { vehicleId, driverId, tripId, vehicle });
  res.json({ success: true, vehicle });
});

// Resume Tracking REST Endpoint
app.post('/api/trips/resume', (req: Request, res: Response) => {
  const { vehicleId, driverId, tripId } = req.body;
  const verification = verifyDriverAndVehicle(vehicleId, driverId);
  if (!verification.valid || !verification.vehicle) {
    return res.status(403).json({ error: verification.error });
  }

  const vehicle = verification.vehicle;
  vehicle.isPaused = false;

  io.emit('vehicle:trip:resume', { vehicleId, driverId, tripId, vehicle });
  res.json({ success: true, vehicle });
});

// End Trip REST Endpoint
app.post('/api/trips/end', (req: Request, res: Response) => {
  const { vehicleId, driverId, tripId, shipmentId, finalLocation } = req.body;
  const verification = verifyDriverAndVehicle(vehicleId, driverId);
  if (!verification.valid || !verification.vehicle) {
    return res.status(403).json({ error: verification.error });
  }

  const vehicle = verification.vehicle;
  vehicle.status = 'DELIVERED';
  vehicle.isTrackingActive = false;
  vehicle.isPaused = false;
  vehicle.speedKmh = 0;
  vehicle.completedTrips = (vehicle.completedTrips || 0) + 1;
  vehicle.activeTripId = undefined;
  vehicle.activeShipmentId = undefined;

  if (finalLocation?.lat && finalLocation?.lng) {
    vehicle.currentLocation.coordinates = {
      lat: Number(finalLocation.lat),
      lng: Number(finalLocation.lng)
    };
  }

  if (shipmentId) {
    const shipment = shipmentsState.find(s => s.id === shipmentId);
    if (shipment) {
      shipment.status = 'DELIVERED';
      shipment.deliveredAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      io.emit('shipment:status:update', shipment);
    }
  }

  io.emit('vehicle:trip:end', {
    vehicleId,
    driverId,
    tripId,
    shipmentId,
    vehicle
  });

  res.json({ success: true, vehicle });
});

// Submit Location Update (REST fallback or for batch synced queued points)
app.post('/api/vehicles/location', (req: Request, res: Response) => {
  const updates: VehicleLocationTelemetry[] = Array.isArray(req.body) ? req.body : [req.body];

  let lastProcessedVehicle: Vehicle | null = null;

  for (const update of updates) {
    const { vehicleId, driverId, latitude, longitude, accuracy, speedKmh, heading, timestamp, shipmentId, tripId } = update;

    // Validate coordinates
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      continue;
    }

    const verification = verifyDriverAndVehicle(vehicleId, driverId);
    if (!verification.valid || !verification.vehicle) {
      continue;
    }

    const vehicle = verification.vehicle;
    const shipment = shipmentsState.find(s => s.id === (shipmentId || vehicle.activeShipmentId));

    // Update vehicle location
    vehicle.currentLocation.coordinates = { lat, lng };
    vehicle.speedKmh = speedKmh !== undefined ? Number(speedKmh) : vehicle.speedKmh;
    if (heading !== undefined) vehicle.heading = Number(heading);
    vehicle.lastLocationUpdate = timestamp || new Date().toISOString();
    vehicle.accuracyMeters = accuracy !== undefined ? Number(accuracy) : undefined;
    vehicle.offlineStatus = 'LIVE';

    // Evaluate Geofences
    const { geofenceStatus, alert } = evaluateGeofence(lat, lng, vehicle, shipment);
    vehicle.geofenceStatus = geofenceStatus;

    // If geofence triggered an alert, emit it
    if (alert) {
      io.emit('geofence:alert', alert);
    }

    // Save to historical telemetry (capped to 500 records)
    const telemetryRecord: VehicleLocationTelemetry = {
      vehicleId,
      driverId,
      shipmentId: shipment?.id,
      tripId: tripId || vehicle.activeTripId,
      latitude: lat,
      longitude: lng,
      accuracy: vehicle.accuracyMeters,
      speedKmh: vehicle.speedKmh,
      heading: vehicle.heading,
      geofenceStatus,
      timestamp: vehicle.lastLocationUpdate
    };
    telemetryHistory.push(telemetryRecord);
    if (telemetryHistory.length > 500) {
      telemetryHistory.shift();
    }

    lastProcessedVehicle = vehicle;

    // Broadcast location update
    io.emit('vehicle:location:update', {
      vehicleId,
      driverId,
      shipmentId: shipment?.id,
      tripId: tripId || vehicle.activeTripId,
      coordinates: { lat, lng },
      speedKmh: vehicle.speedKmh,
      heading: vehicle.heading,
      accuracy: vehicle.accuracyMeters,
      geofenceStatus,
      lastLocationUpdate: vehicle.lastLocationUpdate,
      vehicle
    });
  }

  res.json({ success: true, processed: updates.length, vehicle: lastProcessedVehicle });
});

// ============================================================================
// SOCKET.IO REAL-TIME EVENT HANDLERS
// ============================================================================

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send current grid snapshot to freshly connected client
  socket.emit('init:state', {
    vehicles: vehiclesState,
    shipments: shipmentsState,
    serverTime: new Date().toISOString()
  });

  // Event: Driver sends real-time GPS location
  socket.on('vehicle:location:update', (data: VehicleLocationTelemetry) => {
    const { vehicleId, driverId, latitude, longitude, accuracy, speedKmh, heading, timestamp, shipmentId, tripId } = data;

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      socket.emit('error', { message: 'Invalid GPS coordinates' });
      return;
    }

    const verification = verifyDriverAndVehicle(vehicleId, driverId);
    if (!verification.valid || !verification.vehicle) {
      socket.emit('error', { message: verification.error || 'Unauthorized' });
      return;
    }

    const vehicle = verification.vehicle;
    const shipment = shipmentsState.find(s => s.id === (shipmentId || vehicle.activeShipmentId));

    // Update real-time coordinates
    vehicle.currentLocation.coordinates = { lat, lng };
    vehicle.speedKmh = speedKmh !== undefined ? Math.round(Number(speedKmh)) : vehicle.speedKmh;
    if (heading !== undefined) vehicle.heading = Math.round(Number(heading));
    vehicle.lastLocationUpdate = timestamp || new Date().toISOString();
    vehicle.accuracyMeters = accuracy !== undefined ? Number(accuracy) : undefined;
    vehicle.offlineStatus = 'LIVE';

    // Geofencing detection
    const { geofenceStatus, alert } = evaluateGeofence(lat, lng, vehicle, shipment);
    vehicle.geofenceStatus = geofenceStatus;

    if (alert) {
      io.emit('geofence:alert', alert);
    }

    // Historical record
    const telemetryRecord: VehicleLocationTelemetry = {
      vehicleId,
      driverId,
      shipmentId: shipment?.id,
      tripId: tripId || vehicle.activeTripId,
      latitude: lat,
      longitude: lng,
      accuracy: vehicle.accuracyMeters,
      speedKmh: vehicle.speedKmh,
      heading: vehicle.heading,
      geofenceStatus,
      timestamp: vehicle.lastLocationUpdate
    };
    telemetryHistory.push(telemetryRecord);
    if (telemetryHistory.length > 500) {
      telemetryHistory.shift();
    }

    // BROADCAST to all listening dashboards (Admin, Transporter, Customer)
    io.emit('vehicle:location:update', {
      vehicleId,
      driverId,
      shipmentId: shipment?.id,
      tripId: tripId || vehicle.activeTripId,
      coordinates: { lat, lng },
      speedKmh: vehicle.speedKmh,
      heading: vehicle.heading,
      accuracy: vehicle.accuracyMeters,
      geofenceStatus,
      lastLocationUpdate: vehicle.lastLocationUpdate,
      vehicle
    });
  });

  // Event: Driver Starts Trip
  socket.on('vehicle:trip:start', (data: { vehicleId: string; driverId: string; shipmentId?: string; tripId?: string }) => {
    const { vehicleId, driverId, shipmentId, tripId } = data;
    const verification = verifyDriverAndVehicle(vehicleId, driverId);
    if (!verification.valid || !verification.vehicle) {
      socket.emit('error', { message: verification.error || 'Unauthorized' });
      return;
    }

    const vehicle = verification.vehicle;
    const generatedTripId = tripId || `TRIP-${Date.now()}`;
    vehicle.status = 'IN_TRANSIT';
    vehicle.activeTripId = generatedTripId;
    vehicle.activeShipmentId = shipmentId;
    vehicle.isTrackingActive = true;
    vehicle.isPaused = false;
    vehicle.offlineStatus = 'LIVE';
    vehicle.lastLocationUpdate = new Date().toISOString();

    if (shipmentId) {
      const shipment = shipmentsState.find(s => s.id === shipmentId);
      if (shipment) {
        shipment.status = 'IN_TRANSIT';
        shipment.assignedVehicleId = vehicleId;
        shipment.assignedVehicleNumber = vehicle.vehicleNumber;
        shipment.assignedTransporterName = vehicle.driverName;
        io.emit('shipment:status:update', shipment);
      }
    }

    io.emit('vehicle:trip:start', {
      vehicleId,
      driverId,
      shipmentId,
      tripId: generatedTripId,
      vehicle
    });
  });

  // Event: Driver Pauses Trip
  socket.on('vehicle:trip:pause', (data: { vehicleId: string; driverId: string; tripId?: string }) => {
    const { vehicleId, driverId, tripId } = data;
    const verification = verifyDriverAndVehicle(vehicleId, driverId);
    if (!verification.valid || !verification.vehicle) return;

    const vehicle = verification.vehicle;
    vehicle.isPaused = true;
    vehicle.speedKmh = 0;

    io.emit('vehicle:trip:pause', { vehicleId, driverId, tripId, vehicle });
  });

  // Event: Driver Resumes Trip
  socket.on('vehicle:trip:resume', (data: { vehicleId: string; driverId: string; tripId?: string }) => {
    const { vehicleId, driverId, tripId } = data;
    const verification = verifyDriverAndVehicle(vehicleId, driverId);
    if (!verification.valid || !verification.vehicle) return;

    const vehicle = verification.vehicle;
    vehicle.isPaused = false;

    io.emit('vehicle:trip:resume', { vehicleId, driverId, tripId, vehicle });
  });

  // Event: Driver Ends Trip
  socket.on('vehicle:trip:end', (data: { vehicleId: string; driverId: string; tripId?: string; shipmentId?: string; finalLocation?: { lat: number; lng: number } }) => {
    const { vehicleId, driverId, tripId, shipmentId, finalLocation } = data;
    const verification = verifyDriverAndVehicle(vehicleId, driverId);
    if (!verification.valid || !verification.vehicle) return;

    const vehicle = verification.vehicle;
    vehicle.status = 'DELIVERED';
    vehicle.isTrackingActive = false;
    vehicle.isPaused = false;
    vehicle.speedKmh = 0;
    vehicle.completedTrips = (vehicle.completedTrips || 0) + 1;
    vehicle.activeTripId = undefined;
    vehicle.activeShipmentId = undefined;

    if (finalLocation?.lat && finalLocation?.lng) {
      vehicle.currentLocation.coordinates = {
        lat: Number(finalLocation.lat),
        lng: Number(finalLocation.lng)
      };
    }

    if (shipmentId) {
      const shipment = shipmentsState.find(s => s.id === shipmentId);
      if (shipment) {
        shipment.status = 'DELIVERED';
        shipment.deliveredAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        io.emit('shipment:status:update', shipment);
      }
    }

    io.emit('vehicle:trip:end', {
      vehicleId,
      driverId,
      tripId,
      shipmentId,
      vehicle
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚜 GRAMINLINK Live Telemetry Backend running on port ${PORT}`);
  console.log(`📡 WebSocket & REST Endpoints active at http://localhost:${PORT}`);
  console.log(`================================================================`);
});
