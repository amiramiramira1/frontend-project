import { Clock, ChefHat, Truck, Package, CheckCircle } from 'lucide-react';

const STEPS = [
    { key: 'pending',           label: 'Order Placed',      desc: 'Your order has been received',          icon: Clock     },
    { key: 'preparing',         label: 'Preparing',         desc: 'Fresh ingredients are being packed',    icon: ChefHat   },
    { key: 'out_for_delivery',  label: 'Out for Delivery',  desc: 'Your box is on its way to you',         icon: Truck     },
    { key: 'delivered',         label: 'Delivered',         desc: 'Your box has arrived',                  icon: Package   },
    { key: 'paid',              label: 'Payment Confirmed', desc: 'Cash on delivery collected',            icon: CheckCircle },
];

export default function OrderTimeline({ status, horizontal = false }){
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

                    {/* Top row: circle + connecting line */}
                    <div className="flex items-center w-full">
                    {/* Line before circle — hidden on first step */}
                    <div className={`flex-1 h-0.5 ${idx === 0 ? 'invisible' : idx <= currentIndex ? 'bg-brand-400' : 'bg-gray-200'}`} />

                    {/* Circle */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
                        ${isCompleted ? 'bg-brand-500' : ''}
                        ${isActive    ? 'bg-brand-500 ring-4 ring-brand-100' : ''}
                        ${isUpcoming  ? 'bg-gray-200' : ''}
                    `}>
                        <Icon className={`w-4 h-4 ${isCompleted || isActive ? 'text-white' : 'text-gray-400'}`} />
                    </div>

                    {/* Line after circle — hidden on last step */}
                    <div className={`flex-1 h-0.5 ${idx === STEPS.length - 1 ? 'invisible' : idx < currentIndex ? 'bg-brand-400' : 'bg-gray-200'}`} />
                    </div>

                    {/* Text below circle */}
                    <div className="text-center mt-2 px-1">
                    <p className={`font-semibold text-xs ${isUpcoming ? 'text-gray-400' : 'text-gray-900'}`}>
                        {step.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${isUpcoming ? 'text-gray-300' : 'text-gray-500'} hidden sm:block`}>
                        {step.desc}
                    </p>
                    </div>

                </div>
                );
            })}
            </div>
        );
    }

    {/* existing vertical layout stays exactly as is. */}
    return (
    <div className="flex flex-col gap-0">
        {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentIndex;
            const isActive    = idx === currentIndex;
            const isUpcoming  = idx > currentIndex;

        return (
            <div key={step.key} className="flex gap-4">

            {/* Left column: icon circle + connecting line */}
            <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
                ${isCompleted ? 'bg-brand-500'         : ''}
                ${isActive    ? 'bg-brand-500 ring-4 ring-brand-100' : ''}
                ${isUpcoming  ? 'bg-gray-200'          : ''}
            `}>
                <Icon className={`w-4 h-4 ${isCompleted || isActive ? 'text-white' : 'text-gray-400'}`} />
            </div>
              {/* Connecting line — hidden on the last step */}
            {idx < STEPS.length - 1 && (
                <div className={`w-0.5 h-8 ${idx < currentIndex ? 'bg-brand-400' : 'bg-gray-200'}`} />
            )}
            </div>

            {/* Right column: text */}
            <div className="pb-6 text-left">
            <p className={`font-semibold text-sm ${isUpcoming ? 'text-gray-400' : 'text-gray-900'}`}>
                {step.label}
            </p>
            <p className={`text-xs mt-0.5 ${isUpcoming ? 'text-gray-300' : 'text-gray-500'}`}>
                {step.desc}
            </p>
            </div>

        </div>
        );
    })}
    </div>
);
}