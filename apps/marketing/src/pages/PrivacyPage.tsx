import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PrivacyPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 1, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-xl font-display font-semibold text-foreground mt-8">1. Information We Collect</h2>
          <p>SRP AI HRMS ("we", "our", "us") collects information you provide directly when you register, use our services, or communicate with us. This includes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account information (name, email, organization)</li>
            <li>Employee data managed through the platform</li>
            <li>Usage data and analytics</li>
            <li>Device and browser information</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Analyze usage patterns to improve the platform</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">3. Data Security</h2>
          <p>We implement industry-standard security measures including AES-256 encryption at rest and in transit, role-based access control, multi-factor authentication, and complete audit logging. All data is stored in isolated multi-tenant environments with no cross-tenant data access.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">4. Data Retention</h2>
          <p>We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting us.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">5. Third-Party Services</h2>
          <p>We may share data with trusted third-party services (cloud hosting, payment processing, AI model providers) solely for the purpose of delivering our services. We do not sell personal data to third parties.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">6. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to access, correct, delete, or export your personal data. For GDPR, CCPA, or equivalent requests, contact us at <a href="mailto:privacy@srpailabs.com" className="text-primary hover:underline">privacy@srpailabs.com</a>.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">7. Cookies</h2>
          <p>We use essential cookies for authentication and session management. Analytics cookies are used only with your consent.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page.</p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-8">9. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, contact us at <a href="mailto:privacy@srpailabs.com" className="text-primary hover:underline">privacy@srpailabs.com</a>.</p>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default PrivacyPage;
