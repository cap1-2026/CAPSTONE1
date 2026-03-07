-- Update bookings table to include personal information and ID verification
-- Run this SQL in phpMyAdmin to update your existing bookings table

USE apartment_system;

-- Add new columns to bookings table for personal information
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) AFTER property_id,
ADD COLUMN IF NOT EXISTS email VARCHAR(255) AFTER full_name,
ADD COLUMN IF NOT EXISTS phone VARCHAR(50) AFTER email,
ADD COLUMN IF NOT EXISTS current_address TEXT AFTER phone,
ADD COLUMN IF NOT EXISTS id_type VARCHAR(100) AFTER current_address,
ADD COLUMN IF NOT EXISTS id_number VARCHAR(100) AFTER id_type,
ADD COLUMN IF NOT EXISTS id_image_path VARCHAR(500) AFTER id_number,
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255) AFTER id_image_path,
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50) AFTER emergency_contact_name,
ADD COLUMN IF NOT EXISTS lease_duration VARCHAR(50) AFTER emergency_contact_phone;

-- Add index for email lookup
ALTER TABLE bookings ADD INDEX IF NOT EXISTS idx_email (email);
