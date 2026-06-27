import { useTranslation } from 'react-i18next';
import { Clock, ChefHat, Truck, Package, CheckCircle } from 'lucide-react';

const STEPS = [
    { key: 'pending',          icon: Clock       },
    { key: 'preparing',        icon: ChefHat     },
    { key: 'out_for_delivery', icon: Truck       },
    { key: 'delivered',        icon: Package     },
    { key: 'paid',             icon: CheckCircle },
];

export default function OrderTimeline({ status, horizontal = false }) {
    const { t } = useTranslation();
    const currentIndex = STEPS.findIndex(s => s.key === status);

    if (horizontal) {
        return (
        <div className="flex items-start justify-between w-full overflow-x-auto">
            {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentIndex;
            const isActive    = idx === currentIndex;
            const isUpcoming  = idx > currentIndex;

            return (
                <div key={step.key} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                    <div className={`flex-1 h-0.5 ${idx === 0 ? 'invisible' : idx <= currentIndex ? 'bg-brand-400' : 'bg-gray-200'}`} />
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
                    ${isCompleted ? 'bg-brand-500' : ''}
                    ${isActive    ? 'bg-brand-500 ring-4 ring-brand-100' : ''}
                    ${isUpcoming  ? 'bg-gray-200' : ''}
                    `}>
                    <Icon className={`w-4 h-4 ${isCompleted || isActive ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className={`flex-1 h-0.5 ${idx === STEPS.length - 1 ? 'invisible' : idx < currentIndex ? 'bg-brand-400' : 'bg-gray-200'}`} />
                </div>
                <div className="text-center mt-2 px-1">
                    <p className={`font-semibold text-xs ${isUpcoming ? 'text-gray-400' : 'text-gray-900'}`}>
                    {t(`orders.timeline.${step.key}.label`)}
                    </p>
                    <p className={`text-xs mt-0.5 ${isUpcoming ? 'text-gray-300' : 'text-gray-500'} hidden sm:block`}>
                    {t(`orders.timeline.${step.key}.desc`)}
                    </p>
                </div>
                </div>
            );
            })}
        </div>
        );
    }

    return (
        <div className="flex flex-col gap-0">
        {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentIndex;
            const isActive    = idx === currentIndex;
            const isUpcoming  = idx > currentIndex;

            return (
            <div key={step.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
                    ${isCompleted ? 'bg-brand-500' : ''}
                    ${isActive    ? 'bg-brand-500 ring-4 ring-brand-100' : ''}
                    ${isUpcoming  ? 'bg-gray-200' : ''}
                `}>
                    <Icon className={`w-4 h-4 ${isCompleted || isActive ? 'text-white' : 'text-gray-400'}`} />
                </div>
                {idx < STEPS.length - 1 && (
                    <div className={`w-0.5 h-8 ${idx < currentIndex ? 'bg-brand-400' : 'bg-gray-200'}`} />
                )}
                </div>
                <div className="pb-6 text-start flex-1">
                <p className={`font-semibold text-sm ${isUpcoming ? 'text-gray-400' : 'text-gray-900'}`}>
                    {t(`orders.timeline.${step.key}.label`)}
                </p>
                <p className={`text-xs mt-0.5 ${isUpcoming ? 'text-gray-300' : 'text-gray-500'}`}>
                    {t(`orders.timeline.${step.key}.desc`)}
                </p>
                </div>
            </div>
            );
        })}
        </div>
    );
    }