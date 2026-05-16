import { Link } from 'react-router-dom';
import {
  ArrowRight01Icon,
  PackageIcon,
  WarehouseIcon,
  Analytics01Icon,
  ShoppingBasket01Icon,
  MagicWand01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-xl">
              <PackageIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight font-heading">StockPro</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" className="hidden md:flex">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" className="rounded-full px-6 shadow-app-subtle shadow-primary/20">
                Get Started
                <ArrowRight01Icon className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border/50 text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            New: Multi-warehouse optimization is live
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight font-heading mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Next-Gen <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent italic">
              Inventory
            </span> Mastery
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            Effortlessly manage stock, warehouses, and procurement with our industry-leading platform designed for speed and reliability.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
            <Link to="/login">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-app-subtle shadow-primary/30 group">
                Start Free Trial
                <MagicWand01Icon className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<PackageIcon className="w-6 h-6" />}
              title="Smart Tracking"
              description="Real-time SKU monitoring with automated reorder alerts and low-stock predictions."
            />
            <FeatureCard
              icon={<WarehouseIcon className="w-6 h-6" />}
              title="Multi-Warehouse"
              description="Seamlessly manage inventory across multiple locations with intelligent transfers."
            />
            <FeatureCard
              icon={<ShoppingBasket01Icon className="w-6 h-6" />}
              title="Procurement"
              description="Automated purchase orders and supplier management with approval workflows."
            />
            <FeatureCard
              icon={<Analytics01Icon className="w-6 h-6" />}
              title="Live Analytics"
              description="Gain deep insights into stock movements, valuation, and performance metrics."
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-8">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* These would be logos in a real app */}
            <span className="text-2xl font-bold italic">LOGITECH</span>
            <span className="text-2xl font-bold italic">STEELSERIES</span>
            <span className="text-2xl font-bold italic">RAZER</span>
            <span className="text-2xl font-bold italic">CORSAIR</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <PackageIcon className="w-5 h-5 text-primary" />
            <span className="font-bold">StockPro</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 StockPro Systems. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 rounded-3xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-app-hover transition-all duration-500 group">
    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 font-heading">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>
);
