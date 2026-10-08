-- ==============================================================================
-- GRAMINLINK: Maharashtra Rural Logistics Coordination & Optimization Platform
-- Database Schema (PostgreSQL / Supabase)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TYPE user_role AS ENUM (
    'ENTREPRENEUR_SHG',
    'FARMER',
    'TRANSPORTER_DRIVER',
    'HUB_MANAGER',
    'MARKET_BUYER',
    'ADMIN'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    role user_role NOT NULL,
    organization_name VARCHAR(255), -- e.g. "Prerna Mahila Mandal", "Matsyakanya SHG"
    district VARCHAR(100) NOT NULL, -- e.g. "Ratnagiri", "Nashik", "Raigad"
    taluka VARCHAR(100) NOT NULL,   -- e.g. "Dapoli", "Dindori", "Panvel"
    village VARCHAR(100) NOT NULL,  -- e.g. "Gavhan", "Khed Village"
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HUBS, MANDIS & COLLECTION POINTS
CREATE TYPE hub_type AS ENUM (
    'VILLAGE_COLLECTION_POINT',
    'TALUKA_HUB',
    'DISTRICT_HUB',
    'MANDI_APMC',
    'CENTRAL_WAREHOUSE'
);

CREATE TABLE logistics_hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type hub_type NOT NULL,
    district VARCHAR(100) NOT NULL,
    taluka VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    total_capacity_kg DECIMAL(10, 2) DEFAULT 10000.00,
    current_occupancy_kg DECIMAL(10, 2) DEFAULT 0.00,
    manager_user_id UUID REFERENCES users(id),
    operating_hours VARCHAR(100) DEFAULT '06:00 AM - 08:00 PM',
    has_cold_storage BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. VEHICLES & TRANSPORTER PROFILES
CREATE TYPE vehicle_category AS ENUM (
    'AUTO_RICKSHAW',
    'E_RICKSHAW_CARGO',
    'TATA_ACE',
    'BOLERO_PICKUP',
    'MINI_TRUCK_407',
    'HEAVY_TRUCK'
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transporter_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. "MH-08-E-4219"
    vehicle_category vehicle_category NOT NULL,
    make_model VARCHAR(100) NOT NULL, -- e.g. "Tata Ace Gold", "Mahindra Bolero Maxi Truck"
    max_payload_kg DECIMAL(10, 2) NOT NULL, -- e.g. 750.00
    current_payload_kg DECIMAL(10, 2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT TRUE,
    current_lat DECIMAL(10, 7),
    current_lng DECIMAL(10, 7),
    current_speed_kmh DECIMAL(5, 2) DEFAULT 0.0,
    base_rate_per_km DECIMAL(10, 2) DEFAULT 18.00,
    rating DECIMAL(3, 2) DEFAULT 4.8,
    total_trips_completed INT DEFAULT 0,
    permit_valid_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. GOODS CATEGORIES & SHIPMENTS
CREATE TYPE goods_category AS ENUM (
    'PERISHABLE_AGRI',
    'PROCESSED_FOOD',
    'HANDICRAFTS',
    'DAIRY',
    'FISHERIES',
    'FRUITS',
    'VEGETABLES',
    'SPICES',
    'POULTRY_FEED',
    'GENERAL_GOODS'
);

CREATE TYPE destination_type AS ENUM (
    'TALUKA_HUB',
    'DISTRICT_HUB',
    'MANDI_APMC',
    'RETAIL_BUYER',
    'WHOLESALE_BUYER',
    'WAREHOUSE'
);

CREATE TYPE shipment_status AS ENUM (
    'DRAFT',
    'ORDER_CREATED',
    'POOL_SEARCHING',
    'POOL_CONFIRMED',
    'TRANSPORTER_ASSIGNED',
    'PICKUP_SCHEDULED',
    'PICKED_UP',
    'IN_TRANSIT',
    'AT_HUB',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED'
);

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. "GL-2026-00125"
    creator_user_id UUID REFERENCES users(id) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category goods_category NOT NULL,
    weight_kg DECIMAL(10, 2) NOT NULL,
    package_count INT DEFAULT 1,
    requires_cold_chain BOOLEAN DEFAULT FALSE,
    special_instructions TEXT,
    
    -- Origin Details
    origin_district VARCHAR(100) NOT NULL,
    origin_taluka VARCHAR(100) NOT NULL,
    origin_village VARCHAR(100) NOT NULL,
    origin_address TEXT NOT NULL,
    origin_lat DECIMAL(10, 7) NOT NULL,
    origin_lng DECIMAL(10, 7) NOT NULL,
    pickup_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_window_end TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Destination Details
    dest_name VARCHAR(255) NOT NULL,
    dest_type destination_type NOT NULL,
    dest_district VARCHAR(100) NOT NULL,
    dest_taluka VARCHAR(100) NOT NULL,
    dest_address TEXT NOT NULL,
    dest_lat DECIMAL(10, 7) NOT NULL,
    dest_lng DECIMAL(10, 7) NOT NULL,
    target_delivery_time TIMESTAMP WITH TIME ZONE,
    destination_hub_id UUID REFERENCES logistics_hubs(id),
    buyer_user_id UUID REFERENCES users(id),

    -- Cost & Pricing
    estimated_solo_cost DECIMAL(10, 2) NOT NULL,
    estimated_pooled_cost DECIMAL(10, 2) NOT NULL,
    final_allocated_cost DECIMAL(10, 2),
    
    -- State
    status shipment_status DEFAULT 'ORDER_CREATED',
    current_pool_id UUID,
    assigned_vehicle_id UUID REFERENCES vehicles(id),
    assigned_transporter_id UUID REFERENCES users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. POOLING ENGINE & POOL MANIFESTS
CREATE TYPE pool_status AS ENUM (
    'FORMING',
    'MATCHED',
    'DISPATCHED',
    'IN_TRANSIT',
    'COMPLETED',
    'CANCELLED'
);

CREATE TABLE shipment_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. "POOL-MH-1024"
    cluster_origin_area VARCHAR(255) NOT NULL, -- e.g. "Dapoli - Khed Belt"
    cluster_dest_area VARCHAR(255) NOT NULL,   -- e.g. "Chiplun APMC / Panvel Hub"
    status pool_status DEFAULT 'FORMING',
    
    total_weight_kg DECIMAL(10, 2) DEFAULT 0.00,
    max_vehicle_capacity_kg DECIMAL(10, 2) DEFAULT 750.00,
    utilization_percentage DECIMAL(5, 2) DEFAULT 0.00,
    
    total_solo_cost DECIMAL(10, 2) DEFAULT 0.00,
    total_pooled_cost DECIMAL(10, 2) DEFAULT 0.00,
    total_savings_amount DECIMAL(10, 2) DEFAULT 0.00,
    savings_percentage DECIMAL(5, 2) DEFAULT 0.00,
    
    assigned_vehicle_id UUID REFERENCES vehicles(id),
    assigned_transporter_id UUID REFERENCES users(id),
    scheduled_departure TIMESTAMP WITH TIME ZONE,
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_departure TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Associate shipments with pools
CREATE TABLE pool_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id UUID REFERENCES shipment_pools(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    stop_sequence INT NOT NULL,
    allocated_fare DECIMAL(10, 2) NOT NULL,
    is_picked_up BOOLEAN DEFAULT FALSE,
    is_delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pool_id, shipment_id)
);

-- 6. ROUTE OPTIMIZATION & WAYPOINTS
CREATE TABLE optimized_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id UUID REFERENCES shipment_pools(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id),
    raw_distance_km DECIMAL(10, 2) NOT NULL,
    optimized_distance_km DECIMAL(10, 2) NOT NULL,
    distance_saved_km DECIMAL(10, 2) NOT NULL,
    estimated_fuel_saved_litres DECIMAL(8, 2) NOT NULL,
    estimated_carbon_offset_kg DECIMAL(8, 2) NOT NULL,
    estimated_duration_mins INT NOT NULL,
    waypoints_json JSONB NOT NULL, -- GeoJSON / Array of Waypoints {lat, lng, name, stopType, seq}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RETURN TRIP OPTIMIZATION OPPORTUNITIES
CREATE TYPE return_trip_status AS ENUM (
    'AVAILABLE',
    'CLAIMED',
    'IN_TRANSIT',
    'COMPLETED',
    'EXPIRED'
);

CREATE TABLE return_trip_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_pool_id UUID REFERENCES shipment_pools(id),
    transporter_id UUID REFERENCES users(id),
    vehicle_id UUID REFERENCES vehicles(id),
    origin_point VARCHAR(255) NOT NULL, -- e.g. "Khed Mandi / APMC"
    destination_point VARCHAR(255) NOT NULL, -- e.g. "Dapoli Rural Hub"
    return_cargo_description TEXT NOT NULL, -- e.g. "180 kg organic fertilizers & poultry feed"
    weight_kg DECIMAL(10, 2) NOT NULL,
    additional_earnings DECIMAL(10, 2) NOT NULL,
    departure_time_window VARCHAR(100),
    status return_trip_status DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. LIVE NOTIFICATIONS & ALERTS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'POOL_MATCH', 'TRANSPORTER_ASSIGNED', 'PICKUP_SCHEDULED', 'RETURN_LOAD', etc.
    reference_id VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_origin ON shipments(origin_district, origin_taluka);
CREATE INDEX idx_shipments_dest ON shipments(dest_district, dest_taluka);
CREATE INDEX idx_vehicles_availability ON vehicles(is_available);
CREATE INDEX idx_pools_status ON shipment_pools(status);

-- 9. REAL-TIME VEHICLE LOCATION TELEMETRY & GPS TRACKING
CREATE TYPE trip_tracking_status AS ENUM (
    'IDLE',
    'TRIP_STARTED',
    'TRIP_PAUSED',
    'ARRIVED_PICKUP',
    'PICKED_UP',
    'IN_TRANSIT',
    'ARRIVED_DESTINATION',
    'DELIVERED',
    'TRIP_COMPLETED'
);

CREATE TABLE vehicle_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
    trip_id VARCHAR(100),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    accuracy DECIMAL(8, 2), -- Accuracy in meters from Geolocation API
    speed_kmh DECIMAL(5, 2) DEFAULT 0.0,
    heading DECIMAL(5, 2),
    geofence_status VARCHAR(50) DEFAULT 'IN_TRANSIT',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vehicle_locations_vehicle_time ON vehicle_locations(vehicle_id, timestamp DESC);
CREATE INDEX idx_vehicle_locations_trip ON vehicle_locations(trip_id);
CREATE INDEX idx_vehicle_locations_driver ON vehicle_locations(driver_id);

