import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { subscriptionService } from "@/services/subscription.service";
import { authService } from "@/services/auth.service";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        // Get order_id from URL (PayPal returns it as 'token' or 'PayerID')
        const orderId = searchParams.get("token") || searchParams.get("order_id") || searchParams.get("PayerID");
        
        // Get data from URL params (backend passes these) or sessionStorage
        const urlTenantId = searchParams.get("tenant_id");
        const urlPlanId = searchParams.get("plan_id");
        
        const pendingOrderId = orderId || sessionStorage.getItem('pending_order_id');
        const pendingPlanId = urlPlanId || sessionStorage.getItem('pending_plan_id');
        const pendingTenantId = urlTenantId || sessionStorage.getItem('pending_tenant_id');
        const pendingProvider = sessionStorage.getItem('pending_provider') || 'paypal';

        if (!pendingOrderId || !pendingPlanId) {
          toast({
            title: "Error",
            description: "Missing payment information. Please try subscribing again.",
            variant: "destructive",
          });
          navigate("/plans");
          return;
        }

        const user = authService.getUser();
        const tenantId = pendingTenantId ? parseInt(pendingTenantId) : (user?.tenant_id);

        if (!tenantId) {
          toast({
            title: "Error",
            description: "Unable to identify your account. Please log in again.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        // Capture payment and create subscription
        const response = await subscriptionService.capturePayment({
          order_id: pendingOrderId,
          plan_id: parseInt(pendingPlanId),
          tenant_id: tenantId,
          provider: pendingProvider as 'paypal' | 'cashfree' | 'razorpay',
        });

        if (response.success) {
          // Clear session storage
          sessionStorage.removeItem('pending_order_id');
          sessionStorage.removeItem('pending_plan_id');
          sessionStorage.removeItem('pending_tenant_id');
          sessionStorage.removeItem('pending_provider');

          setIsSuccess(true);
          setIsProcessing(false);

          toast({
            title: "Payment successful!",
            description: "Your subscription has been activated successfully.",
          });

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        } else {
          setIsProcessing(false);
          toast({
            title: "Payment capture failed",
            description: response.error || "Failed to activate subscription. Please contact support.",
            variant: "destructive",
          });
          
          // Redirect to plans page after error
          setTimeout(() => {
            navigate("/plans");
          }, 3000);
        }
      } catch (error) {
        console.error("Payment capture error:", error);
        setIsProcessing(false);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please contact support.",
          variant: "destructive",
        });
        
        setTimeout(() => {
          navigate("/plans");
        }, 3000);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, navigate, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Processing your payment...</h2>
          <p className="text-muted-foreground">Please wait while we activate your subscription.</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground mb-6">
            Your subscription has been activated. Redirecting to dashboard...
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentSuccess;

