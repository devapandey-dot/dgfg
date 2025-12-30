import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import RecentPostsTable from "@/components/dashboard/RecentPostsTable";
import { Plus, FileText, Users, Link as LinkIcon, TrendingUp, Calendar, ArrowUpRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/ui/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { postsService, PostItem } from "@/services/posts.service";
import { socialService } from "@/services/social.service";
import { subscriptionService } from "@/services/subscription.service";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";

type TablePost = {
  id: string;
  title: string;
  status: "draft" | "pending" | "approved" | "scheduled" | "published";
  scheduledAt?: string;
  author: string;
  platforms: string[];
  comments: number;
};

const Dashboard = () => {
  const [planName, setPlanName] = useState<string | null>(null);
  const [planType, setPlanType] = useState<"Free" | "Individual" | "Business" | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const [connectedAccounts, setConnectedAccounts] = useState<number>(0);
  const [teamMembers, setTeamMembers] = useState<number>(0);
  const [engagementRate, setEngagementRate] = useState<{ value: string; change: string; type: "positive" | "negative" | "neutral" }>({ value: "—", change: "", type: "neutral" });
  const [recentPosts, setRecentPosts] = useState<TablePost[]>([]);
  const [upcomingPosts, setUpcomingPosts] = useState<Array<{ title: string; date: string; time: string }>>([]);

  const platformNameFromEntry = (entry: any): string => {
    if (!entry) return "";
    if (typeof entry === "string") return entry;
    if (typeof entry === "object") {
      if (typeof (entry as any).platform === "string") return (entry as any).platform;
      const keys = Object.keys(entry);
      if (keys.length > 0) return keys[0];
    }
    return "";
  };

  const formatDate = (iso?: string | null): string | undefined => {
    if (!iso) return undefined;
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return undefined;
    }
  };

  const formatDateTime = (iso?: string | null): string | undefined => {
    if (!iso) return undefined;
    try {
      const d = new Date(iso);
      const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      return `${date} ${time}`;
    } catch {
      return undefined;
    }
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const user = authService.getUser();
        const tenantId = user?.tenant_id;
        if (!tenantId) {
          setLoadingSubscription(false);
          return;
        }
        const res = await subscriptionService.getSubscriptionByOrgId(tenantId);
        // Robust extraction matching PlanUsage.tsx logic
        const payload = (res as any).data ?? res;
        
        // Handle array response or nested subscription
        let sub = null;
        if (Array.isArray(payload)) {
          sub = payload[0];
        } else if (payload) {
          sub = payload.subscription ?? (payload.plan_id || payload.id ? payload : null);
        }
        
        if (sub) {
          const p = sub.Plan || sub.plan || null;
          const name = sub.plan_name || p?.plan_name || p?.name || null;
          const type = sub.plan_type || p?.plan_type || (name ? "Paid" : "Free");
          
          setPlanName(name);
          setPlanType(type as any);
          setSubscriptionStatus(sub.status || "Active");
        } else if (payload && typeof payload === 'object') {
          // One more fallback for flat objects
          const name = payload.plan_name || payload.name;
          if (name) {
            setPlanName(name);
            setPlanType((payload.plan_type || "Free") as any);
            setSubscriptionStatus(payload.status || "Active");
          }
        }
      } catch (err) {
        // Silently fail; banner will not show details
      } finally {
        setLoadingSubscription(false);
      }
    };
    fetchSubscription();
  }, []);

  // Fetch dashboard stats and lists
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setStatsLoading(true);
      try {
        const postsRes = await postsService.list({ page: 1, limit: 1 });
        if (postsRes.success && postsRes.data) setTotalPosts(postsRes.data.total || 0);

        const accountsRes = await socialService.getAccounts();
        if (accountsRes.success && accountsRes.data) {
          setConnectedAccounts(accountsRes.data.accounts?.length || 0);
        }

        const usersRes = await userService.list();
        if (usersRes.success && usersRes.data) {
          setTeamMembers(usersRes.data.users?.length || 0);
        }

        // Recent posts (last 5 by created_at)
        const recentRes = await postsService.list({ page: 1, limit: 5, sort_by: "created_at", sort_order: "DESC" });
        const recentList: PostItem[] = (recentRes as any)?.data?.data ?? ((recentRes as any)?.data ?? []);
        const tablePosts: TablePost[] = (Array.isArray(recentList) ? recentList : []).map((p) => ({
          id: String(p.id ?? p.post_id ?? Math.random()),
          title: (p.post_name || p.description || "Untitled") as string,
          status: ((p.status as any) || "draft") as TablePost["status"],
          scheduledAt: formatDateTime(p.scheduled_time),
          author: authService.getUser()?.name || "—",
          platforms: Array.isArray(p.platforms)
            ? (p.platforms as any[]).map(platformNameFromEntry).filter(Boolean)
            : p.platforms
            ? [platformNameFromEntry(p.platforms)]
            : [],
          comments: 0,
        }));
        // Fetch comments count for each recent post
        const withCommentCounts: TablePost[] = await Promise.all(
          tablePosts.map(async (row) => {
            try {
              const res = await postsService.getComments(row.id);
              const list = Array.isArray((res as any)?.data)
                ? (res as any).data
                : Array.isArray((res as any)?.comments)
                ? (res as any).comments
                : [];
              return { ...row, comments: list.length };
            } catch {
              return row;
            }
          })
        );
        setRecentPosts(withCommentCounts);

        // Upcoming posts (next 14 days, 3 items by scheduled_time asc)
        const now = new Date();
        const next = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const upcomingRes = await postsService.list({
          status: "scheduled",
          scheduled_from: now.toISOString(),
          scheduled_to: next.toISOString(),
          sort_by: "scheduled_time",
          sort_order: "ASC",
          limit: 3,
        });
        if (upcomingRes.success && upcomingRes.data) {
          const upcomingList = upcomingRes.data.posts || [];
          setUpcomingPosts(upcomingList.map((p) => {
            const d = p.scheduled_time ? new Date(p.scheduled_time) : null;
            const date = d?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) || "—";
            const time = d?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) || "";
            return { title: (p.post_name || p.description || "Untitled") as string, date, time };
          }));
        }

        // Engagement rate (published last 7 days vs previous 7)
        const end = new Date();
        const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        const prevEnd = new Date(start.getTime());
        const prevStart = new Date(prevEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

        const currRes = await postsService.list({ status: "published", created_from: start.toISOString(), created_to: end.toISOString(), limit: 1 });
        const curr = Number(currRes.data?.total ?? 0);
        const prevRes = await postsService.list({ status: "published", created_from: prevStart.toISOString(), created_to: prevEnd.toISOString(), limit: 1 });
        const prev = Number(prevRes.data?.total ?? 0);
        const change = prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
        setEngagementRate({ value: `${Math.max(0, Math.min(100, curr)).toFixed(1)}%`, change: `${change >= 0 ? "+" : ""}${change.toFixed(1)}% from last week`, type: change >= 0 ? "positive" : "negative" });
      } catch (e) {
        setEngagementRate({ value: "—", change: "", type: "neutral" });
      } finally {
        setStatsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout>
      <PageTransition className="space-y-5 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1a1f36]"> Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" className="h-9 px-4 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all" onClick={() => navigate("/posts/create")}>
              <Plus className="h-3.5 w-3.5 mr-2" />
              Create Post
            </Button>
          </div>
        </div>

        {/* Subscription banner */}
        {!loadingSubscription && (
          <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent backdrop-blur-md rounded-2xl border border-primary/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow duration-300"
        >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">Current Plan</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {planName || planType || "No active subscription"}
                  </h3>
                  {subscriptionStatus && (
                    <span className="bg-gradient-to-r from-green-300 to-emerald-400 text-black text-xs font-black px-4 py-2 rounded-full shadow-lg animate-pulse">
                      {subscriptionStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant={planType === "Free" ? "default" : "outline"} className="rounded-xl px-6" asChild>
                <Link to="/plans">{planType === "Free" ? "Upgrade Now" : "Manage Subscription"}</Link>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ))}
            </>
          ) : (
            <>
              <StatCard 
                title="Total Posts" 
                value={String(totalPosts)} 
                change="+0%"
                changeType="positive"
                description="Published content"
                color="blue"
                icon={<FileText />} 
              />
              <StatCard 
                title="Connected Accounts" 
                value={String(connectedAccounts)} 
                change="+0%"
                changeType="positive"
                description="Active connections"
                color="purple"
                icon={<LinkIcon />} 
              />
              <StatCard 
                title="Team Members" 
                value={String(teamMembers)} 
                change="+0%"
                changeType="neutral"
                description="Team size"
                color="pink"
                icon={<Users />} 
              />
              <StatCard 
                title="Engagement Rate" 
                value={engagementRate.value} 
                change={engagementRate.change || "+0.0%"} 
                changeType={engagementRate.type || "positive"} 
                description="Last 7 days"
                color="green"
                icon={<TrendingUp />} 
              />
            </>
          )}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Recent posts - spans 2 columns */}
          <div className="xl:col-span-2">
            {recentPosts.length === 0 && statsLoading ? (
              <div className="bg-card rounded-xl border border-border shadow-card p-4">
                <Skeleton className="h-4 w-40 mb-4" />
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full mb-2" />
                ))}
              </div>
            ) : (
              <RecentPostsTable posts={recentPosts} onOpenPost={(id) => navigate(`/posts/${id}/edit`)} />
            )}
          </div>

          {/* Upcoming posts sidebar */}
          <div className="bg-card rounded-xl border border-border shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#1a1f36]">Upcoming</h3>
              <Button variant="outline" size="sm" className="rounded-lg border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary text-[9px] h-6 px-2" asChild>
                <Link to="/posts?status=scheduled" className="flex items-center gap-1">
                  VIEW ALL
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingPosts.map((post, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[#1a1f36] truncate">
                      {post.title}
                    </p>
                    <p className="text-[9px] text-gray-400 font-medium">
                      {post.date} at {post.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Dashboard;
