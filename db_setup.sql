-- SQL Setup Script for MVP
-- Run this in your MySQL database (PeddalDrop_Live)

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS Orders (
    ORID VARCHAR(36) PRIMARY KEY,
    ORDT DATETIME DEFAULT CURRENT_TIMESTAMP,
    ORVL DECIMAL(10, 2),
    ORST VARCHAR(50),
    ORDD DATETIME,
    ORCD VARCHAR(100), -- Customer Code / Cancel Time
    OOID VARCHAR(36)
);

-- 2. OrderTrips Table
CREATE TABLE IF NOT EXISTS OrderTrips (
    OTID VARCHAR(36) PRIMARY KEY,
    ORID VARCHAR(36),
    OTSLL VARCHAR(100), -- Pickup "lat,lng"
    OTDLL VARCHAR(100), -- Drop "lat,lng"
    OTSA1 VARCHAR(50), -- Pickup address line 1
    OTSC VARCHAR(50), -- Pickup city
    OTSS VARCHAR(50), -- Pickup state
    OTSCO VARCHAR(50), -- Pickup country
    OTDA1 VARCHAR(50), -- Drop address line 1
    OTDC VARCHAR(50), -- Drop city
    OTDS VARCHAR(50), -- Drop state
    OTDCO VARCHAR(50), -- Drop country
    OTDN VARCHAR(100), -- Destination contact name
    OTDO VARCHAR(20), -- Destination contact phone
    OTSD DATETIME,
    OTDD DATETIME,
    FOREIGN KEY (ORID) REFERENCES Orders(ORID)
);

-- 3. DPLocation Table (Delivery Partners)
CREATE TABLE IF NOT EXISTS DPLocation (
    DPID INT PRIMARY KEY,
    DPSTA TINYINT(1) DEFAULT 1, -- 1 = Active
    DPCLL VARCHAR(100) -- Current "lat,lng"
);

-- 4. Sample Partner Data (Optional - for testing)
-- Replace with actual partner location within 2km of your test pickup
-- INSERT INTO DPLocation (DPID, DPSTA, DPCLL) VALUES (1, 1, '19.0760,72.8777'); 
