import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const AboutSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="about" className="section-padding bg-secondary/20" ref={ref}>
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">About the Platform</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-5 text-foreground leading-tight">
              Reimagining HR with <br />
              <span className="gradient-text">Artificial Intelligence</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              SRP AI HRMS is a next-generation human resource management system built by SRP AI Labs.
              Our platform combines deep AI capabilities with enterprise-grade security to automate, predict,
              and transform every aspect of workforce management.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              From recruitment to retirement, every workflow is powered by intelligent automation,
              real-time analytics, and a conversational AI assistant that understands your organization.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="glass-card p-5 flex-1">
                <h4 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Vision
                </h4>
                <p className="text-sm text-muted-foreground">
                  To be the world's most intelligent and accessible HR platform, democratizing enterprise-grade
                  people management through AI.
                </p>
              </div>
              <div className="glass-card p-5 flex-1">
                <h4 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[hsl(260_80%_60%)]" />
                  Mission
                </h4>
                <p className="text-sm text-muted-foreground">
                  Delivering AI-first, secure, multi-tenant HR solutions that scale from 10-employee startups
                  to 100,000+ enterprise organizations.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right — Product highlights */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-4"
          >
            {[
              { title: 'SRP AI Labs', desc: '6 AI products live — built by a team obsessed with intelligent automation', icon: '🚀' },
              { title: 'Enterprise Ready', desc: 'Isolated data per organization, custom branding, and role-based access', icon: '🏢' },
              { title: 'Scalable Platform', desc: 'Handles 10 employees to 100,000+ — no performance compromise', icon: '⚡' },
              { title: 'AI-Native', desc: 'Resume screening, attrition prediction, HR chatbot — AI in every module', icon: '🤖' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="glow-card p-6 group hover:border-primary/30 transition-all duration-500 flex gap-4"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
