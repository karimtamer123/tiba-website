-- Insert initial admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admin_users (username, password) VALUES 
('admin', '$2b$10$rOzJqKQHxH5QxH5QxH5QxeQxH5QxH5QxH5QxH5QxH5QxH5QxH5QxH');

-- Insert initial statistics
INSERT INTO statistics (value, label, description, suffix, display_order) VALUES
('46', 'Years in Business', 'Pioneering HVAC excellence since 1978', '', 1),
('7598', 'Projects Completed', '', '', 2),
('30', 'Global Partners', '', '+', 3),
('200', 'Clients & Partners', '', '+', 4);

-- Insert initial slideshow images (using existing images)
INSERT INTO slideshow_images (image_path, title, subtitle, display_order) VALUES
('indexbackground/TIBA MANZALAWI GROU-14.jpg', 'Engineering Excellence Since 1978', 'Leading the HVAC industry across Egypt and the Middle East with innovative solutions and unwavering commitment to quality.', 1),
('indexbackground/TIBA MANZALAWI GROU-10.jpg', 'Complete HVAC Solutions Portfolio', 'From air handling units to cooling towers, chillers to VRF systems - we provide comprehensive HVAC solutions for every application.', 2),
('indexbackground/TIBA MANZALAWI GROUP-139.jpg', 'Landmark Projects & Achievements', 'Engineering iconic buildings across the Middle East with over 7,598 projects successfully delivered.', 3),
('indexbackground/TIBA MANZALAWI GROUP-100.jpg', 'Trusted Global Partnerships', 'Collaborating with 30+ industry leaders worldwide including Samsung, Dunham-Bush, Evapco, and Trox.', 4),
('indexbackground/TIBA MANZALAWI GROUP-135.jpg', 'Join Our Growing Success', 'Building the future of HVAC together with talented professionals and unlimited growth potential.', 5);

