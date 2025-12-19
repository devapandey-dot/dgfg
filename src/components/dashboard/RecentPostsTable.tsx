import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Calendar, MessageSquare } from "lucide-react";

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

const RecentPostsTable = ({ posts }: RecentPostsTableProps) => {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Recent Posts</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Scheduled
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Platforms
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Author
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{post.title}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        {post.comments} comments
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      statusConfig[post.status].className
                    )}
                  >
                    {statusConfig[post.status].label}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  {post.scheduledAt ? (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.scheduledAt}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {post.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium"
                        title={platform}
                      >
                        {platformIcons[platform] || platform[0].toUpperCase()}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {post.author}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentPostsTable;
