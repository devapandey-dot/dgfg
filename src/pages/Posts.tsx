import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Crop,
  Smile,
  Hash,
  Type,
  Heart,
  MessageCircle,
  Send,
  Play,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { postsService, PostItem } from "@/services/posts.service";
import { socialService, SocialAccount } from "@/services/social.service";
import { uploadService } from "@/services/upload.service";
import { mediaService, MediaAssetItem } from "@/services/media.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PostStatus = "all" | "draft" | "pending" | "approved" | "scheduled" | "published";

const statusConfig: Record<Exclude<PostStatus, "all">, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  pending: { label: "Pending Review", className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "Approved", className: "bg-info/10 text-info border-info/20" },
  scheduled: { label: "Scheduled", className: "bg-primary/10 text-primary border-primary/20" },
  published: { label: "Published", className: "bg-success/10 text-success border-success/20" },
};

const platformIcons: Record<string, string> = {
  twitter: "𝕏",
  facebook: "f",
  instagram: "📷",
  linkedin: "in",
  bluesky: "🦋",
};

const mockPosts = [
  {
    id: "1",
    title: "Your June Email Campaign",
    excerpt: "Check out our latest email campaign strategies for better engagement and conversion rates...",
    status: "published" as const,
    scheduledAt: "Dec 15, 2024",
    publishedAt: "Dec 15, 2024 10:00 AM",
    author: "John Doe",
    platforms: ["twitter", "facebook", "linkedin"],
    comments: 5,
    thumbnail: "/placeholder.svg",
  },
  {
    id: "2",
    title: "Product Launch Announcement",
    excerpt: "We're excited to announce our new product line that will revolutionize the industry...",
    status: "scheduled" as const,
    scheduledAt: "Dec 20, 2024 10:00 AM",
    author: "Jane Smith",
    platforms: ["instagram", "twitter"],
    comments: 2,
    thumbnail: "/placeholder.svg",
  },
  {
    id: "3",
    title: "Holiday Special Promotion",
    excerpt: "This holiday season, enjoy our special discounts and exclusive offers...",
    status: "pending" as const,
    scheduledAt: "Dec 23, 2024 2:00 PM",
    author: "Mike Johnson",
    platforms: ["facebook", "instagram"],
    comments: 8,
    thumbnail: "/placeholder.svg",
  },
  {
    id: "4",
    title: "Year in Review Post",
    excerpt: "Looking back at our incredible journey in 2024 and the milestones we've achieved...",
    status: "draft" as const,
    author: "Sarah Wilson",
    platforms: ["linkedin"],
    comments: 0,
    thumbnail: "/placeholder.svg",
  },
  {
    id: "5",
    title: "New Feature Announcement",
    excerpt: "Introducing our latest feature that will make your workflow more efficient...",
    status: "approved" as const,
    scheduledAt: "Dec 28, 2024 9:00 AM",
    author: "John Doe",
    platforms: ["twitter", "linkedin"],
    comments: 3,
    thumbnail: "/placeholder.svg",
  },
  {
    id: "6",
    title: "Behind the Scenes",
    excerpt: "Take a look at what goes on behind the scenes at our company...",
    status: "draft" as const,
    author: "Emily Chen",
    platforms: ["instagram"],
    comments: 1,
    thumbnail: "/placeholder.svg",
  },
];

const Posts = () => {
  const [activeTab, setActiveTab] = useState<PostStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth());
  const [year, setYear] = useState<number>(now.getFullYear());
  const [scheduledPosts, setScheduledPosts] = useState<PostItem[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composeTitle, setComposeTitle] = useState("");
  const [composeText, setComposeText] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);

  // Composer enhancements
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [postType, setPostType] = useState<'post' | 'reel' | 'story'>('post');
  const [attachments, setAttachments] = useState<Array<{ file_url: string; file_type: string; file_size?: number }>>([]);
  const [composeFirstComment, setComposeFirstComment] = useState<string>("");
  const [createAnother, setCreateAnother] = useState<boolean>(false);
  const [firstAspectRatio, setFirstAspectRatio] = useState<number | null>(null);
  const [libraryAssets, setLibraryAssets] = useState<MediaAssetItem[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  const months = useMemo(() => [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ], []);
  const monthName = useMemo(() => new Date(year, month, 1).toLocaleString(undefined, { month: 'long' }), [year, month]);

  const formatKey = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const postsByDay = useMemo(() => {
    const map = new Map<string, PostItem[]>();
    scheduledPosts.forEach(p => {
      const iso = p.scheduled_time || '';
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        const key = formatKey(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
        const arr = map.get(key) || [];
        arr.push(p);
        map.set(key, arr);
      }
    });
    return map;
  }, [scheduledPosts]);

  const loadMonth = async () => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const res = await postsService.list({
      status: 'scheduled',
      scheduled_from: start.toISOString(),
      scheduled_to: end.toISOString(),
      limit: 500,
      sort_by: 'scheduled_time',
      sort_order: 'ASC',
    });
    if (res.success) {
      const list = Array.isArray(res.data) ? (res.data as any[]) : (res.data?.data ?? []);
      setScheduledPosts(list as PostItem[]);
    }
  };

  useEffect(() => {
    if (viewMode === 'calendar') {
      loadMonth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, month, year]);

  // Load connected channels when composer opens
  useEffect(() => {
    if (!composerOpen) return;
    (async () => {
      const res = await socialService.getAccounts({ is_active: true });
      const list = Array.isArray(res.data) ? (res.data as SocialAccount[]) : (res.data?.data ?? []);
      if (res.success && list) {
        setAccounts(list);
        if (!selectedAccountIds.length && list.length) {
          setSelectedAccountIds([list[0].id]);
        }
      }
    })();
  }, [composerOpen]);

  const toggleSelectAccount = (id: number) => {
    setSelectedAccountIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const handleLocalFiles = async (files?: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const next: Array<{ file_url: string; file_type: string; file_size?: number }> = [];
      for (const file of Array.from(files)) {
        const res = await uploadService.uploadFile(file);
        if (res.success && res.data) {
          next.push({ file_url: res.data.url, file_type: res.data.mimetype, file_size: res.data.size });
          // best-effort add to media library
          try { await mediaService.create({ file_url: res.data.url, file_type: res.data.mimetype, file_size: res.data.size, original_name: file.name }); } catch {}
        }
      }
      if (next.length) setAttachments((prev) => [...prev, ...next]);
    } finally {
      setUploading(false);
    }
  };

  const openLibrary = async () => {
    const res = await mediaService.list({ limit: 24, sort_by: 'created_at', sort_order: 'DESC' });
    const list = Array.isArray(res.data) ? (res.data as any).data : res.data?.data;
    if (res.success && list) {
      setLibraryAssets(list as MediaAssetItem[]);
      setLibraryOpen(true);
    }
  };

  const addAssetToPost = (asset: MediaAssetItem) => {
    setAttachments((prev) => [...prev, { file_url: asset.file_url, file_type: asset.file_type, file_size: asset.file_size }]);
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Simple platform-specific preview renderer
  const renderPlatformPreview = (acc: SocialAccount, text: string, att?: { file_url: string; file_type: string }) => {
    const avatar = (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
        {platformIcons[acc.platform] || '📷'}
      </div>
    );
    const media = att?.file_url ? (
      <div className="rounded-md overflow-hidden border mb-3">
        {att.file_type?.startsWith('image/') ? (
          <img src={att.file_url} alt="attachment" className="w-full h-40 object-cover" />
        ) : (
          <video src={att.file_url} controls className="w-full h-40 object-cover" />
        )}
      </div>
    ) : null;

    switch (acc.platform) {
      case 'twitter':
      case 'x':
        return (
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-3 mb-2">
              {avatar}
              <div className="text-sm">
                <div className="font-semibold">{acc.display_name || acc.username || 'User'}</div>
                <div className="text-muted-foreground text-xs">@{acc.username || 'handle'}</div>
              </div>
            </div>
            <div className="text-sm whitespace-pre-wrap mb-3">{text || 'What’s happening?'}</div>
            {media}
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>💬</span><span>🔁</span><span>❤️</span><span>📊</span>
            </div>
          </div>
        );
      case 'instagram':
        // Instagram specific layouts for Post, Story, and Reel
        if (postType === 'story') {
          return (
            <div className="rounded-lg border bg-black text-white p-3">
              <div className="h-1 bg-white/40 rounded mb-2" />
              <div className="flex items-center gap-2 mb-2">
                {avatar}
                <div className="text-xs">{acc.username || 'you'} <span className="text-white/60">• 21h</span></div>
                <div className="ml-auto text-white/70">…</div>
              </div>
              <div className="rounded-md overflow-hidden border mb-2">
                {att?.file_url ? (
                  att.file_type?.startsWith('image/') ? (
                    <img src={att.file_url} alt="story" className="w-full h-[480px] object-cover" />
                  ) : (
                    <video src={att.file_url} controls className="w-full h-[480px] object-cover" />
                  )
                ) : (
                  <div className="w-full h-[480px] bg-white/10 flex items-center justify-center text-white/60">Story media</div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="bg-white/10 rounded-full px-4 py-2 text-xs">Send message</div>
                </div>
                <div className="flex items-center gap-4 ml-3 text-white/80">
                  <Heart className="h-4 w-4" />
                  <Send className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        }
        if (postType === 'reel') {
          return (
            <div className="rounded-lg border bg-black text-white p-3 relative">
              <div className="rounded-md overflow-hidden border mb-3 relative">
                {att?.file_url ? (
                  att.file_type?.startsWith('image/') ? (
                    <img src={att.file_url} alt="reel" className="w-full h-[480px] object-cover" />
                  ) : (
                    <video src={att.file_url} controls className="w-full h-[480px] object-cover" />
                  )
                ) : (
                  <div className="w-full h-[480px] bg-white/10 flex items-center justify-center text-white/60">Reel media</div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/80 rounded-full p-3">
                    <Play className="h-5 w-5 text-black" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {avatar}
                <div className="text-xs font-medium">{acc.username || 'user'}</div>
              </div>
              <div className="flex flex-col items-end gap-3 absolute right-6 top-24">
                <Heart className="h-5 w-5" />
                <MessageCircle className="h-5 w-5" />
                <Send className="h-5 w-5" />
              </div>
            </div>
          );
        }
        // Instagram feed Post
        return (
          <div className="rounded-lg border bg-background">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                {avatar}
                <div className="text-sm font-semibold">{acc.username || 'user'}</div>
              </div>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="w-full h-64 bg-muted overflow-hidden">
              {att?.file_url ? (
                att.file_type?.startsWith('image/') ? (
                  <img src={att.file_url} alt="post" className="w-full h-full object-cover" />
                ) : (
                  <video src={att.file_url} controls className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">Post media</div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center gap-4 text-foreground">
                <Heart className="h-5 w-5" />
                <MessageCircle className="h-5 w-5" />
                <Send className="h-5 w-5" />
              </div>
              <div className="mt-2 text-sm whitespace-pre-wrap">{text || 'Write a caption...'}</div>
            </div>
          </div>
        );
      case 'linkedin':
        return (
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-3 mb-2">
              {avatar}
              <div className="text-sm font-semibold">{acc.display_name || acc.username || 'User'}</div>
            </div>
            <div className="text-sm whitespace-pre-wrap mb-3">{text || 'Share an update...'}</div>
            {media}
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>👍</span><span>💬</span><span>↗</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center gap-3 mb-3">
              {avatar}
              <div className="text-sm">
                <div className="font-semibold">{acc.display_name || acc.username || acc.platform}</div>
                <div className="text-muted-foreground text-xs">@{acc.username || 'yourhandle'}</div>
              </div>
            </div>
            {media}
            <div className="text-sm whitespace-pre-wrap">{text || 'Write your caption...'}</div>
          </div>
        );
    }
  };

  const filteredPosts = mockPosts.filter((post) => {
    if (activeTab !== "all" && post.status !== activeTab) return false;
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusCounts = () => {
    const counts = {
      all: mockPosts.length,
      draft: 0,
      pending: 0,
      approved: 0,
      scheduled: 0,
      published: 0,
    };
    mockPosts.forEach((post) => {
      counts[post.status]++;
    });
    return counts;
  };

  const counts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Posts</h1>
            <p className="text-muted-foreground">Manage and schedule your social media content.</p>
          </div>
          <Button onClick={() => setComposerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <Button variant={viewMode === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('calendar')}>Calendar View</Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>Approval Status</Button>
        </div>

        {/* Calendar view */}
        {viewMode === 'calendar' && (
          <div className="space-y-4">
            {/* Calendar controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">{monthName} {year}</h2>
                <span className="text-sm text-muted-foreground">Month</span>
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map((m, idx) => (
                      <SelectItem key={m} value={String(idx)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="ml-3 text-sm text-muted-foreground">Year</span>
                <div className="inline-flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={() => setYear(y => y - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => setYear(y => y + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
                <div className="inline-flex items-center gap-1 ml-2">
                  <Button variant="outline" size="icon" onClick={() => {
                    const prev = new Date(year, month - 1, 1);
                    setYear(prev.getFullYear());
                    setMonth(prev.getMonth());
                  }}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => {
                    const next = new Date(year, month + 1, 1);
                    setYear(next.getFullYear());
                    setMonth(next.getMonth());
                  }}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
              {/* Removed calendar view "Create Post" button as requested */}
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-2 text-sm text-muted-foreground">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} className="text-center">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="bg-card rounded-xl border border-border shadow-card p-2">
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const first = new Date(year, month, 1);
                  const startOffset = first.getDay(); // 0=Sun
                  const gridStart = new Date(year, month, 1 - startOffset);
                  const cells = 42; // 6 weeks
                  const items: JSX.Element[] = [];
                  for (let i = 0; i < cells; i++) {
                    const d = new Date(gridStart);
                    d.setDate(gridStart.getDate() + i);
                    const inMonth = d.getMonth() === month;
                    const key = formatKey(d);
                    const dayPosts = postsByDay.get(key) || [];
                    items.push(
                      <div key={key} className={cn("min-h-[160px] rounded-lg border p-3", inMonth ? "border-border" : "border-transparent bg-muted/20") }>
                        <div className="flex items-center justify-between">
                          <span className={cn("text-sm font-medium", inMonth ? "text-foreground" : "text-muted-foreground")}>{d.getDate()}</span>
                        </div>
                        <div className="mt-2 space-y-1">
                          {dayPosts.slice(0,3).map((p) => {
                            const time = p.scheduled_time ? new Date(p.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                            return (
                              <div key={String(p.id ?? p.post_id)} className="text-[11px] flex items-center justify-between rounded bg-muted px-2 py-1">
                                <span className="truncate mr-2">{time} • {p.post_name || p.description || 'Scheduled Post'}</span>
                                <Link to={`/posts/${p.id ?? p.post_id}`} className="text-primary">View</Link>
                              </div>
                            );
                          })}
                          {dayPosts.length > 3 && (
                            <Link to={`/posts?date=${key}`} className="text-xs text-primary">View all ({dayPosts.length})</Link>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return items;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Filters and search */}
        {viewMode === 'list' && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select defaultValue="newest">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        )}

        {/* Status tabs */}
        {viewMode === 'list' && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PostStatus)}>
            <TabsList className="bg-muted/30 p-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-background">
                All <span className="ml-1.5 text-xs text-muted-foreground">({counts.all})</span>
              </TabsTrigger>
              <TabsTrigger value="draft" className="data-[state=active]:bg-background">
                Drafts <span className="ml-1.5 text-xs text-muted-foreground">({counts.draft})</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-background">
                Pending <span className="ml-1.5 text-xs text-muted-foreground">({counts.pending})</span>
              </TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-background">
                Approved <span className="ml-1.5 text-xs text-muted-foreground">({counts.approved})</span>
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="data-[state=active]:bg-background">
                Scheduled <span className="ml-1.5 text-xs text-muted-foreground">({counts.scheduled})</span>
              </TabsTrigger>
              <TabsTrigger value="published" className="data-[state=active]:bg-background">
                Published <span className="ml-1.5 text-xs text-muted-foreground">({counts.published})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Posts list */}
        {viewMode === 'list' && (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search or filters."
                  : "Create your first post to get started."}
              </p>
              <Button onClick={() => setComposerOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex gap-4 p-4 hover:bg-muted/20 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="hidden sm:block shrink-0">
                    <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden">
                      <img
                        src={post.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/posts/${post.id}`}
                            className="text-base font-semibold text-foreground hover:text-primary transition-colors truncate"
                          >
                            {post.title}
                          </Link>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium shrink-0",
                              statusConfig[post.status].className
                            )}
                          >
                            {statusConfig[post.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/posts/${post.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/posts/${post.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                      <span>{post.author}</span>
                      
                      {post.scheduledAt && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {post.scheduledAt}
                        </span>
                      )}
                      
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post.comments}
                      </span>

                      <div className="flex gap-1">
                        {post.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted text-xs font-medium"
                            title={platform}
                          >
                            {platformIcons[platform] || platform[0].toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Modal Composer */}
      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="w-[920px] max-w-[95vw] max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle>Create Post</DialogTitle>
                <Button variant="outline" size="sm">Tags</Button>
              </div>
              <Button variant="outline" onClick={() => setShowPreview((v) => !v)}>Preview</Button>
            </div>
          </DialogHeader>
          {/* Scrollable body to prevent viewport overflow */}
          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-64px)] grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Composer left */}
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Channels connected</Label>
                <div className="flex flex-wrap gap-2">
                  {accounts.length === 0 && (
                    <span className="text-xs text-muted-foreground">No channels yet. Connect from Channels page.</span>
                  )}
                  {accounts.map((acc) => {
                    const selected = selectedAccountIds.includes(acc.id);
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => toggleSelectAccount(acc.id)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm",
                          selected ? "bg-primary/10 border-primary/20 text-primary" : "bg-background hover:bg-muted/40"
                        )}
                        title={acc.platform}
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                          {platformIcons[acc.platform] || acc.platform?.[0]?.toUpperCase() || "?"}
                        </span>
                        <span className="truncate max-w-[160px]">
                          {acc.display_name || acc.username || acc.platform}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label className="text-sm text-muted-foreground">Type</Label>
                <div className="inline-flex items-center rounded-md border p-1 text-sm">
                  <Button variant={postType === 'post' ? 'default' : 'ghost'} size="sm" onClick={() => setPostType('post')}>Post</Button>
                  <Button variant={postType === 'reel' ? 'default' : 'ghost'} size="sm" onClick={() => setPostType('reel')}>Reel</Button>
                  <Button variant={postType === 'story' ? 'default' : 'ghost'} size="sm" onClick={() => setPostType('story')}>Story</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Add a short title" value={composeTitle} onChange={(e) => setComposeTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>What would you like to share?</Label>
                <Textarea rows={6} placeholder="Write your caption or content..." value={composeText} onChange={(e) => setComposeText(e.target.value)} />
              </div>

              {/* Quick actions under caption */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Button variant="ghost" size="icon-sm" title="Add media" onClick={() => document.getElementById('compose-file-input')?.click()}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Add emoji" onClick={() => setComposeText((t) => (t ? t + " 🙂" : "🙂"))}>
                  <Smile className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Insert hashtag" onClick={() => setComposeText((t) => (t ? t + " #" : "#"))}>
                  <Hash className="h-4 w-4" />
                </Button>
              </div>

              {/* Media area: left preview + right uploader */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative border rounded-lg overflow-hidden bg-muted/20">
                  {attachments[0] ? (
                    <div className="group">
                      {attachments[0].file_type.startsWith('image/') ? (
                        <img
                          src={attachments[0].file_url}
                          alt="attachment"
                          className="w-full h-40 object-cover"
                          onLoad={(e) => {
                            const img = e.currentTarget;
                            if (img.naturalWidth && img.naturalHeight) {
                              setFirstAspectRatio(img.naturalWidth / img.naturalHeight);
                            }
                          }}
                        />
                      ) : (
                        <video src={attachments[0].file_url} className="w-full h-40 object-cover" />
                      )}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Button variant="secondary" size="xs"><span className="inline-flex items-center gap-1"><Crop className="h-3 w-3" />Crop</span></Button>
                        <Button variant="secondary" size="xs"><span className="inline-flex items-center gap-1"><Type className="h-3 w-3" />ALT</span></Button>
                      </div>
                      <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeAttachment(0)}>×</Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">No media selected</div>
                  )}
                </div>
                <div className="border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                  Drag & drop or select a file
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="file" multiple accept="image/*,video/*" className="hidden" id="compose-file-input" onChange={(e) => handleLocalFiles(e.target.files)} />
                <Button variant="ghost" onClick={() => document.getElementById('compose-file-input')?.click()} disabled={uploading}>
                  {uploading ? 'Uploading…' : 'Upload from computer'}
                </Button>
                <Button variant="ghost" onClick={openLibrary}>Choose from media library</Button>
              </div>

              {/* Aspect ratio warning */}
              {attachments[0]?.file_type?.startsWith('image/') && firstAspectRatio !== null && (firstAspectRatio < 0.8 || firstAspectRatio > 1.91) && (
                <div className="rounded-md border border-warning/20 bg-warning/10 text-warning p-3 text-sm flex items-start gap-2">
                  <span className="font-medium">Action needed:</span>
                  <span>One or more images aren’t matching the expected aspect ratios (4:5 to 1.91:1). Crop it to post automatically, or switch to Notify Me to finish posting on mobile.</span>
                  <a href="#" className="underline">Learn more</a>
                </div>
              )}

              {/* Additional attachments grid */}
              {attachments.length > 1 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachments.slice(1).map((a, i) => (
                    <div key={`${a.file_url}-${i}`} className="relative rounded-lg overflow-hidden border">
                      <img src={a.file_url} alt="media" className="w-full h-24 object-cover" />
                      <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeAttachment(i+1)}>×</Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Embedded media library selector */}
              {libraryOpen && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Media Library</Label>
                    <Button variant="ghost" size="sm" onClick={() => setLibraryOpen(false)}>Close</Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {libraryAssets.map((asset) => (
                      <button key={asset.asset_id} type="button" onClick={() => addAssetToPost(asset)} className="rounded-md overflow-hidden border hover:ring-2 hover:ring-primary">
                        <img src={asset.file_url} alt={asset.title || ''} className="w-full h-24 object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* First comment */}
              <div className="space-y-2">
                <Label>First Comment</Label>
                <Input placeholder="Your comment" value={composeFirstComment} onChange={(e) => setComposeFirstComment(e.target.value)} />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="create-another" checked={createAnother} onCheckedChange={(v) => setCreateAnother(Boolean(v))} />
                  <Label htmlFor="create-another" className="text-sm text-muted-foreground">Create Another</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setComposerOpen(false)}>Close</Button>
                  <Button onClick={async () => {
                  setSavingDraft(true);
                  // Build keyed objects mapping platform -> late_account_id
                  const platformsKV = selectedAccountIds
                    .map((id) => {
                      const acc = accounts.find((a) => a.id === id);
                      if (!acc) return null;
                      const key = String(acc.platform || "").toLowerCase();
                      const lateId = acc.late_account_id ?? null;
                      return { [key]: lateId } as Record<string, string | null>;
                    })
                    .filter(Boolean) as Array<Record<string, string | null>>;

                  const payload = {
                    post_name: (composeTitle.trim() || "Untitled Post"),
                    post_type: postType,
                    description: composeText,
                    // Send key-value objects so backend preserves accountId
                    platforms: platformsKV.length ? platformsKV : [{ instagram: null }],
                    status: "draft",
                    attachments,
                  };
                  console.log('[Posts] SaveDraft payload', payload);
                  const res = await postsService.create(payload as any);
                  setSavingDraft(false);
                  if (res?.success) {
                    if (createAnother) {
                      setComposeTitle("");
                      setComposeText("");
                      setAttachments([]);
                      setLibraryOpen(false);
                      setComposeFirstComment("");
                      setFirstAspectRatio(null);
                    } else {
                      setComposerOpen(false);
                      setAttachments([]);
                      setLibraryOpen(false);
                    }
                  }
                }} disabled={savingDraft}>
                  {savingDraft ? "Saving..." : "Save Draft"}
                </Button>
                </div>
              </div>
            </div>

            {/* Preview right: supports multiple channels */}
            <div className="border-l lg:block hidden">
              {showPreview && (
                <div className="px-6 space-y-3 overflow-y-auto max-h-[70vh]">
                  {selectedAccountIds.map((id) => {
                    const acc = accounts.find(a => a.id === id);
                    if (!acc) return null;
                    const att = attachments[0];
                    const platformName = acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1);
                    return (
                      <div key={id}>
                        <h3 className="text-sm font-semibold mb-2">{platformName} Preview</h3>
                        {renderPlatformPreview(acc, composeText, att)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Inline media library panel moved inside modal above */}
    </DashboardLayout>
  );
};

export default Posts;
