-- Initial Seed Data for HostelSync

INSERT INTO hostels (id, name, capacity, address) VALUES
(1, 'Gopabandhu Hostel - Block A', 120, 'Campus North Wing'),
(2, 'Kalam Hall - Block B', 150, 'Campus East Wing');

INSERT INTO rooms (id, room_number, capacity, current_occupancy, floor, status, hostel_id) VALUES
(1, '101', 4, 1, 1, 'AVAILABLE', 1),
(2, '102', 4, 0, 1, 'AVAILABLE', 1),
(3, '201', 4, 0, 2, 'AVAILABLE', 2);

INSERT INTO users (id, username, password, role, name, hostel_id) VALUES
(1, 'superadmin', '$2a$10$9861944502@SA', 'SUPERADMIN', 'System Super Admin', 1),
(2, 'admin', '$2a$10$admin123', 'ADMIN', 'Superintendent Block A', 1),
(3, 'canteen', '$2a$10$canteen123', 'CANTEEN_STAFF', 'Canteen Officer', 1),
(4, 'caretaker', '$2a$10$caretaker123', 'CARETAKER', 'Hostel Caretaker', 1);
