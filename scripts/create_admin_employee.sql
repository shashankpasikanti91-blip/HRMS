-- Create employee profiles for company_admin users who don't have one
-- Admin: admin@demo.srpailabs.com (Jane HR) in company 1027d171-0587-4fa6-878f-2ef9f46a783c

INSERT INTO employees (
    id, business_id, company_id, user_id, employee_code, full_name, first_name, last_name,
    work_email, department_id, designation, employment_type, employment_status, work_mode,
    joining_date, documents_count, is_active, is_deleted, created_at, updated_at
)
SELECT
    gen_random_uuid()::varchar,
    'EMP-ADMIN-' || UPPER(SUBSTR(MD5(u.id), 1, 6)),
    u.company_id,
    u.id,
    'ADMIN-' || UPPER(SUBSTR(MD5(u.id), 1, 6)),
    COALESCE(NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), ''), SPLIT_PART(u.email, '@', 1)),
    COALESCE(NULLIF(u.first_name,''), SPLIT_PART(u.email,'@',1)),
    COALESCE(NULLIF(u.last_name,''), 'Admin'),
    u.email,
    (SELECT id FROM departments WHERE name = 'Human Resources' LIMIT 1),
    'HR Admin',
    'full_time',
    'active',
    'office',
    CURRENT_DATE,
    0,
    true,
    false,
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'admin@demo.srpailabs.com'
  AND u.company_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.user_id = u.id);
