import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { postsService, PostItem } from "@/services/posts.service";
import { socialService } from "@/services/social.service";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Calendar, MessageSquare, Eye, Edit, Clock, Trash2, Reply, Instagram, Facebook, Linkedin, Twitter, Share2, ChevronDown, Network } from "lucide-react";
import Loader from "@/components/ui/loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, MotionDialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

type StatusTab = "all" | "draft" | "review" | "approved" | "scheduled" | "published";

const statusLabel: Record<Exclude<StatusTab, "all">, string> = {
  draft: "Drafts",
  review: "Pending Approvals",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
};

const statusBadgeClass: Record<Exclude<StatusTab, "all">, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-info/10 text-info border-info/20",
  scheduled: "bg-primary/10 text-primary border-primary/20",
  published: "bg-success/10 text-success border-success/20",
};

const PLATFORM_OPTIONS = ["all", "twitter", "facebook", "instagram", "linkedin", "bluesky", "pinterest", "threads", "tiktok", "youtube"] as const;

const platformIcons: Record<string, React.ReactNode> = {
  all: <Share2 className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4 text-[#1DA1F2]" />,
  facebook: <Facebook className="h-4 w-4 text-[#1877F2]" />,
  instagram: <Instagram className="h-4 w-4 text-[#E4405F]" />,
  linkedin: <Linkedin className="h-4 w-4 text-[#0A66C2]" />,
  bluesky: <span className="text-blue-500">🦋</span>,
  pinterest: <span className="text-red-600 font-bold">P</span>,
  threads: <span className="text-foreground">@</span>,
  tiktok: <span className="text-foreground">T</span>,
  youtube: <span className="text-red-600">▶</span>,
};

const PLATFORM_LABELS: Record<string, string> = {
  all: "All Channels",
  twitter: "Twitter / X",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "Linkedin",
  bluesky: "Bluesky",
  pinterest: "Pinterest",
  threads: "Threads",
  tiktok: "TikTok",
  youtube: "YouTube",
};

// Normalize various platform shapes to an array of lowercase strings.
// Supports:
// - ["instagram", "facebook"]
// - [{ platform: "instagram", accountId: "..." }]
// - [{ instagram: "late_account_id" }]
// - "instagram,facebook" or JSON string shapes
const normalizePlatforms = (platforms?: any): string[] => {
  if (!platforms) return [];

  // If array, coerce each item to a platform string
  if (Array.isArray(platforms)) {
    const out: string[] = [];
    for (const item of platforms) {
      if (!item) continue;
      if (typeof item === "string") {
        out.push(item.toLowerCase());
        continue;
      }
      if (typeof item === "object") {
        // Shape: { platform: "instagram", accountId: "..." }
        if ("platform" in item && item.platform) {
          out.push(String(item.platform).toLowerCase());
          continue;
        }
        // Shape: { instagram: "late_account_id" }
        const keys = Object.keys(item);
        if (keys.length === 1) {
          out.push(keys[0].toLowerCase());
          continue;
        }
      }
    }
    // Deduplicate
    return Array.from(new Set(out));
  }

  // If string, try JSON first
  const raw = String(platforms).trim();
  if (raw.startsWith("[") || raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      return normalizePlatforms(parsed);
    } catch {}
  }

  // Fallback: comma-separated list
  return raw
    .split(",")
    .map((p) => p.trim().replace(/^[\[\"\']+|[\]\"\']+$/g, "").toLowerCase())
    .filter(Boolean);
};

// Build platform -> accountId mapping from various platform shapes
const extractAccountIds = (platforms?: any): Record<string, string> => {
  const map: Record<string, string> = {};
  if (!platforms) return map;

  const handleParsed = (parsed: any) => {
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (!item) continue;
        if (typeof item === 'object') {
          if ('platform' in item && (item as any).platform) {
            const p = String((item as any).platform).toLowerCase();
            const id = (item as any).accountId || (item as any).account_id || (item as any).late_account_id;
            if (id) map[p] = String(id);
            continue;
          }
          const keys = Object.keys(item);
          if (keys.length === 1) {
            const p = keys[0].toLowerCase();
            const id = (item as any)[keys[0]];
            if (id) map[p] = String(id);
          }
        }
      }
    } else if (typeof parsed === 'object') {
      const keys = Object.keys(parsed ?? {});
      if (keys.length === 1) {
        const p = keys[0].toLowerCase();
        const id = (parsed as any)[keys[0]];
        if (id) map[p] = String(id);
      }
    }
  };

  if (Array.isArray(platforms) || typeof platforms === 'object') {
    handleParsed(platforms);
    return map;
  }

  const raw = String(platforms).trim();
  if (raw.startsWith('[') || raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      handleParsed(parsed);
      return map;
    } catch {}
  }
  return map;
};

const Content = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<StatusTab>("review");
  const [searchQuery, setSearchQuery] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORM_OPTIONS)[number]>("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { toast } = useToast();
  const [sendingId, setSendingId] = useState<number | string | null>(null);

  const queryParams = useMemo(() => {
    const params: any = {
      page,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (activeTab !== "all") params.status = activeTab;
    if (searchQuery) params.search = searchQuery;
    if (platform && platform !== "all") params.platforms = platform;
    return params;
  }, [activeTab, searchQuery, platform, sortBy, sortOrder, page, limit]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["posts", queryParams],
    queryFn: async () => {
      const res = await postsService.list(queryParams);
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to load posts");
      }
      return res.data;
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1);
  }, [activeTab, searchQuery, platform, sortBy, sortOrder, limit]);

  // Handle deep links: switch tab and open comments panel
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["all","draft","review","approved","scheduled","published"].includes(tab)) {
      setActiveTab(tab as StatusTab);
    }
  }, [searchParams]);

  useEffect(() => {
    const action = searchParams.get("action");
    const postIdParam = searchParams.get("postId");
    if (action === "viewComments" && postIdParam) {
      const pid = Number(postIdParam);
      // Expand targeted post's comments for deep link
      setExpandedComments((prev) => {
        const next = new Set(prev);
        next.add(pid);
        return next;
      });
    }
  }, [searchParams]);

  const posts = (data?.data ?? []) as PostItem[];
  const meta = data?.meta;

  // After posts are available, ensure expansion and scroll to anchor
  useEffect(() => {
    const action = searchParams.get("action");
    const postIdParam = searchParams.get("postId");
    if (action === "viewComments" && postIdParam) {
      const pid = Number(postIdParam);
      setExpandedComments((prev) => {
        const next = new Set(prev);
        next.add(pid);
        return next;
      });
      const anchor = document.getElementById(`post-${pid}`);
      if (anchor) {
        try { anchor.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {}
      }
    }
  }, [posts, searchParams]);

  const pickThumbnail = (post: PostItem): string | null => {
    const attachments = post.attachments || [];
    const image = attachments.find((a) => {
      const t = (a.file_type || "").toLowerCase();
      return t.includes("image") || t.includes("jpg") || t.includes("jpeg") || t.includes("png") || t.includes("gif") || t.includes("webp") || t.includes("bmp") || t.includes("svg");
    });
    return image?.file_url || null;
  };

  const subtitleByTab: Record<StatusTab, string> = {
    all: "Browse all posts across your workflow.",
    draft: "Drafts — Your post is saved privately. Not visible to approvers yet",
    review: "Pending Approvals — Your posts are waiting for review",
    approved: "Approved — Ready to be scheduled or published",
    scheduled: "Scheduled — Posts are queued for publishing",
    published: "Published — Posts live across channels",
  };

  const handleSendForApproval = async (post: PostItem) => {
    const id = post.post_id ?? post.id;
    if (!id) return;
    try {
      setSendingId(id);
      const res = await postsService.action(id as any, 'update_status', { status: 'review' });
      if (!res.success) {
        toast({
          title: 'Failed to send for approval',
          description: res.error || 'Unexpected error',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Sent for approval',
        description: 'Approvers have been notified.',
      });
      await refetch();
      setActiveTab('review');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setSendingId(null);
    }
  };
  // Inline comments expansion state
  const [expandedComments, setExpandedComments] = useState<Set<number | string>>(new Set());
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const toggleComments = (post: PostItem) => {
    const id = post.post_id ?? post.id;
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  // Schedule dialog state
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<PostItem | null>(null);
  const [scheduleValue, setScheduleValue] = useState<string>("");

  // Approve/Reject decision dialog state
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionTarget, setDecisionTarget] = useState<PostItem | null>(null);
  const [decisionType, setDecisionType] = useState<"approve" | "reject" | null>(null);
  const [decisionComment, setDecisionComment] = useState<string>("");
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  const toLocalInputValue = (date?: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date instanceof Date ? date : new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleSchedule = (post: PostItem) => {
    setScheduleTarget(post);
    setScheduleValue(toLocalInputValue(post.scheduled_time || new Date()));
    setScheduleOpen(true);
  };
  const handlePublishNow = async (post: PostItem) => {
    const id = post.post_id ?? post.id;
    if (!id) return;
    try {
      setSendingId(id);
      // 1) Fetch latest post ONLY (no accounts call)
      console.log('[Content] PublishNow: fetching post', { id });
      const postRes = await postsService.get(id as any);
      const latestPost = (postRes as any)?.data?.post ?? (postRes as any)?.post ?? null;
      if (!postRes.success || !latestPost) {
        toast({ title: "Publish failed", description: (postRes as any).error || "Could not load post details", variant: "destructive" });
        return;
      }

      // Prefer latest platforms, fallback to the list item if missing
      const rawPlatforms = latestPost?.platforms?.length ? latestPost.platforms : post.platforms;
      const platforms = normalizePlatforms(rawPlatforms);
      const accountIds = extractAccountIds(rawPlatforms);
      if (!platforms.length) {
        toast({ title: "Publish failed", description: "Post has no platforms configured", variant: "destructive" });
        return;
      }
      // 2) Call social/posts with camelCase payload; include accountIds if available
      const payload = { postId: id as any, publishNow: true, platforms, ...(Object.keys(accountIds).length ? { accountIds } : {}) };
      console.log('[Content] PublishNow: calling social/posts', payload);
      const res = await socialService.scheduleOrPublish(payload);
      if (!res.success) {
        toast({ title: "Publish failed", description: res.error || "Unexpected error", variant: "destructive" });
        return;
      }
      toast({ title: "Post published", description: "Post was sent to connected channels." });
      await refetch();
      setActiveTab("published");
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Unexpected error", variant: "destructive" });
    } finally {
      setSendingId(null);
    }
  };
  const handleViewAnalytics = (post: PostItem) => {
    console.log("View analytics", post.post_id ?? post.id);
  };
  const handleRepost = (post: PostItem) => {
    console.log("Repost", post.post_id ?? post.id);
  };

  const openDecision = (post: PostItem, type: "approve" | "reject") => {
    setDecisionTarget(post);
    setDecisionType(type);
    setDecisionComment("");
    setDecisionOpen(true);
  };

  const confirmDecision = async () => {
    if (!decisionTarget || !decisionType) return;
    const id = decisionTarget.post_id ?? decisionTarget.id;
    if (!id) return;
    try {
      setDecisionLoading(true);
      // Add comment first (optional but recommended)
      if (decisionComment.trim().length > 0) {
        const commentRes = await postsService.addComment(id as any, {
          message: decisionComment.trim(),
        });
        if (!commentRes.success) {
          toast({
            title: "Failed to add comment",
            description: commentRes.error || "Unexpected error",
            variant: "destructive",
          });
          setDecisionLoading(false);
          return;
        }
      }

      const nextStatus = decisionType === "approve" ? "approved" : "draft";
      const actionRes = await postsService.action(id as any, "update_status", { status: nextStatus });
      if (!actionRes.success) {
        toast({
          title: decisionType === "approve" ? "Approve failed" : "Reject failed",
          description: actionRes.error || "Unexpected error",
          variant: "destructive",
        });
        setDecisionLoading(false);
        return;
      }

      toast({
        title: decisionType === "approve" ? "Post approved" : "Post rejected",
        description: decisionType === "approve" ? "The post moved to Approved." : "The post returned to Drafts.",
      });
      setDecisionOpen(false);
      setDecisionTarget(null);
      setDecisionType(null);
      setDecisionComment("");
      await refetch();
      setActiveTab(decisionType === "approve" ? "approved" : "draft");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Approval Workflow</h1>
            <p className="text-xs text-muted-foreground">{subtitleByTab[activeTab]}</p>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex gap-2.5">
            <Select value={platform} onValueChange={(v) => setPlatform(v as any)}>
              <SelectTrigger 
                className="h-9 px-3 rounded-xl border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-400 hover:ring-4 hover:ring-blue-50 transition-all group w-40 justify-between shadow-sm text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                    <SelectValue placeholder="Channels" />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border-gray-100 p-1">
                {PLATFORM_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p} className="rounded-lg">
                    <div className="flex items-center gap-2">
                      {platformIcons[p]}
                      <span>{PLATFORM_LABELS[p]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={`${sortBy}:${sortOrder}`} onValueChange={(v) => {
              const [by, order] = v.split(":");
              setSortBy(by);
              setSortOrder(order.toUpperCase() as any);
            }}>
              <SelectTrigger 
                className="h-9 px-3 rounded-xl border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-400 hover:ring-4 hover:ring-blue-50 transition-all group w-40 justify-between shadow-sm text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Filter className="h-4 w-4 text-gray-500 group-hover:text-blue-500" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                    <SelectValue placeholder="Sort" />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border-gray-100 p-1">
                <SelectItem value="created_at:DESC" className="rounded-lg text-sm">Newest</SelectItem>
                <SelectItem value="created_at:ASC" className="rounded-lg text-sm">Oldest</SelectItem>
                <SelectItem value="post_name:ASC" className="rounded-lg text-sm">Title A–Z</SelectItem>
                <SelectItem value="post_name:DESC" className="rounded-lg text-sm">Title Z–A</SelectItem>
                <SelectItem value="scheduled_time:ASC" className="rounded-lg text-sm">Schedule ↑</SelectItem>
                <SelectItem value="scheduled_time:DESC" className="rounded-lg text-sm">Schedule ↓</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => refetch()} 
              aria-label="Apply filters"
              className="h-9 w-9 rounded-xl border-gray-200 hover:bg-gray-50 hover:border-blue-400 hover:ring-4 hover:ring-blue-50 transition-all shadow-sm"
            >
              <Filter className="h-3.5 w-3.5 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Status tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StatusTab)}>
          <TabsList className="bg-muted/30 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-background">
              All <span className="ml-1.5 text-xs text-muted-foreground">({meta?.total ?? "–"})</span>
            </TabsTrigger>
            {Object.keys(statusLabel).map((key) => {
              const k = key as Exclude<StatusTab, "all">;
              return (
                <TabsTrigger key={k} value={k} className="data-[state=active]:bg-background">
                  {statusLabel[k]}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* List */}
        <div className="bg-background rounded-xl border border-border shadow-card p-2">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              <Loader showText text="Loading posts…" />
            </div>
          ) : isError ? (
            <div className="p-12 text-center text-destructive">
              Failed to load posts. Please try again.
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No posts found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search or filters." : "Start by creating content from the Posts section."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const platforms = normalizePlatforms(post.platforms);
                const title = post.post_name || `Post #${post.post_id || post.id}`;
                const desc = post.description || "";
                const status = String(post.status || "").toLowerCase() as Exclude<StatusTab, "all">;
                return (
                  <div key={(post.post_id ?? post.id) as any} className="space-y-2" id={`post-${post.post_id ?? post.id}`}>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="flex gap-4">
                      {/* Thumbnail */}
                    <div className="hidden sm:block shrink-0">
                      <div className="w-24 h-24 rounded-lg border border-border bg-muted overflow-hidden">
                        {(() => {
                          const src = pickThumbnail(post);
                          if (!src) {
                            return (
                              <img
                                src="/placeholder.svg"
                                alt="No media"
                                className="w-full h-full object-cover opacity-60"
                              />
                            );
                          }
                          return (
                            <img
                              src={src}
                              alt={post.post_name || "Post thumbnail"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                                e.currentTarget.classList.add("opacity-60");
                              }}
                            />
                          );
                        })()}
                      </div>
                    </div>

                      {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {status && status !== "all" && (
                          <Badge variant="outline" className={cn("border", statusBadgeClass[status] || "bg-muted text-muted-foreground")}>{statusLabel[status] || status}</Badge>
                        )}
                        {post.scheduled_time && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" /> {new Date(post.scheduled_time).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="mt-1 text-base font-semibold text-foreground truncate">{title}</h3>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" aria-label="Delete" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="link" className="px-0" asChild>
                            <Link to={`/posts/${post.post_id ?? post.id}/edit`}>Edit Post</Link>
                          </Button>
                        </div>
                      </div>
                      {desc && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{desc}</p>}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {platforms.map((p) => (
                          <Badge key={p} variant="secondary" className="text-xs capitalize">{p}</Badge>
                        ))}
                        {platforms.length === 0 && (
                          <span className="text-xs text-muted-foreground">No channels</span>
                        )}
                      </div>
                      </div>
                    </div>
                    </div>
                  {/* Bottom Actions Bar */}
                  <div className="px-4 pb-2">
                    <div className="flex items-center justify-between">
                      {status === "review" ? (
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" size="sm" className="px-2" onClick={() => toggleComments(post)}>
                            <MessageSquare className="h-3.5 w-3.5 mr-2" /> Comments
                          </Button>
                          <Button
                            onClick={() => openDecision(post, "approve")}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => openDecision(post, "reject")}
                            size="sm"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {(status === "scheduled" || status === "published" || status === "draft") && (
                            <Button variant="ghost" size="sm" className="px-2" onClick={() => toggleComments(post)}>
                              <MessageSquare className="h-3.5 w-3.5 mr-2" /> Comments
                            </Button>
                          )}
                          {status === "draft" && (
                            <Button
                              onClick={() => handleSendForApproval(post)}
                              disabled={sendingId === (post.post_id ?? post.id)}
                              size="sm"
                              className="bg-amber-500 hover:bg-amber-600 text-white"
                            >
                              {sendingId === (post.post_id ?? post.id) ? (
                                <span className="flex items-center"><Loader size="sm" className="mr-2" /> Sending…</span>
                              ) : (
                                'Send for Approval'
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {status === "scheduled" ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleSchedule(post)}>Reschedule</Button>
                            <Button size="sm" onClick={() => handlePublishNow(post)}>Publish Now</Button>
                          </>
                        ) : status === "published" ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleViewAnalytics?.(post)}>View analytics</Button>
                            <Button size="sm" onClick={() => handleRepost?.(post)}>Repost</Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleSchedule(post)}>Schedule</Button>
                            <Button size="sm" onClick={() => handlePublishNow(post)}>Publish Now</Button>
                          </>
                        )}
                      </div>
                    </div>
                    {expandedComments.has(post.post_id ?? post.id) && (
                      <div className="px-4 pb-4">
                        <CommentsPanel
                          postId={(post.post_id ?? post.id) as any}
                          submitting={commentSubmitting}
                          onSubmit={async (payload: { message: string; parent_comment_id?: number; mentions?: number[] }) => {
                            const id = (post.post_id ?? post.id) as any;
                            try {
                              setCommentSubmitting(true);
                              const res = await postsService.addComment(id, payload);
                              if (!res.success) {
                                toast({ title: "Failed to add comment", description: res.error || "Unexpected error", variant: "destructive" });
                              } else {
                                window.dispatchEvent(new CustomEvent("rb:notify", {
                                  detail: {
                                    title: payload.parent_comment_id ? "Replied to a comment" : "New comment",
                                    description: (post.post_name || `Post #${post.post_id ?? post.id}`),
                                    type: "comment",
                                    postId: Number(id),
                                  },
                                }));
                              }
                            } finally {
                              setCommentSubmitting(false);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Schedule Dialog */}
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <MotionDialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{scheduleTarget?.status === "scheduled" ? "Reschedule Post" : "Schedule Post"}</DialogTitle>
              <DialogDescription>
                Pick a date and time for publishing. This does not publish immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <label className="text-sm font-medium">Publish at</label>
              <Input type="datetime-local" value={scheduleValue} onChange={(e) => setScheduleValue(e.target.value)} />
              {scheduleTarget?.scheduled_time && (
                <p className="text-xs text-muted-foreground">Currently: {new Date(scheduleTarget.scheduled_time).toLocaleString()}</p>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setScheduleOpen(false)} disabled={scheduleSubmitting}>Cancel</Button>
              <Button onClick={async () => {
                const id = (scheduleTarget?.post_id ?? scheduleTarget?.id) as any;
                if (!id || !scheduleValue) { setScheduleOpen(false); return; }
                try {
                  setScheduleSubmitting(true);
                  const iso = new Date(scheduleValue).toISOString();
                  // 1) Fetch latest post ONLY (no accounts call)
                  console.log('[Content] Schedule: fetching post', { id, scheduleValue });
                  const postRes = await postsService.get(id);

                  if (!postRes.success || !((postRes as any)?.data?.post ?? (postRes as any)?.post)) {
                    toast({ title: scheduleTarget?.status === "scheduled" ? "Reschedule failed" : "Schedule failed", description: postRes.error || "Could not load post details", variant: "destructive" });
                    return;
                  }
                  const platforms = postRes?.post?.platforms
                  if (!platforms.length) {
                    toast({ title: scheduleTarget?.status === "scheduled" ? "Reschedule failed" : "Schedule failed", description: "Post has no platforms configured", variant: "destructive" });
                    return;
                  }
                  
                  // 2) Call social/posts with camelCase payload; include accountIds if available
                  const payload = { postId: id, scheduledFor: iso, platforms:platforms,publishNow:false };
                  console.log('[Content] Schedule: calling social/posts', payload);
                  const res = await socialService.scheduleOrPublish(payload);
                  if (!res.success) {
                    toast({ title: scheduleTarget?.status === "scheduled" ? "Reschedule failed" : "Schedule failed", description: res.error || "Unexpected error", variant: "destructive" });
                    return;
                  }
                  toast({ title: scheduleTarget?.status === "scheduled" ? "Post rescheduled" : "Post scheduled", description: `Will publish at ${new Date(iso).toLocaleString()}` });
                  setScheduleOpen(false);
                  setScheduleTarget(null);
                  await refetch();
                  setActiveTab("scheduled");
                } catch (error) {
                  toast({ title: "Error", description: error instanceof Error ? error.message : "Unexpected error", variant: "destructive" });
                } finally {
                  setScheduleSubmitting(false);
                }
              }} disabled={scheduleSubmitting}>{scheduleTarget?.status === "scheduled" ? "Reschedule" : "Schedule"}</Button>
            </DialogFooter>
          </MotionDialogContent>
        </Dialog>

        {/* Decision Dialog */}
        <Dialog open={decisionOpen} onOpenChange={setDecisionOpen}> 
          <MotionDialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {decisionType === "approve" ? "Approve Post" : decisionType === "reject" ? "Reject Post" : "Decision"}
              </DialogTitle>
              <DialogDescription>
                {decisionType === "approve"
                  ? "Optionally add a comment for the author, then confirm approval."
                  : decisionType === "reject"
                  ? "Add a comment explaining changes needed, then confirm rejection."
                  : "Add a comment and confirm your decision."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm font-medium">Comment</p>
              <Textarea
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder="Share your feedback or rationale (optional)"
                className="min-h-[120px]"
              />
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setDecisionOpen(false)} disabled={decisionLoading}>Cancel</Button>
              <Button onClick={confirmDecision} disabled={decisionLoading}>
                {decisionLoading ? (
                  <span className="flex items-center"><Loader size="sm" className="mr-2" /> Processing…</span>
                ) : (
                  decisionType === "approve" ? "Confirm Approve" : decisionType === "reject" ? "Confirm Reject" : "Confirm"
                )}
              </Button>
            </DialogFooter>
          </MotionDialogContent>
        </Dialog>

        {/* Inline comments are rendered per post above; dialog removed */}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {meta ? `Page ${meta.page} of ${meta.totalPages} · ${meta.total} total` : ""}
            {isFetching && <span className="ml-2">Updating…</span>}
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(limit)} onValueChange={(v) => setLimit(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={(meta?.page ?? 1) <= 1}>
              Prev
            </Button>
            <Button variant="outline" onClick={() => setPage((p) => (meta && meta.page < (meta.totalPages || 1) ? p + 1 : p))} disabled={!meta || meta.page >= (meta.totalPages || 1)}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Content;

// Lightweight comments panel used in the comments dialog
function CommentsPanel({
  postId,
  submitting,
  onSubmit,
}: {
  postId: number | string | undefined;
  submitting: boolean;
  onSubmit: (payload: { message: string; parent_comment_id?: number; mentions?: number[] }) => Promise<void> | void;
}) {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentions, setMentions] = useState<number[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [activeComposer, setActiveComposer] = useState<"root" | "reply" | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["comments", postId],
    enabled: !!postId,
    queryFn: async () => {
      if (!postId) return { comments: [] } as { comments: any[] };
      const res = await postsService.getComments(postId);
      if (!res.success) throw new Error(res.error || "Failed to load comments");
      // Support both response shapes: { comments } or { data: { comments } }
      const list = (res as any).comments ?? (res.data as any)?.comments ?? [];
      return { comments: Array.isArray(list) ? list : [] };
    },
    staleTime: 5_000,
  });

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await userService.list();
      return res.data?.users ?? [];
    },
  });

  const comments = (data?.comments ?? []) as any[];

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !postId) return;
    await onSubmit({ message: text, parent_comment_id: replyTo ?? undefined, mentions: mentions.length ? mentions : undefined });
    setMessage("");
    setReplyTo(null);
    setMentions([]);
    await refetch();
  };

  // Detect "@" and open the mention popover with live query
  useEffect(() => {
    const lastAt = message.lastIndexOf("@");
    if (lastAt >= 0) {
      const tail = message.slice(lastAt + 1);
      const hasSpace = /\s/.test(tail);
      if (!hasSpace) {
        setMentionOpen(true);
        setMentionQuery(tail);
        return;
      }
    }
    setMentionOpen(false);
    setMentionQuery("");
  }, [message]);

  const insertMention = (user: any) => {
    const name = user?.name || "user";
    const id = user?.id;
    const lastAt = message.lastIndexOf("@");
    const base = lastAt >= 0 ? message.slice(0, lastAt) : message;
    const next = `${base}@${name} `;
    setMessage(next);
    setMentions((m) => (id && !m.includes(id) ? [...m, id] : m));
    setMentionOpen(false);
  };

  const currentUserId = authService.getUser()?.id;

  const renderThread = (c: any, depth = 0) => {
    const author = c?.User?.name || c?.user?.name || c?.author?.name || "User";
    const authorId = c?.User?.id ?? c?.user?.id ?? c?.author?.id;
    const created = c?.created_at || c?.createdAt || c?.timestamp;
    const when = created ? new Date(created).toLocaleString() : "";
    const isMine = authorId && currentUserId && Number(authorId) === Number(currentUserId);
    return (
      <div key={(c?.comment_id ?? c?.id ?? when) as any} className={cn("mb-3", depth > 0 ? "ml-8" : "")}>
        <div className={cn("flex items-start gap-2", isMine ? "justify-end" : "justify-start")}> 
          {!isMine && (
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>{String(author).trim().charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          )}
          <div className={cn("max-w-[75%] rounded-lg px-3 py-2", isMine ? "bg-primary text-primary-foreground" : "bg-background border border-border")}> 
            <div className="text-xs opacity-80 flex items-center justify-between gap-3">
              <span className="font-medium">{author}</span>
              <span className="text-muted-foreground">{when}</span>
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm">{c?.message || c?.text || ""}</div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setReplyTo(Number(c?.comment_id ?? c?.id))}>
                <Reply className="h-3.5 w-3.5 mr-1" /> Reply
              </Button>
            </div>
          </div>
          {isMine && (
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>{String(author).trim().charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          )}
        </div>
        {/* Inline reply composer */}
        {replyTo && Number(replyTo) === Number(c?.comment_id ?? c?.id) && (
          <div className="mt-2 ml-8">
            <Popover open={mentionOpen && activeComposer === "reply"} onOpenChange={setMentionOpen}>
              <PopoverTrigger asChild>
                <Textarea value={message} onFocus={() => setActiveComposer("reply")} onChange={(e) => setMessage(e.target.value)} placeholder={`Reply to ${author}…`} className="min-h-[60px]" />
              </PopoverTrigger>
              <PopoverContent className="p-0 w-64">
                <Command>
                  <CommandInput value={mentionQuery} placeholder="Search users…" onValueChange={setMentionQuery} />
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {(usersData ?? [])
                      .filter((u: any) => String(u?.name || "").toLowerCase().includes(String(mentionQuery).toLowerCase()))
                      .map((u: any) => (
                        <CommandItem key={u.id} onSelect={() => insertMention(u)}>
                          {u.name}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-wrap gap-1">
                {mentions.map((id) => {
                  const u = (usersData ?? []).find((x: any) => x.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="text-xs">
                      @{u?.name || id}
                      <button className="ml-1 opacity-70" onClick={() => setMentions((m) => m.filter((x) => x !== id))}>×</button>
                    </Badge>
                  );
                })}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { setMessage(""); setMentions([]); setReplyTo(null); }}>Cancel</Button>
                <Button size="sm" onClick={handleSend} disabled={submitting || !message.trim()}>{submitting ? <span className="flex items-center"><Loader size="sm" className="mr-2" />Sending…</span> : "Send"}</Button>
              </div>
            </div>
          </div>
        )}
        {/* Children */}
        {(c?.children ?? []).map((child: any) => renderThread(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[12px] text-muted-foreground px-1">
        <span className="font-medium">Comments ({comments.length})</span>
      </div>
      <ScrollArea className="h-[320px] border rounded-md p-3 bg-muted/20">
        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            <Loader showText text="Loading comments…" />
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-destructive text-sm">Failed to load comments.</div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">No comments yet.</div>
        ) : (
          <div className="space-y-3">
            {comments.map((c: any) => renderThread(c, 0))}
          </div>
        )}
      </ScrollArea>

      {/* Root composer */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Add a comment</label>
        <Popover open={mentionOpen && activeComposer === "root"} onOpenChange={setMentionOpen}>
          <PopoverTrigger asChild>
            <Textarea
              value={message}
              onFocus={() => setActiveComposer("root")}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message…"
              className="min-h-[70px]"
            />
          </PopoverTrigger>
          <PopoverContent className="p-0 w-64">
            <Command>
              <CommandInput value={mentionQuery} placeholder="Search users…" onValueChange={setMentionQuery} />
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {(usersData ?? [])
                  .filter((u: any) => String(u?.name || "").toLowerCase().includes(String(mentionQuery).toLowerCase()))
                  .map((u: any) => (
                    <CommandItem key={u.id} onSelect={() => insertMention(u)}>
                      {u.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
          <div className="flex flex-wrap gap-1">
            {mentions.map((id) => {
              const u = (usersData ?? []).find((x: any) => x.id === id);
              return (
                <Badge key={id} variant="secondary" className="text-xs">
                  @{u?.name || id}
                  <button className="ml-1 opacity-70" onClick={() => setMentions((m) => m.filter((x) => x !== id))}>×</button>
                </Badge>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => { setMessage(""); setMentions([]); }}>Clear</Button>
            <Button onClick={handleSend} disabled={submitting || !message.trim()}>
              {submitting ? <span className="flex items-center"><Loader size="sm" className="mr-2" /> Sending…</span> : "Send"}
            </Button>
          </div>
        </div>
      </div>
  );
}