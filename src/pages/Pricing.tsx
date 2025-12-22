import { useState } from "react";
import { Check, Sparkles, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const getPrice = (monthly: number) => {
    if (isAnnual) {
      return Math.round(monthly * 0.8);
    }
    return monthly;
  };

  const tiers = [
    {
      name: "Starter",
      icon: Zap,
      monthlyPrice: 199,
      description: "Early-stage DTC brands & Solo-founders",
      features: [
        "500 Semantic AI Searches /mo",
        "Access to 5M+ Micro/Macro profiles",
        "1 Active Campaign",
        "Manual link tracking only",
        "Standard Invoice Management",
        "Email Support",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Professional",
      icon: Sparkles,
      monthlyPrice: 499,
      description: "High-growth brands & scale-ups",
      features: [
        "Unlimited AI Discovery",
        "Full Database + Advanced Vetting",
        "Unlimited Campaigns",
        "Live Attribution Dashboard",
        "Automated Escrow (Creator Payouts)",
        "Shopify, Klaviyo & GA Integrations",
        "Priority Support + Monthly Strategy Call",
      ],
      highlights: ["Live Attribution Dashboard", "Automated Escrow (Creator Payouts)"],
      cta: "Start Free Trial",
      highlighted: true,
      badge: "Best Value",
    },
    {
      name: "Enterprise",
      icon: Building2,
      monthlyPrice: null,
      customPrice: "Custom",
      description: "Performance agencies & Conglomerates",
      features: [
        "Unlimited + Deep Competitor Audits",
        "Custom sourcing & Priority Database",
        "Multi-Brand / Multi-Workspace Support",
        "Real-Time Reward Engine",
        "Full API Access + Custom CRM Sync",
        "Real-Time Content Rewards",
        "Dedicated Account Manager + 24/7 Slack",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
            Pricing Plans
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your influencer marketing needs. Scale as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn("text-sm font-medium", !isAnnual ? "text-foreground" : "text-muted-foreground")}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={cn("text-sm font-medium", isAnnual ? "text-foreground" : "text-muted-foreground")}>
              Annual
            </span>
            {isAnnual && (
              <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 ml-2">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.name}
                className={cn(
                  "relative rounded-2xl p-8 transition-all duration-300",
                  tier.highlighted
                    ? "bg-card/40 backdrop-blur-xl border-2 border-primary/50 shadow-[0_0_60px_-15px] shadow-primary/30 scale-105 z-10"
                    : "bg-card/20 backdrop-blur-sm border border-border/50 hover:border-border"
                )}
              >
                {/* Best Value Badge */}
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold shadow-lg shadow-primary/30">
                      {tier.badge}
                    </Badge>
                  </div>
                )}

                {/* Glassmorphism overlay for Professional */}
                {tier.highlighted && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
                )}

                <div className="relative">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      tier.highlighted ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        tier.highlighted ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{tier.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {tier.monthlyPrice ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-foreground">
                          ${getPrice(tier.monthlyPrice)}
                        </span>
                        <span className="text-muted-foreground">/mo</span>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-foreground">{tier.customPrice}</div>
                    )}
                    {isAnnual && tier.monthlyPrice && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="line-through">${tier.monthlyPrice}</span> billed annually
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

                  {/* CTA Button */}
                  <Button
                    className={cn(
                      "w-full mb-6",
                      tier.highlighted
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    )}
                  >
                    {tier.cta}
                  </Button>

                  {/* Features */}
                  <ul className="space-y-3">
                    {tier.features.map((feature) => {
                      const isHighlighted = tier.highlights?.includes(feature);
                      return (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className={cn(
                            "w-5 h-5 mt-0.5 flex-shrink-0",
                            isHighlighted ? "text-neon-green" : tier.highlighted ? "text-primary" : "text-muted-foreground"
                          )} />
                          <span className={cn(
                            "text-sm",
                            isHighlighted 
                              ? "text-neon-green font-semibold" 
                              : "text-muted-foreground"
                          )}>
                            {feature}
                            {isHighlighted && (
                              <Sparkles className="inline-block w-3 h-3 ml-1 text-neon-green" />
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-sm text-muted-foreground">
            Need a custom solution?{" "}
            <a href="#" className="text-primary hover:underline">
              Talk to our team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
