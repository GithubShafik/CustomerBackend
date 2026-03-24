-- Fix for "Duplicate entry '' for key 'PRIMARY'"
-- Run this in your MySQL database (PeddalDrop_Live)

-- 1. Ensure ORID is AUTO_INCREMENT
ALTER TABLE Orders MODIFY COLUMN ORID INT AUTO_INCREMENT;

-- 2. Ensure OTID is AUTO_INCREMENT
ALTER TABLE OrderTrips MODIFY COLUMN OTID INT AUTO_INCREMENT;

-- Optional: If you already have rows with ORID = 0 or empty, 
-- you might need to clean them up first or reset the AUTO_INCREMENT value.
-- SELECT * FROM Orders WHERE ORID = 0;
-- DELETE FROM Orders WHERE ORID = 0;
