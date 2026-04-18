import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Brain, AlertTriangle, MessageSquare, RefreshCw } from 'lucide-react';

const differentiators = [
  {
    icon: Brain,
    title: 'AI Resume Screening',
    desc: 'Upload resumes and get automatic scoring based on job requirements. Saves hours of manual review.',
    emoji: '🧠',
  },
  {
    icon: AlertTriangle,
    title: 'Smart Alerts',
    desc: 'Get notified about pending approvals, visa expirations, and payroll deadlines before they become problems.',
    emoji: '⚠️',
  },
  {
    icon: MessageSquare,
    title: 'AI HR Assistant',
    desc: 'Employees can ask common HR questions through a built-in chatbot, reducing repetitive queries.',
    emoji: '💬',
  },
  {
    icon: RefreshCw,
    title: 'Workflow Automation',
    desc: 'Automate onboarding steps, leave approvals, and payroll processing with configurable rules.',
    emoji: '🔄',
  },
];

const AISection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="ai" className="section-padding relative overflow-hidden" ref={ref}>
      {/* Background orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] orb-violet rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] orb-cyan rounded-full blur-3xl opacity-20" />

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">AI Capabilities</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            Built-in <span className="gradient-text">AI Tools</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Practical AI features that save time across hiring, HR support, and daily operations.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {differentiators.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glow-card glow-card-violet p-7 group text-center"
            >
              <div className="text-4xl mb-4">{d.emoji}</div>
              <h3 className="font-display font-semibold text-base text-foreground mb-3">{d.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AISection;
