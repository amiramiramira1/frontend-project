import { useState } from 'react';
import { Mail, Instagram, Facebook, Twitter, Youtube, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logo from '@/assets/logo.jpeg';

const quickLinks = [
  { name: 'About Us', href: '#about' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Our Boxes', href: '#boxes' },
  { name: 'Pricing', href: '#' },
  { name: 'Gift Cards', href: '#' },
];

const supportLinks = [
  { name: 'FAQ', href: '#' },
  { name: 'Contact Us', href: '#' },
  { name: 'Shipping Info', href: '#' },
  { name: 'Privacy Policy', href: '#' },
  { name: 'Terms of Service', href: '#' },
];

const socialLinks = [
  { name: 'Instagram', icon: Instagram, href: '#' },
  { name: 'Facebook', icon: Facebook, href: '#' },
  { name: 'Twitter', icon: Twitter, href: '#' },
  { name: 'Youtube', icon: Youtube, href: '#' },
];

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    setEmail('');
  };

  return (
    <footer className="bg-[hsl(var(--footer-bg))] text-[hsl(var(--footer-foreground))]">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-6">
              <img src={logo} alt="Boxify" className="h-10 w-10 rounded-lg object-cover" />
              <span className="text-xl font-bold font-['Poppins']">Boxify</span>
            </a>
            <p className="text-[hsl(var(--footer-foreground))]/70 mb-6 leading-relaxed">
              Fresh, chef-crafted meals delivered to your door. Healthy eating made simple, 
              delicious, and convenient.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="p-2 bg-[hsl(var(--footer-foreground))]/10 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6 font-['Poppins']">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-[hsl(var(--footer-foreground))]/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-lg mb-6 font-['Poppins']">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-[hsl(var(--footer-foreground))]/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-lg mb-6 font-['Poppins']">Stay Updated</h4>
            <p className="text-[hsl(var(--footer-foreground))]/70 mb-4">
              Get exclusive offers and healthy eating tips delivered to your inbox.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[hsl(var(--footer-foreground))]/5 border-[hsl(var(--footer-foreground))]/20 text-[hsl(var(--footer-foreground))] placeholder:text-[hsl(var(--footer-foreground))]/50"
                  required
                />
              </div>
              <Button type="submit" variant="default" className="w-full group">
                Subscribe
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-[hsl(var(--footer-foreground))]/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[hsl(var(--footer-foreground))]/60">
              © {new Date().getFullYear()} Boxify. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-[hsl(var(--footer-foreground))]/60 hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-[hsl(var(--footer-foreground))]/60 hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-[hsl(var(--footer-foreground))]/60 hover:text-primary transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
