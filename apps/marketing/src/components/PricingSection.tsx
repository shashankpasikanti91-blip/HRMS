import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$29',
    unit: 'per employee/month',
    desc: 'For small teams getting started with HR automation.',
    features: [
      'Core HR & Employee Management',
      'Attendance & Leave Tracking',
      'Basic Payroll Processing',
      'Employee Self-Service Portal',
    ],
    popular: false,
  },
  {
    name: 'Growth',
    price: '$59',
    unit: 'per employee/month',
    desc: 'For growing companies that need AI-powered HR.',
    features: [
      'Everything in Starter',
      'Recruitment & ATS',
      'AI HR Chatbot',
      'Analytics Dashboard',
      'Workflow Automation',
    ],
    popular: true,
  },
  {
    name: 'Professional',
    price: '$89',
    unit: 'per employee/month',
    desc: 'For organizations that need the full AI engine.',
    features: [
      'Everything in Growth',
      'AI Resume Screening',
      'Attrition Prediction',
      'Multi-Country Payroll',
      'Priority Support',
    ],
    popular: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    unit: 'contact us',
    desc: 'For large organizations with custom requirements.',
    features: [
      'Full AI Engine Access',
      'Custom Integrations',
      'Dedicated Support',
      'SLA Guarantee',
    ],
    popular: false,
  },
];

const PricingSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="pricing" className="section-padding bg-secondary/20" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            Simple, <span className="gradient-text">Scalable</span> Pricing
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            No hidden fees. No per-module charges. Scale as you grow.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`relative rounded-xl border p-8 transition-all duration-500 ${
                plan.popular
                  ? 'border-primary/50 bg-card/80 shadow-[0_0_40px_hsl(var(--glow-cyan)/0.15)]'
                  : 'border-border/50 bg-card/40'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-display font-semibold text-white uppercase tracking-wider" style={{ background: 'var(--gradient-primary)' }}>
                  Most Popular
                </div>
              )}

              <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
              <div className="mt-4 mb-1">
                <span className="text-4xl font-display font-bold gradient-text">{plan.price}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-4">{plan.unit}</div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="https://app.hrms.srpailabs.com/register"
                className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg font-display font-semibold text-sm tracking-wider uppercase transition-all duration-300 ${
                  plan.popular
                    ? 'text-white hover:-translate-y-1'
                    : 'border border-primary/50 text-foreground hover:bg-primary/10'
                }`}
                style={plan.popular ? { background: 'var(--gradient-primary)' } : {}}
              >
                Get Started <ArrowRight size={14} />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
