import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Clock, Download } from 'lucide-react';
import OrderTimeline from '../components/OrderTimeline';
import { useState } from 'react';
import { generateReceipt } from '../utils/generateReceipt';
import { useTranslation } from 'react-i18next';

export default function OrderConfirmationPage() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  if (!order) { navigate('/'); return null; }

  const deliveryDate = new Date(order.deliveryDate);
  const formatted = deliveryDate.toLocaleDateString('en-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await generateReceipt(order);
    setDownloading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* LEFT — order details */}
          <div className="card p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shrink-0">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-black text-gray-900">{t('confirm.heading')}</h1>
                <p className="text-gray-500 text-sm">{t('confirm.subheading')}</p>
              </div>
            </div>

            <div className="bg-brand-50 rounded-2xl p-5 mb-4 text-left">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-600">{t('confirm.orderNum')}</span>
                <span className="font-display font-bold text-brand-700 text-lg">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-600">{t('confirm.payment')}</span>
                <span className="badge badge-orange">{t('confirm.cod')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">{t('confirm.status')}</span>
                <span className="badge badge-blue">{t('confirm.pending')}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 mb-4 text-left">
              <h3 className="font-semibold text-gray-700 mb-3">{t('confirm.billing')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">{t('confirm.name')}</span><span className="font-medium text-gray-900">{order.customerName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('confirm.email')}</span><span className="font-medium text-gray-900">{order.customerEmail}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('confirm.phone')}</span><span className="font-medium text-gray-900">{order.deliveryAddress?.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('confirm.address')}</span><span className="font-medium text-gray-900 text-right">{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</span></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 text-sm mb-3">
                <Truck className="w-5 h-5 text-brand-500 shrink-0" />
                <div>
                  <div className="font-medium text-gray-700">{t('confirm.estDelivery')}</div>
                  <div className="text-brand-600 font-semibold">{formatted}</div>
                </div>
              </div>
              {order.timeSlot && (
                <div className="flex items-center gap-3 text-sm border-t border-gray-200 pt-3">
                  <Clock className="w-5 h-5 text-brand-500 shrink-0" />
                  <div>
                    <div className="font-medium text-gray-700">{t('confirm.timeSlot')}</div>
                    <div className="text-brand-600 font-semibold">{order.timeSlot}</div>
                  </div>
                </div>
              )}
            </div>

            <OrderTimeline status={order.status} horizontal />
          </div>

          {/* RIGHT — summary */}
          <div className="card p-8">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-5">{t('confirm.summary')}</h2>

            <div className="space-y-3 mb-6">
              {order.items?.map(item => (
                <div key={item._id} className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {item.type === 'pre-made-box' ? item.boxName : t('confirm.customBox')}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{t('confirm.qty')} {item.quantity || 1}</div>
                  </div>
                  <span className="font-semibold text-gray-900">{item.totalPrice?.toLocaleString()} EGP</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t('confirm.subtotal')}</span>
                <span>{order.totalPrice?.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t('confirm.delivery')}</span>
                <span className="text-green-600 font-medium">{t('confirm.free')}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-200">
                <span>{t('confirm.total')}</span>
                <span className="text-brand-600 text-lg">{order.totalPrice?.toLocaleString()} EGP</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link to="/dashboard/orders" className="btn-primary flex items-center justify-center gap-2">
                <Package className="w-4 h-4" /> {t('confirm.trackOrder')}
              </Link>
              <button onClick={handleDownload} disabled={downloading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors">
                <Download className="w-4 h-4" />
                {downloading ? t('confirm.genPdf') : t('confirm.download')}
              </button>
              <Link to="/boxes" className="btn-secondary text-center">{t('confirm.continue')}</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
