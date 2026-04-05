-- =====================================================
-- SRP AI HRMS - Demo Seed Data: 20 Additional Employees
-- Tenant: a0000000-0000-4000-8000-000000000001 (SRP AI Labs Demo)
-- Password hash: Demo@2026!
-- Run: psql -U srp_hrms_prod -d srp_hrms_prod -f seed-demo-employees.sql
-- =====================================================

DO $$
DECLARE
  v_tenant UUID := 'a0000000-0000-4000-8000-000000000001';
  v_pw TEXT := '$2a$12$n.XPEyGdzUAJRiglxWSdleOclgiHD0SA2p8Taqhky9gKUpbrl3CYu';
  v_role_emp UUID := 'c0000000-0000-4000-8000-000000000004';
  v_role_mgr UUID := 'c0000000-0000-4000-8000-000000000003';
  v_dept_eng UUID := 'd0000000-0000-4000-8000-000000000003';
  v_dept_hr  UUID := 'd0000000-0000-4000-8000-000000000002';
  v_dept_mkt UUID := 'd0000000-0000-4000-8000-000000000004';
  v_dept_fin UUID := 'd0000000-0000-4000-8000-000000000005';
  v_dept_exc UUID := 'd0000000-0000-4000-8000-000000000001';
  v_pos_ceo  UUID := 'e0000000-0000-4000-8000-000000000001';
  v_pos_hrd  UUID := 'e0000000-0000-4000-8000-000000000002';
  v_pos_hrm  UUID := 'e0000000-0000-4000-8000-000000000003';
  v_pos_sse  UUID := 'e0000000-0000-4000-8000-000000000004';
  v_pos_se   UUID := 'e0000000-0000-4000-8000-000000000005';
  v_pos_mktm UUID := 'e0000000-0000-4000-8000-000000000006';
  v_pos_acc  UUID := 'e0000000-0000-4000-8000-000000000007';
  v_ceo  UUID := '10000000-0000-4000-8000-000000000001';
  v_eng  UUID := '10000000-0000-4000-8000-000000000003';
  v_hr   UUID := '10000000-0000-4000-8000-000000000002';
  v_mkt  UUID := '10000000-0000-4000-8000-000000000006';
  v_fin  UUID := '10000000-0000-4000-8000-000000000007';
  v_lt_casual UUID;
  v_lt_sick   UUID;
  v_lt_earned UUID;
BEGIN

  SELECT id INTO v_lt_casual FROM leave_types WHERE name = 'Casual Leave' LIMIT 1;
  SELECT id INTO v_lt_sick   FROM leave_types WHERE name = 'Sick Leave'   LIMIT 1;
  SELECT id INTO v_lt_earned FROM leave_types WHERE name = 'Earned Leave' LIMIT 1;

  -- =========== USERS ===========
  INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, status, email_verified, updated_at) VALUES
    ('f0000000-0000-4000-8000-000000000008', v_tenant, 'liang.wei@demo.srpailabs.com',           v_pw, 'Liang',    'Wei',         '+65-91234501',     'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000009', v_tenant, 'kavya.menon@demo.srpailabs.com',          v_pw, 'Kavya',    'Menon',        '+91-9876543210',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000010', v_tenant, 'daniel.fernandez@demo.srpailabs.com',     v_pw, 'Daniel',   'Fernandez',    '+60-1234567890',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000011', v_tenant, 'sana.mirza@demo.srpailabs.com',           v_pw, 'Sana',     'Mirza',        '+92-3001234567',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000012', v_tenant, 'rohan.mehta@demo.srpailabs.com',          v_pw, 'Rohan',    'Mehta',        '+91-9988776655',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000013', v_tenant, 'fatima.alrashid@demo.srpailabs.com',      v_pw, 'Fatima',   'Al-Rashid',    '+971-501234567',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000014', v_tenant, 'chris.okonkwo@demo.srpailabs.com',        v_pw, 'Chris',    'Okonkwo',      '+234-8012345678',  'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000015', v_tenant, 'mohammed.alfarsi@demo.srpailabs.com',     v_pw, 'Mohammed', 'Al-Farsi',     '+973-36123456',    'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000016', v_tenant, 'aanya.kapoor@demo.srpailabs.com',         v_pw, 'Aanya',    'Kapoor',       '+91-9876543211',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000017', v_tenant, 'isabel.torres@demo.srpailabs.com',        v_pw, 'Isabel',   'Torres',       '+57-3012345678',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000018', v_tenant, 'kenji.tanaka@demo.srpailabs.com',         v_pw, 'Kenji',    'Tanaka',       '+81-9012345678',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000019', v_tenant, 'advita.rao@demo.srpailabs.com',           v_pw, 'Advita',   'Rao',          '+91-9876543212',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000020', v_tenant, 'ben.zhang@demo.srpailabs.com',            v_pw, 'Ben',      'Zhang',        '+86-13812345678',  'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000021', v_tenant, 'layla.hassan@demo.srpailabs.com',         v_pw, 'Layla',    'Hassan',       '+20-1012345678',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000022', v_tenant, 'patrick.osei@demo.srpailabs.com',         v_pw, 'Patrick',  'Osei',         '+233-244123456',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000023', v_tenant, 'yasmin.alsayed@demo.srpailabs.com',       v_pw, 'Yasmin',   'Al-Sayed',     '+966-501234567',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000024', v_tenant, 'raj.malhotra@demo.srpailabs.com',         v_pw, 'Raj',      'Malhotra',     '+91-9876543213',   'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000025', v_tenant, 'elena.petrov@demo.srpailabs.com',         v_pw, 'Elena',    'Petrov',       '+7-9123456789',    'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000026', v_tenant, 'james.richardson@demo.srpailabs.com',     v_pw, 'James',    'Richardson',   '+1-4155551234',    'active', true, NOW()),
    ('f0000000-0000-4000-8000-000000000027', v_tenant, 'sara.johnson@demo.srpailabs.com',         v_pw, 'Sara',     'Johnson',      '+1-4155551235',    'active', true, NOW())
  ON CONFLICT (tenant_id, email) DO NOTHING;

  -- =========== EMPLOYEES ===========
  INSERT INTO employees (id, tenant_id, user_id, employee_code, first_name, last_name, email, phone, date_of_birth, gender, nationality, department_id, position_id, manager_id, employment_type, date_of_joining, status, address, emergency_contacts, custom_fields, updated_at) VALUES
    ('10000000-0000-4000-8000-000000000008', v_tenant, 'f0000000-0000-4000-8000-000000000008', 'SRP-008', 'Liang',    'Wei',       'liang.wei@demo.srpailabs.com',           '+65-91234501',     '1993-06-10', 'male',   'Singaporean', v_dept_eng, v_pos_sse,  v_eng, 'full_time', '2023-01-15', 'active', '{"city":"Singapore","country":"Singapore"}', '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000009', v_tenant, 'f0000000-0000-4000-8000-000000000009', 'SRP-009', 'Kavya',    'Menon',     'kavya.menon@demo.srpailabs.com',          '+91-9876543210',   '1996-11-22', 'female', 'Indian',      v_dept_eng, v_pos_se,   v_eng, 'full_time', '2024-03-01', 'active', '{"city":"Bangalore","country":"India"}',    '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000010', v_tenant, 'f0000000-0000-4000-8000-000000000010', 'SRP-010', 'Daniel',   'Fernandez', 'daniel.fernandez@demo.srpailabs.com',     '+60-1234567890',   '1994-03-18', 'male',   'Malaysian',   v_dept_eng, v_pos_se,   '10000000-0000-4000-8000-000000000008', 'full_time', '2023-07-01', 'active', '{"city":"Kuala Lumpur","country":"Malaysia"}', '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000011', v_tenant, 'f0000000-0000-4000-8000-000000000011', 'SRP-011', 'Sana',     'Mirza',     'sana.mirza@demo.srpailabs.com',           '+92-3001234567',   '1995-08-05', 'female', 'Pakistani',   v_dept_eng, v_pos_sse,  v_eng, 'full_time', '2022-11-15', 'active', '{"city":"Lahore","country":"Pakistan"}',    '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000012', v_tenant, 'f0000000-0000-4000-8000-000000000012', 'SRP-012', 'Rohan',    'Mehta',     'rohan.mehta@demo.srpailabs.com',          '+91-9988776655',   '1997-02-14', 'male',   'Indian',      v_dept_eng, v_pos_se,   '10000000-0000-4000-8000-000000000008', 'full_time', '2024-06-01', 'active', '{"city":"Mumbai","country":"India"}',      '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000013', v_tenant, 'f0000000-0000-4000-8000-000000000013', 'SRP-013', 'Fatima',   'Al-Rashid', 'fatima.alrashid@demo.srpailabs.com',      '+971-501234567',   '1992-09-30', 'female', 'Emirati',     v_dept_eng, v_pos_se,   '10000000-0000-4000-8000-000000000008', 'full_time', '2023-04-15', 'active', '{"city":"Dubai","country":"UAE"}',         '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000014', v_tenant, 'f0000000-0000-4000-8000-000000000014', 'SRP-014', 'Chris',    'Okonkwo',   'chris.okonkwo@demo.srpailabs.com',        '+234-8012345678',  '1991-12-07', 'male',   'Nigerian',    v_dept_eng, v_pos_sse,  v_eng, 'full_time', '2022-08-01', 'active', '{"city":"Lagos","country":"Nigeria"}',     '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000015', v_tenant, 'f0000000-0000-4000-8000-000000000015', 'SRP-015', 'Mohammed', 'Al-Farsi',  'mohammed.alfarsi@demo.srpailabs.com',     '+973-36123456',    '1994-05-25', 'male',   'Bahraini',    v_dept_eng, v_pos_se,   v_eng, 'full_time', '2023-10-01', 'active', '{"city":"Manama","country":"Bahrain"}',    '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000016', v_tenant, 'f0000000-0000-4000-8000-000000000016', 'SRP-016', 'Aanya',    'Kapoor',    'aanya.kapoor@demo.srpailabs.com',         '+91-9876543211',   '1993-07-19', 'female', 'Indian',      v_dept_hr,  v_pos_hrm,  v_hr,  'full_time', '2023-02-01', 'active', '{"city":"Delhi","country":"India"}',       '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000017', v_tenant, 'f0000000-0000-4000-8000-000000000017', 'SRP-017', 'Isabel',   'Torres',    'isabel.torres@demo.srpailabs.com',        '+57-3012345678',   '1990-04-12', 'female', 'Colombian',   v_dept_hr,  v_pos_hrm,  v_hr,  'full_time', '2022-06-15', 'active', '{"city":"Bogota","country":"Colombia"}',   '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000018', v_tenant, 'f0000000-0000-4000-8000-000000000018', 'SRP-018', 'Kenji',    'Tanaka',    'kenji.tanaka@demo.srpailabs.com',         '+81-9012345678',   '1989-10-01', 'male',   'Japanese',    v_dept_hr,  v_pos_hrm,  v_hr,  'full_time', '2021-11-01', 'active', '{"city":"Tokyo","country":"Japan"}',       '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000019', v_tenant, 'f0000000-0000-4000-8000-000000000019', 'SRP-019', 'Advita',   'Rao',       'advita.rao@demo.srpailabs.com',           '+91-9876543212',   '1995-01-28', 'female', 'Indian',      v_dept_mkt, v_pos_mktm, v_mkt, 'full_time', '2023-09-01', 'active', '{"city":"Chennai","country":"India"}',     '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000020', v_tenant, 'f0000000-0000-4000-8000-000000000020', 'SRP-020', 'Ben',      'Zhang',     'ben.zhang@demo.srpailabs.com',            '+86-13812345678',  '1993-03-15', 'male',   'Chinese',     v_dept_mkt, v_pos_mktm, v_mkt, 'full_time', '2023-05-01', 'active', '{"city":"Shanghai","country":"China"}',    '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000021', v_tenant, 'f0000000-0000-4000-8000-000000000021', 'SRP-021', 'Layla',    'Hassan',    'layla.hassan@demo.srpailabs.com',         '+20-1012345678',   '1994-08-20', 'female', 'Egyptian',    v_dept_mkt, v_pos_mktm, v_mkt, 'full_time', '2022-12-01', 'active', '{"city":"Cairo","country":"Egypt"}',       '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000022', v_tenant, 'f0000000-0000-4000-8000-000000000022', 'SRP-022', 'Patrick',  'Osei',      'patrick.osei@demo.srpailabs.com',         '+233-244123456',   '1991-06-03', 'male',   'Ghanaian',    v_dept_mkt, v_pos_mktm, v_mkt, 'full_time', '2022-03-15', 'active', '{"city":"Accra","country":"Ghana"}',       '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000023', v_tenant, 'f0000000-0000-4000-8000-000000000023', 'SRP-023', 'Yasmin',   'Al-Sayed',  'yasmin.alsayed@demo.srpailabs.com',       '+966-501234567',   '1992-11-16', 'female', 'Saudi',       v_dept_fin, v_pos_acc,  v_fin, 'full_time', '2023-08-01', 'active', '{"city":"Riyadh","country":"Saudi Arabia"}','[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000024', v_tenant, 'f0000000-0000-4000-8000-000000000024', 'SRP-024', 'Raj',      'Malhotra',  'raj.malhotra@demo.srpailabs.com',         '+91-9876543213',   '1990-07-09', 'male',   'Indian',      v_dept_fin, v_pos_acc,  v_fin, 'full_time', '2021-05-01', 'active', '{"city":"Hyderabad","country":"India"}',   '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000025', v_tenant, 'f0000000-0000-4000-8000-000000000025', 'SRP-025', 'Elena',    'Petrov',    'elena.petrov@demo.srpailabs.com',         '+7-9123456789',    '1988-02-22', 'female', 'Russian',     v_dept_fin, v_pos_acc,  v_fin, 'full_time', '2020-10-01', 'active', '{"city":"Moscow","country":"Russia"}',     '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000026', v_tenant, 'f0000000-0000-4000-8000-000000000026', 'SRP-026', 'James',    'Richardson','james.richardson@demo.srpailabs.com',     '+1-4155551234',    '1985-04-30', 'male',   'American',    v_dept_exc, v_pos_ceo,  v_ceo, 'full_time', '2020-01-15', 'active', '{"city":"San Francisco","country":"USA"}', '[]', '{}', NOW()),
    ('10000000-0000-4000-8000-000000000027', v_tenant, 'f0000000-0000-4000-8000-000000000027', 'SRP-027', 'Sara',     'Johnson',   'sara.johnson@demo.srpailabs.com',         '+1-4155551235',    '1987-09-11', 'female', 'American',    v_dept_hr,  v_pos_hrd,  v_ceo, 'full_time', '2020-03-01', 'active', '{"city":"New York","country":"USA"}',      '[]', '{}', NOW())
  ON CONFLICT DO NOTHING;

  -- =========== USER ROLES (Employee) ===========
  INSERT INTO user_roles (user_id, role_id) VALUES
    ('f0000000-0000-4000-8000-000000000008', v_role_emp),
    ('f0000000-0000-4000-8000-000000000009', v_role_emp),
    ('f0000000-0000-4000-8000-000000000010', v_role_emp),
    ('f0000000-0000-4000-8000-000000000011', v_role_emp),
    ('f0000000-0000-4000-8000-000000000012', v_role_emp),
    ('f0000000-0000-4000-8000-000000000013', v_role_emp),
    ('f0000000-0000-4000-8000-000000000014', v_role_emp),
    ('f0000000-0000-4000-8000-000000000015', v_role_emp),
    ('f0000000-0000-4000-8000-000000000016', v_role_emp),
    ('f0000000-0000-4000-8000-000000000017', v_role_emp),
    ('f0000000-0000-4000-8000-000000000018', v_role_emp),
    ('f0000000-0000-4000-8000-000000000019', v_role_emp),
    ('f0000000-0000-4000-8000-000000000020', v_role_emp),
    ('f0000000-0000-4000-8000-000000000021', v_role_emp),
    ('f0000000-0000-4000-8000-000000000022', v_role_emp),
    ('f0000000-0000-4000-8000-000000000023', v_role_emp),
    ('f0000000-0000-4000-8000-000000000024', v_role_emp),
    ('f0000000-0000-4000-8000-000000000025', v_role_emp),
    ('f0000000-0000-4000-8000-000000000026', v_role_emp),
    ('f0000000-0000-4000-8000-000000000027', v_role_emp)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- =========== MANAGER ROLES for Senior Engineers/HR Managers ===========
  INSERT INTO user_roles (user_id, role_id) VALUES
    ('f0000000-0000-4000-8000-000000000008', v_role_mgr),
    ('f0000000-0000-4000-8000-000000000011', v_role_mgr),
    ('f0000000-0000-4000-8000-000000000014', v_role_mgr),
    ('f0000000-0000-4000-8000-000000000016', v_role_mgr),
    ('f0000000-0000-4000-8000-000000000017', v_role_mgr),
    ('f0000000-0000-4000-8000-000000000018', v_role_mgr),
    ('f0000000-0000-4000-8000-000000000027', v_role_mgr)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- =========== SALARY STRUCTURES ===========
  INSERT INTO salary_structures (id, tenant_id, employee_id, basic, components, gross_salary, currency, effective_date, updated_at) VALUES
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000008', 7500.00, '[{"name":"HRA","amount":1500},{"name":"Transport","amount":300},{"name":"Medical","amount":200},{"name":"Performance Bonus","amount":500}]', 10000.00, 'USD', '2023-01-15', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000009', 5500.00, '[{"name":"HRA","amount":1100},{"name":"Transport","amount":200},{"name":"Medical","amount":150}]',                                         6950.00, 'USD', '2024-03-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000010', 5800.00, '[{"name":"HRA","amount":1160},{"name":"Transport","amount":250},{"name":"Medical","amount":150}]',                                         7360.00, 'USD', '2023-07-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000011', 7200.00, '[{"name":"HRA","amount":1440},{"name":"Transport","amount":300},{"name":"Medical","amount":200},{"name":"Performance Bonus","amount":460}]', 9600.00, 'USD', '2022-11-15', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000012', 5200.00, '[{"name":"HRA","amount":1040},{"name":"Transport","amount":200},{"name":"Medical","amount":150}]',                                         6590.00, 'USD', '2024-06-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000013', 5400.00, '[{"name":"HRA","amount":1080},{"name":"Transport","amount":250},{"name":"Medical","amount":150}]',                                         6880.00, 'USD', '2023-04-15', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000014', 7000.00, '[{"name":"HRA","amount":1400},{"name":"Transport","amount":300},{"name":"Medical","amount":200},{"name":"Performance Bonus","amount":500}]', 9400.00, 'USD', '2022-08-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000015', 5600.00, '[{"name":"HRA","amount":1120},{"name":"Transport","amount":250},{"name":"Medical","amount":150}]',                                         7120.00, 'USD', '2023-10-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000016', 5000.00, '[{"name":"HRA","amount":1000},{"name":"Transport","amount":200},{"name":"Medical","amount":150}]',                                         6350.00, 'USD', '2023-02-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000017', 5000.00, '[{"name":"HRA","amount":1000},{"name":"Transport","amount":200},{"name":"Medical","amount":150}]',                                         6350.00, 'USD', '2022-06-15', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000018', 5200.00, '[{"name":"HRA","amount":1040},{"name":"Transport","amount":200},{"name":"Medical","amount":150}]',                                         6590.00, 'USD', '2021-11-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000019', 5500.00, '[{"name":"HRA","amount":1100},{"name":"Transport","amount":200},{"name":"Medical","amount":150}]',                                         6950.00, 'USD', '2023-09-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000020', 5300.00, '[{"name":"HRA","amount":1060},{"name":"Transport","amount":200},{"name":"Medical","amount":150}]',                                         6710.00, 'USD', '2023-05-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000021', 5100.00, '[{"name":"HRA","amount":1020},{"name":"Transport","amount":200},{"name":"Medical","amount":150}]',                                         6470.00, 'USD', '2022-12-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000022', 5000.00, '[{"name":"HRA","amount":1000},{"name":"Transport","amount":200},{"name":"Medical","amount":150}]',                                         6350.00, 'USD', '2022-03-15', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000023', 4800.00, '[{"name":"HRA","amount":960}, {"name":"Transport","amount":200},{"name":"Medical","amount":150}]',                                         6110.00, 'USD', '2023-08-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000024', 5000.00, '[{"name":"HRA","amount":1000},{"name":"Transport","amount":200},{"name":"Medical","amount":150}]',                                         6350.00, 'USD', '2021-05-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000025', 5200.00, '[{"name":"HRA","amount":1040},{"name":"Transport","amount":200},{"name":"Medical","amount":150}]',                                         6590.00, 'USD', '2020-10-01', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000026', 12000.00,'[{"name":"HRA","amount":2400},{"name":"Transport","amount":500},{"name":"Medical","amount":300},{"name":"Executive Allowance","amount":800}]',16000.00,'USD', '2020-01-15', NOW()),
    (gen_random_uuid(), v_tenant, '10000000-0000-4000-8000-000000000027', 9000.00, '[{"name":"HRA","amount":1800},{"name":"Transport","amount":400},{"name":"Medical","amount":250},{"name":"Leadership Bonus","amount":550}]', 12000.00,'USD', '2020-03-01', NOW())
  ON CONFLICT (employee_id) DO NOTHING;

  -- =========== LEAVE BALANCES (2026) ===========
  INSERT INTO leave_balances (id, tenant_id, employee_id, leave_type_id, year, total_quota, used, pending, carry_forwarded, available, updated_at)
  SELECT
    gen_random_uuid(), v_tenant, emp.id::uuid, lt.leave_type_id::uuid, 2026,
    lt.quota::numeric, lt.used_days::numeric, 0, 0, lt.quota::numeric - lt.used_days::numeric, NOW()
  FROM (
    VALUES
      ('10000000-0000-4000-8000-000000000008'),('10000000-0000-4000-8000-000000000009'),
      ('10000000-0000-4000-8000-000000000010'),('10000000-0000-4000-8000-000000000011'),
      ('10000000-0000-4000-8000-000000000012'),('10000000-0000-4000-8000-000000000013'),
      ('10000000-0000-4000-8000-000000000014'),('10000000-0000-4000-8000-000000000015'),
      ('10000000-0000-4000-8000-000000000016'),('10000000-0000-4000-8000-000000000017'),
      ('10000000-0000-4000-8000-000000000018'),('10000000-0000-4000-8000-000000000019'),
      ('10000000-0000-4000-8000-000000000020'),('10000000-0000-4000-8000-000000000021'),
      ('10000000-0000-4000-8000-000000000022'),('10000000-0000-4000-8000-000000000023'),
      ('10000000-0000-4000-8000-000000000024'),('10000000-0000-4000-8000-000000000025'),
      ('10000000-0000-4000-8000-000000000026'),('10000000-0000-4000-8000-000000000027')
  ) AS emp(id)
  CROSS JOIN (
    VALUES
      (v_lt_casual, 12.0, 2.0),
      (v_lt_sick,   10.0, 1.0),
      (v_lt_earned, 20.0, 3.0)
  ) AS lt(leave_type_id, quota, used_days)
  ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;

  RAISE NOTICE 'Seed completed: 20 users, 20 employees, salary structures, and leave balances added.';
END $$;
