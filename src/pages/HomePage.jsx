import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Clock, Users, Leaf, Star, ChevronRight, Package, Truck, ChevronLeft, CheckCircle } from 'lucide-react';
import BoxCard from '../components/BoxCard';
import { useEffect, useState, useRef } from 'react';
import { sampleBoxes } from '../data/mockData';

const features = [
  { icon: Clock, title: 'Save Time', desc: 'Pre-portioned ingredients, no meal planning or grocery shopping needed.' },
  { icon: Leaf, title: 'Fresh & Healthy', desc: 'Chef-curated recipes with full nutritional info and allergy filtering.' },
  { icon: Users, title: 'Flexible Sizes', desc: 'Serve 1, 2, 4, or 6 people. Perfect for singles, couples, and families.' },
  { icon: Truck, title: 'Weekly Delivery', desc: 'Fresh box delivered to your door every week, right on schedule.' },
];

const steps = [
  { num: '01', title: 'Choose a Box', desc: 'Pick from our curated meal boxes or build your own from scratch.' },
  { num: '02', title: 'Select Servings', desc: "Choose how many people you're cooking for." },
  { num: '03', title: 'We Deliver', desc: 'Fresh ingredients arrive at your door in 3-5 days.' },
  { num: '04', title: 'Cook & Enjoy', desc: 'Follow our easy recipe cards and enjoy a delicious meal.' },
];

const testimonials = [
  { name: 'Sara Ahmed', avatar: 'https://i.pravatar.cc/150?img=47', text: 'Amazing quality! Fresh ingredients delivered every week. My family absolutely loves it!', stars: 5, date: 'April 2025', source: 'Google' },
  { name: 'Mohamed Ali', avatar: 'https://i.pravatar.cc/150?img=12', text: 'Saves me so much time. The recipes are easy and the food is always delicious!', stars: 5, date: 'March 2025', source: 'Google' },
  { name: 'Nour Hassan', avatar: 'https://i.pravatar.cc/150?img=32', text: 'Best meal kit service in Egypt. Highly recommend to everyone!', stars: 5, date: 'March 2025', source: 'Google' },
];

const stats = [
  { value: 500, suffix: '+', label: 'Happy Families', icon: '👨‍👩‍👧' },
  { value: 10, suffix: '+', label: 'Fresh Meals Weekly', icon: '🥗' },
  { value: 4, suffix: '', label: 'Cities Covered', icon: '📍' },
  { value: 98, suffix: '%', label: 'Satisfaction Rate', icon: '⭐' },
];

function useCountUp(target, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ value, suffix, label, icon }) {
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const count = useCountUp(value, 1500, started);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-4 text-center text-white">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-display font-black mb-1">{count}{suffix}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function HomePage() {
  const [featuredBoxes, setFeaturedBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setFeaturedBoxes(sampleBoxes.filter(b => b.featured).slice(0, 3));
      setLoading(false);
    }, 300);
  }, []);

  const prevTestimonial = () => setCurrentTestimonial(prev => (prev + testimonials.length - 1) % testimonials.length);
  const nextTestimonial = () => setCurrentTestimonial(prev => (prev + 1) % testimonials.length);

  const handleSubscribe = () => {
    if (!email.trim()) { setEmailError('Please enter your email address.'); return; }
    if (!validateEmail(email)) { setEmailError('Please enter a valid email address.'); return; }
    setEmailError('');
    setSubscribed(true);
    setEmail('');
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  return (
    <div className="min-h-screen">
      <Helmet>
  <title>Boxify — Fresh Meal Kits Delivered to Your Door</title>
  <meta name="description" content="Pre-portioned fresh ingredients delivered weekly. Choose from our curated meal boxes or build your own. No planning, no waste, just delicious food." />
  <meta property="og:title" content="Boxify — Fresh Meal Kits Delivered" />
  <meta property="og:description" content="Fresh meal kits delivered to your door in Egypt. Cook amazing meals at home with pre-portioned ingredients." />
  <script type="application/ld+json">{JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Boxify",
    "description": "Fresh meal kits delivered to your door in Egypt",
    "url": "https://boxify.com"
  })}</script>
</Helmet>

      {/* HERO */}
      <section className="relative bg-hero-pattern text-white overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1600" alt="Fresh ingredients" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="relative page-container py-8 md:py-36">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Star className="w-4 h-4 text-brand-400 fill-brand-400" />
              <span className="text-sm font-medium">Fresh Ingredients. Real Meals.</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl md:text-7xl font-black leading-tight mb-6">
              Cook Amazing
              <span className="block text-gradient">Meals at Home</span>
            </h1>
            <p className="text-xs md:text-xl text-gray-500 mb-10 leading-relaxed">
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
            <div className="mt-10 flex flex-wrap gap-3 md:gap-10">
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
      <section className="py-10 bg-white">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">Why Choose Boxify?</h2>
            <p className="section-subtitle">Everything you need for a stress-free cooking experience</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-4 text-center group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-display font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED BOXES */}
      <section className="pt-6 pb-4 bg-gray-50">
        <div className="page-container">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Featured Boxes</h2>
              <p className="section-subtitle mt-2 text-sm">Most popular collections</p>
            </div>
            <Link to="/boxes" className="flex items-center gap-1 text-sm whitespace-nowrap text-brand-600 font-semibold transition-all">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="card h-80 animate-pulse bg-gray-100 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredBoxes.map(box => <BoxCard key={box._id} box={box} />)}
            </div>
          )}
          <div className="text-center mt-8">
            <Link to="/boxes" className="btn-outline">Browse All Boxes</Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-10 bg-white">
        <div className="page-container">
          <div className="text-center mb-8">
            <h2 className="section-title">Our Numbers</h2>
            <p className="section-subtitle">Trusted by hundreds of families across Egypt</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ value, suffix, label, icon }) => (
              <StatCard key={label} value={value} suffix={suffix} label={label} icon={icon} />
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-10 bg-gray-50">
        <div className="page-container">
          <div className="text-center mb-8">
            <h2 className="section-title">What Customers Say</h2>
            <p className="section-subtitle">Real reviews from real people</p>
          </div>
          <div className="max-w-xl mx-auto">
            <div className="card p-6">
              <div className="text-4xl text-brand-500 font-serif leading-none mb-3">"</div>
              <p className="text-gray-600 text-base leading-relaxed mb-6">{testimonials[currentTestimonial].text}</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div className="w-10 h-10 bg-brand-100 rounded-full items-center justify-center hidden flex-shrink-0">
                    <span className="font-bold text-brand-600">{testimonials[currentTestimonial].name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900 whitespace-nowrap">{testimonials[currentTestimonial].name}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <CheckCircle className="w-3 h-3" /> Verified buyer
                      </span>
                    </div>
                    <div className="text-brand-500 text-sm">{'★'.repeat(testimonials[currentTestimonial].stars)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{testimonials[currentTestimonial].date} · via {testimonials[currentTestimonial].source}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={prevTestimonial} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-brand-400 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button onClick={nextTestimonial} className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center hover:bg-brand-600 transition-colors">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1.5 justify-center mt-4">
                {testimonials.map((_, idx) => (
                  <div key={idx} onClick={() => setCurrentTestimonial(idx)} className={`h-1.5 rounded-full cursor-pointer transition-all ${idx === currentTestimonial ? 'w-6 bg-brand-500' : 'w-1.5 bg-gray-300'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="pt-8 pb-10 bg-white">
        <div className="page-container">
          <div className="text-center mb-6">
            <h2 className="section-title">How Boxify Works</h2>
            <p className="section-subtitle">From selection to your table in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
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
      <section className="py-10 bg-gradient-to-br from-brand-500 to-brand-700">
        <div className="page-container text-center text-white">
          <Package className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-black mb-4">Ready to start cooking?</h2>
          <p className="text-base md:text-xl opacity-80 mb-8">Join thousands of families enjoying fresh, home-cooked meals every week.</p>
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

      {/* NEWSLETTER */}
      <section className="py-10 bg-gray-900">
        <div className="page-container text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-white mb-2">Stay in the loop</h2>
          <p className="text-gray-400 mb-6">Get weekly meal inspiration & exclusive offers</p>
          {subscribed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg">Thanks for subscribing! 🎉</p>
              <p className="text-gray-400 text-sm">You'll receive our next weekly update soon.</p>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={handleEmailChange}
                    onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-gray-500 focus:outline-none transition-colors ${emailError ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-brand-400'}`}
                  />
                  {emailError && (
                    <p className="text-red-400 text-xs mt-1.5 text-left flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 12 12">
                        <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
                        <path d="M6 4v3M6 8.5v.5" stroke="currentColor" strokeLinecap="round" />
                      </svg>
                      {emailError}
                    </p>
                  )}
                </div>
                <button onClick={handleSubscribe} className="btn-primary px-6 py-3 whitespace-nowrap self-start">
                  Subscribe
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}