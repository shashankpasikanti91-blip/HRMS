import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const legalDocuments = [
  {
    title: 'Terms of Service',
    description: 'The agreement that governs your use of the SRP AI HRMS platform, including subscription terms, acceptable use, and your rights as a customer.',
    link: '/terms',
    label: 'Review Terms',
    updated: 'April 5, 2026',
  },
  {
    title: 'Privacy Policy',
    description: 'How we collect, use, store, and protect your data. Includes your rights under GDPR, CCPA, and other applicable privacy regulations.',
    link: '/privacy',
    label: 'Review Privacy Policy',
    updated: 'April 5, 2026',
  },
  {
    title: 'Security Policy',
    description: 'A detailed overview of our technical and organizational security measures protecting your employee data at every layer.',
    link: '/security',
    label: 'Review Security Policy',
    updated: 'April 5, 2026',
  },
  {
    title: 'Data Processing Agreement (DPA)',
    description: 'Governs the processing of personal data on behalf of enterprise customers under GDPR Article 28. Contact us to request a signed DPA.',
    link: 'mailto:legal@srpailabs.com?subject=DPA Request - SRP AI HRMS',
    label: 'Request DPA',
    updated: 'April 5, 2026',
    external: true,
  },
];

const LegalPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">Legal</h1>
          <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
            SRP AI Labs operates with full transparency. Below you will find all legal documents governing your use of
            the SRP AI HRMS platform. If you have questions or need custom agreements (e.g., Enterprise DPA, BAA),
            contact our legal team at{' '}
            <a href="mailto:legal@srpailabs.com" className="text-primary hover:underline">legal@srpailabs.com</a>.
          </p>
        </div>

        {/* Legal documents grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {legalDocuments.map((doc) => (
            <div key={doc.title} className="glow-card p-7 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground mb-2">{doc.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{doc.description}</p>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Updated: {doc.updated}</span>
                {doc.external ? (
                  <a
                    href={doc.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-display font-semibold text-primary hover:underline flex items-center gap-1 transition-colors"
                  >
                    {doc.label} →
                  </a>
                ) : (
                  <Link
                    to={doc.link}
                    className="text-sm font-display font-semibold text-primary hover:underline flex items-center gap-1 transition-colors"
                  >
                    {doc.label} →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Compliance badges */}
        <div className="glow-card p-8 mb-10">
          <h2 className="text-xl font-display font-bold text-foreground mb-4">Compliance &amp; Certifications</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            SRP AI HRMS is architected to meet or exceed the requirements of major global compliance frameworks.
            Our security controls, data handling practices, and organizational policies are designed to align with:
          </p>
          <div className="flex flex-wrap gap-3">
            {['GDPR', 'CCPA', 'SOC2 Type II Ready', 'ISO 27001 Ready', 'HIPAA Ready', 'PDPA (India)', 'PDPL (Saudi Arabia)'].map((badge) => (
              <span key={badge} className="px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-xs font-display font-semibold text-primary uppercase tracking-wider">
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Accessibility */}
        <div id="accessibility" className="glow-card p-8 mb-10">
          <h2 className="text-xl font-display font-bold text-foreground mb-4">Accessibility</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            SRP AI Labs is committed to making the SRP AI HRMS platform accessible to all users, including those with disabilities.
            We follow the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA conformance level as our baseline target.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            If you encounter accessibility barriers while using our platform or website, please contact us:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Email: <a href="mailto:accessibility@srpailabs.com" className="text-primary hover:underline">accessibility@srpailabs.com</a></li>
            <li>We aim to respond to accessibility feedback within 5 business days</li>
            <li>We will work with you to provide access to information or functionality through alternative means</li>
          </ul>
        </div>

        {/* Open source */}
        <div className="glow-card p-8">
          <h2 className="text-xl font-display font-bold text-foreground mb-4">Third-Party Open Source Licenses</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            SRP AI HRMS is built using a combination of proprietary software and open-source components.
            Open-source libraries are used in accordance with their respective licenses (MIT, Apache 2.0, BSD, etc.).
            For a complete list of third-party licenses used in the platform, contact{' '}
            <a href="mailto:legal@srpailabs.com" className="text-primary hover:underline">legal@srpailabs.com</a>.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-border/20">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SRP AI Labs. All rights reserved. For all legal inquiries:{' '}
            <a href="mailto:legal@srpailabs.com" className="text-primary hover:underline">legal@srpailabs.com</a>
          </p>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default LegalPage;
