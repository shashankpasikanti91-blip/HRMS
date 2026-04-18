import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

const reasons = [
  {
    title: 'Built for growing companies',
    desc: 'Whether you have 10 or 500 employees, the system scales with your team without additional complexity.',
  },
  {
    title: 'Clean automation workflows',
    desc: 'Attendance, leave approvals, payroll runs, and onboarding steps — automated end to end.',
  },
  {
    title: 'Secure multi-tenant architecture',
    desc: 'Every company\'s data is fully isolated. Role-based access ensures the right people see the right data.',
  },
  {
    title: 'AI-assisted productivity',
    desc: 'Resume screening, candidate scoring, and an HR chatbot that answers employee questions around the clock.',
  },
  {
    title: 'Fast setup, no long contracts',
    desc: 'Create your account, invite your team, and start managing HR the same day. Cancel anytime.',
  },
  {
    title: 'Actively maintained & updated',
    desc: 'New features and improvements ship regularly. Built by a team that responds to customer feedback.',
  },
];

const TestimonialsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="section-padding overflow-hidden" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Why SRP AI HRMS</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            Why Teams Choose <span className="gradient-text">SRP AI HRMS</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            We focus on building software that actually works for HR teams — no gimmicks, no bloat.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass-card p-6"
            >
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <h3 className="text-sm font-display font-bold text-foreground">{r.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-8">{r.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-10"
        >
          <a href="https://app.hrms.srpailabs.com/register" className="inline-flex items-center gap-2 text-sm font-display font-semibold text-primary hover:gap-3 transition-all">
            Start your free trial <ArrowRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
