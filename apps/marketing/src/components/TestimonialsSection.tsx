import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Arjun Mehta',
    role: 'CHRO, TechStar India',
    text: 'SRP AI HRMS replaced three separate tools for us — payroll, attendance, and recruitment. The AI chatbot alone saves our HR team 20+ hours per week.',
  },
  {
    name: 'Sarah Chen',
    role: 'VP People Operations, CloudScale',
    text: 'We evaluated Workday and Oracle before choosing SRP AI HRMS. The AI capabilities and modern UX are leagues ahead, at a fraction of the cost.',
  },
  {
    name: 'Mohammed Al-Rashid',
    role: 'HR Director, Gulf Enterprises',
    text: 'Multi-tenant architecture was critical for our group of companies. SRP AI HRMS handles 5 entities with independent configurations flawlessly.',
  },
  {
    name: 'Priya Krishnamurthy',
    role: 'Founder, HR Catalyst',
    text: 'The performance management module with OKR tracking and 360° feedback has transformed how our clients manage talent. Truly enterprise-grade.',
  },
  {
    name: 'David Park',
    role: 'CTO, ScaleUp Labs',
    text: 'As a tech leader, I appreciate the architecture — NestJS microservices, NATS events, pgvector for AI. This is how modern SaaS should be built.',
  },
  {
    name: 'Lisa Fernandez',
    role: 'COO, MedTech Solutions',
    text: 'HIPAA compliance was a must for us. SRP AI HRMS had it built-in with encryption, audit trails, and access controls that passed our security review.',
  },
];

const TestimonialsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="section-padding bg-secondary/20 overflow-hidden" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Client Voices</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            Trusted by <span className="gradient-text">HR Leaders</span>
          </h2>
        </motion.div>
      </div>

      {/* Marquee testimonials */}
      <div className="testimonial-track">
        {[...testimonials, ...testimonials].map((t, i) => (
          <div key={i} className="w-[380px] shrink-0 mx-3">
            <div className="glass-card p-6 h-full">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm text-white" style={{ background: 'var(--gradient-primary)' }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-display font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
