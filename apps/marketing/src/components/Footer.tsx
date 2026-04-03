import { Linkedin, Twitter, Github, ArrowUpRight } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border/30 bg-card/30">
      <div className="container mx-auto px-4 md:px-8">
        {/* CTA Banner */}
        <div className="py-16 text-center border-b border-border/20">
          <h3 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Ready to Experience the Future of HR?
          </h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join hundreds of companies already using SRP AI HRMS to transform their workforce management.
          </p>
          <a href="#contact" className="btn-primary inline-flex items-center gap-2">
            Start Free Trial <ArrowUpRight size={16} />
          </a>
        </div>

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
              The next-generation AI-powered Human Resource Management System by SRP AI Labs.
              More advanced than Workday, Oracle HCM & SAP SuccessFactors.
            </p>
            <div className="flex gap-3">
              {[Linkedin, Twitter, Github].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-all duration-300">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2">
              {['Core HR', 'Payroll', 'Recruitment', 'Performance', 'Analytics', 'AI Engine'].map((l) => (
                <li key={l}>
                  <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              {['About SRP AI Labs', 'Careers', 'Blog', 'Contact', 'Partners'].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2">
              {['Documentation', 'API Reference', 'Status Page', 'Privacy Policy', 'Terms of Service'].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/30 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SRP AI Labs. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>A product of</span>
            <a href="https://srpailabs.com" className="text-primary font-display font-semibold hover:underline">
              SRP AI Labs
            </a>
            <span>— 6 AI Products Live</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
