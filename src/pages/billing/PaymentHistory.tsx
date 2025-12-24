import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PaymentHistory = () => {
  return (
    <div className="space-y-6">
      {/* Current Payment Method */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Current Payment Method</h3>
          <div className="rounded-xl border border-dashed border-primary/30 p-4">
            <p className="text-xs text-muted-foreground">Supported gateways</p>
            <div className="mt-2 text-sm text-foreground">Razorpay, PayPal, Cashfree</div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Button asChild variant="outline" size="sm">
              <Link to="/plans">Add New Card</Link>
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto-renew Subscription</span>
              <div className="h-4 w-8 rounded-full bg-muted relative">
                <div className="absolute left-0 top-0 h-4 w-4 rounded-full bg-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Billing Address</h3>
          <p className="text-sm text-muted-foreground">Not set</p>
          <div className="mt-3">
            <Button variant="outline" size="sm">Edit</Button>
          </div>
        </div>
      </div>

      {/* Invoices & History */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Invoices & History</h3>
        </div>
        <div className="p-5 text-sm text-muted-foreground">No invoices to show.</div>
      </div>
    </div>
  );
};

export default PaymentHistory;