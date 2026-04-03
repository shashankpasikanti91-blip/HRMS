import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const outcomes = [
  { emoji: '⏱', text: '70% reduction in manual HR work' },
  { emoji: '🎯', text: 'Faster hiring with AI screening' },
  { emoji: '📉', text: 'Lower employee attrition' },
  { emoji: '📊', text: 'Real-time workforce insights' },
  { emoji: '🤖', text: '24/7 HR support without extra staff' },
];

const ResultsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="section-padding" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Results</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            What You Achieve With <span className="gradient-text">SRP AI HRMS</span>
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-4">
          {outcomes.map((o, i) => (
            <motion.div
              key={o.text}
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glow-card p-5 flex items-center gap-4 group"
            >
              <span className="text-2xl">{o.emoji}</span>
              <p className="font-display font-medium text-foreground">{o.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
