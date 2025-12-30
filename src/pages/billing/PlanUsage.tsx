import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { subscriptionService, Plan } from "@/services/subscription.service";
import { authService } from "@/services/auth.service";
import { Crown, ArrowRight } from "lucide-react";
import Loader from "@/components/ui/loader";

interface UsageData {
  storageUsedMb?: number;
  teamMembersUsed?: number;
  connectedChannelsUsed?: number;
  scheduledPostsThisMonth?: number;
  renewalDate?: string;
}

const normalizeUsage = (usage: any): UsageData => {
  if (!usage) return {};
  return {
    storageUsedMb:
      usage.storageUsedMb ?? usage.storage_mb_used ?? usage.storage_used_mb ?? usage.storage_used ?? 0,
    teamMembersUsed:
      usage.teamMembersUsed ?? usage.team_members_used ?? usage.team_members ?? usage.seats_used ?? 0,
    connectedChannelsUsed:
      usage.connectedChannelsUsed ?? usage.connected_channels_used ?? usage.channels_used ?? 0,
    scheduledPostsThisMonth:
      usage.scheduledPostsThisMonth ?? usage.scheduled_posts_month ?? usage.scheduled_posts ?? 0,
    renewalDate: usage.renewalDate ?? usage.renewal_date ?? undefined,
  };
};

const formatCurrency = (amount?: number, currency?: string) => {
  if (amount === undefined || amount === null) return "-";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || "USD"} ${amount}`;
  }
};

const PlanUsage = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = authService.getUser();
        const orgId = user?.tenant_id;
        if (!orgId) {
          setLoading(false);
          return;
        }
        const res = await subscriptionService.getSubscriptionByOrgId(orgId);
        const payload = (res as any).data ?? res; // defensive
        const sub = payload?.subscription ?? payload;
        setSubscription(sub || null);
        setUsage(normalizeUsage(payload?.usage));
      } catch (e) {
        console.error("Failed to load subscription:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const plan: Plan | undefined = useMemo(() => {
    const p = subscription?.Plan || subscription?.plan || null;
    if (!p) return undefined;
    return {
      id: p.id,
      plan_name: p.plan_name ?? p.name ?? subscription?.plan_name ?? "",
      plan_type: p.plan_type ?? subscription?.plan_type ?? "Free",
      description: p.description ?? "",
      price: Number(p.price ?? subscription?.price ?? 0),
      currency: p.currency ?? subscription?.currency ?? "USD",
      billing_cycle: p.billing_cycle ?? "Yearly",
      trial_days: p.trial_days ?? 0,
      max_social_accounts: p.max_social_accounts ?? 1,
      max_posts_per_month: p.max_posts_per_month ?? "100",
      no_of_tenant: p.no_of_tenant ?? 1,
      supported_channels: p.supported_channels ?? [],
      storage_limit_mb: p.storage_limit_mb ?? 512,
      enable_ai_features: !!p.enable_ai_features,
      enable_approval_workflow: !!p.enable_approval_workflow,
      enable_advanced_analytics: !!p.enable_advanced_analytics,
      enable_inbox: !!p.enable_inbox,
      enable_review_management: !!p.enable_review_management,
      custom_domain_support: !!p.custom_domain_support,
      is_active: p.is_active ?? true,
    };
  }, [subscription]);

  const statusLabel = subscription?.status ?? "";

  const storageLimitMb = plan?.storage_limit_mb ?? 0;
  const storageUsedMb = usage?.storageUsedMb ?? 0;
  const storagePct = storageLimitMb > 0 ? Math.min(100, Math.round((storageUsedMb / storageLimitMb) * 100)) : 0;

  const teamLimit = plan?.no_of_tenant ?? 1;
  const teamUsed = usage?.teamMembersUsed ?? 0;
  const teamPct = teamLimit > 0 ? Math.min(100, Math.round((teamUsed / teamLimit) * 100)) : 0;

  const channelLimit = plan?.max_social_accounts ?? 1;
  const channelUsed = usage?.connectedChannelsUsed ?? 0;
  const channelPct = channelLimit > 0 ? Math.min(100, Math.round((channelUsed / channelLimit) * 100)) : 0;

  const postsLimitRaw = plan?.max_posts_per_month ?? "0";
  const postsUnlimited = String(postsLimitRaw).toLowerCase().includes("unlimited");
  const postsLimit = postsUnlimited ? Infinity : Number(postsLimitRaw) || 0;
  const postsUsed = usage?.scheduledPostsThisMonth ?? 0;
  const postsPct = postsUnlimited ? 0 : postsLimit > 0 ? Math.min(100, Math.round((postsUsed / postsLimit) * 100)) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader showText text="Loading plan usage..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Plan card with gradient + animation */}
      <div className="rounded-xl p-5 w-full max-w-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg transition-transform duration-200 hover:scale-[1.01]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs/5 text-white/70">Current Plan</p>
              <p className="text-base font-semibold">{plan?.plan_name || "-"}</p>
              <div className="mt-1 flex items-center gap-2">
                {statusLabel && (
                  <Badge className="bg-green-500/20 text-green-100 border-0">{statusLabel}</Badge>
                )}
                {usage?.renewalDate && (
                  <span className="text-xs text-white/80">Renews on {usage.renewalDate}</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70">Price</p>
            <p className="text-sm font-semibold">
              {formatCurrency(plan?.price, plan?.currency)}/{plan?.billing_cycle?.toLowerCase() === "monthly" ? "month" : "year"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button asChild size="sm" className="bg-yellow-400 hover:bg-yellow-300 text-black">
            <Link to="/billing/upgrade">Upgrade Plan</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white hover:border-white">
            <Link to="/billing/payments">Manage Plan</Link>
          </Button>
        </div>
      </div>

      {/* Usage & Limits */}
      <div className="space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Usage & Limits</h2>

        {/* Storage */}
        <div className="rounded-xl border border-border bg-background">
          <div className="p-4">
            <p className="text-xs font-medium text-foreground">Media Storage</p>
            <p className="text-xs text-muted-foreground">
              {Math.round((storageUsedMb || 0) / 1024)}GB/{Math.round((storageLimitMb || 0) / 1024)}GB
            </p>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${storagePct}%` }} />
            </div>
            {storageLimitMb > 0 && storageUsedMb / storageLimitMb > 0.8 && (
              <p className="mt-2 text-xs text-destructive">You are close to exceeding media storage.</p>
            )}
          </div>
        </div>

        {/* Team Members */}
        <div className="rounded-xl border border-border bg-background">
          <div className="p-4">
            <p className="text-xs font-medium text-foreground">Team Members</p>
            <p className="text-xs text-muted-foreground">
              {teamUsed}/{teamLimit} seats
            </p>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${teamPct}%` }} />
            </div>
            {teamLimit > 0 && teamUsed / teamLimit > 0.8 && (
              <p className="mt-2 text-xs text-warning">Add more team seats with Add-ons.</p>
            )}
          </div>
        </div>

        {/* Connected Channels */}
        <div className="rounded-xl border border-border bg-background">
          <div className="p-4">
            <p className="text-xs font-medium text-foreground">Connected Channels</p>
            <p className="text-xs text-muted-foreground">
              {channelUsed}/{channelLimit}
            </p>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${channelPct}%` }} />
            </div>
          </div>
        </div>

        {/* Scheduled Posts */}
        <div className="rounded-xl border border-border bg-background">
          <div className="p-4">
            <p className="text-xs font-medium text-foreground">Scheduled Posts</p>
            <p className="text-xs text-muted-foreground">
              {postsUnlimited ? `${postsUsed}/Unlimited` : `${postsUsed}/${postsLimit}`}
            </p>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div className={cn("h-2 rounded-full", postsUnlimited ? "bg-muted" : "bg-primary")} style={{ width: postsUnlimited ? "100%" : `${postsPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanUsage;