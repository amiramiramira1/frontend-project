    import { useSearchParams, useNavigate } from 'react-router-dom';
    import { sampleBoxes } from '../data/mockData';
    import { ChevronLeft, Check, X, Users, ChefHat, Flame, Tag, ShoppingCart, Clock, AlertTriangle, Trophy } from 'lucide-react';
    import { useCart } from '../context/CartContext';
    import { useAuth } from '../context/AuthContext';
    import toast from 'react-hot-toast';

    export default function BoxComparePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useAuth();

    const ids = searchParams.get('ids')?.split(',') || [];
    const boxes = sampleBoxes.filter(b => ids.includes(b._id));

    if (boxes.length < 2) {
        return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
            <p className="text-gray-500 mb-4">Please select at least 2 boxes to compare.</p>
            <button onClick={() => navigate('/boxes')} className="btn-primary">Browse Boxes</button>
            </div>
        </div>
        );
    }

    const handleAddToCart = async (box) => {
        if (!user) { navigate('/login'); return; }
        try {
        await addToCart({ type: 'pre-made-box', boxId: box._id, servingsPerMeal: 2 });
        toast.success(`${box.name} added to cart!`);
        } catch {
        toast.error('Failed to add to cart');
        }
    };

    // ===== Helpers للـ highlight =====
    const minPrice = Math.min(...boxes.map(b => b.startingPrice || 0));
    const minCal = Math.min(...boxes.map(b => b.pricingOptions?.[2]?.mealDetails?.[0]?.caloriesPerServing || Infinity));
    const maxMeals = Math.max(...boxes.map(b => b.mealsCount || 0));
    const minPrepTime = Math.min(...boxes.map(b => {
        const times = b.pricingOptions?.[2]?.mealDetails?.map(m => m.prepTime || 99) || [99];
        return Math.max(...times);
    }));

    const allTags = [...new Set(boxes.flatMap(b =>
        b.pricingOptions?.[2]?.mealDetails?.flatMap(m => m.dietaryTags || []) || []
    ))];

    const allAllergens = [...new Set(boxes.flatMap(b =>
        b.pricingOptions?.[2]?.mealDetails?.flatMap(m => m.allergens || []) || []
    ))];

    const rows = [
        {
        label: 'Starting Price',
        icon: <Tag className="w-4 h-4" />,
        render: (box) => {
            const isLowest = box.startingPrice === minPrice;
            return (
            <div className={`${isLowest ? 'bg-green-50 rounded-xl p-2' : ''}`}>
                {isLowest && (
                <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-semibold mb-1">
                    <Trophy className="w-3 h-3" /> Best Value
                </div>
                )}
                <span className={`text-2xl font-display font-black ${isLowest ? 'text-green-600' : 'text-brand-600'}`}>
                {(box.startingPrice || 0).toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 ml-1">EGP</span>
                <p className="text-xs text-gray-400">for 2 people</p>
            </div>
            );
        },
        },
        {
        label: 'Meals Count',
        icon: <ChefHat className="w-4 h-4" />,
        render: (box) => {
            const isMost = box.mealsCount === maxMeals;
            return (
            <div className={`${isMost ? 'bg-green-50 rounded-xl p-2' : ''}`}>
                {isMost && (
                <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-semibold mb-1">
                    <Trophy className="w-3 h-3" /> Most Meals
                </div>
                )}
                <span className={`text-lg font-bold ${isMost ? 'text-green-600' : 'text-gray-800'}`}>
                {box.mealsCount} Meals
                </span>
            </div>
            );
        },
        },
        {
        label: 'Serving Sizes',
        icon: <Users className="w-4 h-4" />,
        render: (box) => (
            <div className="flex flex-wrap gap-1 justify-center">
            {box.availableServings?.map(s => (
                <span key={s} className="text-xs bg-brand-50 text-brand-600 px-2 py-1 rounded-full font-medium">
                {s} {s === 1 ? 'person' : 'people'}
                </span>
            ))}
            </div>
        ),
        },
        {
        label: 'Category',
        icon: <Tag className="w-4 h-4" />,
        render: (box) => (
            <span className="badge bg-brand-500 text-white">{box.category}</span>
        ),
        },
        {
        label: 'Calories (per serving)',
        icon: <Flame className="w-4 h-4" />,
        render: (box) => {
            const cal = box.pricingOptions?.[2]?.mealDetails?.[0]?.caloriesPerServing;
            const isLowest = cal === minCal;
            return cal ? (
            <div className={`${isLowest ? 'bg-green-50 rounded-xl p-2' : ''}`}>
                {isLowest && (
                <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-semibold mb-1">
                    <Trophy className="w-3 h-3" /> Lowest Cal
                </div>
                )}
                <span className={`text-lg font-bold ${isLowest ? 'text-green-600' : 'text-orange-500'}`}>
                {cal} cal
                </span>
            </div>
            ) : <span className="text-gray-400 text-sm">—</span>;
        },
        },
        {
        label: 'Max Prep Time',
        icon: <Clock className="w-4 h-4" />,
        render: (box) => {
            const times = box.pricingOptions?.[2]?.mealDetails?.map(m => m.prepTime || 0) || [];
            const maxTime = Math.max(...times);
            const isFastest = maxTime === minPrepTime;
            return maxTime ? (
            <div className={`${isFastest ? 'bg-green-50 rounded-xl p-2' : ''}`}>
                {isFastest && (
                <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-semibold mb-1">
                    <Trophy className="w-3 h-3" /> Fastest
                </div>
                )}
                <span className={`text-lg font-bold ${isFastest ? 'text-green-600' : 'text-gray-800'}`}>
                {maxTime} min
                </span>
            </div>
            ) : <span className="text-gray-400 text-sm">—</span>;
        },
        },
        // Dietary Tags
        ...allTags.map(tag => ({
        label: tag.charAt(0).toUpperCase() + tag.slice(1),
        icon: null,
        render: (box) => {
            const hasTag = box.pricingOptions?.[2]?.mealDetails?.some(m => m.dietaryTags?.includes(tag));
            return hasTag
            ? <Check className="w-5 h-5 text-green-500 mx-auto" />
            : <X className="w-5 h-5 text-gray-300 mx-auto" />;
        },
        })),
        // Allergens
        ...allAllergens.map(allergen => ({
        label: `Contains ${allergen.charAt(0).toUpperCase() + allergen.slice(1)}`,
        icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
        render: (box) => {
            const hasAllergen = box.pricingOptions?.[2]?.mealDetails?.some(m => m.allergens?.includes(allergen));
            return hasAllergen
            ? <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-medium">⚠️ Yes</span>
            : <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">✓ No</span>;
        },
        })),
    ];

    return (
        <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
            <div className="page-container py-6">
            <button onClick={() => navigate('/boxes')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back to Boxes
            </button>
            <h1 className="font-display text-3xl font-bold text-gray-900">Compare Boxes</h1>
            <p className="text-gray-500 mt-1">Side-by-side comparison to help you decide</p>
            </div>
        </div>

        <div className="page-container py-8">

            {/* ===== MOBILE ===== */}
            <div className="block md:hidden space-y-6">
            {boxes.map((box) => (
                <div key={box._id} className="card overflow-hidden">
                <div className="relative">
                    <img
                    src={box.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400'}
                    alt={box.name}
                    className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-display font-black text-white text-xl">{box.name}</h3>
                    <p className="text-white/80 text-xs mt-1 line-clamp-2">{box.description}</p>
                    </div>
                    {box.startingPrice === minPrice && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Best Value
                    </div>
                    )}
                </div>

                <div className="divide-y divide-gray-100">
                    {rows.map((row, idx) => (
                    <div key={idx} className={`flex items-center justify-between px-4 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        {row.icon && <span className="text-brand-500">{row.icon}</span>}
                        {row.label}
                        </div>
                        <div className="text-right">
                        {row.render(box)}
                        </div>
                    </div>
                    ))}
                </div>

                <div className="p-4">
                    <button
                    onClick={() => handleAddToCart(box)}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                    </button>
                </div>
                </div>
            ))}
            </div>

            {/* ===== DESKTOP ===== */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[600px]">
                <thead>
                <tr>
                    <th className="w-40 text-left pb-6 pr-4">
                    <span className="text-sm font-medium text-gray-400">Features</span>
                    </th>
                    {boxes.map(box => (
                    <th key={box._id} className="pb-6 px-4">
                        <div className={`card p-4 text-center ${box.startingPrice === minPrice ? 'ring-2 ring-green-400' : ''}`}>
                        {box.startingPrice === minPrice && (
                            <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 mb-2">
                            <Trophy className="w-3 h-3" /> Best Value
                            </div>
                        )}
                        <img
                            src={box.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400'}
                            alt={box.name}
                            className="w-full h-32 object-cover rounded-xl mb-3"
                        />
                        <h3 className="font-display font-bold text-gray-900 text-base mb-1">{box.name}</h3>
                        <p className="text-xs text-gray-400 line-clamp-2 mb-3">{box.description}</p>
                        <button
                            onClick={() => handleAddToCart(box)}
                            className="btn-primary w-full text-sm py-2"
                        >
                            Add to Cart
                        </button>
                        </div>
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {rows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-4 pr-4 text-sm font-medium text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                        {row.icon && <span className="text-brand-500">{row.icon}</span>}
                        {row.label}
                        </div>
                    </td>
                    {boxes.map(box => (
                        <td key={box._id} className="py-4 px-4 text-center">
                        {row.render(box)}
                        </td>
                    ))}
                    </tr>
                ))}
                </tbody>
            </table>
            </div>

        </div>
        </div>
    );
    }