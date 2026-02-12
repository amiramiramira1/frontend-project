import { Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

/**
 * @typedef {Object} Review
 * @property {number} id - Unique identifier for the review
 * @property {string} name - Name of the reviewer
 * @property {number} rating - Rating from 1-5
 * @property {string} comment - Review text
 * @property {string} date - Date of the review
 * @property {string} avatar - URL to reviewer's avatar
 */

/**
 * @typedef {Object} BoxReviewsProps
 * @property {number} rating - Average rating
 * @property {number} reviewCount - Total number of reviews
 * @property {Review[]} reviews - Array of review objects
 */

/**
 * @param {BoxReviewsProps} props
 */
const BoxReviews = ({ rating, reviewCount, reviews }) => {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-4xl font-bold text-foreground">{rating}</span>
          <div className="flex flex-col">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(rating)
                      ? 'fill-secondary text-secondary'
                      : 'text-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{reviewCount} reviews</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id}>
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {review.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold text-foreground">{review.name}</span>
                  <span className="text-sm text-muted-foreground">{review.date}</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < review.rating
                          ? 'fill-secondary text-secondary'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground">{review.comment}</p>
              </div>
            </div>
            <Separator className="mt-6" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoxReviews;
