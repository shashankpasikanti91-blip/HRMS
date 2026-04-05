import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TermsPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-2">Last updated: April 5, 2026</p>
        <p className="text-sm text-muted-foreground mb-10">
          These Terms constitute a binding agreement between you and SRP AI Labs. Questions:{' '}
          <a href="mailto:legal@srpailabs.com" className="text-primary hover:underline">legal@srpailabs.com</a>
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">1. Acceptance of Terms</h2>
          <p>
            By accessing, activating, or using SRP AI HRMS ("Service"), you ("Customer") agree to be bound by these
            Terms of Service ("Terms"). If you are accepting on behalf of an organization, you represent that you have
            the authority to bind that organization. If you do not accept these Terms, do not use the Service.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">2. Description of Service</h2>
          <p>
            SRP AI HRMS is a cloud-based, multi-tenant human resource management platform that provides AI-powered
            HR automation, employee lifecycle management, payroll processing, recruitment (ATS), attendance tracking,
            performance management, analytics, and related AI services. The Service is operated by SRP AI Labs
            and hosted at <a href="https://app.hrms.srpailabs.com" className="text-primary hover:underline">app.hrms.srpailabs.com</a>.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">3. Account Registration & Security</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must provide accurate, complete, and current registration information</li>
            <li>You are responsible for maintaining the confidentiality of your credentials</li>
            <li>You are responsible for all activities that occur under your account</li>
            <li>You must immediately notify us of any unauthorized access or security breach</li>
            <li>You may not share login credentials or allow multiple users to share a single account</li>
            <li>We reserve the right to require password resets or session revocations for security purposes</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">4. Subscription Plans & Billing</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Subscriptions are billed monthly on a per-employee basis</li>
            <li>Payment is due at the start of each billing cycle</li>
            <li>Prices are in USD unless otherwise stated; applicable taxes may apply</li>
            <li>You may cancel at any time; access continues until the end of the current billing period</li>
            <li>No refunds are issued for partial months or unused features</li>
            <li>Price changes will be communicated with at least 30 days' notice</li>
            <li>Enterprise contracts are subject to separate order forms and SOWs</li>
            <li>Overdue accounts may result in service suspension after 14 days' notice</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">5. Acceptable Use Policy</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violate any applicable law, regulation, or third-party rights</li>
            <li>Process data of individuals without proper legal basis or consent</li>
            <li>Attempt to reverse engineer, decompile, or disassemble the Service</li>
            <li>Conduct automated scraping, crawling, or unauthorized data extraction</li>
            <li>Introduce malware, viruses, or other malicious code</li>
            <li>Attempt to bypass authentication or access controls</li>
            <li>Resell, sublicense, or redistribute the Service without prior written consent</li>
            <li>Use the Service to build a competing product</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">6. Data Ownership & Processing</h2>
          <p>
            You retain full ownership of all Customer Data uploaded to the Service. By using the Service, you grant SRP AI Labs
            a limited, non-exclusive license to process your data solely for the purpose of providing the Service as described herein.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>We act as a data processor on your behalf for personal data you manage in the platform</li>
            <li>You are the data controller and are responsible for establishing a lawful basis for processing</li>
            <li>You may request a full data export at any time from your account settings</li>
            <li>Upon account termination, your data is retained for 30 days for export, then permanently deleted</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">7. Service Level Agreement (SLA)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Uptime commitment:</strong> 99.9% monthly uptime for paid plans (excludes scheduled maintenance)</li>
            <li><strong className="text-foreground">Scheduled maintenance:</strong> Communicated at least 48 hours in advance via email and in-app notification</li>
            <li><strong className="text-foreground">Service credits:</strong> Downtime exceeding SLA thresholds may entitle you to pro-rated service credits upon written request</li>
            <li><strong className="text-foreground">Support response times:</strong> Business (24h), Professional (8h), Enterprise (2h) for critical issues</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">8. Intellectual Property</h2>
          <p>
            The Service, including all software, AI models, algorithms, designs, content, and documentation, is the exclusive
            intellectual property of SRP AI Labs and its licensors. These Terms do not grant you any ownership rights in the Service.
            All feedback, suggestions, or ideas you share regarding the Service may be used by us without obligation or compensation.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">9. Confidentiality</h2>
          <p>
            Each party agrees to keep confidential any non-public information disclosed by the other party that is designated
            as confidential or that reasonably should be understood to be confidential. Confidentiality obligations survive
            termination of these Terms for a period of 3 years.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">10. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
            BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, SRP AI LABS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS INTERRUPTION,
            ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF SUCH DAMAGES.
            OUR TOTAL CUMULATIVE LIABILITY SHALL NOT EXCEED THE FEES PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless SRP AI Labs and its officers, directors, employees, and agents
            from any claims, liabilities, damages, losses, or expenses arising from your use of the Service, your violation
            of these Terms, or your violation of any third-party rights.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">13. Termination</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You may terminate your account at any time via account settings or by contacting support</li>
            <li>We may suspend or terminate your access immediately upon material breach of these Terms</li>
            <li>We may terminate the Service for any user with 30 days' notice</li>
            <li>Upon termination, all licenses granted to you cease immediately</li>
            <li>Sections 8, 9, 10, 11, 12, and 15 survive termination</li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">14. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Material changes will be communicated via email
            at least 30 days before taking effect. Continued use of the Service after changes take effect constitutes
            acceptance of the revised Terms.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">15. Governing Law & Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to
            conflict of law principles. Any dispute arising under these Terms shall first be subject to good-faith
            negotiation between the parties. If unresolved within 30 days, disputes shall be submitted to binding
            arbitration in Hyderabad, Telangana, India under applicable arbitration rules.
          </p>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">16. General</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Entire agreement:</strong> These Terms, together with the Privacy Policy and any Order Forms, constitute the entire agreement between the parties</li>
            <li><strong className="text-foreground">Severability:</strong> If any provision is found invalid, the remaining provisions continue in full force</li>
            <li><strong className="text-foreground">Waiver:</strong> Failure to enforce any provision does not constitute a waiver of future enforcement</li>
            <li><strong className="text-foreground">Assignment:</strong> You may not assign these Terms without our written consent; we may assign them in connection with a merger or acquisition</li>
            <li><strong className="text-foreground">Notices:</strong> Legal notices should be sent to <a href="mailto:legal@srpailabs.com" className="text-primary hover:underline">legal@srpailabs.com</a></li>
          </ul>

          <h2 className="text-xl font-display font-semibold text-foreground mt-10">17. Contact</h2>
          <p>
            For questions about these Terms, contact our Legal team at{' '}
            <a href="mailto:legal@srpailabs.com" className="text-primary hover:underline">legal@srpailabs.com</a> or write to:
            SRP AI Labs, Hyderabad, Telangana, India.
          </p>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default TermsPage;

