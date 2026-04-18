import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Phone } from 'lucide-react';
import Navbar from '../components/Navbar';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

const ContactPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <div className="text-center mb-12">
          <p className="text-xs font-medium tracking-widest uppercase text-primary mb-4">GET IN TOUCH</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">Contact <span className="gradient-text">SRP AI Labs</span></h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about SRP AI HRMS? Our team is ready to help you transform your HR operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gradient-primary)' }}>
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">Email Us</h3>
            <p className="text-sm text-muted-foreground mb-3">For sales, support, and general inquiries</p>
            <a href="mailto:contact@srpailabs.com" className="text-primary hover:underline text-sm font-medium">contact@srpailabs.com</a>
          </div>

          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gradient-primary)' }}>
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">Live Chat</h3>
            <p className="text-sm text-muted-foreground mb-3">Chat with our AI assistant 24/7</p>
            <a href="https://app.hrms.srpailabs.com" className="text-primary hover:underline text-sm font-medium">Start a conversation →</a>
          </div>

          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gradient-primary)' }}>
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">Call Us</h3>
            <p className="text-sm text-muted-foreground mb-3">Mon–Fri, 9 AM–6 PM IST</p>
            <a href="tel:+919000000000" className="text-primary hover:underline text-sm font-medium">+91 90000 00000</a>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">Send Us a Message</h2>
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); window.location.href = 'mailto:contact@srpailabs.com'; }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <input type="text" placeholder="Your name" required className="w-full px-4 py-2.5 rounded-lg bg-background/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Work Email</label>
                <input type="email" placeholder="you@company.com" required className="w-full px-4 py-2.5 rounded-lg bg-background/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Company</label>
              <input type="text" placeholder="Your company name" className="w-full px-4 py-2.5 rounded-lg bg-background/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
              <textarea rows={4} placeholder="Tell us how we can help…" required className="w-full px-4 py-2.5 rounded-lg bg-background/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none" />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-95" style={{ background: 'var(--gradient-primary)' }}>
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
    <CTASection />
    <Footer />
  </div>
);

export default ContactPage;
