import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Brain, AlertTriangle, MessageSquare, RefreshCw } from 'lucide-react';

const differentiators = [
  {
    icon: Brain,
    title: 'AI Resume Screening',
    desc: 'Automatically parses, scores, and ranks candidates — no manual screening needed.',
    emoji: '🧠',
  },
  {
    icon: AlertTriangle,
    title: 'Attrition Prediction',
    desc: 'Detect employees at risk before they resign using behavioral signals.',
    emoji: '⚠️',
  },
  {
    icon: MessageSquare,
    title: 'AI HR Assistant',
    desc: '24/7 chatbot answering policies, payroll queries, and HR requests.',
    emoji: '💬',
  },
  {
    icon: RefreshCw,
    title: 'Workflow Automation',
    desc: 'From onboarding to payroll — everything runs automatically.',
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
            What Makes SRP AI HRMS <span className="gradient-text">Different</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Intelligence built into every workflow — from hiring to retention.
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
