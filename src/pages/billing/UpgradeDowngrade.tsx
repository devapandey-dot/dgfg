import { useEffect, useState } from "react";
import { subscriptionService, Plan } from "@/services/subscription.service";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const UpgradeDowngrade = () => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      try {
        const res = await subscriptionService.getAllPlans({ is_active: true });
        const payload = (res as any).data ?? res;
        const list: Plan[] = payload?.plans ?? [];
        setPlans(list);
      } catch (e) {
        console.error("Failed to load plans:", e);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Upgrade / Downgrade</h2>
          <p className="text-sm text-muted-foreground">Browse all available plans and pick one.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/plans">Open full Plans page</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-base font-semibold text-foreground">{p.plan_name}</h3>
                <span className="text-sm font-semibold">
                  {p.currency} {p.price}/{p.billing_cycle === "Monthly" ? "mo" : "yr"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.description || ""}</p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                <li>• {p.max_social_accounts} social accounts</li>
                <li>• {p.no_of_tenant} team members</li>
                <li>• Storage: {Math.round((p.storage_limit_mb || 0) / 1024)}GB</li>
                <li>• Posts per month: {p.max_posts_per_month}</li>
              </ul>
              <div className="mt-4">
                <Button asChild className="w-full">
                  <Link to={`/plans?select=${p.id}`}>Select Plan</Link>
                </Button>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No plans found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UpgradeDowngrade;