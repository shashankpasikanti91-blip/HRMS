import Navbar from '../components/Navbar';
import PricingSection from '../components/PricingSection';
import TestimonialsSection from '../components/TestimonialsSection';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

const PricingPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-20">
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
    </div>
    <Footer />
  </div>
);

export default PricingPage;
