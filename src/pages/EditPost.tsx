import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { postsService, PostItem } from "@/services/posts.service";
import { socialService } from "@/services/social.service";
import { Loader2, Calendar, ArrowLeft, Edit as EditIcon } from "lucide-react";

const platformNameFromEntry = (entry: any): string => {
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  if (typeof entry === "object") {
    if ((entry as any).platform) return String((entry as any).platform);
    const keys = Object.keys(entry);
    if (keys.length) return keys[0];
  }
  return "";
};

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleValue, setScheduleValue] = useState<string>("");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) { navigate("/posts"); return; }
      try {
        setLoading(true);
        const res = await postsService.get(id);
        const p: any = (res as any)?.data?.post ?? (res as any)?.post;
        if (!p) { setLoading(false); return; }
        setPost(p);
        setTitle(String(p.post_name || "Untitled"));
        setDescription(String(p.description || ""));
        if (p.scheduled_time) {
          const d = new Date(p.scheduled_time);
          setScheduleValue(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const attachments: Array<{ url: string; type?: string }> = useMemo(() => {
    const list = (post as any)?.attachments ?? [];
    if (!Array.isArray(list)) return [];
    return list.map((a: any) => ({ url: String(a?.url || a?.src || a), type: String(a?.type || "image") }));
  }, [post]);

  const platforms: string[] = useMemo(() => {
    const p = (post as any)?.platforms;
    if (!p) return [];
    const arr = Array.isArray(p) ? p : [p];
    return arr.map(platformNameFromEntry).filter(Boolean);
  }, [post]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-xl font-semibold">Edit Post</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setScheduleOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              {post?.status === "scheduled" ? "Reschedule" : "Schedule"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : post ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview column */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                {attachments.length > 0 ? (
                  <img src={attachments[0].url} alt="Attachment" className="w-full aspect-video object-cover" />
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-muted">No image</div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((pl) => (
                      <Badge key={pl} variant="outline" className="capitalize">{pl}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Status: <span className="font-medium capitalize">{String(post.status || "draft")}</span></p>
                  {post.scheduled_time && (
                    <p className="text-sm text-muted-foreground">Scheduled: {new Date(post.scheduled_time).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Editor column */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-border shadow-card p-4 space-y-4">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write your post..." rows={10} />
                <div className="flex items-center gap-2">
                  <Button disabled>
                    <EditIcon className="h-4 w-4 mr-2" />
                    Save (content editing not enabled)
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/posts/create">Duplicate to new post</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">Post not found.</div>
        )}

        {/* Schedule Dialog */}
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{post?.status === "scheduled" ? "Reschedule Post" : "Schedule Post"}</DialogTitle>
              <DialogDescription>Pick a date and time for publishing.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <label className="text-sm font-medium">Publish at</label>
              <Input type="datetime-local" value={scheduleValue} onChange={(e) => setScheduleValue(e.target.value)} />
              {post?.scheduled_time && (
                <p className="text-xs text-muted-foreground">Currently: {new Date(post.scheduled_time).toLocaleString()}</p>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setScheduleOpen(false)} disabled={scheduleSubmitting}>Cancel</Button>
              <Button onClick={async () => {
                if (!id || !scheduleValue) { setScheduleOpen(false); return; }
                try {
                  setScheduleSubmitting(true);
                  const iso = new Date(scheduleValue).toISOString();
                  const postRes = await postsService.get(id);
                  const loaded: any = (postRes as any)?.data?.post ?? (postRes as any)?.post;
                  const platforms = loaded?.platforms ?? [];
                  if (!Array.isArray(platforms) || platforms.length === 0) {
                    setScheduleOpen(false);
                    return;
                  }
                  const payload = { postId: id, scheduledFor: iso, platforms, publishNow: false } as any;
                  const res = await socialService.scheduleOrPublish(payload);
                  if ((res as any)?.success) {
                    setScheduleOpen(false);
                    navigate(`/posts?status=scheduled`);
                  }
                } finally {
                  setScheduleSubmitting(false);
                }
              }} disabled={scheduleSubmitting}>{post?.status === "scheduled" ? "Reschedule" : "Schedule"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default EditPost;