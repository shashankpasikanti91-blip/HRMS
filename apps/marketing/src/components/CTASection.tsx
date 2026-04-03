import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ArrowRight, Mail, Phone, MapPin, Send } from 'lucide-react';

const CTASection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [formData, setFormData] = useState({ name: '', email: '', company: '', employees: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  return (
    <section id="contact" className="section-padding relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] orb-cyan rounded-full blur-3xl opacity-20" />

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left — CTA */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <span className="text-primary font-display text-sm tracking-widest uppercase font-semibold">Get in Touch</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 mb-5 text-foreground leading-tight">
              Ready to Transform <br />
              <span className="gradient-text">Your HR?</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Schedule a personalized demo and see how SRP AI HRMS can replace your legacy systems
              with AI-powered intelligence. Our team will set up a trial environment with your data in under 24 hours.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm font-display font-semibold text-foreground">contact@srpailabs.com</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="text-sm font-display font-semibold text-foreground">+1 (555) 123-4567</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Platform</div>
                  <div className="text-sm font-display font-semibold text-foreground">hrms.srpailabs.com</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="glow-card p-8">
              <h3 className="font-display font-bold text-xl text-foreground mb-6">Request a Demo</h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                  />
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="Work Email"
                    className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Company Name"
                    className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                  />
                  <select
                    name="employees"
                    value={formData.employees}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="" className="bg-card">Number of Employees</option>
                    <option value="1-50" className="bg-card">1 – 50</option>
                    <option value="51-200" className="bg-card">51 – 200</option>
                    <option value="201-500" className="bg-card">201 – 500</option>
                    <option value="501-2000" className="bg-card">501 – 2,000</option>
                    <option value="2001-10000" className="bg-card">2,001 – 10,000</option>
                    <option value="10000+" className="bg-card">10,000+</option>
                  </select>
                </div>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your HR challenges..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors resize-none"
                />
                <button type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-2">
                  <Send size={14} /> Request Demo
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
