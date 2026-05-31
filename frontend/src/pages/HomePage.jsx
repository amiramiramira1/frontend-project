import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Users, Leaf, Star, ChevronRight, Package, Truck } from 'lucide-react';
import BoxCard from '../components/BoxCard';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { HOME_STATS } from '../constants/homeStats';

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [featuredBoxes, setFeaturedBoxes] = useState([]);
  const [recommendedBoxes, setRecommendedBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  useEffect(() => {
    api.get('/boxes', { params: { limit: 3 } })
      .then(({ data }) => setFeaturedBoxes(data.boxes || []))
      .finally(() => setLoading(false));
  }, []);

  // Fetch personalized recommendations when user is logged in
  useEffect(() => {
    if (user) {
      setLoadingRecommended(true);
      api.get('/boxes/recommended', { params: { limit: 6 } })
        .then(({ data }) => setRecommendedBoxes(data.boxes || []))
        .catch(() => {})
        .finally(() => setLoadingRecommended(false));
    }
  }, [user]);

  const features = [
    { icon: Clock,  title: t('home.feat1Title'), desc: t('home.feat1Desc') },
    { icon: Leaf,   title: t('home.feat2Title'), desc: t('home.feat2Desc') },
    { icon: Users,  title: t('home.feat3Title'), desc: t('home.feat3Desc') },
    { icon: Truck,  title: t('home.feat4Title'), desc: t('home.feat4Desc') },
  ];

  const steps = [
    { num: t('home.step1Num'), title: t('home.step1Title'), desc: t('home.step1Desc') },
    { num: t('home.step2Num'), title: t('home.step2Title'), desc: t('home.step2Desc') },
    { num: t('home.step3Num'), title: t('home.step3Title'), desc: t('home.step3Desc') },
    { num: t('home.step4Num'), title: t('home.step4Title'), desc: t('home.step4Desc') },
  ];

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
        <div className="relative page-container py-8 md:py-36">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Star className="w-4 h-4 text-brand-400 fill-brand-400" />
              <span className="text-sm font-medium">{t('home.heroBadge')}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl md:text-7xl font-black leading-tight mb-6">
              {t('home.heroTitle1')}
              <span className="block text-gradient">{t('home.heroTitle2')}</span>
            </h1>
            <p className="text-xs md:text-xl text-gray-500 mb-10 leading-relaxed">
              {t('home.heroDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/boxes" className="btn-primary text-lg flex items-center justify-center gap-2">
                {t('home.exploreBoxes')} <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/build-box" className="glass text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                {t('home.buildCustom')}
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3 md:gap-10">
              {HOME_STATS.map(({ countKey, labelKey, count }) => (
                <div key={labelKey}>
                  {/* count is passed as interpolation variable — locale controls formatting:
                      en: "{{count}}+" → "500+" | ar: "+{{count}}" → "+500" */}
                  <div className="text-3xl font-display font-bold text-brand-400">
                    {count != null ? t(countKey, { count }) : t(countKey)}
                  </div>
                  <div className="text-sm text-gray-400 mt-0.5">{t(labelKey)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RECOMMENDED FOR YOU — only for logged-in users */}
      {user && recommendedBoxes.length > 0 && (
        <section className="py-10 bg-white border-b border-gray-100">
          <div className="page-container">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                <span className="text-xl">🥕</span>
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-gray-900">Recommended for You</h2>
                <p className="text-sm text-gray-500">Based on your preferences and order history</p>
              </div>
            </div>
            {loadingRecommended ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[1,2,3].map(i => (
                  <div key={i} className="min-w-[280px] h-64 card animate-pulse bg-gray-100 rounded-2xl flex-shrink-0" />
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden -mx-4 px-4">
                {recommendedBoxes.map(box => (
                  <div key={box._id} className="min-w-[280px] flex-shrink-0">
                    <BoxCard box={box} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="py-10 bg-white">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">{t('home.whyTitle')}</h2>
            <p className="section-subtitle">{t('home.whySubtitle')}</p>
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
              <h2 className="section-title">{t('home.featuredTitle')}</h2>
              <p className="section-subtitle mt-2 text-sm">{t('home.featuredSubtitle')}</p>
            </div>
            <Link to="/boxes" className="flex items-center gap-1 text-sm whitespace-nowrap text-brand-600 font-semibold transition-all">
              {t('home.viewAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="card h-80 animate-pulse bg-gray-100 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredBoxes.map(box => <BoxCard key={box._id} box={box} />)}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/boxes" className="btn-outline">{t('home.browseAll')}</Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="pt-8 pb-10 bg-white">
        <div className="page-container">
          <div className="text-center mb-6">
            <h2 className="section-title">{t('home.howTitle')}</h2>
            <p className="section-subtitle">{t('home.howSubtitle')}</p>
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
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-black mb-4">{t('home.ctaTitle')}</h2>
          <p className="text-base md:text-xl opacity-80 mb-8">{t('home.ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <Link to="/register" className="bg-white text-brand-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-md">
                {t('home.ctaStartFree')}
              </Link>
            )}
            {user && (
              <Link to="/dashboard" className="bg-white text-brand-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-md">
                {t('home.ctaDashboard')}
              </Link>
            )}
            <Link to="/boxes" className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors">
              {t('home.ctaBrowse')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}