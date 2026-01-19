-- HR Users table (separate from admin users)
CREATE TABLE IF NOT EXISTS hr_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  age INT NOT NULL,
  position VARCHAR(255) NOT NULL,
  experience VARCHAR(50) NOT NULL,
  cv_path VARCHAR(500) NOT NULL,
  cover_letter TEXT,
  status ENUM('new', 'reviewed', 'shortlisted', 'rejected', 'hired') DEFAULT 'new',
  notes TEXT,
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewed_by) REFERENCES hr_users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_position (position),
  INDEX idx_created_at (created_at)
);

