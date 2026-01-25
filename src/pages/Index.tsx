import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import FeaturedBoxes from '@/components/FeaturedBoxes';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <FeaturedBoxes />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;
