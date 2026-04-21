-- Fix: rename metadata_ to metadata in tables that have the wrong column name
-- Tables with metadata_ (wrong): employee_documents, document_type_templates, onboarding_checklists, exit_checklists, etc.
-- Tables with metadata (correct): users, employees

DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'employee_documents',
        'document_type_templates',
        'document_access_logs',
        'onboarding_checklists',
        'onboarding_checklist_items',
        'exit_checklists',
        'exit_checklist_items',
        'employee_bank_accounts',
        'leave_requests',
        'leave_types',
        'leave_policies',
        'leave_balances',
        'attendance',
        'attendance_policies',
        'holidays',
        'departments',
        'designations',
        'branches',
        'job_postings',
        'candidates',
        'applications',
        'interviews',
        'offers',
        'notifications',
        'audit_logs',
        'payroll_runs',
        'payroll_items',
        'employee_salaries',
        'performance_reviews',
        'performance_goals',
        'lop_records',
        'lop_policies',
        'lop_overrides',
        'salary_structures',
        'salary_components',
        'organization_settings',
        'country_configs',
        'policies',
        'documents'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Check if the table exists and has a metadata_ column
        IF EXISTS (
            SELECT 1 FROM pg_attribute a
            JOIN pg_class t ON a.attrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            WHERE t.relname = tbl
              AND a.attname = 'metadata_'
              AND n.nspname = 'public'
              AND t.relkind = 'r'
              AND a.attnum > 0
              AND NOT a.attisdropped
        ) THEN
            EXECUTE format('ALTER TABLE public.%I RENAME COLUMN metadata_ TO metadata', tbl);
            RAISE NOTICE 'Renamed metadata_ to metadata in table: %', tbl;
        END IF;
    END LOOP;
END $$;
