import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const integrations = [
  { name: 'Google OAuth', abbr: 'GO', note: 'Single sign-on' },
  { name: 'OpenAI GPT-4o', abbr: 'AI', note: 'AI assistant & screening' },
  { name: 'Telegram', abbr: 'TG', note: 'Bot notifications' },
  { name: 'WhatsApp', abbr: 'WA', note: 'Contact & notifications' },
  { name: 'Slack', abbr: 'SL', note: 'Coming soon' },
  { name: 'MS Teams', abbr: 'MT', note: 'Coming soon' },
];

const IntegrationsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="section-padding bg-secondary/20" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Integrations</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            Works With Your <span className="gradient-text">Existing Tools</span>
          </h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
          {integrations.map((int, i) => (
            <motion.div
              key={int.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="glass-card px-8 py-5 text-center group hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-display font-bold text-primary group-hover:bg-primary/20 transition-colors">
                {int.abbr}
              </div>
              <div className="text-sm font-display font-semibold text-foreground">{int.name}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{int.note}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
