import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const integrations = [
  { name: 'PostgreSQL', desc: 'Primary DB' },
  { name: 'Redis', desc: 'Caching' },
  { name: 'Elasticsearch', desc: 'Search' },
  { name: 'NATS', desc: 'Events' },
  { name: 'MinIO / S3', desc: 'Storage' },
  { name: 'OpenAI / GPT-4', desc: 'AI Models' },
  { name: 'Google Gemini', desc: 'AI Models' },
  { name: 'Anthropic Claude', desc: 'AI Models' },
  { name: 'Slack', desc: 'Messaging' },
  { name: 'MS Teams', desc: 'Collaboration' },
  { name: 'WhatsApp', desc: 'Notifications' },
  { name: 'Twilio', desc: 'SMS / Voice' },
  { name: 'Stripe', desc: 'Payments' },
  { name: 'Razorpay', desc: 'Payments' },
  { name: 'Google SSO', desc: 'Auth' },
  { name: 'Azure AD', desc: 'SSO / LDAP' },
];

const IntegrationsSection = () => {
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
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Integrations</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            Connects with <span className="gradient-text">Everything</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Built with an API-first architecture. Integrates with your existing tools, databases, and AI models seamlessly.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {integrations.map((int, i) => (
            <motion.div
              key={int.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="glass-card p-4 text-center group hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-display font-bold text-primary group-hover:bg-primary/20 transition-colors">
                {int.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-xs font-display font-semibold text-foreground truncate">{int.name}</div>
              <div className="text-[10px] text-muted-foreground">{int.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
