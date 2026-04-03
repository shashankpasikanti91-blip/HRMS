import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Users, Clock, DollarSign, Briefcase, Target, Bell,
  BarChart3, Bot, ArrowUpRight,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Core HR & Employee Management',
    desc: 'Complete employee lifecycle — onboarding, profiles, org charts, documents, and self-service portal.',
  },
  {
    icon: Briefcase,
    title: 'Recruitment & ATS',
    desc: 'AI-powered job board, candidate pipeline, interview scheduling, resume screening, and offer letter automation.',
  },
  {
    icon: DollarSign,
    title: 'Payroll & Compensation',
    desc: 'Multi-country payroll processing, tax calculations, salary structures, and payslip generation.',
  },
  {
    icon: Clock,
    title: 'Attendance & Leave',
    desc: 'Real-time tracking, shift scheduling, leave policies, holiday calendars, and overtime management.',
  },
  {
    icon: Target,
    title: 'Performance & OKR Tracking',
    desc: 'Goal setting, review cycles, 360° feedback, skill matrix, and competency frameworks.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    desc: 'Executive dashboards, workforce analytics, attrition trends, and scheduled report exports.',
  },
  {
    icon: Bot,
    title: 'AI HR Chatbot',
    desc: '24/7 assistant that answers HR policies, generates letters, explains payslips, and handles requests.',
  },
  {
    icon: Bell,
    title: 'Notifications & Workflows',
    desc: 'Multi-channel alerts and automated workflows from onboarding to exit — no manual steps.',
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
            Everything You Need, <span className="gradient-text">Powered by AI</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            From hiring to exit — every module is designed to save time, reduce errors, and give you real-time insights.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
