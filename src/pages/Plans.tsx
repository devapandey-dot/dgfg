import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { subscriptionService, Plan } from "@/services/subscription.service";
import { authService } from "@/services/auth.service";

const Plans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [processingPlanId, setProcessingPlanId] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await subscriptionService.getAllPlans({ is_active: true });
      
      console.log("Plans API Response:", response);
      
      // Handle different response structures
      let plansArray: Plan[] = [];
      
      // Check for plans at top level first (most common)
      if (response.plans && Array.isArray(response.plans)) {
        plansArray = response.plans;
      } else if (response.data?.plans && Array.isArray(response.data.plans)) {
        plansArray = response.data.plans;
      } else if (Array.isArray(response.data)) {
        // Handle case where data is directly the plans array
        plansArray = response.data;
      }
      
      if (plansArray.length > 0) {
        // Sort by price: Free first, then ascending
        const sortedPlans = plansArray.sort((a, b) => {
          if (a.plan_type === 'Free') return -1;
          if (b.plan_type === 'Free') return 1;
          return Number(a.price) - Number(b.price);
        });
        console.log("Sorted Plans:", sortedPlans);
        setPlans(sortedPlans);
      } else {
        console.error("No plans found in response:", response);
        toast({
          title: "Error",
          description: "No plans available. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    if (price === 0) return "$0 per month";
    const formattedPrice = Number(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `$${formattedPrice} per month`;
  };

  // Helper: dynamically load Razorpay checkout script
  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof (window as any).Razorpay !== "undefined") {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleStartTrial = async (plan: Plan) => {
    if (processingPlanId) return; // Prevent multiple clicks
    
    setSelectedPlanId(plan.id);
    setProcessingPlanId(plan.id);

    try {
      const user = authService.getUser();
      if (!user || !user.tenant_id) {
        toast({
          title: "Authentication required",
          description: "Please log in to subscribe to a plan.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const isFreePlan = plan.plan_type === 'Free' || Number(plan.price) === 0;

      if (isFreePlan) {
        // Free plan - create subscription directly
        const response = await subscriptionService.createSubscription({
          plan_id: plan.id,
          tenant_id: user.tenant_id,
        });

        if (response.success) {
          toast({
            title: "Success!",
            description: `You've successfully subscribed to the ${plan.plan_name} plan.`,
          });
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);
        } else {
          toast({
            title: "Subscription failed",
            description: response.error || "Failed to create subscription. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // Paid plan - use Razorpay by default
        const createRes = await subscriptionService.createSubscription({
          plan_id: plan.id,
          tenant_id: user.tenant_id,
          provider: 'razorpay',
        });

        if (createRes.success && createRes.data && createRes.data.order_id && createRes.data.razorpay_key) {
          const loaded = await loadRazorpay();
          if (!loaded) {
            toast({
              title: "Payment error",
              description: "Failed to load Razorpay SDK. Please retry.",
              variant: "destructive",
            });
            return;
          }

          const Razorpay = (window as any).Razorpay;
          const amountRaw = (createRes.data.amount ?? (plan as any)?.price ?? 0);
          const amountPaise = Math.round(Number(amountRaw) * 100);
          const options = {
            key: createRes.data.razorpay_key,
            amount: amountPaise,
            currency: createRes.data.currency || 'INR',
            name: 'Ranblitz',
            description: `Subscription: ${plan.plan_name}`,
            order_id: createRes.data.order_id,
            handler: async (paymentResponse: any) => {
              try {
                const captureRes = await subscriptionService.capturePayment({
                  order_id: createRes.data.order_id!,
                  plan_id: plan.id,
                  tenant_id: user.tenant_id,
                  provider: 'razorpay',
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                });

                if (captureRes.success) {
                  toast({
                    title: "Payment successful!",
                    description: "Your subscription has been activated.",
                  });
                  setTimeout(() => navigate('/dashboard'), 1500);
                } else {
                  toast({
                    title: "Payment capture failed",
                    description: captureRes.error || 'Failed to activate subscription.',
                    variant: 'destructive',
                  });
                }
              } catch (err) {
                console.error('Capture error:', err);
                toast({
                  title: "Payment error",
                  description: "Unexpected error while capturing payment.",
                  variant: "destructive",
                });
              }
            },
            prefill: {
              name: user?.name || 'User',
              email: user?.email || 'user@example.com',
            },
            theme: { color: '#0ea5e9' },
          };
          const rzp = new Razorpay(options);
          rzp.open();
        } else {
          toast({
            title: "Payment setup failed",
            description: createRes.error || "Could not create Razorpay order.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleContactSales = () => {
    toast({
      title: "Contact Sales",
      description: "Please contact our sales team for custom plans.",
    });
  };

  const getMainFeatures = (plan: Plan) => {
    const features: string[] = [];
    
    // Channels
    if (plan.max_social_accounts > 0) {
      features.push(`${plan.max_social_accounts} channels`);
    }
    
    // Team members
    if (plan.no_of_tenant > 0) {
      features.push(`${plan.no_of_tenant} Team members`);
    }
    
    // Storage
    if (plan.storage_limit_mb > 0) {
      const storageGB = (plan.storage_limit_mb / 1024).toFixed(1);
      features.push(`${storageGB}Gb Storage`);
    }
    
    // Posts
    if (plan.max_posts_per_month !== 'unlimited') {
      features.push(`${plan.max_posts_per_month} Scheduled Posts`);
    } else {
      features.push("Unlimited Scheduled Posts");
    }
    
    // Analytics
    if (plan.enable_advanced_analytics) {
      features.push("Advanced Analytics");
    } else {
      features.push("Basic Analytics");
    }
    
    features.push("Standard Support");
    
    return features;
  };

  const getAdditionalFeatures = (plan: Plan) => {
    const features: string[] = [];
    
    if (plan.enable_ai_features) {
      features.push("AI Features");
    }
    if (plan.enable_approval_workflow) {
      features.push("Approval Workflow");
    }
    if (plan.enable_inbox) {
      features.push("Inbox Management");
    }
    if (plan.enable_review_management) {
      features.push("Review Management");
    }
    if (plan.custom_domain_support) {
      features.push("Custom Domain");
    }
    
    return features;
  };

  const getAllPlanFeatures = () => {
    return [
      "Unlimited design requests",
      "Unlimited brands or businesses",
      "Free and unlimited revisions",
      "Dedicated Project Manager",
      "Dedicated Account Manager",
      "Dedicated Graphic Designers",
      "Stock photos via Shutterstock",
      "Delivery in Figma, Canva, and Adobe",
      "Real-time Slack collaboration"
    ];
  };

  // Determine which plan should be highlighted (usually the middle paid plan)
  const getHighlightedPlanIndex = () => {
    const paidPlans = plans.filter(p => p.plan_type !== 'Free');
    if (paidPlans.length > 0) {
      const highlightedPlan = paidPlans[Math.floor(paidPlans.length / 2)];
      return plans.findIndex(p => p.id === highlightedPlan.id);
    }
    return -1;
  };

  const highlightedIndex = getHighlightedPlanIndex();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Pricing Comparison Table */}
        {plans.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="flex flex-col md:flex-row">
              {/* Plan Columns */}
              {plans.map((plan, index) => {
              const isHighlighted = index === highlightedIndex;
              const mainFeatures = getMainFeatures(plan);
              const additionalFeatures = getAdditionalFeatures(plan);
              
              const isSelected = selectedPlanId === plan.id;
              
              return (
                <div
                  key={plan.id}
                  className={`flex-1 border-r border-gray-200 last:border-r-0 transition-all ${
                    isHighlighted ? "bg-blue-900 text-white" : "bg-white"
                  } ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  {/* Plan Header */}
                  <div className={`p-6 ${isHighlighted ? "bg-blue-900" : "bg-white"}`}>
                    <h3 className={`text-xl font-bold mb-2 ${isHighlighted ? "text-white" : "text-gray-900"}`}>
                      {plan.plan_name}
                    </h3>
                    <p className={`text-sm mb-4 min-h-[3rem] ${isHighlighted ? "text-blue-100" : "text-gray-600"}`}>
                      {plan.description || "Get started with our features"}
                    </p>
                    <div className={`text-2xl font-bold mb-4 ${isHighlighted ? "text-white" : "text-gray-900"}`}>
                      {formatPrice(Number(plan.price), plan.currency)}
                    </div>
                    <Button
                      className={`w-full ${
                        isHighlighted
                          ? "bg-white text-blue-900 hover:bg-gray-100"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                      onClick={() => handleStartTrial(plan)}
                      disabled={processingPlanId !== null}
                    >
                      {processingPlanId === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Start $5 trial
                          {isHighlighted && <ArrowRight className="ml-2 h-4 w-4" />}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Features List */}
                  <div className={`p-6 ${isHighlighted ? "bg-blue-900" : "bg-white"}`}>
                    <div className="space-y-3">
                      {mainFeatures.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className={`h-4 w-4 flex-shrink-0 ${
                            isHighlighted ? "text-white" : "text-green-600"
                          }`} />
                          <span className={`text-sm ${
                            isHighlighted ? "text-white" : "text-gray-700"
                          }`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Features Section (for paid plans) */}
                  {plan.plan_type !== 'Free' && additionalFeatures.length > 0 && (
                    <div className={`p-6 border-t ${
                      isHighlighted ? "border-blue-800 bg-blue-900" : "border-gray-200 bg-gray-50"
                    }`}>
                      <p className={`text-xs font-semibold mb-3 ${
                        isHighlighted ? "text-blue-200" : "text-gray-500"
                      }`}>
                        This also includes:
                      </p>
                      <div className="space-y-2">
                        {additionalFeatures.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Check className={`h-4 w-4 flex-shrink-0 ${
                              isHighlighted ? "text-white" : "text-green-600"
                            }`} />
                            <span className={`text-sm ${
                              isHighlighted ? "text-white" : "text-gray-700"
                            }`}>
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 mb-8 text-center">
            <p className="text-gray-600">No plans available at the moment.</p>
          </div>
        )}

        {/* Custom Plan Banner */}
        <div className="bg-gray-900 text-white rounded-lg p-6 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Custom plan</h3>
              <p className="text-gray-300">
                Get all design services included in the Light, Standard, and Pro plans,
                white-glove onboarding, 1-on-1 support, and unlimited projects at a time
                - starting at $5K/mo.
              </p>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleContactSales}
            >
              Contact sales <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Included with every plan */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Included with every plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {getAllPlanFeatures().map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
