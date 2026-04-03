import { motion } from 'framer-motion';
import { ArrowRight, Calendar } from 'lucide-react';

const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background grid + orbs */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute top-20 -left-40 w-[600px] h-[600px] orb-cyan rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-40 w-[500px] h-[500px] orb-violet rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] orb-cyan rounded-full blur-3xl opacity-30" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm text-sm font-medium text-foreground/80 tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI That Runs Your HR
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold leading-[1.05] mb-6"
        >
          <span className="text-foreground">Stop Managing HR.</span>
          <br />
          <motion.span
            className="gradient-text-hero inline-block"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 6, repeat: Infinity }}
            style={{ backgroundSize: '200% 200%' }}
          >
            Let AI Run It.
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed"
        >
          AI-powered HRMS that screens candidates, predicts attrition, automates workflows,
          and answers employee queries — all in real time.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-sm text-muted-foreground/70 mb-10"
        >
          Built for modern teams replacing manual HR with intelligent automation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a href="https://app.hrms.srpailabs.com/register" className="btn-primary inline-flex items-center gap-2 justify-center">
            🚀 Start Free Trial <ArrowRight size={16} />
          </a>
          <a href="#contact" className="btn-outline inline-flex items-center gap-2 justify-center">
            <Calendar size={14} /> Book Live Demo
          </a>
        </motion.div>

        {/* Dashboard preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="mt-16 relative mx-auto max-w-5xl"
        >
          <div className="relative rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl p-1 shadow-2xl">
            <div className="rounded-lg bg-card/80 border border-border/30 overflow-hidden">
              {/* Mock browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-secondary/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background/60 rounded-md px-4 py-1.5 text-xs text-muted-foreground text-center">
                    hrms.srpailabs.com/dashboard
                  </div>
                </div>
              </div>
              {/* Mock dashboard content */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total Employees', value: '2,847', change: '+12%' },
                    { label: 'Present Today', value: '2,651', change: '93.1%' },
                    { label: 'Open Positions', value: '34', change: '+5' },
                    { label: 'Payroll Status', value: 'Processed', change: '✓ On Time' },
                  ].map((card, i) => (
                    <div key={i} className="glass-card p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">{card.label}</div>
                      <div className="text-xl font-display font-bold text-foreground">{card.value}</div>
                      <div className="text-xs text-primary mt-1">{card.change}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 glass-card p-4 rounded-lg h-32">
                    <div className="text-xs text-muted-foreground mb-2">Attendance Trends</div>
                    <div className="flex items-end gap-1 h-20">
                      {[65, 78, 82, 90, 85, 92, 88, 95, 91, 87, 93, 96].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t"
                          style={{
                            height: `${h}%`,
                            background: `linear-gradient(180deg, hsl(190 95% 45% / ${0.3 + i * 0.05}), hsl(260 80% 60% / ${0.2 + i * 0.03}))`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="glass-card p-4 rounded-lg h-32">
                    <div className="text-xs text-muted-foreground mb-2">AI Insights</div>
                    <div className="space-y-2 mt-3">
                      <div className="text-xs text-foreground/80">🔮 3 employees at attrition risk</div>
                      <div className="text-xs text-foreground/80">📊 Payroll anomaly detected in Dept. 7</div>
                      <div className="text-xs text-foreground/80">✅ 12 reviews pending approval</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow effects behind the dashboard */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-primary/20 blur-3xl rounded-full" />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-12 flex flex-col items-center gap-3"
        >
          <span className="text-xs text-muted-foreground uppercase tracking-[0.3em] font-display">Scroll</span>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-primary" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
