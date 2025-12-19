import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3 } from "lucide-react";
import authGradientWave from "@/assets/auth-gradient-wave.png";

const features = [
  {
    icon: Zap,
    title: "Schedule Everywhere",
    description: "Publish to all major social platforms from one dashboard.",
  },
  {
    icon: Shield,
    title: "Team Collaboration",
    description: "Approval workflows and role-based access for your team.",
  },
  {
    icon: BarChart3,
    title: "Powerful Analytics",
    description: "Track performance and optimize your social strategy.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Zap className="h-4 w-4" />
                Social Media Management Made Easy
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Manage All Your
                <span className="text-primary"> Social Media </span>
                in One Place
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl">
                Ranblitz helps teams create, schedule, and analyze social media content across all platforms. Save time and grow your audience with powerful collaboration tools.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" asChild>
                  <Link to="/signup">
                    Start Free Trial
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link to="/login">Watch Demo</Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                {["No credit card required", "14-day free trial", "Cancel anytime"].map((text) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl" />
              <img
                src={authGradientWave}
                alt="Dashboard preview"
                className="relative rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help your team create better content, faster.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card rounded-2xl border border-border p-8 shadow-card hover:shadow-card-hover transition-all animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-6">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-3xl p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Transform Your Social Media?
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Join thousands of teams already using Ranblitz to grow their social presence.
            </p>
            <Button size="xl" variant="secondary" asChild>
              <Link to="/signup">
                Get Started for Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © 2024 Ranblitz. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
