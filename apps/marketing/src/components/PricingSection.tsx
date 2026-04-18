import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$69',
    unit: 'per company / month',
    desc: 'For small teams that need core HR tools to get organized.',
    features: [
      'Up to 50 employees',
      'Employee management & profiles',
      'Attendance & leave tracking',
      'Holiday calendar',
      'Basic payroll processing',
      'Employee self-service portal',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Growth',
    price: '$149',
    unit: 'per company / month',
    desc: 'For growing companies that need recruitment, analytics, and automation.',
    features: [
      'Up to 200 employees',
      'Everything in Starter',
      'Recruitment & applicant tracking',
      'AI resume screening',
      'Performance reviews & goals',
      'Analytics dashboard',
      'Department management',
      'Document management',
      'Priority support',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    unit: 'contact us for pricing',
    desc: 'For larger organizations with advanced needs and dedicated support.',
    features: [
      'Unlimited employees',
      'Everything in Growth',
      'Multi-branch management',
      'Custom salary structures',
      'Advanced reporting & exports',
      'API access & integrations',
      'Dedicated account manager',
      'Custom onboarding & training',
      'SLA guarantee',
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
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            No hidden fees. No per-module charges. Pick a plan and get started today.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`relative rounded-xl border p-8 transition-all duration-500 flex flex-col ${
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

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={plan.price === 'Custom' ? '#contact' : 'https://app.hrms.srpailabs.com/register'}
                className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg font-display font-semibold text-sm tracking-wider uppercase transition-all duration-300 ${
                  plan.popular
                    ? 'text-white hover:-translate-y-1'
                    : 'border border-primary/50 text-foreground hover:bg-primary/10'
                }`}
                style={plan.popular ? { background: 'var(--gradient-primary)' } : {}}
              >
                {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'} <ArrowRight size={14} />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
