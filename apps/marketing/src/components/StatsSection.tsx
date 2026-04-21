import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Shield, Layers, Globe, Lock } from 'lucide-react';

const highlights = [
  { icon: Shield, title: 'Multi-Tenant Architecture', desc: 'Each company\'s data is fully isolated. Secure by default, configurable per organization.' },
  { icon: Layers, title: '35+ Built-in Modules', desc: 'HR, Payroll, Leave, LOP, Attendance, Performance, Analytics, and more.' },
  { icon: Globe, title: 'Multi-Country Support', desc: 'India, Malaysia, Singapore, UAE — statutory deductions and holiday presets built in.' },
  { icon: Lock, title: '7 Roles, RBAC', desc: 'Granular permissions from super admin to employee. Every screen respects role access.' },
];

const StatsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-16 md:py-20 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-[hsl(260_80%_60%/0.05)]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="text-center p-6"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-display font-bold text-foreground mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
