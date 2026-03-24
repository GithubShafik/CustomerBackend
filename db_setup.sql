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
