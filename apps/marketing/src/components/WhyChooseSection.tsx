import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Shield, Zap, Globe, Brain, Lock, TrendingUp } from 'lucide-react';

const differentiators = [
  { icon: Brain, title: 'AI-First Architecture', desc: 'Every module is powered by AI — from smart resume screening to predictive attrition analytics and conversational HR chatbot.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'SOC2 compliant architecture with AES-256 encryption, MFA, RBAC, field-level encryption, and complete audit trails.' },
  { icon: Zap, title: 'Lightning Performance', desc: '99.9% uptime SLA with Redis caching, NATS event streaming, and Elasticsearch-powered instant search across all modules.' },
  { icon: Globe, title: 'Global Multi-Tenant', desc: 'True data isolation per tenant with custom domains, branding, roles, and configurable workflows for any country or region.' },
  { icon: Lock, title: 'Compliance Built-In', desc: 'GDPR, SOX, HIPAA ready. Automated tax calculations, statutory reports, and region-specific labor law compliance.' },
  { icon: TrendingUp, title: 'Real-Time Analytics', desc: 'Live dashboards, workforce analytics, headcount trends, cost analysis, and AI-generated insights with one-click export.' },
];

const WhyChooseSection = () => {
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
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Why Choose Us</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            Beyond <span className="gradient-text">Workday & Oracle</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Built from the ground up to outperform legacy HCM platforms with modern AI, cloud-native architecture, and developer-first APIs.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {differentiators.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glow-card glow-card-violet p-8 group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center transition-all duration-500 group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-[0_0_30px_hsl(var(--glow-cyan)/0.2)] mb-6">
                <d.icon className="w-6 h-6 text-primary transition-transform duration-500 group-hover:scale-110" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-3">{d.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
