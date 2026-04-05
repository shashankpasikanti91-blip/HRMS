import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-2">Last updated: April 5, 2026</p>
        <p className="text-sm text-muted-foreground mb-10">
          Effective date: April 5, 2026 · SRP AI Labs · contact: <a href="mailto:privacy@srpailabs.com" className="text-primary hover:underline">privacy@srpailabs.com</a>
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">

          <p>
            SRP AI Labs ("we", "our", "us") operates the SRP AI HRMS platform ("Service") at{' '}
            <a href="https://hrms.srpailabs.com" className="text-primary hover:underline">hrms.srpailabs.com</a> and{' '}
            <a href="https://app.hrms.srpailabs.com" className="text-primary hover:underline">app.hrms.srpailabs.com</a>.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
            Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">1. Information We Collect</h2>
          <h3 className="text-base font-display font-semibold text-foreground/90 mt-4">1.1 Information You Provide Directly</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account registration data (name, email address, organization name, job title)</li>
            <li>Employee records entered or imported into the platform</li>
            <li>Payroll and compensation data</li>
            <li>Performance reviews, goals, and feedback</li>
            <li>Recruitment and candidate information</li>
            <li>Documents uploaded to the document vault</li>
            <li>Support requests and correspondence</li>
          </ul>
          <h3 className="text-base font-display font-semibold text-foreground/90 mt-4">1.2 Automatically Collected Information</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Log data (IP address, browser type, pages visited, timestamps)</li>
            <li>Device information (operating system, device type)</li>
            <li>Usage patterns and feature interaction data</li>
            <li>Session identifiers and authentication tokens</li>
          </ul>
          <h3 className="text-base font-display font-semibold text-foreground/90 mt-4">1.3 Information from Third Parties</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Single sign-on identity providers (Google, Microsoft) if enabled</li>
            <li>HR integrations and connected data sources you authorize</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide, operate, and maintain the Service</li>
            <li>Process payroll, attendance, and HR transactions on your behalf</li>
            <li>Power AI features including resume screening, attrition prediction, and the HR chatbot</li>
            <li>Send system notifications, authentication codes, and service alerts</li>
            <li>Respond to support requests and inquiries</li>
            <li>Improve platform performance, detect bugs, and develop new features</li>
            <li>Generate aggregated, anonymized analytics about platform usage</li>
            <li>Comply with legal obligations and enforce our policies</li>
          </ul>
          <p className="mt-2">
            We do <strong className="text-foreground">not</strong> sell, rent, or trade your personal data to any third party for marketing purposes.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">3. Legal Basis for Processing (GDPR)</h2>
          <p>For users in the European Economic Area (EEA) and United Kingdom, we process personal data under the following legal bases:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Contract performance:</strong> Processing necessary to deliver the Service you subscribed to</li>
            <li><strong className="text-foreground">Legitimate interests:</strong> Improving the Service, security monitoring, fraud prevention</li>
            <li><strong className="text-foreground">Legal obligation:</strong> Compliance with applicable laws and regulations</li>
            <li><strong className="text-foreground">Consent:</strong> Analytics cookies and non-essential communications (withdrawable at any time)</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">4. Data Sharing and Disclosure</h2>
          <p>We share data only in the following circumstances:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Infrastructure providers:</strong> Cloud hosting (Hetzner) and database services under contractual data protection obligations</li>
            <li><strong className="text-foreground">AI model providers:</strong> Anonymized or pseudonymized inputs processed for AI features; no raw personal data is stored by model providers</li>
            <li><strong className="text-foreground">Payment processors:</strong> Billing data is handled exclusively by certified payment processors; we do not store card information</li>
            <li><strong className="text-foreground">Legal requirements:</strong> When required by law, court order, or to protect our legal rights</li>
            <li><strong className="text-foreground">Business transfers:</strong> In the event of a merger, acquisition, or asset sale, with prior notice to affected users</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">5. Data Security</h2>
          <p>We implement industry-leading security measures to protect your data:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>AES-256 encryption at rest and TLS 1.3 in transit</li>
            <li>Complete multi-tenant data isolation — no cross-tenant data access is architecturally possible</li>
            <li>Role-based access control (RBAC) with principle of least privilege</li>
            <li>Multi-factor authentication (MFA) support</li>
            <li>Comprehensive audit logging of all data access and mutations</li>
            <li>Regular security reviews and penetration testing</li>
          </ul>
          <p className="mt-2">
            Despite our measures, no transmission over the Internet is 100% secure. If you become aware of a security incident, please contact{' '}
            <a href="mailto:security@srpailabs.com" className="text-primary hover:underline">security@srpailabs.com</a> immediately.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">6. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as necessary to provide the Service.
            Upon account termination:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Active data is retained for 30 days to allow data export requests</li>
            <li>Backups containing your data are purged within 90 days of account closure</li>
            <li>Audit logs are retained for 7 years to comply with applicable financial and employment regulations</li>
            <li>You may request immediate deletion of personal data subject to legal retention obligations</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">7. International Data Transfers</h2>
          <p>
            Our servers are located in the EU (Hetzner, Germany). If you access the Service from outside the EEA,
            your data may be transferred to and processed in the EU. For transfers from the EEA to other countries,
            we rely on Standard Contractual Clauses (SCCs) approved by the European Commission where applicable.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">8. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the following rights:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong className="text-foreground">Rectification:</strong> Request correction of inaccurate or incomplete data</li>
            <li><strong className="text-foreground">Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
            <li><strong className="text-foreground">Portability:</strong> Request export of your data in a machine-readable format</li>
            <li><strong className="text-foreground">Objection:</strong> Object to processing based on legitimate interests</li>
            <li><strong className="text-foreground">Restriction:</strong> Request restriction of processing in certain circumstances</li>
            <li><strong className="text-foreground">Withdraw consent:</strong> Withdraw consent at any time where processing is consent-based</li>
          </ul>
          <p className="mt-2">
            For GDPR, CCPA, PDPA, or equivalent requests, contact{' '}
            <a href="mailto:privacy@srpailabs.com" className="text-primary hover:underline">privacy@srpailabs.com</a>.
            We will respond within 30 days (GDPR) or 45 days (CCPA).
          </p>
          <p>
            EEA residents have the right to lodge a complaint with their local data protection authority.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">9. Cookies and Tracking</h2>
          <p>We use the following types of cookies:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Essential cookies:</strong> Required for authentication, session management, and security. Cannot be disabled.</li>
            <li><strong className="text-foreground">Functional cookies:</strong> Remember your preferences (e.g., language, theme). Enabled by default.</li>
            <li><strong className="text-foreground">Analytics cookies:</strong> Aggregate, anonymized usage statistics. Disabled by default — require your consent.</li>
          </ul>
          <p className="mt-2">
            You can manage your cookie preferences at any time. To opt out of analytics tracking, adjust your browser settings or contact us.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">10. Children's Privacy</h2>
          <p>
            The Service is not directed to individuals under 16 years of age. We do not knowingly collect personal data
            from children. If you believe a child has provided us with personal data, please contact us immediately.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">11. California Privacy Rights (CCPA)</h2>
          <p>
            California residents have additional rights under the California Consumer Privacy Act (CCPA), including the right
            to know what personal information is collected, the right to delete, and the right to opt out of the sale of
            personal information. We do not sell personal information. To exercise your rights, contact{' '}
            <a href="mailto:privacy@srpailabs.com" className="text-primary hover:underline">privacy@srpailabs.com</a>.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Material changes will be communicated via email to registered
            account holders and via an in-app notification at least 30 days before taking effect. The "Last updated"
            date at the top of this page reflects the most recent revision. Continued use of the Service after changes
            take effect constitutes acceptance of the revised policy.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">13. Data Protection Officer & Contact</h2>
          <p>
            For all privacy-related questions, requests, or concerns, contact our Data Protection team:
          </p>
          <ul className="list-none pl-0 space-y-1 mt-2">
            <li>📧 Email: <a href="mailto:privacy@srpailabs.com" className="text-primary hover:underline">privacy@srpailabs.com</a></li>
            <li>🌐 Website: <a href="https://srpailabs.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">srpailabs.com</a></li>
            <li>📮 SRP AI Labs — Hyderabad, Telangana, India</li>
          </ul>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default PrivacyPage;

