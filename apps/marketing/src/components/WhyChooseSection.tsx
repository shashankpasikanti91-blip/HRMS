import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { UserCheck, TrendingDown, MessageCircle, Workflow, ArrowRight } from 'lucide-react';

const benefits = [
  { icon: UserCheck, text: 'Automatically shortlist candidates' },
  { icon: TrendingDown, text: 'Predict which employees may leave' },
  { icon: MessageCircle, text: 'Answer HR questions instantly' },
  { icon: Workflow, text: 'Run workflows without human intervention' },
];

const WhyChooseSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="section-padding" ref={ref}>
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">The Difference</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 text-foreground leading-tight">
              This Isn't HR Software.<br />
              This is an <span className="gradient-text">AI Decision Engine.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-10"
          >
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Traditional HR systems store data.<br />
              <span className="text-foreground font-semibold">SRP AI HRMS takes decisions for you.</span>
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {benefits.map((b, i) => (
              <motion.div
                key={b.text}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="glow-card p-6 group flex items-center gap-4"
              >
                <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center transition-all duration-500 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_hsl(var(--glow-cyan)/0.2)]">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground font-display font-medium">{b.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center text-muted-foreground"
          >
            Your HR team shifts from <span className="text-foreground font-semibold">operations</span> → <span className="gradient-text font-semibold">strategy</span>.
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
