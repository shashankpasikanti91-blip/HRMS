import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import SecurityPage from './pages/SecurityPage';
import LegalPage from './pages/LegalPage';
import SolutionsPage from './pages/SolutionsPage';
import AIEnginePage from './pages/AIEnginePage';
import PlatformPage from './pages/PlatformPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/solutions" element={<SolutionsPage />} />
      <Route path="/ai" element={<AIEnginePage />} />
      <Route path="/platform" element={<PlatformPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/legal" element={<LegalPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;
