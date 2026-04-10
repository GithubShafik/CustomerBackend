-- Migration Script: Add Destination Contact Fields to OrderTrips Table
-- Date: 2026-04-09
-- Description: Adds OTDN (Destination Name) and OTDO (Destination Contact) columns

-- Add Destination Name column
ALTER TABLE OrderTrips 
ADD COLUMN IF NOT EXISTS OTDN VARCHAR(100) NULL 
COMMENT 'Order trip destination contact name' 
AFTER OTDLL;

-- Add Destination Contact Phone column
ALTER TABLE OrderTrips 
ADD COLUMN IF NOT EXISTS OTDO VARCHAR(20) NULL 
COMMENT 'Order trip destination contact phone' 
AFTER OTDN;

-- Verify the columns were added
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'OrderTrips' 
AND COLUMN_NAME IN ('OTDN', 'OTDO');
