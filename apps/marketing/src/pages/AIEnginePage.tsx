import Navbar from '../components/Navbar';
import AISection from '../components/AISection';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

const AIEnginePage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-20">
      <AISection />
      <CTASection />
    </div>
    <Footer />
  </div>
);

export default AIEnginePage;
