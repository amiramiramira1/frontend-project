import { Package, CalendarCheck, Utensils } from 'lucide-react';

const steps = [
  {
    icon: Package,
    number: '01',
    title: 'Choose Your Box',
    description: 'Browse our selection of chef-crafted meal boxes designed for every lifestyle and dietary preference.',
  },
  {
    icon: CalendarCheck,
    number: '02',
    title: 'Set Your Schedule',
    description: 'Pick your delivery days and frequency. Pause or skip anytime with just a few clicks.',
  },
  {
    icon: Utensils,
    number: '03',
    title: 'Enjoy Fresh Meals',
    description: 'Heat, eat, and enjoy restaurant-quality meals in the comfort of your home.',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-card">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm tracking-wider uppercase mb-3 block">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 font-['Poppins']">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Getting started with Boxify is easy. Just three simple steps to healthier, 
            tastier meals without the hassle.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
              )}

              <div className="bg-background p-8 rounded-2xl border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                {/* Icon and Number */}
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-5xl font-bold text-muted-foreground/20 font-['Poppins']">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3 font-['Poppins']">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
