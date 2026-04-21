import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Users, Clock, DollarSign, Target, Bell,
  BarChart3, Bot, ArrowUpRight, FileText, Calendar,
  Building2, TrendingDown, Globe, ShieldCheck, Layers, UserCheck,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Employee Management',
    desc: 'Full employee lifecycle — profiles, onboarding checklists, exit workflows, document management, and bank account details.',
  },
  {
    icon: Clock,
    title: 'Attendance Tracking',
    desc: 'Clock in/out with location capture, team dashboard, correction requests, monthly history, and CSV export.',
  },
  {
    icon: Calendar,
    title: 'Leave Management',
    desc: 'Apply and approve leave requests, track balances, configure leave policies per type, with manager team viewing.',
  },
  {
    icon: TrendingDown,
    title: 'LOP (Loss of Pay)',
    desc: 'Calculate and approve LOP per employee per month, with policy config, overrides, and bulk processing.',
  },
  {
    icon: DollarSign,
    title: 'Payroll & Compensation',
    desc: 'Configure salary structures and components, run monthly payroll, generate payslips, and maintain full audit trails.',
  },
  {
    icon: Globe,
    title: 'Tax & Compliance',
    desc: 'Built-in statutory rules for India, Malaysia, Singapore, and UAE. Handles PF, ESIC, CPF, and professional tax.',
  },
  {
    icon: Target,
    title: 'Performance Reviews',
    desc: 'Create and manage performance reviews with goal scores, manager feedback, self-assessment, and review history.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    desc: 'Workforce headcount, attendance trend forecasting, payroll summaries, and department-level breakdowns.',
  },
  {
    icon: Bot,
    title: 'AI HR Assistant',
    desc: 'GPT-4o powered chatbot with RAG-based context and session persistence. Handles common HR queries around the clock.',
  },
  {
    icon: FileText,
    title: 'Document Vault',
    desc: 'Upload and manage employee documents, onboarding and exit compliance checklists, and document templates.',
  },
  {
    icon: Building2,
    title: 'Org & Branch Management',
    desc: 'Configure departments, designations, multi-branch structure, shifts, and employee ID formats per company.',
  },
  {
    icon: ShieldCheck,
    title: 'System Audit Logs',
    desc: 'Complete audit trail for every action — entity, change diff, user, IP address — with expandable detail view.',
  },
  {
    icon: Layers,
    title: 'Holiday Calendar',
    desc: 'Monthly calendar with national holiday presets for India, Malaysia, Singapore, and UAE, plus bulk import.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    desc: 'In-app notification feed with mark-read, bulk clear, pagination, and priority categories.',
  },
  {
    icon: UserCheck,
    title: 'User & Role Management',
    desc: 'Invite team members by email, assign one of 7 RBAC roles, and manage access from the Settings panel.',
  },
  {
    icon: Target,
    title: 'Calendar Overview',
    desc: 'Visual monthly calendar overlaying attendance, late marks, absences, and holiday indicators per employee.',
  },
];

const FeaturesSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="section-padding bg-secondary/20" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Complete Platform</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            Everything You Need, <span className="gradient-text">One Platform</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Core HR modules that cover the full employee lifecycle — from onboarding to exit.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ gridAutoRows: '1fr' }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glow-card p-7 group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-primary/5 to-[hsl(260_80%_60%/0.05)]" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center transition-all duration-500 group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-[0_0_20px_hsl(var(--glow-cyan)/0.2)]">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all duration-500 translate-y-2 group-hover:translate-y-0" />
                </div>
                <h3 className="font-display font-semibold text-base text-foreground mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
