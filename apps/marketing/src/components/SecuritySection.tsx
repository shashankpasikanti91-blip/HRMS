import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Shield, Lock, Eye, FileCheck, Key, Server } from 'lucide-react';

const securityFeatures = [
  { icon: Lock, title: 'AES-256 Encryption', desc: 'Data encrypted at rest and in transit with military-grade encryption standards' },
  { icon: Key, title: 'Multi-Factor Auth', desc: 'TOTP-based MFA with QR codes, backup codes, and hardware key support' },
  { icon: Shield, title: 'RBAC + ABAC', desc: 'Granular role-based and attribute-based access control with 19 resource types × 7 permission levels' },
  { icon: Eye, title: 'Complete Audit Trail', desc: 'Every action logged with who, what, when, where — immutable audit logs with tamper detection' },
  { icon: FileCheck, title: 'Compliance Ready', desc: 'GDPR, SOC2, HIPAA, SOX compliant architecture with data residency controls' },
  { icon: Server, title: 'Tenant Isolation', desc: 'Complete data isolation per tenant — no cross-tenant data leakage possible at database level' },
];

const SecuritySection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="section-padding relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Security & Compliance</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            Enterprise-Grade <span className="gradient-text">Security</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Your employee data is the most sensitive asset. We built security into every layer — not bolted on as an afterthought.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glow-card p-6 group flex gap-4"
            >
              <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center transition-all duration-500 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_hsl(var(--glow-cyan)/0.2)]">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 flex flex-wrap justify-center gap-6"
        >
          {['SOC2 Type II', 'GDPR Compliant', 'ISO 27001', 'HIPAA Ready', 'SOX Compliant'].map((badge) => (
            <div key={badge} className="px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-display font-semibold text-primary uppercase tracking-wider">
              {badge}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SecuritySection;
