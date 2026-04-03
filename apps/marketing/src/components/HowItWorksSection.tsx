import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Database, Brain, Zap } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: Database,
    title: 'Connect Your Data',
    desc: 'Import employees, resumes, and policies. We handle the migration.',
  },
  {
    num: '02',
    icon: Brain,
    title: 'AI Analyzes & Learns',
    desc: 'Our AI understands your workflows, patterns, and organization structure.',
  },
  {
    num: '03',
    icon: Zap,
    title: 'System Automates',
    desc: 'Decisions and actions happen automatically — from screening to payroll.',
  },
];

const HowItWorksSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="section-padding bg-secondary/20" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">How It Works</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            From Manual HR to <span className="gradient-text">Autonomous HR</span> in 3 Steps
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-10">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-xs font-display font-bold text-primary mb-2 tracking-widest">STEP {s.num}</div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center text-muted-foreground text-sm"
        >
          No complex setup. No technical team needed.
        </motion.p>
      </div>
    </section>
  );
};

export default HowItWorksSection;
