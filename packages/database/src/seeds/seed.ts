// ============================================================
// SRP AI HRMS - Database Seed Script
// Creates initial data for development
// ============================================================

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  console.log('🌱 Seeding SRP AI HRMS database...');

  // 1. Create permissions
  const resources = [
    'employees', 'departments', 'positions', 'attendance', 'leave',
    'payroll', 'recruitment', 'performance', 'documents', 'reports',
    'settings', 'users', 'roles', 'tenants', 'notifications',
    'analytics', 'ai', 'compliance', 'benefits',
  ];
  const actions = ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'];

  console.log('  Creating permissions...');
  for (const resource of resources) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: {
          resource,
          action,
          description: `${action} ${resource}`,
        },
      });
    }
  }

  // 2. Create demo tenant
  console.log('  Creating demo tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      domain: 'demo.hrms.srpailabs.com',
      status: 'active',
      plan: 'enterprise',
      maxUsers: 1000,
      settings: {
        branding: {
          primaryColor: '#6366f1',
          secondaryColor: '#8b5cf6',
        },
        locale: {
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          currency: 'USD',
          language: 'en',
        },
        features: {
          enabledModules: [
            'core_hr', 'payroll', 'attendance', 'leave',
            'recruitment', 'performance', 'ai_chatbot',
          ],
          aiFeatures: true,
          maxEmployees: 1000,
        },
        security: {
          mfaRequired: false,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxAge: 90,
            preventReuse: 3,
          },
          sessionTimeout: 3600,
          ipWhitelist: [],
        },
      },
    },
  });

  // 3. Create system roles
  console.log('  Creating system roles...');
  const systemRoles = [
    { name: 'Super Admin', slug: 'super_admin', description: 'Full platform access' },
    { name: 'Tenant Admin', slug: 'tenant_admin', description: 'Full tenant access' },
    { name: 'HR Admin', slug: 'hr_admin', description: 'Full HR module access' },
    { name: 'HR Manager', slug: 'hr_manager', description: 'HR management access' },
    { name: 'Department Head', slug: 'department_head', description: 'Department-level access' },
    { name: 'Team Manager', slug: 'team_manager', description: 'Team management access' },
    { name: 'Employee', slug: 'employee', description: 'Basic employee self-service' },
    { name: 'Recruiter', slug: 'recruiter', description: 'Recruitment module access' },
    { name: 'Finance Admin', slug: 'finance_admin', description: 'Finance & payroll access' },
  ];

  for (const role of systemRoles) {
    await prisma.role.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: role.slug } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: role.name,
        slug: role.slug,
        description: role.description,
        isSystem: true,
      },
    });
  }

  // 4. Create admin user
  console.log('  Creating admin user...');
  const passwordHash = await hashPassword('Admin@123!');
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@srpailabs.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@srpailabs.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      status: 'active',
      emailVerified: true,
    },
  });

  const adminRole = await prisma.role.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'tenant_admin' } },
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id },
    });
  }

  // 5. Create departments
  console.log('  Creating departments...');
  const departments = [
    { name: 'Engineering', code: 'ENG', description: 'Software Engineering' },
    { name: 'Human Resources', code: 'HR', description: 'People Operations' },
    { name: 'Finance', code: 'FIN', description: 'Finance & Accounting' },
    { name: 'Marketing', code: 'MKT', description: 'Marketing & Communications' },
    { name: 'Sales', code: 'SALES', description: 'Sales & Business Development' },
    { name: 'Operations', code: 'OPS', description: 'Operations & Logistics' },
    { name: 'Product', code: 'PROD', description: 'Product Management' },
    { name: 'Design', code: 'DES', description: 'UX/UI Design' },
  ];

  const createdDepts: Record<string, string> = {};
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: dept.code } },
      update: {},
      create: { tenantId: tenant.id, ...dept },
    });
    createdDepts[dept.code] = d.id;
  }

  // 6. Create positions
  console.log('  Creating positions...');
  const positions = [
    { title: 'Software Engineer', code: 'SE-001', departmentId: createdDepts['ENG'], grade: 'L3' },
    { title: 'Senior Software Engineer', code: 'SE-002', departmentId: createdDepts['ENG'], grade: 'L4' },
    { title: 'Engineering Manager', code: 'EM-001', departmentId: createdDepts['ENG'], grade: 'L5' },
    { title: 'HR Specialist', code: 'HR-001', departmentId: createdDepts['HR'], grade: 'L3' },
    { title: 'HR Manager', code: 'HR-002', departmentId: createdDepts['HR'], grade: 'L5' },
    { title: 'Financial Analyst', code: 'FIN-001', departmentId: createdDepts['FIN'], grade: 'L3' },
    { title: 'Product Manager', code: 'PM-001', departmentId: createdDepts['PROD'], grade: 'L4' },
    { title: 'UX Designer', code: 'DES-001', departmentId: createdDepts['DES'], grade: 'L3' },
  ];

  const createdPositions: Record<string, string> = {};
  for (const pos of positions) {
    const p = await prisma.position.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: pos.code } },
      update: {},
      create: { tenantId: tenant.id, ...pos },
    });
    createdPositions[pos.code] = p.id;
  }

  // 7. Create leave types
  console.log('  Creating leave types...');
  const leaveTypes = [
    { name: 'Annual Leave', code: 'AL', annualQuota: 20, carryForwardLimit: 5, isPaid: true },
    { name: 'Sick Leave', code: 'SL', annualQuota: 14, carryForwardLimit: 0, isPaid: true },
    { name: 'Casual Leave', code: 'CL', annualQuota: 7, carryForwardLimit: 0, isPaid: true },
    { name: 'Maternity Leave', code: 'ML', annualQuota: 90, carryForwardLimit: 0, isPaid: true, applicableGenders: ['female'] },
    { name: 'Paternity Leave', code: 'PL', annualQuota: 14, carryForwardLimit: 0, isPaid: true, applicableGenders: ['male'] },
    { name: 'Unpaid Leave', code: 'UL', annualQuota: 30, carryForwardLimit: 0, isPaid: false },
    { name: 'Compensatory Off', code: 'CO', annualQuota: 0, carryForwardLimit: 0, isPaid: true },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: lt.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        ...lt,
        applicableGenders: lt.applicableGenders || [],
      },
    });
  }

  // 8. Create skills
  console.log('  Creating skills taxonomy...');
  const skills = [
    { name: 'JavaScript', category: 'Programming' },
    { name: 'TypeScript', category: 'Programming' },
    { name: 'Python', category: 'Programming' },
    { name: 'React', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'Kubernetes', category: 'DevOps' },
    { name: 'Machine Learning', category: 'AI/ML' },
    { name: 'Data Analysis', category: 'Analytics' },
    { name: 'Project Management', category: 'Management' },
    { name: 'Leadership', category: 'Soft Skills' },
    { name: 'Communication', category: 'Soft Skills' },
    { name: 'Problem Solving', category: 'Soft Skills' },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log(`
  📊 Summary:
  - Permissions: ${resources.length * actions.length}
  - Tenant: Demo Company
  - Roles: ${systemRoles.length}
  - Admin: admin@srpailabs.com / Admin@123!
  - Departments: ${departments.length}
  - Positions: ${positions.length}
  - Leave Types: ${leaveTypes.length}
  - Skills: ${skills.length}
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
