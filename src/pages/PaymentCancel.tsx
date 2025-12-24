import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Clear any pending payment data
    sessionStorage.removeItem('pending_order_id');
    sessionStorage.removeItem('pending_plan_id');
    sessionStorage.removeItem('pending_tenant_id');
    sessionStorage.removeItem('pending_provider');

    toast({
      title: "Payment cancelled",
      description: "Your payment was cancelled. No charges were made.",
    });
  }, [toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <XCircle className="h-16 w-16 text-orange-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Payment Cancelled</h2>
        <p className="text-muted-foreground mb-6">
          Your payment was cancelled. No charges were made to your account.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => navigate("/plans")}>
            Back to Plans
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;

