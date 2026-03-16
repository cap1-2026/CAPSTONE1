-- Add payment_status column to bookings table
-- Run this in phpMyAdmin or MySQL to enable owner payment approval flow

USE apartment_system;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_status ENUM('none','pending_owner_approval','approved','rejected') DEFAULT 'none' AFTER contract_status;
