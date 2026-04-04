-- ============================================================
-- SRP AI HRMS - Demo Seed Data
-- Creates a demo tenant with admin + staff accounts
-- ============================================================
-- Password for all demo accounts: Demo@2026!
-- bcrypt hash of "Demo@2026!" with 12 rounds
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. DEMO TENANT
-- ============================================================
INSERT INTO tenants (id, name, slug, domain, logo, settings, status, plan, max_users, trial_ends_at, created_at, updated_at)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'SRP AI Labs Demo',
  'demo',
  'demo.hrms.srpailabs.com',
  NULL,
  '{"timezone": "Asia/Kolkata", "currency": "INR", "dateFormat": "DD/MM/YYYY", "language": "en", "features": {"ai": true, "attendance": true, "payroll": true, "recruitment": true, "performance": true, "analytics": true}}',
  'active',
  'enterprise',
  100,
  (NOW() + INTERVAL '90 days'),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. PERMISSIONS
-- ============================================================
INSERT INTO permissions (id, resource, action, description) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'tenant', 'manage', 'Full tenant management'),
  ('b0000000-0000-4000-8000-000000000002', 'users', 'create', 'Create users'),
  ('b0000000-0000-4000-8000-000000000003', 'users', 'read', 'View users'),
  ('b0000000-0000-4000-8000-000000000004', 'users', 'update', 'Update users'),
  ('b0000000-0000-4000-8000-000000000005', 'users', 'delete', 'Delete users'),
  ('b0000000-0000-4000-8000-000000000006', 'employees', 'create', 'Create employees'),
  ('b0000000-0000-4000-8000-000000000007', 'employees', 'read', 'View employees'),
  ('b0000000-0000-4000-8000-000000000008', 'employees', 'update', 'Update employees'),
  ('b0000000-0000-4000-8000-000000000009', 'employees', 'delete', 'Delete employees'),
  ('b0000000-0000-4000-8000-000000000010', 'attendance', 'read', 'View attendance'),
  ('b0000000-0000-4000-8000-000000000011', 'attendance', 'manage', 'Manage attendance'),
  ('b0000000-0000-4000-8000-000000000012', 'payroll', 'read', 'View payroll'),
  ('b0000000-0000-4000-8000-000000000013', 'payroll', 'manage', 'Process payroll'),
  ('b0000000-0000-4000-8000-000000000014', 'recruitment', 'read', 'View recruitment'),
  ('b0000000-0000-4000-8000-000000000015', 'recruitment', 'manage', 'Manage recruitment'),
  ('b0000000-0000-4000-8000-000000000016', 'performance', 'read', 'View performance'),
  ('b0000000-0000-4000-8000-000000000017', 'performance', 'manage', 'Manage performance'),
  ('b0000000-0000-4000-8000-000000000018', 'reports', 'read', 'View reports'),
  ('b0000000-0000-4000-8000-000000000019', 'settings', 'manage', 'Manage settings'),
  ('b0000000-0000-4000-8000-000000000020', 'leave', 'read', 'View leave'),
  ('b0000000-0000-4000-8000-000000000021', 'leave', 'manage', 'Manage leave'),
  ('b0000000-0000-4000-8000-000000000022', 'leave', 'approve', 'Approve leave requests')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================
-- 3. ROLES
-- ============================================================
INSERT INTO roles (id, tenant_id, name, slug, description, is_system, created_at, updated_at) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Super Admin', 'super-admin', 'Full system access', true, NOW(), NOW()),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'HR Manager', 'hr-manager', 'HR department manager', true, NOW(), NOW()),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Manager', 'manager', 'Team/Department manager', true, NOW(), NOW()),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Employee', 'employee', 'Regular employee', true, NOW(), NOW())
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Super Admin gets ALL permissions
INSERT INTO role_permissions (id, role_id, permission_id) 
SELECT uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000001', id FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- HR Manager permissions
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000006'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000007'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000008'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000010'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000011'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000012'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000013'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000014'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000015'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000016'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000017'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000018'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000020'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000021'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000022')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Employee permissions (read own data)
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000007'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000010'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000012'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000016'),
  (uuid_generate_v4(), 'c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000020')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================
-- 4. DEPARTMENTS
-- ============================================================
INSERT INTO departments (id, tenant_id, name, code, description, parent_id, head_id, status, created_at, updated_at) VALUES
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Executive', 'EXEC', 'Executive leadership', NULL, NULL, 'active', NOW(), NOW()),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Human Resources', 'HR', 'People operations & talent management', NULL, NULL, 'active', NOW(), NOW()),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Engineering', 'ENG', 'Software development & infrastructure', NULL, NULL, 'active', NOW(), NOW()),
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Marketing', 'MKT', 'Brand & growth marketing', NULL, NULL, 'active', NOW(), NOW()),
  ('d0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Finance', 'FIN', 'Financial operations & accounting', NULL, NULL, 'active', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. POSITIONS
-- ============================================================
INSERT INTO positions (id, tenant_id, title, code, department_id, grade, band, min_salary, max_salary, status, created_at, updated_at) VALUES
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'CEO', 'CEO-001', 'd0000000-0000-4000-8000-000000000001', 'L10', 10, 0, 0, 'active', NOW(), NOW()),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'HR Director', 'HRD-001', 'd0000000-0000-4000-8000-000000000002', 'L8', 8, 0, 0, 'active', NOW(), NOW()),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'HR Manager', 'HRM-001', 'd0000000-0000-4000-8000-000000000002', 'L6', 6, 0, 0, 'active', NOW(), NOW()),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Senior Software Engineer', 'SSE-001', 'd0000000-0000-4000-8000-000000000003', 'L5', 5, 0, 0, 'active', NOW(), NOW()),
  ('e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Software Engineer', 'SE-001', 'd0000000-0000-4000-8000-000000000003', 'L4', 4, 0, 0, 'active', NOW(), NOW()),
  ('e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'Marketing Manager', 'MM-001', 'd0000000-0000-4000-8000-000000000004', 'L6', 6, 0, 0, 'active', NOW(), NOW()),
  ('e0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'Accountant', 'ACC-001', 'd0000000-0000-4000-8000-000000000005', 'L4', 4, 0, 0, 'active', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. USERS (password: Demo@2026!)
-- bcrypt hash generated with 12 rounds
-- ============================================================
-- NOTE: The password hash below is for "Demo@2026!" 
-- In production, use the auth service's registration endpoint instead
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, status, mfa_enabled, email_verified, created_at, updated_at) VALUES
  -- Admin
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'admin@demo.srpailabs.com', '$2b$12$LJ3m4ys3LMDrBN/XJqKgNuVp1CjGQDJvJGZZrT5mBZxrSQz/Udeay',
   'Demo', 'Admin', '+91-9876543210', 'active', false, true, NOW(), NOW()),
  -- HR Manager
  ('f0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'hr@demo.srpailabs.com', '$2b$12$LJ3m4ys3LMDrBN/XJqKgNuVp1CjGQDJvJGZZrT5mBZxrSQz/Udeay',
   'Priya', 'Sharma', '+91-9876543211', 'active', false, true, NOW(), NOW()),
  -- Engineering Manager
  ('f0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'engineering@demo.srpailabs.com', '$2b$12$LJ3m4ys3LMDrBN/XJqKgNuVp1CjGQDJvJGZZrT5mBZxrSQz/Udeay',
   'Rahul', 'Kumar', '+91-9876543212', 'active', false, true, NOW(), NOW()),
  -- Software Engineer 1
  ('f0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001',
   'dev1@demo.srpailabs.com', '$2b$12$LJ3m4ys3LMDrBN/XJqKgNuVp1CjGQDJvJGZZrT5mBZxrSQz/Udeay',
   'Anita', 'Patel', '+91-9876543213', 'active', false, true, NOW(), NOW()),
  -- Software Engineer 2
  ('f0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001',
   'dev2@demo.srpailabs.com', '$2b$12$LJ3m4ys3LMDrBN/XJqKgNuVp1CjGQDJvJGZZrT5mBZxrSQz/Udeay',
   'Vikram', 'Singh', '+91-9876543214', 'active', false, true, NOW(), NOW()),
  -- Marketing
  ('f0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001',
   'marketing@demo.srpailabs.com', '$2b$12$LJ3m4ys3LMDrBN/XJqKgNuVp1CjGQDJvJGZZrT5mBZxrSQz/Udeay',
   'Neha', 'Gupta', '+91-9876543215', 'active', false, true, NOW(), NOW()),
  -- Finance
  ('f0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001',
   'finance@demo.srpailabs.com', '$2b$12$LJ3m4ys3LMDrBN/XJqKgNuVp1CjGQDJvJGZZrT5mBZxrSQz/Udeay',
   'Arjun', 'Reddy', '+91-9876543216', 'active', false, true, NOW(), NOW())
ON CONFLICT (tenant_id, email) DO NOTHING;

-- ============================================================
-- 7. USER ROLES
-- ============================================================
INSERT INTO user_roles (id, user_id, role_id) VALUES
  (uuid_generate_v4(), 'f0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001'), -- Admin -> Super Admin
  (uuid_generate_v4(), 'f0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002'), -- Priya -> HR Manager
  (uuid_generate_v4(), 'f0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003'), -- Rahul -> Manager
  (uuid_generate_v4(), 'f0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004'), -- Anita -> Employee
  (uuid_generate_v4(), 'f0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000004'), -- Vikram -> Employee
  (uuid_generate_v4(), 'f0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000004'), -- Neha -> Employee
  (uuid_generate_v4(), 'f0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000004')  -- Arjun -> Employee
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ============================================================
-- 8. EMPLOYEES
-- ============================================================
INSERT INTO employees (id, tenant_id, user_id, employee_code, first_name, last_name, email, phone, date_of_birth, gender, department_id, position_id, manager_id, employment_type, date_of_joining, status, address, created_at, updated_at) VALUES
  -- Admin/CEO
  ('10000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'f0000000-0000-4000-8000-000000000001', 'SRP-001', 'Demo', 'Admin',
   'admin@demo.srpailabs.com', '+91-9876543210', '1985-06-15', 'male',
   'd0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   NULL, 'full_time', '2024-01-01', 'active',
   '{"line1": "123 Tech Park", "city": "Hyderabad", "state": "Telangana", "country": "India", "pincode": "500081"}',
   NOW(), NOW()),
  -- HR Director
  ('10000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'f0000000-0000-4000-8000-000000000002', 'SRP-002', 'Priya', 'Sharma',
   'hr@demo.srpailabs.com', '+91-9876543211', '1990-03-22', 'female',
   'd0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000001', 'full_time', '2024-02-01', 'active',
   '{"line1": "456 IT Hub", "city": "Hyderabad", "state": "Telangana", "country": "India", "pincode": "500082"}',
   NOW(), NOW()),
  -- Engineering Manager
  ('10000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'f0000000-0000-4000-8000-000000000003', 'SRP-003', 'Rahul', 'Kumar',
   'engineering@demo.srpailabs.com', '+91-9876543212', '1988-11-10', 'male',
   'd0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000004',
   '10000000-0000-4000-8000-000000000001', 'full_time', '2024-01-15', 'active',
   '{"line1": "789 Cyber City", "city": "Hyderabad", "state": "Telangana", "country": "India", "pincode": "500083"}',
   NOW(), NOW()),
  -- Developer 1
  ('10000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001',
   'f0000000-0000-4000-8000-000000000004', 'SRP-004', 'Anita', 'Patel',
   'dev1@demo.srpailabs.com', '+91-9876543213', '1995-07-18', 'female',
   'd0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000005',
   '10000000-0000-4000-8000-000000000003', 'full_time', '2024-03-01', 'active',
   '{"line1": "321 Dev Lane", "city": "Hyderabad", "state": "Telangana", "country": "India", "pincode": "500084"}',
   NOW(), NOW()),
  -- Developer 2
  ('10000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001',
   'f0000000-0000-4000-8000-000000000005', 'SRP-005', 'Vikram', 'Singh',
   'dev2@demo.srpailabs.com', '+91-9876543214', '1993-12-05', 'male',
   'd0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000005',
   '10000000-0000-4000-8000-000000000003', 'full_time', '2024-04-01', 'active',
   '{"line1": "654 Code Street", "city": "Bangalore", "state": "Karnataka", "country": "India", "pincode": "560001"}',
   NOW(), NOW()),
  -- Marketing Manager
  ('10000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001',
   'f0000000-0000-4000-8000-000000000006', 'SRP-006', 'Neha', 'Gupta',
   'marketing@demo.srpailabs.com', '+91-9876543215', '1992-08-30', 'female',
   'd0000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000006',
   '10000000-0000-4000-8000-000000000001', 'full_time', '2024-02-15', 'active',
   '{"line1": "987 Marketing Blvd", "city": "Hyderabad", "state": "Telangana", "country": "India", "pincode": "500085"}',
   NOW(), NOW()),
  -- Finance/Accountant
  ('10000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001',
   'f0000000-0000-4000-8000-000000000007', 'SRP-007', 'Arjun', 'Reddy',
   'finance@demo.srpailabs.com', '+91-9876543216', '1991-04-12', 'male',
   'd0000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000007',
   '10000000-0000-4000-8000-000000000001', 'full_time', '2024-03-15', 'active',
   '{"line1": "147 Finance Plaza", "city": "Hyderabad", "state": "Telangana", "country": "India", "pincode": "500086"}',
   NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 9. LEAVE TYPES
-- ============================================================
INSERT INTO leave_types (id, tenant_id, name, code, description, annual_quota, carry_forward_limit, encashable, is_paid, status, created_at, updated_at) VALUES
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Casual Leave', 'CL', 'Casual leave for personal work', 12, 6, false, true, 'active', NOW(), NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Sick Leave', 'SL', 'Medical / sick leave', 12, 0, false, true, 'active', NOW(), NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Earned Leave', 'EL', 'Earned / privilege leave', 15, 30, true, true, 'active', NOW(), NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Maternity Leave', 'ML', 'Maternity leave (26 weeks)', 182, 0, false, true, 'active', NOW(), NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Paternity Leave', 'PL', 'Paternity leave', 15, 0, false, true, 'active', NOW(), NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Compensatory Off', 'CO', 'Compensatory time off', 0, 0, false, true, 'active', NOW(), NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Loss of Pay', 'LOP', 'Leave without pay', 0, 0, false, false, 'active', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. HOLIDAYS (2026 India)
-- ============================================================
INSERT INTO holidays (id, tenant_id, name, date, type, location, created_at) VALUES
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Republic Day', '2026-01-26', 'national', 'all', NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Holi', '2026-03-17', 'national', 'all', NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Good Friday', '2026-04-03', 'national', 'all', NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Labour Day', '2026-05-01', 'national', 'all', NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Independence Day', '2026-08-15', 'national', 'all', NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Gandhi Jayanti', '2026-10-02', 'national', 'all', NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Diwali', '2026-10-20', 'national', 'all', NOW()),
  (uuid_generate_v4(), 'a0000000-0000-4000-8000-000000000001', 'Christmas', '2026-12-25', 'national', 'all', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- DEMO LOGIN CREDENTIALS
-- ============================================================
-- Tenant:  demo.hrms.srpailabs.com (slug: "demo")
--
-- Super Admin:  admin@demo.srpailabs.com      / Demo@2026!
-- HR Manager:   hr@demo.srpailabs.com         / Demo@2026!
-- Eng Manager:  engineering@demo.srpailabs.com / Demo@2026!
-- Developer:    dev1@demo.srpailabs.com        / Demo@2026!
-- Developer:    dev2@demo.srpailabs.com        / Demo@2026!
-- Marketing:    marketing@demo.srpailabs.com   / Demo@2026!
-- Finance:      finance@demo.srpailabs.com     / Demo@2026!
-- ============================================================
