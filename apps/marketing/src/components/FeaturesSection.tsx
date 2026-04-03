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
    desc: 'Complete employee lifecycle — onboarding, profiles, org charts, department hierarchy, document vault, and self-service portal.',
  },
  {
    icon: Clock,
    title: 'Attendance & Leave Management',
    desc: 'Biometric integration, geo-fenced check-in, shift scheduling, leave policies, holiday calendars, and auto-overtime calculations.',
  },
  {
    icon: DollarSign,
    title: 'Payroll & Compensation',
    desc: 'Multi-country payroll with precision math (Decimal.js), tax calculations, salary structures, payslip generation, and CTC modeling.',
  },
  {
    icon: Briefcase,
    title: 'Recruitment & ATS',
    desc: 'AI-powered job board, candidate pipeline, interview scheduling, resume parsing, scorecard evaluation, and offer letter automation.',
  },
  {
    icon: Target,
    title: 'Performance & Goals',
    desc: 'OKR/KPI tracking, 360° reviews, review cycles, skill matrix, competency frameworks, goal alignment, and 9-box grid visualization.',
  },
  {
    icon: Bell,
    title: 'Notifications & Workflows',
    desc: 'Multi-channel alerts (email, SMS, push, WhatsApp, Telegram), custom workflows via n8n, and event-driven automation with NATS.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    desc: 'Executive dashboards, headcount analytics, attrition trends, payroll cost analysis, custom reports, and scheduled CSV/PDF exports.',
  },
  {
    icon: Bot,
    title: 'AI HR Chatbot',
    desc: 'RAG-powered conversational assistant that answers HR policies, generates letters, explains payslips, and provides manager insights.',
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
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Platform Capabilities</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            Everything You Need, <span className="gradient-text">Powered by AI</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            8 microservices working in harmony — each module is independently scalable, fully API-driven, and enhanced with artificial intelligence.
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
