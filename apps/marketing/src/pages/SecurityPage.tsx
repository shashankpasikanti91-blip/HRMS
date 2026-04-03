import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Shield, Lock, Eye, Server, Key, FileCheck } from 'lucide-react';

const features = [
  { icon: Lock, title: 'AES-256 Encryption', desc: 'All data encrypted at rest and in transit using AES-256 encryption with TLS 1.3.' },
  { icon: Key, title: 'Multi-Factor Authentication', desc: 'TOTP-based MFA with QR codes and backup codes for all user accounts.' },
  { icon: Shield, title: 'Role-Based Access Control', desc: 'Granular permissions with role-based and attribute-based access control across all modules.' },
  { icon: Eye, title: 'Complete Audit Logging', desc: 'Every action is logged with who, what, when, and where — immutable and tamper-proof.' },
  { icon: Server, title: 'Multi-Tenant Isolation', desc: 'Complete data isolation per organization at the database level. No cross-tenant data access.' },
  { icon: FileCheck, title: 'Compliance Ready', desc: 'Architecture designed for SOC2, GDPR, HIPAA, and ISO 27001 compliance requirements.' },
];

const SecurityPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">Security at SRP AI HRMS</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Your employee data is the most sensitive asset. We built security into every layer — not bolted on as an afterthought.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((f) => (
            <div key={f.title} className="glow-card p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="glow-card p-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6">Infrastructure Security</h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">Cloud Hosting:</strong> Deployed on enterprise-grade infrastructure with automatic failover, DDoS protection, and geographic redundancy.</p>
            <p><strong className="text-foreground">Network Security:</strong> All traffic passes through Web Application Firewalls (WAF) with rate limiting, IP allowlisting, and Cloudflare protection.</p>
            <p><strong className="text-foreground">Backup & Recovery:</strong> Automated daily backups with point-in-time recovery. Backups are encrypted and stored in a separate geographic region.</p>
            <p><strong className="text-foreground">Penetration Testing:</strong> Regular third-party security assessments and automated vulnerability scanning across all services.</p>
            <p><strong className="text-foreground">Incident Response:</strong> Dedicated security team with documented incident response procedures and 24/7 monitoring.</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-12">
          {['SOC2', 'GDPR', 'ISO 27001', 'HIPAA Ready'].map((badge) => (
            <div key={badge} className="px-6 py-3 rounded-full border border-primary/20 bg-primary/5 text-sm font-display font-semibold text-primary uppercase tracking-wider">
              {badge}
            </div>
          ))}
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default SecurityPage;
