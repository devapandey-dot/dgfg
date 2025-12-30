import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CalendarIcon,
  Image as ImageIcon,
  Video,
  Link2,
  Bold,
  Italic,
  List,
  Upload,
  Clock,
  Send,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { socialService, SocialProfile, SocialAccount } from "@/services/social.service";
import { postsService } from "@/services/posts.service";
import { userService } from "@/services/user.service";
import { uploadService } from "@/services/upload.service";
import { mediaService, MediaAssetItem } from "@/services/media.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Map platform to simple icon token
const platformIcon: Record<string, string> = {
  twitter: "𝕏",
  x: "𝕏",
  facebook: "f",
  instagram: "📷",
  linkedin: "in",
  bluesky: "🦋",
  tiktok: "🎵",
};

const CreatePost = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string; roleName?: string }>>([]);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedAttachments, setUploadedAttachments] = useState<Array<{ file_url: string; file_type: string; file_size?: number }>>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<MediaAssetItem[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load profiles, users, and default accounts
  useEffect(() => {
    const loadInitial = async () => {
      // Profiles
      const profRes = await socialService.getProfiles();
      if (profRes.success && profRes.data) {
        setProfiles(profRes.data);
        const firstId = String(profRes.data[0]?.id || "");
        if (firstId) setSelectedProfileId(firstId);
      } else if (profRes.error) {
        toast({ title: "Failed to load profiles", description: profRes.error, variant: "destructive" });
      }
      // Users (optional, for assignments)
      const usersRes = await userService.list();
      if (usersRes.success && usersRes.data?.users) {
        setUsers(
          usersRes.data.users.map((u: any) => {
            const roleName = u.Role?.name || "Member";
            return {
              id: u.id,
              name: u.name || u.email,
              roleName,
            };
          })
        );
      }
    };
    loadInitial();
  }, [toast]);

  // Fetch accounts whenever profile changes
  useEffect(() => {
    const loadAccounts = async () => {
      if (!selectedProfileId) return;
      const accRes = await socialService.getProfileAccounts(selectedProfileId);
      if (accRes.success && accRes.data) {
        setAccounts(accRes.data);
        setSelectedAccountIds([]);
      } else if (accRes.error) {
        toast({ title: "Failed to load channels", description: accRes.error, variant: "destructive" });
      }
    };
    loadAccounts();
  }, [selectedProfileId, toast]);

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    try {
      const results: Array<{ file_url: string; file_type: string; file_size?: number }> = [];
      for (const file of Array.from(files)) {
        const res = await uploadService.uploadFile(file);
        if (res.success && res.data) {
          results.push({
            file_url: res.data.url,
            file_type: res.data.mimetype,
            file_size: res.data.size,
          });
        } else {
          toast({ title: `Failed to upload ${file.name}`, description: res.error || 'Unknown error', variant: 'destructive' });
        }
      }
      if (results.length) {
        setUploadedAttachments(prev => [...prev, ...results]);
        toast({ title: 'Upload complete', description: `${results.length} file(s) uploaded.` });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeAttachment = (idx: number) => {
    setUploadedAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const openLibrary = async () => {
    setLibraryOpen(true);
    const res = await mediaService.list({ limit: 24 });
    if (res.success && res.data) {
      setLibraryAssets(res.data.data);
    }
  };

  const addFromLibrary = (asset: MediaAssetItem) => {
    const next = { file_url: asset.file_url, file_type: asset.file_type || 'application/octet-stream', file_size: asset.file_size };
    setUploadedAttachments(prev => {
      if (prev.find(p => p.file_url === next.file_url)) return prev; // avoid duplicates
      return [...prev, next];
    });
    setLibraryOpen(false);
  };

  const selectedPlatforms = Array.from(
    new Set(
      accounts
        .filter(acc => selectedAccountIds.includes(String(acc.id)))
        .map(acc => (acc.platform || "").toLowerCase())
    )
  );

  const handleSaveDraft = () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "No channels selected",
        description: "Select at least one connected channel.",
        variant: "destructive",
      });
      return;
    }
    // Build keyed objects mapping platform -> late_account_id for selected accounts
    const platformsKV = selectedAccountIds
      .map((id) => {
        const acc = accounts.find((a) => String(a.id) === String(id));
        if (!acc) return null;
        const key = String(acc.platform || '').toLowerCase();
        const lateId = acc.late_account_id ?? null;
        return { [key]: lateId } as Record<string, string | null>;
      })
      .filter(Boolean) as Array<Record<string, string | null>>;

    const payload = {
      post_name: title.trim() || "Untitled Post",
      post_type: "text",
      description: content,
      platforms: platformsKV.length ? platformsKV : [{ instagram: null }],
      status: "draft",
      attachments: uploadedAttachments,
      assignments: assigneeId ? [{ user_id: Number(assigneeId), role: "assignee" }] : [],
    } as any;
    setIsLoading(true);
    postsService.create(payload).then((res) => {
      setIsLoading(false);
      if (res.success) {
        toast({ title: "Draft saved", description: "Your post has been saved." });
        navigate("/posts");
      } else {
        toast({ title: "Failed to save draft", description: res.error || "Unknown error", variant: "destructive" });
      }
    });
  };

  const handleSchedule = () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "No channels selected",
        description: "Select at least one connected channel.",
        variant: "destructive",
      });
      return;
    }
    const scheduledIso = (() => {
      if (!scheduledDate) return null;
      const [hh, mm] = scheduledTime.split(":");
      const local = new Date(scheduledDate);
      local.setHours(Number(hh), Number(mm), 0, 0);
      return local.toISOString();
    })();

    // Build keyed objects mapping platform -> late_account_id for selected accounts
    const platformsKV = selectedAccountIds
      .map((id) => {
        const acc = accounts.find((a) => String(a.id) === String(id));
        if (!acc) return null;
        const key = String(acc.platform || '').toLowerCase();
        const lateId = acc.late_account_id ?? null;
        return { [key]: lateId } as Record<string, string | null>;
      })
      .filter(Boolean) as Array<Record<string, string | null>>;

    const payload = {
      post_name: title.trim() || "Untitled Post",
      post_type: "text",
      description: content,
      platforms: platformsKV.length ? platformsKV : [{ instagram: null }],
      scheduled_time: scheduledIso,
      status: scheduledIso ? "scheduled" : "review",
      attachments: uploadedAttachments,
      assignments: assigneeId ? [{ user_id: Number(assigneeId), role: "assignee" }] : [],
    } as any;

    setIsLoading(true);
    postsService.create(payload).then((res) => {
      setIsLoading(false);
      if (res.success) {
        toast({
          title: scheduledIso ? "Post scheduled" : "Submitted for review",
          description: scheduledIso
            ? `Will publish on ${format(new Date(scheduledIso), "PPP")} at ${format(new Date(scheduledIso), "p")}`
            : "Your post has been submitted for approval.",
        });
        navigate("/posts");
      } else {
        toast({ title: "Failed to create post", description: res.error || "Unknown error", variant: "destructive" });
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/posts">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Post</h1>
            <p className="text-muted-foreground">Compose and schedule your social media content.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content editor */}
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Add a short title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <Button variant="ghost" size="icon-sm">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <List className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <Link2 className="h-4 w-4" />
                  </Button>
                  <div className="h-4 w-px bg-border mx-1" />
                  <Button variant="ghost" size="icon-sm">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>

                <Textarea
                  placeholder="What's on your mind? Start typing your post content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] resize-none border-0 p-0 focus-visible:ring-0 text-base"
                />

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    {content.length} characters
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {280 - content.length} remaining (Twitter)
                  </span>
                </div>
              </div>
            </div>

            {/* Media upload */}
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Media</h3>
              <label htmlFor="file-upload" className="block">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, GIF, MP4 (max 25MB)
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*,video/mp4,video/webm"
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                </div>
              </label>

              <div className="mt-3">
                <Button variant="outline" onClick={openLibrary}>Choose from Media Library</Button>
              </div>

              {uploadedAttachments.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {uploadedAttachments.map((att, idx) => (
                    <div key={`${att.file_url}-${idx}`} className="flex items-center justify-between rounded-md border border-border p-2">
                      <div className="text-sm truncate max-w-[70%]">
                        {att.file_url}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeAttachment(idx)}>Remove</Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Media Library Picker */}
              <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Select media from library</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {libraryAssets.map((asset) => {
                      const isImage = (asset.file_type || '').startsWith('image/');
                      return (
                        <button key={asset.asset_id} className="border border-border rounded-md overflow-hidden text-left" onClick={() => addFromLibrary(asset)}>
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            {isImage ? (
                              <img src={asset.file_url} alt={asset.title || asset.original_name || 'media'} className="w-full h-full object-cover" />
                            ) : (
                              <video src={asset.file_url} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="p-2 text-xs truncate">{asset.title || asset.original_name || asset.file_url}</div>
                        </button>
                      );
                    })}
                    {libraryAssets.length === 0 && (
                      <div className="text-sm text-muted-foreground">No media available.</div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile selection */}
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Profile</h3>
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={String(p.id)} value={String(p.id)}>
                      {p.name || `Profile ${p.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Platform selection */}
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Publish to</h3>
              <div className="space-y-3">
                {accounts.length === 0 && (
                  <p className="text-sm text-muted-foreground">No connected channels for this profile.</p>
                )}
                {accounts.map((acc) => {
                  const accId = String(acc.id);
                  const icon = platformIcon[(acc.platform || "").toLowerCase()] || "#";
                  const isSelected = selectedAccountIds.includes(accId);
                  return (
                    <label
                      key={accId}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleAccount(accId)}
                      />
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-sm font-medium">
                        {icon}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {(acc.platform || '').toUpperCase()} {acc.username ? `• @${acc.username}` : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Schedule</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !scheduledDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select value={scheduledTime} onValueChange={setScheduledTime}>
                    <SelectTrigger>
                      <Clock className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                          {`${i.toString().padStart(2, "0")}:00`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Assign to */}
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Assign to</h3>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional assignee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name}{u.roleName ? ` — ${u.roleName}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleSchedule}
                disabled={isLoading || !content.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {scheduledDate ? "Schedule Post" : "Submit for Review"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleSaveDraft}
                disabled={isLoading || !content.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatePost;
