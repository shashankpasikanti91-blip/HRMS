import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import StatsSection from '../components/StatsSection';
import WhyChooseSection from '../components/WhyChooseSection';
import ModulesSection from '../components/ModulesSection';
import AISection from '../components/AISection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorksSection from '../components/HowItWorksSection';
import ResultsSection from '../components/ResultsSection';
import SecuritySection from '../components/SecuritySection';
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
      <AboutSection />
      <StatsSection />
      <WhyChooseSection />
      <ModulesSection />
      <AISection />
      <FeaturesSection />
      <HowItWorksSection />
      <ResultsSection />
      <SecuritySection />
      <PricingSection />
      <TestimonialsSection />
      <IntegrationsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
