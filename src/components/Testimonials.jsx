import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    role: 'Busy Professional',
    content: 'Boxify has completely changed my relationship with food. I no longer stress about meal prep or eating healthy. The meals are delicious and so convenient!',
    rating: 5,
    avatar: 'SM',
  },
  {
    id: 2,
    name: 'James Rodriguez',
    role: 'Fitness Enthusiast',
    content: 'The Protein Plus box is perfect for my training schedule. Great macros, amazing taste, and it saves me hours every week. Highly recommend!',
    rating: 5,
    avatar: 'JR',
  },
  {
    id: 3,
    name: 'Emily Chen',
    role: 'Working Mom',
    content: 'With two kids and a full-time job, Boxify is a lifesaver. The whole family loves the Mediterranean box. Fresh, healthy, and zero cooking stress!',
    rating: 5,
    avatar: 'EC',
  },
];

const Testimonials = () => {
  return (
    <section id="about" className="py-20 lg:py-28 bg-accent/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm tracking-wider uppercase mb-3 block">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 font-['Poppins']">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of happy customers who have transformed their eating habits with Boxify.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="bg-card p-8 rounded-2xl border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote Icon */}
              <div className="mb-6">
                <Quote className="h-10 w-10 text-primary/20" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-secondary text-secondary" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground/90 leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-foreground font-['Poppins']">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '50K+', label: 'Happy Customers' },
            { value: '1M+', label: 'Meals Delivered' },
            { value: '4.9', label: 'Average Rating' },
            { value: '98%', label: 'Satisfaction Rate' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2 font-['Poppins']">
                {stat.value}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
