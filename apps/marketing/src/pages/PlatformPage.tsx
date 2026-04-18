import Navbar from '../components/Navbar';
import FeaturesSection from '../components/FeaturesSection';
import ModulesSection from '../components/ModulesSection';
import IntegrationsSection from '../components/IntegrationsSection';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

const PlatformPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-20">
      <FeaturesSection />
      <ModulesSection />
      <IntegrationsSection />
      <CTASection />
    </div>
    <Footer />
  </div>
);

export default PlatformPage;
