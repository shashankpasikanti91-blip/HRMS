import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import {
  Users, DollarSign, Briefcase, Clock, BarChart3, Brain, ArrowRight,
} from 'lucide-react';

const solutions = [
  {
    id: 'hr',
    role: 'HR Teams',
    icon: Users,
    headline: 'Elevate Your People Operations',
    description:
      'Automate the entire employee lifecycle — from onboarding to exit. Manage org charts, policies, documents, and employee self-service from a single intelligent platform.',
    bullets: [
      'Full employee lifecycle automation',
      'AI-powered onboarding & offboarding workflows',
      'Document vault with e-signatures',
      'Employee self-service & mobile access',
      '360° org chart & hierarchy management',
    ],
    accent: 'from-primary to-[hsl(200_80%_50%)]',
    glow: 'hsl(var(--glow-cyan))',
  },
  {
    id: 'payroll',
    role: 'Finance & Payroll',
    icon: DollarSign,
    headline: 'Accurate Payroll. Zero Manual Work.',
    description:
      'Process multi-country payroll with automated tax calculations, salary structures, and statutory compliance. Generate payslips, manage deductions, and maintain complete audit trails.',
    bullets: [
      'Multi-country payroll processing',
      'Automated tax & statutory compliance',
      'Salary bands & compensation management',
      'Instant payslip generation & distribution',
      'Full audit trail for every transaction',
    ],
    accent: 'from-emerald-500 to-[hsl(160_70%_40%)]',
    glow: 'hsl(160 70% 40%)',
  },
  {
    id: 'recruitment',
    role: 'Talent Acquisition',
    icon: Briefcase,
    headline: 'Hire Faster. Hire Smarter.',
    description:
      'AI-powered applicant tracking system that screens, scores, and ranks candidates automatically. From job posting to signed offer — reduce time-to-hire by over 60%.',
    bullets: [
      'AI resume screening & scoring',
      'Structured interview scheduling',
      'Candidate pipeline & ATS workflows',
      'Offer letter automation',
      'Career page & job board integration',
    ],
    accent: 'from-violet-500 to-[hsl(260_80%_60%)]',
    glow: 'hsl(var(--glow-violet))',
  },
  {
    id: 'workforce',
    role: 'Workforce Management',
    icon: Clock,
    headline: 'Total Visibility. Full Control.',
    description:
      'Real-time attendance tracking, leave management, shift scheduling, and overtime management — all automated and configurable per team, location, or role.',
    bullets: [
      'Real-time attendance & clock-in/out',
      'Intelligent leave policies & calendars',
      'Shift scheduling & rotation management',
      'Overtime tracking & compliance',
      'Multi-location & remote workforce support',
    ],
    accent: 'from-amber-500 to-[hsl(40_90%_50%)]',
    glow: 'hsl(40 90% 50%)',
  },
  {
    id: 'performance',
    role: 'Performance & Growth',
    icon: BarChart3,
    headline: 'Unlock Your Team\'s Potential',
    description:
      'Set goals, run review cycles, collect 360° feedback, and build skill matrices. Identify high performers and flight risks before they impact your business.',
    bullets: [
      'OKR & goal-setting frameworks',
      'Structured review cycles',
      '360° multi-rater feedback',
      'Competency & skills matrix',
      'AI-driven attrition prediction',
    ],
    accent: 'from-rose-500 to-[hsl(340_80%_55%)]',
    glow: 'hsl(340 80% 55%)',
  },
  {
    id: 'ai',
    role: 'AI & Analytics',
    icon: Brain,
    headline: 'Intelligence That Anticipates.',
    description:
      'Executive dashboards, workforce analytics, and predictive AI that surfaces insights before problems emerge. Your HR chatbot handles queries around the clock.',
    bullets: [
      'Executive & workforce dashboards',
      'AI HR assistant (24/7 chatbot)',
      'Predictive attrition modeling',
      'Custom report builder & exports',
      'Real-time anomaly alerts',
    ],
    accent: 'from-primary to-[hsl(260_80%_60%)]',
    glow: 'hsl(var(--glow-cyan))',
  },
];

const SolutionsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [active, setActive] = useState('hr');

  const current = solutions.find((s) => s.id === active)!;

  return (
    <section id="solutions" className="section-padding relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] orb-violet rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] orb-cyan rounded-full blur-3xl opacity-15 pointer-events-none" />

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Solutions by Team</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            Built for Every Team <br />
            <span className="gradient-text">in Your Organization</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Purpose-built workflows for HR, Finance, Talent, and Operations — unified under one AI-powered platform.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {solutions.map((s) => {
            const Icon = s.icon;
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-display font-semibold transition-all duration-300 border ${
                  isActive
                    ? 'text-white border-transparent shadow-lg scale-105'
                    : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border bg-card/40'
                }`}
                style={isActive ? { background: `var(--gradient-primary)` } : {}}
              >
                <Icon className="w-4 h-4" />
                {s.role}
              </button>
            );
          })}
        </motion.div>

        {/* Active panel */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid lg:grid-cols-2 gap-10 items-center max-w-5xl mx-auto"
        >
          {/* Left: Content */}
          <div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: `linear-gradient(135deg, ${current.glow}30, ${current.glow}10)`, border: `1px solid ${current.glow}40` }}
            >
              <current.icon className="w-7 h-7" style={{ color: current.glow }} />
            </div>
            <h3 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4 leading-snug">
              {current.headline}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-8 text-base">
              {current.description}
            </p>
            <ul className="space-y-3 mb-8">
              {current.bullets.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${current.glow}20`, border: `1px solid ${current.glow}50` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: current.glow }} />
                  </div>
                  <span className="text-sm text-muted-foreground">{b}</span>
                </li>
              ))}
            </ul>
            <a
              href="https://app.hrms.srpailabs.com/register"
              className="inline-flex items-center gap-2 text-sm font-display font-semibold transition-colors hover:gap-3"
              style={{ color: current.glow }}
            >
              Explore {current.role} Features <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Right: Visual card */}
          <div
            className="rounded-2xl border p-8 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${current.glow}08, transparent)`,
              borderColor: `${current.glow}30`,
              boxShadow: `0 0 60px ${current.glow}15`,
            }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: current.glow }} />

            <div className="relative z-10 space-y-4">
              {current.bullets.map((b, i) => (
                <motion.div
                  key={b}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: `${current.glow}08`, border: `1px solid ${current.glow}15` }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-xs"
                    style={{ background: `${current.glow}30` }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <span className="text-sm font-medium text-foreground/80">{b}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionsSection;
