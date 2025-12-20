import { Link } from "react-router-dom";
import {
  ArrowRight,
  LineChart,
  Lightbulb,
  BookOpen,
  Shield,
  Sparkles,
  CheckCircle,
  Play,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AnimatedBackground } from "@/components/ui/animated-background";

const features = [
  {
    icon: <LineChart className="h-6 w-6" />,
    title: "Portfolio Tracking",
    description: "Real-time monitoring with beautiful charts and actionable insights.",
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: "AI Recommendations",
    description: "Smart investment suggestions tailored to your goals and risk profile.",
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Learn Investing",
    description: "Structured courses from fundamentals to advanced trading strategies.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Risk-Free Simulation",
    description: "Practice trading with virtual money before investing real capital.",
  },
];

const benefits = [
  "No credit card required",
  "Start with $100K virtual money",
  "AI-powered insights included",
  "Access to all courses",
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground variant="hero" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/30">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30 animate-float">
              <span className="text-xl font-bold text-primary-foreground">X</span>
            </div>
            <span className="text-xl font-bold">InvestX Labs</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login" className="btn-ghost">
              Sign in
            </Link>
            <Link to="/signup" className="btn-primary group">
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8 opacity-0 animate-in backdrop-blur-sm">
              <Sparkles className="h-4 w-4 animate-pulse" />
              AI-Powered Investment Platform
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 tracking-tight leading-[1.1] opacity-0 animate-in animate-in-delay-1">
              Learn to invest
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-info bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                with confidence
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed opacity-0 animate-in animate-in-delay-2">
              Master the markets through AI-powered insights, hands-on simulation, and structured education. Start your investment journey today.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 opacity-0 animate-in animate-in-delay-3">
              <Link to="/signup" className="btn-primary text-base px-8 py-4 rounded-2xl group">
                Start Free Trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/dashboard" className="btn-secondary text-base px-8 py-4 rounded-2xl group">
                <Play className="h-5 w-5 transition-transform group-hover:scale-110" />
                Watch Demo
              </Link>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap items-center justify-center gap-6 opacity-0 animate-in animate-in-delay-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={benefit} 
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <CheckCircle className="h-4 w-4 text-positive" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-muted/30 dark:bg-muted/10" />
        <div className="container mx-auto px-6 relative">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete platform for learning, practicing, and mastering investment strategies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="premium-card p-8 text-center group opacity-0 animate-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-6 transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-primary/30">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="glass-card p-16 text-center max-w-4xl mx-auto relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-info/5 animate-pulse-slow" />
            
            <div className="relative z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 mx-auto mb-8 shadow-lg shadow-primary/30 animate-float">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Ready to start investing?
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
                Join thousands of investors learning to build wealth through smart investing.
              </p>
              <Link to="/signup" className="btn-primary text-base px-10 py-4 rounded-2xl group">
                Create Free Account
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                <span className="text-sm font-bold text-primary-foreground">X</span>
              </div>
              <span className="font-bold">InvestX Labs</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 InvestX Labs
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
