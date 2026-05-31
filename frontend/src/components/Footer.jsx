import { Link } from 'react-router-dom';
import { Package, Instagram, Twitter, Facebook, Mail, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function AccordionSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-800 md:border-none">
      <button
        className="w-full flex items-center justify-between py-4 md:py-0 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="font-semibold text-white">{title}</h4>
        <ChevronDown
          className={`w-4 h-4 md:hidden transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <ul className={`space-y-2.5 text-sm overflow-hidden transition-all duration-300 md:block
        ${isOpen ? 'max-h-40 mb-4' : 'max-h-0 md:max-h-none'}`}>
        {children}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="page-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-10">
          {/* Brand */}
          <div className="md:col-span-1 mb-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">Boxify</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-3 mb-0">
              {[Instagram, Twitter, Facebook].map((Icon, idx) => (
                <a key={idx} href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Accordion Sections */}
          <AccordionSection title={t('footer.shopTitle')}>
            <li><Link to="/boxes" className="hover:text-brand-400 transition-colors">{t('footer.allMealBoxes')}</Link></li>
            <li><Link to="/build-box" className="hover:text-brand-400 transition-colors">{t('footer.buildCustomBox')}</Link></li>
            <li><Link to="/boxes?category=Mediterranean" className="hover:text-brand-400 transition-colors">{t('footer.mediterranean')}</Link></li>
            <li><Link to="/boxes?category=Healthy" className="hover:text-brand-400 transition-colors">{t('footer.healthyOptions')}</Link></li>
          </AccordionSection>

          <AccordionSection title={t('footer.accountTitle')}>
            <li><Link to="/dashboard" className="hover:text-brand-400 transition-colors">{t('footer.myDashboard')}</Link></li>
            <li><Link to="/dashboard/orders" className="hover:text-brand-400 transition-colors">{t('footer.myOrders')}</Link></li>
            <li><Link to="/dashboard/subscriptions" className="hover:text-brand-400 transition-colors">{t('footer.subscriptions')}</Link></li>
            <li><Link to="/cart" className="hover:text-brand-400 transition-colors">{t('footer.cart')}</Link></li>
          </AccordionSection>

          <AccordionSection title={t('footer.contactTitle')}>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-400" /> hello@boxify.eg</li>
            <li className="text-gray-400">{t('footer.city')}</li>
            <li className="text-gray-400">{t('footer.deliveryDays')}</li>
          </AccordionSection>
        </div>

        <div className="border-t border-gray-800 mt-4 pt-2 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">{t('footer.copyright')}</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('footer.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}