import { ArrowRight, Leaf, Clock, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.jpg';

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Fresh meal boxes"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--hero-overlay))/95] via-[hsl(var(--hero-overlay))/75] to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 bg-secondary/20 text-secondary-foreground px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-secondary/30">
            <Leaf className="h-4 w-4" />
            Fresh & Healthy Meals Delivered
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight font-['Poppins'] animate-slide-up">
            Delicious Meals,{' '}
            <span className="text-secondary">Zero Effort</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 leading-relaxed max-w-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Choose from our chef-crafted meal boxes, customized for your lifestyle. 
            Fresh ingredients, ready to heat, delivered to your door.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="cta" size="xl" className="group">
              Get Started
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="xl">
              View Our Boxes
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <div className="p-2 bg-primary-foreground/10 rounded-lg backdrop-blur-sm">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Ready in 5 min</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <div className="p-2 bg-primary-foreground/10 rounded-lg backdrop-blur-sm">
                <Truck className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Free Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <div className="p-2 bg-primary-foreground/10 rounded-lg backdrop-blur-sm">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">100% Fresh</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
