import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Users, Leaf, Star, ChevronRight, Package, Truck, Shield } from 'lucide-react';
import BoxCard from '../components/BoxCard';
import { useEffect, useState } from 'react';
import api from '../api/axios';

const features = [
  { icon: Clock, title: 'Save Time', desc: 'Pre-portioned ingredients, no meal planning or grocery shopping needed.' },
  { icon: Leaf, title: 'Fresh & Healthy', desc: 'Chef-curated recipes with full nutritional info and allergy filtering.' },
  { icon: Users, title: 'Flexible Sizes', desc: 'Serve 1, 2, 4, or 6 people. Perfect for singles, couples, and families.' },
  { icon: Truck, title: 'Weekly Delivery', desc: 'Fresh box delivered to your door every week, right on schedule.' },
];

const steps = [
  { num: '01', title: 'Choose a Box', desc: 'Pick from our curated meal boxes or build your own from scratch.' },
  { num: '02', title: 'Select Servings', desc: 'Choose how many people you\'re cooking for.' },
  { num: '03', title: 'We Deliver', desc: 'Fresh ingredients arrive at your door in 3-5 days.' },
  { num: '04', title: 'Cook & Enjoy', desc: 'Follow our easy recipe cards and enjoy a delicious meal.' },
];

export default function HomePage() {
  const [featuredBoxes, setFeaturedBoxes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/boxes?featured=true')
      .then(({ data }) => setFeaturedBoxes(data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative bg-hero-pattern text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1600"
            alt="Fresh ingredients"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative page-container py-24 md:py-36">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Star className="w-4 h-4 text-brand-400 fill-brand-400" />
              <span className="text-sm font-medium">Fresh Ingredients. Real Meals.</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black leading-tight mb-6">
              Cook Amazing
              <span className="block text-gradient">Meals at Home</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed">
              Pre-portioned fresh ingredients delivered weekly. Choose from our curated meal boxes or build your own. No planning, no waste, just delicious food.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/boxes" className="btn-primary text-lg flex items-center justify-center gap-2">
                Explore Meal Boxes <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/build-box" className="glass text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                Build Custom Box
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-14 flex gap-10">
              {[['500+', 'Happy Families'], ['12+', 'Fresh Meals'], ['3-5', 'Day Delivery']].map(([val, label]) => (
                <div key={label}>
                  <div className="text-3xl font-display font-bold text-brand-400">{val}</div>
                  <div className="text-sm text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">Why Choose Boxify?</h2>
            <p className="section-subtitle">Everything you need for a stress-free cooking experience</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 text-center group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7 text-brand-600" />
                </div>
                <h3 className="font-display font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED BOXES */}
      <section className="py-20 bg-gray-50">
        <div className="page-container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="section-title">Featured Boxes</h2>
              <p className="section-subtitle mt-2">Our most popular meal collections</p>
            </div>
            <Link to="/boxes" className="hidden md:flex items-center gap-2 text-brand-600 font-semibold hover:gap-3 transition-all">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="card h-80 animate-pulse bg-gray-100 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredBoxes.map(box => <BoxCard key={box._id} box={box} />)}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/boxes" className="btn-outline">Browse All Boxes</Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">How Boxify Works</h2>
            <p className="section-subtitle">From selection to your table in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={step.num} className="relative text-center">
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-brand-300 to-brand-100" />
                )}
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="font-display text-white font-black text-lg">{step.num}</span>
                </div>
                <h3 className="font-display font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-500 to-brand-700">
        <div className="page-container text-center text-white">
          <Package className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h2 className="font-display text-4xl md:text-5xl font-black mb-4">Ready to start cooking?</h2>
          <p className="text-xl opacity-80 mb-8">Join thousands of families enjoying fresh, home-cooked meals every week.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-brand-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-md">
              Get Started Free
            </Link>
            <Link to="/boxes" className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors">
              Browse Boxes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
