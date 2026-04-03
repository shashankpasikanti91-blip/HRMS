import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    name: 'Arjun Mehta',
    role: 'CHRO',
    company: 'TechStar India',
    text: 'Reduced our hiring time by 60% instantly.',
  },
  {
    name: 'Sarah Chen',
    role: 'VP People Operations',
    company: 'CloudScale',
    text: 'Feels like we hired an AI HR manager.',
  },
  {
    name: 'Mohammed Al-Rashid',
    role: 'HR Director',
    company: 'Gulf Enterprises',
    text: 'Automation replaced 3 manual HR roles.',
  },
  {
    name: 'Priya Krishnamurthy',
    role: 'Founder',
    company: 'HR Catalyst',
    text: 'The performance management transformed how our clients manage talent.',
  },
  {
    name: 'David Park',
    role: 'CTO',
    company: 'ScaleUp Labs',
    text: "Best HR platform we've used — modern, fast, and truly intelligent.",
  },
  {
    name: 'Lisa Fernandez',
    role: 'COO',
    company: 'MedTech Solutions',
    text: 'Passed our security review on day one. Compliance built-in.',
  },
];

const TestimonialsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const visibleCount = 3;
  const maxIndex = testimonials.length - visibleCount;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, maxIndex]);

  return (
    <section className="section-padding overflow-hidden" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-foreground">
            What Teams Say About <span className="gradient-text">SRP AI HRMS</span>
          </h2>
        </motion.div>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Side blur effects */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden">
            <div
              className="flex gap-6 transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${current * (100 / visibleCount)}%)` }}
            >
              {testimonials.map((t, i) => (
                <div key={i} className="min-w-[calc(33.333%-1rem)] shrink-0">
                  <div className="glass-card p-6 h-full">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed mb-5">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm text-white" style={{ background: 'var(--gradient-primary)' }}>
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-display font-semibold text-foreground">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.role}, {t.company}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => setCurrent((p) => Math.max(0, p - 1))}
              className="w-10 h-10 rounded-lg border border-border/50 bg-card/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrent((p) => Math.min(maxIndex, p + 1))}
              className="w-10 h-10 rounded-lg border border-border/50 bg-card/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
