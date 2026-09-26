-- Advanced Logistics and Fleet Monitoring System - Initial Schema
CREATE DATABASE IF NOT EXISTS fleet_db;
USE fleet_db;

-- Users table (admins, drivers, supervisors)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','driver','supervisor') NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(50) NOT NULL UNIQUE,
  model VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  status ENUM('active','maintenance','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table (profile per driver; linked to users.id with role=driver)
CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  license_no VARCHAR(50),
  shift ENUM('morning','evening','night') DEFAULT 'morning',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Assignment: which driver is assigned to which vehicle (current assignment)
CREATE TABLE IF NOT EXISTS vehicle_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  material VARCHAR(100) NULL,
  quantity DECIMAL(10,2) NULL,
  status ENUM('planned','started','paused','completed','cancelled') DEFAULT 'planned',
  started_at DATETIME NULL,
  paused_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- Trip location pings for live tracking
CREATE TABLE IF NOT EXISTS trip_locations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  speed DECIMAL(6,2) NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- Trip issues reported by drivers (optional photo proof)
CREATE TABLE IF NOT EXISTS trip_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  user_id INT NOT NULL,
  description VARCHAR(255) NULL,
  address VARCHAR(255) NULL,
  photo_path VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Verification & approvals (supervisor)
CREATE TABLE IF NOT EXISTS trip_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  supervisor_id INT NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  remarks VARCHAR(255),
  verified_at DATETIME NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Simple reports metadata (for generated files or aggregated rows)
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  params JSON NULL,
  generated_by INT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);
