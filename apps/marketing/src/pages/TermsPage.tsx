import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TermsPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 1, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-xl font-display font-semibold text-foreground mt-8">1. Acceptance of Terms</h2>
          <p>By accessing or using SRP AI HRMS ("Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">2. Description of Service</h2>
          <p>SRP AI HRMS is a cloud-based human resource management platform that provides AI-powered HR automation, employee management, payroll, recruitment, performance tracking, and analytics capabilities.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">3. Account Registration</h2>
          <p>You must register for an account to use the Service. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. You must provide accurate and complete information.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">4. Subscription & Billing</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Subscriptions are billed monthly per employee</li>
            <li>Payment is due at the start of each billing period</li>
            <li>You may cancel at any time; access continues until the end of the billing period</li>
            <li>No refunds for partial months</li>
            <li>Prices may change with 30 days notice</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Upload malicious code or content</li>
            <li>Resell or redistribute the Service without authorization</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">6. Data Ownership</h2>
          <p>You retain ownership of all data you upload to the Service. We claim no intellectual property rights over your content. Upon account termination, you may request a full data export.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">7. Service Level Agreement</h2>
          <p>We commit to 99.9% uptime for paid plans. Scheduled maintenance windows will be communicated in advance. Service credits may be issued for qualifying downtime events.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">8. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, SRP AI Labs shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">9. Termination</h2>
          <p>We may suspend or terminate your access if you violate these terms. You may terminate your account at any time. Upon termination, your data will be retained for 30 days before permanent deletion.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">10. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Material changes will be communicated via email or in-app notification at least 30 days before taking effect.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">11. Contact</h2>
          <p>For questions about these terms, contact <a href="mailto:legal@srpailabs.com" className="text-primary hover:underline">legal@srpailabs.com</a>.</p>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default TermsPage;
