import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

const stats = [
  { value: 15000, suffix: '+', label: 'Employee Profiles Managed' },
  { value: 500, suffix: '+', label: 'Enterprises Onboarded' },
  { value: 99.9, suffix: '%', label: 'Uptime SLA' },
  { value: 38, suffix: '+', label: 'AI-Powered Modules' },
];

const Counter = ({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const isDecimal = target % 1 !== 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(isDecimal ? parseFloat(start.toFixed(1)) : Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span>
      {target >= 1000 ? count.toLocaleString() : count}
      {suffix}
    </span>
  );
};

const StatsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-16 md:py-20 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-[hsl(260_80%_60%/0.05)]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="text-5xl md:text-6xl font-display font-bold gradient-text mb-2">
                <Counter target={s.value} suffix={s.suffix} inView={inView} />
              </div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
