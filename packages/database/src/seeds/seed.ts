// ============================================================
// SRP AI HRMS - Comprehensive Database Seed Script
// Creates full demo data for development and demo
// ============================================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function main() {
  console.log('🌱 Seeding SRP AI HRMS database...\n');

  // =====================================================
  // 1. PERMISSIONS
  // =====================================================
  const resources = [
    'employees', 'departments', 'positions', 'attendance', 'leave',
    'payroll', 'recruitment', 'performance', 'documents', 'reports',
    'settings', 'users', 'roles', 'tenants', 'notifications',
    'analytics', 'ai', 'compliance', 'benefits',
  ];
  const actions = ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'];

  console.log('  📋 Creating permissions...');
  for (const resource of resources) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action, description: `${action} ${resource}` },
      });
    }
  }

  // =====================================================
  // 2. DEMO TENANT
  // =====================================================
  console.log('  🏢 Creating demo tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'SRP AI Labs',
      slug: 'demo-company',
      domain: 'demo.hrms.srpailabs.com',
      industry: 'Technology',
      country: 'India',
      timezone: 'Asia/Kolkata',
      status: 'active',
      plan: 'enterprise',
      maxUsers: 1000,
      settings: {
        branding: { primaryColor: '#6366f1', secondaryColor: '#8b5cf6', companyName: 'SRP AI Labs' },
        locale: { timezone: 'Asia/Kolkata', dateFormat: 'DD-MM-YYYY', currency: 'INR', language: 'en' },
        features: {
          enabledModules: ['core_hr', 'payroll', 'attendance', 'leave', 'recruitment', 'performance', 'ai_chatbot', 'analytics', 'notifications'],
          aiFeatures: true,
          maxEmployees: 1000,
        },
        security: {
          mfaRequired: false,
          passwordPolicy: { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: true, maxAge: 90, preventReuse: 3 },
          sessionTimeout: 3600,
          ipWhitelist: [],
        },
      },
    },
  });

  // =====================================================
  // 3. SYSTEM ROLES
  // =====================================================
  console.log('  👑 Creating system roles...');
  const systemRoles = [
    { name: 'Super Admin', slug: 'super_admin', description: 'Full platform access (SRP AI Labs)' },
    { name: 'Tenant Admin', slug: 'tenant_admin', description: 'Full tenant administration access' },
    { name: 'HR Admin', slug: 'hr_admin', description: 'Full HR module access' },
    { name: 'HR Manager', slug: 'hr_manager', description: 'HR management and approvals' },
    { name: 'Department Head', slug: 'department_head', description: 'Department-level management' },
    { name: 'Team Manager', slug: 'team_manager', description: 'Team management access' },
    { name: 'Employee', slug: 'employee', description: 'Basic employee self-service' },
    { name: 'Recruiter', slug: 'recruiter', description: 'Recruitment module access' },
    { name: 'Finance Admin', slug: 'finance_admin', description: 'Finance and payroll access' },
  ];

  const roleMap: Record<string, string> = {};
  for (const role of systemRoles) {
    const r = await prisma.role.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: role.slug } },
      update: {},
      create: { tenantId: tenant.id, ...role, isSystem: true },
    });
    roleMap[role.slug] = r.id;
  }

  // Assign all permissions to super_admin and tenant_admin
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    for (const roleSlug of ['super_admin', 'tenant_admin']) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleMap[roleSlug], permissionId: perm.id } },
        update: {},
        create: { roleId: roleMap[roleSlug], permissionId: perm.id },
      });
    }
  }

  // HR-specific permissions
  const hrPermissions = allPermissions.filter(p =>
    ['employees', 'departments', 'positions', 'attendance', 'leave', 'recruitment', 'performance', 'documents', 'reports', 'notifications'].includes(p.resource)
  );
  for (const perm of hrPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap['hr_admin'], permissionId: perm.id } },
      update: {},
      create: { roleId: roleMap['hr_admin'], permissionId: perm.id },
    });
  }

  // Employee read-only permissions
  const employeePerms = allPermissions.filter(p =>
    p.action === 'read' && ['employees', 'departments', 'attendance', 'leave', 'notifications'].includes(p.resource)
  );
  for (const perm of employeePerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap['employee'], permissionId: perm.id } },
      update: {},
      create: { roleId: roleMap['employee'], permissionId: perm.id },
    });
  }

  // =====================================================
  // 4. DEPARTMENTS
  // =====================================================
  console.log('  🏗️  Creating departments...');
  const departments = [
    { name: 'Engineering', code: 'ENG', description: 'Software Engineering & Product Development' },
    { name: 'Human Resources', code: 'HR', description: 'People Operations & Talent Management' },
    { name: 'Finance', code: 'FIN', description: 'Finance, Accounting & Payroll' },
    { name: 'Marketing', code: 'MKT', description: 'Marketing, Branding & Communications' },
    { name: 'Sales', code: 'SALES', description: 'Sales & Business Development' },
    { name: 'Operations', code: 'OPS', description: 'Operations & Infrastructure' },
    { name: 'Product', code: 'PROD', description: 'Product Management & Strategy' },
    { name: 'Design', code: 'DES', description: 'UX/UI Design & Research' },
  ];

  const deptMap: Record<string, string> = {};
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: dept.code } },
      update: {},
      create: { tenantId: tenant.id, ...dept },
    });
    deptMap[dept.code] = d.id;
  }

  // =====================================================
  // 5. POSITIONS
  // =====================================================
  console.log('  💼 Creating positions...');
  const positions = [
    { title: 'Software Engineer', code: 'SE-001', departmentId: deptMap['ENG'], grade: 'L3', minSalary: 800000, maxSalary: 1500000 },
    { title: 'Senior Software Engineer', code: 'SSE-001', departmentId: deptMap['ENG'], grade: 'L4', minSalary: 1500000, maxSalary: 2500000 },
    { title: 'Staff Engineer', code: 'STFE-001', departmentId: deptMap['ENG'], grade: 'L5', minSalary: 2500000, maxSalary: 4000000 },
    { title: 'Engineering Manager', code: 'EM-001', departmentId: deptMap['ENG'], grade: 'L5', minSalary: 2500000, maxSalary: 4500000 },
    { title: 'VP Engineering', code: 'VPE-001', departmentId: deptMap['ENG'], grade: 'L7', minSalary: 5000000, maxSalary: 8000000 },
    { title: 'HR Specialist', code: 'HR-001', departmentId: deptMap['HR'], grade: 'L3', minSalary: 600000, maxSalary: 1000000 },
    { title: 'HR Manager', code: 'HRM-001', departmentId: deptMap['HR'], grade: 'L5', minSalary: 1500000, maxSalary: 2500000 },
    { title: 'Financial Analyst', code: 'FA-001', departmentId: deptMap['FIN'], grade: 'L3', minSalary: 700000, maxSalary: 1200000 },
    { title: 'Finance Manager', code: 'FM-001', departmentId: deptMap['FIN'], grade: 'L5', minSalary: 1500000, maxSalary: 2500000 },
    { title: 'Product Manager', code: 'PM-001', departmentId: deptMap['PROD'], grade: 'L4', minSalary: 1500000, maxSalary: 3000000 },
    { title: 'UX Designer', code: 'UXD-001', departmentId: deptMap['DES'], grade: 'L3', minSalary: 800000, maxSalary: 1500000 },
    { title: 'Marketing Executive', code: 'ME-001', departmentId: deptMap['MKT'], grade: 'L3', minSalary: 600000, maxSalary: 1000000 },
    { title: 'Sales Executive', code: 'SLE-001', departmentId: deptMap['SALES'], grade: 'L3', minSalary: 500000, maxSalary: 900000 },
    { title: 'DevOps Engineer', code: 'DO-001', departmentId: deptMap['OPS'], grade: 'L4', minSalary: 1200000, maxSalary: 2000000 },
  ];

  const posMap: Record<string, string> = {};
  for (const pos of positions) {
    const p = await prisma.position.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: pos.code } },
      update: {},
      create: { tenantId: tenant.id, ...pos, currency: 'INR' },
    });
    posMap[pos.code] = p.id;
  }

  // =====================================================
  // 6. USERS + EMPLOYEES
  // =====================================================
  console.log('  👥 Creating users and employees...');
  const passwordHash = await hashPassword('Admin@123!');

  const people = [
    { email: 'admin@srpailabs.com', firstName: 'Suresh', lastName: 'Kumar', role: 'tenant_admin', empCode: 'EMP00001', phone: '+91-9876543210', gender: 'male', dob: '1985-03-15', doj: '2023-01-01', dept: 'ENG', pos: 'VPE-001', employmentType: 'full_time' },
    { email: 'hr@srpailabs.com', firstName: 'Priya', lastName: 'Sharma', role: 'hr_admin', empCode: 'EMP00002', phone: '+91-9876543211', gender: 'female', dob: '1988-07-22', doj: '2023-02-01', dept: 'HR', pos: 'HRM-001', employmentType: 'full_time' },
    { email: 'rahul.dev@srpailabs.com', firstName: 'Rahul', lastName: 'Verma', role: 'department_head', empCode: 'EMP00003', phone: '+91-9876543212', gender: 'male', dob: '1987-11-10', doj: '2023-03-15', dept: 'ENG', pos: 'EM-001', employmentType: 'full_time' },
    { email: 'anita.coder@srpailabs.com', firstName: 'Anita', lastName: 'Patel', role: 'employee', empCode: 'EMP00004', phone: '+91-9876543213', gender: 'female', dob: '1992-05-20', doj: '2023-06-01', dept: 'ENG', pos: 'SSE-001', employmentType: 'full_time' },
    { email: 'vikram.js@srpailabs.com', firstName: 'Vikram', lastName: 'Singh', role: 'employee', empCode: 'EMP00005', phone: '+91-9876543214', gender: 'male', dob: '1995-01-08', doj: '2024-01-15', dept: 'ENG', pos: 'SE-001', employmentType: 'full_time' },
    { email: 'deepa.react@srpailabs.com', firstName: 'Deepa', lastName: 'Nair', role: 'employee', empCode: 'EMP00006', phone: '+91-9876543215', gender: 'female', dob: '1996-09-14', doj: '2024-03-01', dept: 'ENG', pos: 'SE-001', employmentType: 'full_time' },
    { email: 'arjun.py@srpailabs.com', firstName: 'Arjun', lastName: 'Reddy', role: 'employee', empCode: 'EMP00007', phone: '+91-9876543216', gender: 'male', dob: '1993-12-25', doj: '2023-09-01', dept: 'ENG', pos: 'SSE-001', employmentType: 'full_time' },
    { email: 'meera.ml@srpailabs.com', firstName: 'Meera', lastName: 'Gupta', role: 'employee', empCode: 'EMP00008', phone: '+91-9876543217', gender: 'female', dob: '1994-04-18', doj: '2024-02-01', dept: 'ENG', pos: 'STFE-001', employmentType: 'full_time' },
    { email: 'kavita.hr@srpailabs.com', firstName: 'Kavita', lastName: 'Joshi', role: 'employee', empCode: 'EMP00009', phone: '+91-9876543218', gender: 'female', dob: '1991-08-30', doj: '2023-04-01', dept: 'HR', pos: 'HR-001', employmentType: 'full_time' },
    { email: 'amit.fin@srpailabs.com', firstName: 'Amit', lastName: 'Agarwal', role: 'finance_admin', empCode: 'EMP00010', phone: '+91-9876543219', gender: 'male', dob: '1986-02-14', doj: '2023-01-15', dept: 'FIN', pos: 'FM-001', employmentType: 'full_time' },
    { email: 'neha.fin@srpailabs.com', firstName: 'Neha', lastName: 'Deshmukh', role: 'employee', empCode: 'EMP00011', phone: '+91-9876543220', gender: 'female', dob: '1994-06-05', doj: '2024-01-01', dept: 'FIN', pos: 'FA-001', employmentType: 'full_time' },
    { email: 'ravi.pm@srpailabs.com', firstName: 'Ravi', lastName: 'Menon', role: 'department_head', empCode: 'EMP00012', phone: '+91-9876543221', gender: 'male', dob: '1989-10-20', doj: '2023-05-01', dept: 'PROD', pos: 'PM-001', employmentType: 'full_time' },
    { email: 'sneha.ux@srpailabs.com', firstName: 'Sneha', lastName: 'Iyer', role: 'employee', empCode: 'EMP00013', phone: '+91-9876543222', gender: 'female', dob: '1995-03-28', doj: '2023-08-01', dept: 'DES', pos: 'UXD-001', employmentType: 'full_time' },
    { email: 'karthik.mkt@srpailabs.com', firstName: 'Karthik', lastName: 'Rao', role: 'employee', empCode: 'EMP00014', phone: '+91-9876543223', gender: 'male', dob: '1993-07-12', doj: '2024-04-01', dept: 'MKT', pos: 'ME-001', employmentType: 'full_time' },
    { email: 'pooja.sales@srpailabs.com', firstName: 'Pooja', lastName: 'Malhotra', role: 'employee', empCode: 'EMP00015', phone: '+91-9876543224', gender: 'female', dob: '1992-11-03', doj: '2023-07-01', dept: 'SALES', pos: 'SLE-001', employmentType: 'full_time' },
    { email: 'sanjay.ops@srpailabs.com', firstName: 'Sanjay', lastName: 'Mishra', role: 'employee', empCode: 'EMP00016', phone: '+91-9876543225', gender: 'male', dob: '1990-09-22', doj: '2023-10-01', dept: 'OPS', pos: 'DO-001', employmentType: 'full_time' },
    { email: 'divya.fe@srpailabs.com', firstName: 'Divya', lastName: 'Bhatt', role: 'employee', empCode: 'EMP00017', phone: '+91-9876543226', gender: 'female', dob: '1997-01-15', doj: '2024-06-01', dept: 'ENG', pos: 'SE-001', employmentType: 'full_time' },
    { email: 'nikhil.be@srpailabs.com', firstName: 'Nikhil', lastName: 'Chauhan', role: 'employee', empCode: 'EMP00018', phone: '+91-9876543227', gender: 'male', dob: '1996-05-30', doj: '2024-05-15', dept: 'ENG', pos: 'SE-001', employmentType: 'full_time' },
    { email: 'aisha.intern@srpailabs.com', firstName: 'Aisha', lastName: 'Khan', role: 'employee', empCode: 'EMP00019', phone: '+91-9876543228', gender: 'female', dob: '2000-12-10', doj: '2025-01-01', dept: 'ENG', pos: 'SE-001', employmentType: 'intern' },
    { email: 'rajesh.contract@srpailabs.com', firstName: 'Rajesh', lastName: 'Pillai', role: 'employee', empCode: 'EMP00020', phone: '+91-9876543229', gender: 'male', dob: '1988-04-05', doj: '2025-03-01', dept: 'ENG', pos: 'SSE-001', employmentType: 'contract' },
  ];

  const userMap: Record<string, string> = {};
  const employeeMap: Record<string, string> = {};

  for (const person of people) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: person.email } },
      update: { passwordHash },
      create: {
        tenantId: tenant.id,
        email: person.email,
        passwordHash,
        firstName: person.firstName,
        lastName: person.lastName,
        phone: person.phone,
        status: 'active',
        emailVerified: true,
      },
    });
    userMap[person.email] = user.id;

    // Assign role
    if (roleMap[person.role]) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: roleMap[person.role] } },
        update: {},
        create: { userId: user.id, roleId: roleMap[person.role] },
      });
    }
    if (person.role !== 'employee') {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: roleMap['employee'] } },
        update: {},
        create: { userId: user.id, roleId: roleMap['employee'] },
      });
    }

    // Manager mapping
    let managerId: string | null = null;
    if (['EMP00003'].includes(person.empCode)) {
      managerId = employeeMap['EMP00001'] || null;
    } else if (person.dept === 'ENG' && !['EMP00001', 'EMP00003'].includes(person.empCode)) {
      managerId = employeeMap['EMP00003'] || null;
    } else if (person.dept === 'HR' && person.empCode !== 'EMP00002') {
      managerId = employeeMap['EMP00002'] || null;
    } else if (person.dept === 'FIN' && person.empCode !== 'EMP00010') {
      managerId = employeeMap['EMP00010'] || null;
    } else if (['EMP00002', 'EMP00010', 'EMP00012'].includes(person.empCode)) {
      managerId = employeeMap['EMP00001'] || null;
    }

    const emp = await prisma.employee.upsert({
      where: { tenantId_employeeCode: { tenantId: tenant.id, employeeCode: person.empCode } },
      update: { userId: user.id, managerId },
      create: {
        tenantId: tenant.id,
        userId: user.id,
        employeeCode: person.empCode,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        phone: person.phone,
        gender: person.gender,
        dateOfBirth: new Date(person.dob),
        dateOfJoining: new Date(person.doj),
        departmentId: deptMap[person.dept],
        positionId: posMap[person.pos],
        managerId,
        employmentType: person.employmentType,
        status: 'active',
        address: { street: '123 Tech Park', city: 'Bangalore', state: 'Karnataka', country: 'India', postalCode: '560001' },
        emergencyContacts: [{ name: 'Emergency Contact', relationship: 'Parent', phone: '+91-9800000000' }],
      },
    });
    employeeMap[person.empCode] = emp.id;
  }

  // Set department heads
  await prisma.department.update({ where: { id: deptMap['ENG'] }, data: { headId: employeeMap['EMP00001'] } });
  await prisma.department.update({ where: { id: deptMap['HR'] }, data: { headId: employeeMap['EMP00002'] } });
  await prisma.department.update({ where: { id: deptMap['FIN'] }, data: { headId: employeeMap['EMP00010'] } });
  await prisma.department.update({ where: { id: deptMap['PROD'] }, data: { headId: employeeMap['EMP00012'] } });

  // =====================================================
  // 7. LEAVE TYPES
  // =====================================================
  console.log('  🌴 Creating leave types...');
  const leaveTypes = [
    { name: 'Annual Leave', code: 'AL', annualQuota: 20, carryForwardLimit: 5, isPaid: true },
    { name: 'Sick Leave', code: 'SL', annualQuota: 14, carryForwardLimit: 0, isPaid: true },
    { name: 'Casual Leave', code: 'CL', annualQuota: 7, carryForwardLimit: 0, isPaid: true },
    { name: 'Maternity Leave', code: 'ML', annualQuota: 90, carryForwardLimit: 0, isPaid: true, applicableGenders: ['female'] },
    { name: 'Paternity Leave', code: 'PL', annualQuota: 14, carryForwardLimit: 0, isPaid: true, applicableGenders: ['male'] },
    { name: 'Unpaid Leave', code: 'UL', annualQuota: 30, carryForwardLimit: 0, isPaid: false },
    { name: 'Compensatory Off', code: 'CO', annualQuota: 0, carryForwardLimit: 0, isPaid: true },
  ];

  const leaveTypeMap: Record<string, string> = {};
  for (const lt of leaveTypes) {
    const t = await prisma.leaveType.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: lt.code } },
      update: {},
      create: { tenantId: tenant.id, ...lt, applicableGenders: lt.applicableGenders || [] },
    });
    leaveTypeMap[lt.code] = t.id;
  }

  // =====================================================
  // 8. LEAVE BALANCES
  // =====================================================
  console.log('  ⚖️  Creating leave balances...');
  const currentYear = new Date().getFullYear();
  for (const empCode of Object.keys(employeeMap)) {
    const empId = employeeMap[empCode];
    for (const lt of leaveTypes) {
      if (lt.code === 'ML' || lt.code === 'PL' || lt.code === 'CO') continue;
      const used = Math.floor(Math.random() * Math.min(5, lt.annualQuota));
      await prisma.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId: empId, leaveTypeId: leaveTypeMap[lt.code], year: currentYear } },
        update: {},
        create: {
          tenantId: tenant.id,
          employeeId: empId,
          leaveTypeId: leaveTypeMap[lt.code],
          year: currentYear,
          totalQuota: lt.annualQuota,
          used,
          pending: 0,
          carryForwarded: 0,
          available: lt.annualQuota - used,
        },
      });
    }
  }

  // =====================================================
  // 9. SKILLS
  // =====================================================
  console.log('  🎯 Creating skills...');
  const skills = [
    { name: 'JavaScript', category: 'Programming' },
    { name: 'TypeScript', category: 'Programming' },
    { name: 'Python', category: 'Programming' },
    { name: 'React', category: 'Frontend' },
    { name: 'Next.js', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'NestJS', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'MongoDB', category: 'Database' },
    { name: 'Redis', category: 'Database' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'Kubernetes', category: 'DevOps' },
    { name: 'AWS', category: 'Cloud' },
    { name: 'Machine Learning', category: 'AI/ML' },
    { name: 'Data Analysis', category: 'Analytics' },
    { name: 'Project Management', category: 'Management' },
    { name: 'Leadership', category: 'Soft Skills' },
    { name: 'Communication', category: 'Soft Skills' },
    { name: 'Problem Solving', category: 'Soft Skills' },
    { name: 'Figma', category: 'Design' },
  ];

  const skillMap: Record<string, string> = {};
  for (const skill of skills) {
    const s = await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
    skillMap[skill.name] = s.id;
  }

  // Assign skills to engineering employees
  const engEmployees = ['EMP00004', 'EMP00005', 'EMP00006', 'EMP00007', 'EMP00008'];
  const engSkills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL'];
  for (const empCode of engEmployees) {
    for (const skillName of engSkills) {
      await prisma.employeeSkill.upsert({
        where: { employeeId_skillId: { employeeId: employeeMap[empCode], skillId: skillMap[skillName] } },
        update: {},
        create: {
          employeeId: employeeMap[empCode],
          skillId: skillMap[skillName],
          proficiencyLevel: Math.floor(Math.random() * 3) + 3,
        },
      });
    }
  }

  // =====================================================
  // 10. ATTENDANCE RECORDS (Last 30 days)
  // =====================================================
  console.log('  ⏰ Creating attendance records...');
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  for (const empCode of Object.keys(employeeMap)) {
    const empId = employeeMap[empCode];
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const recordDate = dateOnly(new Date(d));
      const isAbsent = Math.random() < 0.05;
      const isLate = !isAbsent && Math.random() < 0.1;

      if (isAbsent) continue;

      const clockInHour = isLate ? 10 : 9;
      const clockInMinute = Math.floor(Math.random() * 30);
      const clockIn = new Date(recordDate);
      clockIn.setHours(clockInHour, clockInMinute, 0, 0);

      const clockOutHour = 18 + Math.floor(Math.random() * 2);
      const clockOutMinute = Math.floor(Math.random() * 30);
      const clockOut = new Date(recordDate);
      clockOut.setHours(clockOutHour, clockOutMinute, 0, 0);

      const totalMs = clockOut.getTime() - clockIn.getTime();
      const totalHours = parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));
      const overtimeHours = totalHours > 8 ? parseFloat((totalHours - 8).toFixed(2)) : 0;

      try {
        await prisma.attendanceRecord.upsert({
          where: { employeeId_date: { employeeId: empId, date: recordDate } },
          update: {},
          create: {
            tenantId: tenant.id,
            employeeId: empId,
            date: recordDate,
            clockIn,
            clockOut,
            totalHours,
            overtimeHours,
            status: isLate ? 'late' : 'present',
            source: 'web',
          },
        });
      } catch {
        // Skip duplicates
      }
    }
  }

  // =====================================================
  // 11. SALARY STRUCTURES
  // =====================================================
  console.log('  💰 Creating salary structures...');
  const salaryData: Record<string, number> = {
    'EMP00001': 6000000, 'EMP00002': 2000000, 'EMP00003': 3500000,
    'EMP00004': 2000000, 'EMP00005': 1200000, 'EMP00006': 1100000,
    'EMP00007': 1800000, 'EMP00008': 2800000, 'EMP00009': 800000,
    'EMP00010': 2200000, 'EMP00011': 900000, 'EMP00012': 2500000,
    'EMP00013': 1200000, 'EMP00014': 800000, 'EMP00015': 700000,
    'EMP00016': 1600000, 'EMP00017': 1000000, 'EMP00018': 1000000,
    'EMP00019': 400000, 'EMP00020': 2000000,
  };

  for (const [empCode, grossAnnual] of Object.entries(salaryData)) {
    const empId = employeeMap[empCode];
    const grossMonthly = grossAnnual / 12;
    const basic = grossMonthly * 0.5;
    const hra = basic * 0.4;
    const da = basic * 0.1;

    await prisma.salaryStructure.upsert({
      where: { employeeId: empId },
      update: {},
      create: {
        tenantId: tenant.id,
        employeeId: empId,
        basic,
        grossSalary: grossMonthly,
        currency: 'INR',
        effectiveDate: new Date('2024-04-01'),
        components: [
          { name: 'Basic', type: 'earning', value: basic, taxable: true },
          { name: 'HRA', type: 'earning', value: hra, taxable: false },
          { name: 'DA', type: 'earning', value: da, taxable: true },
          { name: 'Special Allowance', type: 'earning', value: grossMonthly - basic - hra - da, taxable: true },
          { name: 'PF (Employee)', type: 'deduction', value: basic * 0.12, taxable: false },
          { name: 'ESI', type: 'deduction', value: grossMonthly < 21000 ? grossMonthly * 0.0075 : 0, taxable: false },
        ],
      },
    });
  }

  // =====================================================
  // 12. PAYROLL RUN
  // =====================================================
  console.log('  📊 Creating payroll run...');
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const period = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  let payrollRun: any;
  try {
    payrollRun = await prisma.payrollRun.upsert({
      where: { tenantId_period: { tenantId: tenant.id, period } },
      update: {},
      create: {
        tenantId: tenant.id,
        period,
        runDate: new Date(),
        status: 'finalized',
        totalEmployees: 20,
        totalGross: Object.values(salaryData).reduce((a, b) => a + b / 12, 0),
        totalDeductions: Object.values(salaryData).reduce((a, b) => a + (b / 12) * 0.15, 0),
        totalNet: Object.values(salaryData).reduce((a, b) => a + (b / 12) * 0.85, 0),
        currency: 'INR',
        processedBy: userMap['admin@srpailabs.com'],
        approvedBy: userMap['admin@srpailabs.com'],
      },
    });

    for (const [empCode, grossAnnual] of Object.entries(salaryData)) {
      const grossMonthly = grossAnnual / 12;
      const deductions = grossMonthly * 0.15;
      try {
        await prisma.payslip.upsert({
          where: { employeeId_payrollRunId: { employeeId: employeeMap[empCode], payrollRunId: payrollRun.id } },
          update: {},
          create: {
            tenantId: tenant.id,
            employeeId: employeeMap[empCode],
            payrollRunId: payrollRun.id,
            period,
            grossPay: grossMonthly,
            totalDeductions: deductions,
            netPay: grossMonthly - deductions,
            currency: 'INR',
            status: 'paid',
            paidAt: new Date(),
            earnings: [
              { name: 'Basic', amount: grossMonthly * 0.5 },
              { name: 'HRA', amount: grossMonthly * 0.2 },
              { name: 'DA', amount: grossMonthly * 0.05 },
              { name: 'Special Allowance', amount: grossMonthly * 0.25 },
            ],
            deductions: [
              { name: 'PF', amount: grossMonthly * 0.06 },
              { name: 'Professional Tax', amount: 200 },
              { name: 'TDS', amount: deductions - grossMonthly * 0.06 - 200 },
            ],
          },
        });
      } catch {
        // Skip duplicates
      }
    }
  } catch {
    console.log('    ⚠️  Payroll run already exists, skipping payslips');
  }

  // =====================================================
  // 13. JOB POSTINGS & CANDIDATES
  // =====================================================
  console.log('  📝 Creating job postings and candidates...');
  const jobPostings = [
    {
      title: 'Senior Full Stack Developer', code: 'JOB-2026-001', dept: 'ENG',
      description: 'We are looking for an experienced Full Stack Developer with expertise in React, Node.js, and PostgreSQL.',
      experienceLevel: 'senior', salaryMin: 1500000, salaryMax: 2500000,
      location: 'Bangalore, India', remotePolicy: 'hybrid', vacancies: 2, status: 'published',
    },
    {
      title: 'ML Engineer', code: 'JOB-2026-002', dept: 'ENG',
      description: 'Join our AI team to build machine learning models for HR analytics and predictions.',
      experienceLevel: 'mid', salaryMin: 1800000, salaryMax: 3000000,
      location: 'Bangalore, India', remotePolicy: 'remote', vacancies: 1, status: 'published',
    },
    {
      title: 'Product Designer', code: 'JOB-2026-003', dept: 'DES',
      description: 'Design intuitive user experiences for our enterprise HRMS platform.',
      experienceLevel: 'mid', salaryMin: 1200000, salaryMax: 2000000,
      location: 'Bangalore, India', remotePolicy: 'hybrid', vacancies: 1, status: 'published',
    },
    {
      title: 'DevOps Lead', code: 'JOB-2026-004', dept: 'OPS',
      description: 'Lead our infrastructure team managing Kubernetes, Docker, and CI/CD pipelines.',
      experienceLevel: 'senior', salaryMin: 2000000, salaryMax: 3500000,
      location: 'Bangalore, India', remotePolicy: 'onsite', vacancies: 1, status: 'published',
    },
    {
      title: 'Sales Executive', code: 'JOB-2026-005', dept: 'SALES',
      description: 'Drive B2B sales for our SaaS HRMS platform across India.',
      experienceLevel: 'entry', salaryMin: 500000, salaryMax: 800000,
      location: 'Mumbai, India', remotePolicy: 'onsite', vacancies: 3, status: 'published',
    },
  ];

  const jobMap: Record<string, string> = {};
  for (const job of jobPostings) {
    const j = await prisma.jobPosting.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: job.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        title: job.title,
        code: job.code,
        departmentId: deptMap[job.dept],
        description: job.description,
        experienceLevel: job.experienceLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: 'INR',
        location: job.location,
        remotePolicy: job.remotePolicy,
        vacancies: job.vacancies,
        hiringManagerId: userMap['admin@srpailabs.com'],
        status: job.status,
      },
    });
    jobMap[job.code] = j.id;
  }

  const candidateData = [
    { jobCode: 'JOB-2026-001', firstName: 'Akash', lastName: 'Mehta', email: 'akash.mehta@gmail.com', stage: 'interview', aiScore: 87.5, source: 'linkedin' },
    { jobCode: 'JOB-2026-001', firstName: 'Priyanka', lastName: 'Das', email: 'priyanka.das@gmail.com', stage: 'screening', aiScore: 72.0, source: 'career_page' },
    { jobCode: 'JOB-2026-001', firstName: 'Rohit', lastName: 'Saxena', email: 'rohit.saxena@outlook.com', stage: 'offer', aiScore: 92.3, source: 'referral' },
    { jobCode: 'JOB-2026-001', firstName: 'Shreya', lastName: 'Banerjee', email: 'shreya.b@gmail.com', stage: 'applied', aiScore: 65.0, source: 'naukri' },
    { jobCode: 'JOB-2026-001', firstName: 'Manish', lastName: 'Tiwari', email: 'manish.t@yahoo.com', stage: 'hired', aiScore: 95.0, source: 'linkedin' },
    { jobCode: 'JOB-2026-002', firstName: 'Arun', lastName: 'Krishnan', email: 'arun.k@gmail.com', stage: 'interview', aiScore: 88.0, source: 'linkedin' },
    { jobCode: 'JOB-2026-002', firstName: 'Sushmita', lastName: 'Roy', email: 'sushmita.roy@gmail.com', stage: 'screening', aiScore: 76.5, source: 'career_page' },
    { jobCode: 'JOB-2026-002', firstName: 'Varun', lastName: 'Kapoor', email: 'varun.k@outlook.com', stage: 'applied', aiScore: 58.0, source: 'naukri' },
    { jobCode: 'JOB-2026-003', firstName: 'Tanvi', lastName: 'Shetty', email: 'tanvi.s@gmail.com', stage: 'offer', aiScore: 91.0, source: 'linkedin' },
    { jobCode: 'JOB-2026-003', firstName: 'Aman', lastName: 'Gupta', email: 'aman.g@gmail.com', stage: 'interview', aiScore: 82.0, source: 'career_page' },
    { jobCode: 'JOB-2026-004', firstName: 'Siddharth', lastName: 'Jain', email: 'sid.jain@gmail.com', stage: 'screening', aiScore: 79.0, source: 'referral' },
    { jobCode: 'JOB-2026-004', firstName: 'Nisha', lastName: 'Agarwal', email: 'nisha.a@outlook.com', stage: 'applied', aiScore: 62.0, source: 'career_page' },
    { jobCode: 'JOB-2026-005', firstName: 'Kunal', lastName: 'Shah', email: 'kunal.shah@gmail.com', stage: 'applied', aiScore: 70.0, source: 'naukri' },
    { jobCode: 'JOB-2026-005', firstName: 'Ritika', lastName: 'Verma', email: 'ritika.v@gmail.com', stage: 'screening', aiScore: 74.0, source: 'career_page' },
    { jobCode: 'JOB-2026-005', firstName: 'Deepak', lastName: 'Choudhary', email: 'deepak.c@gmail.com', stage: 'interview', aiScore: 85.0, source: 'linkedin' },
  ];

  for (const candidate of candidateData) {
    try {
      await prisma.candidate.create({
        data: {
          tenantId: tenant.id,
          jobId: jobMap[candidate.jobCode],
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          source: candidate.source,
          stage: candidate.stage,
          status: 'active',
          aiScore: candidate.aiScore,
          aiAnalysis: {
            overallScore: candidate.aiScore,
            skillMatch: candidate.aiScore - 5 + Math.random() * 10,
            experienceMatch: candidate.aiScore - 3 + Math.random() * 6,
            recommendation: candidate.aiScore > 80 ? 'Highly Recommended' : candidate.aiScore > 60 ? 'Recommended' : 'Review Required',
          },
        },
      });
    } catch {
      // Skip duplicates
    }
  }

  // =====================================================
  // 14. HOLIDAYS
  // =====================================================
  console.log('  🎉 Creating holidays...');
  const holidays = [
    { name: 'Republic Day', date: '2026-01-26', type: 'public' },
    { name: 'Holi', date: '2026-03-17', type: 'public' },
    { name: 'Good Friday', date: '2026-04-03', type: 'public' },
    { name: 'Eid ul-Fitr', date: '2026-03-31', type: 'public' },
    { name: 'Independence Day', date: '2026-08-15', type: 'public' },
    { name: 'Ganesh Chaturthi', date: '2026-08-27', type: 'optional' },
    { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'public' },
    { name: 'Diwali', date: '2026-10-20', type: 'public' },
    { name: 'Christmas', date: '2026-12-25', type: 'public' },
  ];

  for (const h of holidays) {
    try {
      await prisma.holiday.create({
        data: { tenantId: tenant.id, name: h.name, date: new Date(h.date), type: h.type },
      });
    } catch {
      // Skip duplicates
    }
  }

  // =====================================================
  // 15. REVIEW CYCLE & GOALS
  // =====================================================
  console.log('  📈 Creating performance data...');
  try {
    await prisma.reviewCycle.create({
      data: {
        tenantId: tenant.id,
        name: 'H1 2026 Performance Review',
        type: 'semi_annual',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-30'),
        status: 'active',
        settings: { selfReviewDeadline: '2026-06-15', managerReviewDeadline: '2026-06-30', goalSettingDeadline: '2026-01-31' },
      },
    });
  } catch {
    // Skip if exists
  }

  const goalData = [
    { empCode: 'EMP00003', title: 'Launch HRMS v2.0', targetValue: 100, currentValue: 65, status: 'in_progress' },
    { empCode: 'EMP00003', title: 'Reduce bug count by 50%', targetValue: 50, currentValue: 30, status: 'in_progress' },
    { empCode: 'EMP00004', title: 'Complete microservices migration', targetValue: 100, currentValue: 80, status: 'in_progress' },
    { empCode: 'EMP00005', title: 'Build attendance module', targetValue: 100, currentValue: 100, status: 'completed' },
    { empCode: 'EMP00006', title: 'Implement real-time notifications', targetValue: 100, currentValue: 40, status: 'in_progress' },
    { empCode: 'EMP00008', title: 'Deploy AI screening model', targetValue: 100, currentValue: 90, status: 'in_progress' },
    { empCode: 'EMP00012', title: 'Launch 3 new features', targetValue: 3, currentValue: 2, status: 'in_progress' },
    { empCode: 'EMP00013', title: 'Redesign dashboard UI', targetValue: 100, currentValue: 100, status: 'completed' },
  ];

  for (const g of goalData) {
    try {
      await prisma.goal.create({
        data: {
          tenantId: tenant.id,
          employeeId: employeeMap[g.empCode],
          title: g.title,
          type: 'objective',
          targetValue: g.targetValue,
          currentValue: g.currentValue,
          startDate: new Date('2026-01-01'),
          dueDate: new Date('2026-06-30'),
          status: g.status,
        },
      });
    } catch {
      // Skip duplicates
    }
  }

  // =====================================================
  // 16. NOTIFICATIONS
  // =====================================================
  console.log('  🔔 Creating notifications...');
  const adminUserId = userMap['admin@srpailabs.com'];
  const notificationData = [
    { type: 'leave_request', title: 'New Leave Request', message: 'Vikram Singh has requested 2 days of casual leave (Apr 10-11)' },
    { type: 'attendance_alert', title: 'Late Check-in Alert', message: '3 employees checked in late today' },
    { type: 'payroll_reminder', title: 'Payroll Pending', message: 'April 2026 payroll run is due in 3 days' },
    { type: 'recruitment_update', title: 'New Application', message: 'Akash Mehta applied for Senior Full Stack Developer position' },
    { type: 'system', title: 'System Update', message: 'HRMS v2.1 deployed with performance improvements' },
    { type: 'performance', title: 'Review Cycle Active', message: 'H1 2026 Performance Review cycle is now active' },
  ];

  for (const n of notificationData) {
    try {
      await prisma.notification.create({
        data: { tenantId: tenant.id, userId: adminUserId, ...n, channel: 'in_app' },
      });
    } catch {
      // Skip duplicates
    }
  }

  // =====================================================
  // 17. ANNOUNCEMENTS
  // =====================================================
  console.log('  📢 Creating announcements...');
  try {
    await prisma.announcement.create({
      data: {
        tenantId: tenant.id,
        title: 'Welcome to SRP HRMS!',
        content: 'We are excited to launch our AI-powered HRMS platform. All employees can now access their dashboard, mark attendance, and view payslips.',
        type: 'general',
        priority: 'high',
        authorId: adminUserId,
        status: 'published',
        publishedAt: new Date(),
        targetRoles: [],
        targetDepts: [],
      },
    });
    await prisma.announcement.create({
      data: {
        tenantId: tenant.id,
        title: 'H1 2026 Performance Reviews',
        content: 'The H1 2026 performance review cycle is now active. Please set your goals by January 31st and complete self-reviews by June 15th.',
        type: 'hr_update',
        priority: 'normal',
        authorId: adminUserId,
        status: 'published',
        publishedAt: new Date(),
        targetRoles: [],
        targetDepts: [],
      },
    });
  } catch {
    // Skip duplicates
  }

  // =====================================================
  // DONE!
  // =====================================================
  console.log('\n✅ Seed completed successfully!');
  console.log(`
  📊 Summary:
  ─────────────────────────────────
  Permissions:     ${resources.length * actions.length}
  Tenant:          SRP AI Labs (${tenant.id})
  Roles:           ${systemRoles.length}
  Departments:     ${departments.length}
  Positions:       ${positions.length}
  Users/Employees: ${people.length}
  Leave Types:     ${leaveTypes.length}
  Skills:          ${skills.length}
  Attendance:      ~${people.length * 22} records (30 days)
  Salary Structs:  ${people.length}
  Payroll Run:     1 (${period})
  Job Postings:    ${jobPostings.length}
  Candidates:      ${candidateData.length}
  Holidays:        ${holidays.length}
  Goals:           ${goalData.length}
  Notifications:   ${notificationData.length}
  Announcements:   2
  ─────────────────────────────────

  🔐 Login Credentials:
  ─────────────────────────────────
  Admin:    admin@srpailabs.com / Admin@123!
  HR:       hr@srpailabs.com / Admin@123!
  Employee: vikram.js@srpailabs.com / Admin@123!
  Finance:  amit.fin@srpailabs.com / Admin@123!
  ─────────────────────────────────
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
