import { Linkedin, Twitter, Github, ArrowUpRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/30 bg-card/30">
      <div className="container mx-auto px-4 md:px-8">
        {/* CTA Banner */}
        <div className="py-16 text-center border-b border-border/20">
          <h3 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Ready to Talk? Get in Touch.
          </h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Start your AI-powered HR transformation today. Our team sets up a trial environment in under 24 hours.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="https://app.hrms.srpailabs.com/register" className="btn-primary inline-flex items-center gap-2">
              Get Started Free <ArrowUpRight size={16} />
            </a>
            <a href="mailto:contact@srpailabs.com" className="btn-outline inline-flex items-center gap-2">
              <Mail size={14} /> Contact Sales
            </a>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid md:grid-cols-5 gap-10 py-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                <span className="text-white font-display font-bold text-xs">S</span>
              </div>
              <div>
                <span className="font-display text-lg font-bold text-foreground">SRP AI <span className="gradient-text">HRMS</span></span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              AI-powered Human Resource Management System by SRP AI Labs.
              From hiring to exit — fully automated, enterprise-grade.
            </p>
            <div className="flex gap-3">
              <a href="https://linkedin.com/company/srpailabs" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-all duration-300">
                <Linkedin size={16} />
              </a>
              <a href="https://twitter.com/srpailabs" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-all duration-300">
                <Twitter size={16} />
              </a>
              <a href="https://github.com/srpailabs" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-all duration-300">
                <Github size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2">
              {[
                { label: 'Core HR', href: '/#solutions' },
                { label: 'Payroll', href: '/#solutions' },
                { label: 'Recruitment & ATS', href: '/#solutions' },
                { label: 'Performance', href: '/#solutions' },
                { label: 'Analytics', href: '/#solutions' },
                { label: 'AI Engine', href: '/#ai' },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              {[
                { label: 'About SRP AI Labs', href: 'https://srpailabs.com', external: true },
                { label: 'Contact Us', href: '/#contact' },
                { label: 'Security', href: '/security', internal: true },
                { label: 'API Reference', href: 'https://api.hrms.srpailabs.com/docs', external: true },
              ].map((l) => (
                <li key={l.label}>
                  {l.internal ? (
                    <Link to={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{l.label}</Link>
                  ) : (
                    <a
                      href={l.href}
                      {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2">
              {[
                { label: 'Legal', href: '/legal' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Security Policy', href: '/security' },
                { label: 'Accessibility', href: '/legal#accessibility' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/30 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} SRP AI Labs. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
            <Link to="/legal" className="hover:text-primary transition-colors">Legal</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/legal#accessibility" className="hover:text-primary transition-colors">Accessibility</Link>
            <span>|</span>
            <span>
              A product of{' '}
              <a href="https://srpailabs.com" target="_blank" rel="noopener noreferrer" className="text-primary font-display font-semibold hover:underline">
                SRP AI Labs
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

