import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Calendar, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PostStatus = "draft" | "pending" | "approved" | "scheduled" | "published";

interface RecentPostsTableProps {
  posts: {
    id: string;
    title: string;
    status: PostStatus;
    scheduledAt?: string;
    author: string;
    platforms: string[];
    comments: number;
  }[];
  onOpenPost?: (id: string) => void;
}

const statusConfig: Record<PostStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "Approved", className: "bg-info/10 text-info border-info/20" },
  scheduled: { label: "Scheduled", className: "bg-primary/10 text-primary border-primary/20" },
  published: { label: "Published", className: "bg-success/10 text-success border-success/20" },
};

const platformIcons: Record<string, string> = {
  twitter: "𝕏",
  facebook: "f",
  instagram: "📷",
  linkedin: "in",
};

const RecentPostsTable = ({ posts, onOpenPost }: RecentPostsTableProps) => {
  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div className="px-4 py-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground tracking-tight">Recent Posts</h3>
        <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/10">
          {posts.length} Total
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20">
              <th className="px-3 py-3 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-wider min-w-[140px]">
                Title & Engagement
              </th>
              <th className="px-3 py-3 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-wider w-[80px]">
                Status
              </th>
              <th className="px-3 py-3 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                Scheduled
              </th>
              <th className="px-3 py-3 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                Platforms
              </th>
              <th className="px-3 py-3 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-wider w-[100px]">
                Author
              </th>
              <th className="px-3 py-3 text-right text-[9px] font-bold text-muted-foreground uppercase tracking-wider w-[60px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            <AnimatePresence initial={false}>
            {posts.map((post) => (
              <motion.tr
                key={post.id}
                className="hover:bg-primary/[0.02] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
                onClick={() => onOpenPost?.(post.id)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpenPost?.(post.id); }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                          <MessageSquare className="h-2.5 w-2.5" />
                          {post.comments}
                        </div>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-[10px] font-medium text-muted-foreground truncate">ID: {post.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-lg px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border-0 shadow-sm",
                      statusConfig[post.status].className
                    )}
                  >
                    {statusConfig[post.status].label}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                    <Calendar className="h-3 w-3 opacity-60" />
                    <span className="truncate">{post.scheduledAt || "Not set"}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    {post.platforms.map((p, i) => (
                      <span
                        key={i}
                        className="flex items-center justify-center h-5 w-5 rounded-md bg-muted/50 text-[9px] font-bold text-foreground border border-border/50 uppercase tracking-tighter"
                        title={p}
                      >
                        {platformIcons[p.toLowerCase()] || p.charAt(0)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center text-[9px] font-bold text-primary border border-primary/10 uppercase">
                      {post.author.charAt(0)}
                    </div>
                    <span className="text-[11px] font-medium text-foreground truncate">{post.author}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </motion.tr>
            ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentPostsTable;
