import Navbar from '../components/Navbar';
import SolutionsSection from '../components/SolutionsSection';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

const SolutionsPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-20">
      <SolutionsSection />
      <CTASection />
    </div>
    <Footer />
  </div>
);

export default SolutionsPage;
