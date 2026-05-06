    import { Star } from 'lucide-react';

    export default function StarRating({ rating, size = 'md', interactive = false, onRate }) {
    const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7', xl: 'w-8 h-8' };

    return (
        <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
            key={star}
            className={`${sizes[size]} ${
                star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 fill-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400 hover:fill-yellow-400 transition-colors' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
            />
        ))}
        </div>
    );
    }