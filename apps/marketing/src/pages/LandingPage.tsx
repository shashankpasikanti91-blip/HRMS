import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import MarqueeSection from '../components/MarqueeSection';
import StatsSection from '../components/StatsSection';
import AboutSection from '../components/AboutSection';
import WhyChooseSection from '../components/WhyChooseSection';
import FeaturesSection from '../components/FeaturesSection';
import AISection from '../components/AISection';
import SecuritySection from '../components/SecuritySection';
import ModulesSection from '../components/ModulesSection';
import PricingSection from '../components/PricingSection';
import TestimonialsSection from '../components/TestimonialsSection';
import IntegrationsSection from '../components/IntegrationsSection';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <MarqueeSection />
      <StatsSection />
      <AboutSection />
      <WhyChooseSection />
      <FeaturesSection />
      <AISection />
      <ModulesSection />
      <SecuritySection />
      <PricingSection />
      <IntegrationsSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
