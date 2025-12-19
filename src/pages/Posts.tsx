import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          <Button asChild>
            <Link to="/posts/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Link>
          </Button>
        </div>

        {/* Filters and search */}
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

        {/* Status tabs */}
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

        {/* Posts list */}
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
              <Button asChild>
                <Link to="/posts/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Link>
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
      </div>
    </DashboardLayout>
  );
};

export default Posts;
