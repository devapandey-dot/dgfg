import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { socialService, SocialAccount, SocialProfile } from "@/services/social.service";
import { authService } from "@/services/auth.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, Instagram, Facebook, Linkedin, Twitter, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { postsService, PostItem } from "@/services/posts.service";

const platformIcon: Record<string, string> = {
  instagram: "📷",
  facebook: "f",
  twitter: "𝕏",
  linkedin: "in",
};

const Channels = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [connectOpen, setConnectOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedAccountKey, setSelectedAccountKey] = useState<string>("all");
  const [postsLoading, setPostsLoading] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [activeTab, setActiveTab] = useState<"queue" | "drafts" | "approvals" | "sent">("queue");

  const redirectUrl = useMemo(() => {
    // Frontend-provided redirect URL; backend uses same value to send user back
    // Default to GitLab domain per request
    return import.meta.env.VITE_SOCIAL_REDIRECT_URL || "https://gitlab.gounicrew.com/";
  }, []);

  const currentProfile = useMemo(() => profiles?.[0], [profiles]);
 console.log("Cirrent", currentProfile)
  const currentProfileId = useMemo(() => {
    return (currentProfile?.late_profile_id as string) || String(currentProfile?.late_profile_id || "");
  }, [currentProfile]);

  const isConnectedPlatform = (platform: string) => {
    return accounts.some((acc) => acc.platform?.toLowerCase() === platform.toLowerCase() && acc.is_active);
  };

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

  const platformIconComp = (platform?: any) => {
    const common = "h-4 w-4 mr-2";
    const name = platformNameFromEntry(platform);
    switch ((name || "").toLowerCase()) {
      case "instagram":
        return <Instagram className={common} />;
      case "facebook":
        return <Facebook className={common} />;
      case "linkedin":
        return <Linkedin className={common} />;
      case "twitter":
      case "x":
        return <Twitter className={common} />;
      default:
        return <Share2 className={common} />;
    }
  };

  const initiateConnect = async () => {
    if (!currentProfileId || !selectedPlatform) return;
    try {
      setConnecting(true);
      const res = await socialService.initiateChannelConnect(selectedPlatform, {
        profileId: currentProfileId, // pass late profile id value under 'profileId'
        redirect_url: redirectUrl,
      });
      const authUrl = (res as any)?.data?.authUrl || (res as any)?.authUrl;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        console.error("No authUrl in response", res);
      }
    } catch (e) {
      console.error("Failed to initiate connect", e);
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Ensure token exists
        if (!authService.getAccessToken()) {
          console.warn("No access token found; APIs may fail.");
        }
        const pRes = await socialService.getProfiles();
        const pData = (pRes as any).data ?? pRes;
        setProfiles(Array.isArray(pData) ? pData : pData?.profiles ?? []);

        const aRes = await socialService.getAccounts({ late_profile_id: currentProfileId });
        const aData = (aRes as any).data ?? aRes;
        const list = Array.isArray(aData) ? aData : aData?.accounts ?? [];
        setAccounts(list);
      } catch (e) {
        console.error("Failed to load channels:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfileId]);

  // Map UI tabs to backend statuses
  const statusMap: Record<typeof activeTab, string> = {
    queue: "scheduled",
    drafts: "draft",
    approvals: "pending",
    sent: "published",
  };

  // Fetch posts when filters change
  useEffect(() => {
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const selected = accounts.find((a) => `${a.platform}:${a.late_account_id || a.id}` === selectedAccountKey);
        const platformFilter = selected ? selected.platform : undefined;
        const statusFilter = statusMap[activeTab];
        const res = await postsService.list({ platforms: platformFilter, status: statusFilter, limit: 12 });
        const list = (res as any)?.data?.data ?? ((res as any)?.data ?? []);
        setPosts(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Failed to fetch posts:", e);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountKey, activeTab, accounts.length]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header & actions to mirror screenshot */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">All Channels</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">List</Button>
            <Button variant="outline" size="sm">Calendar</Button>
            {/* Views dropdown (static options) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">Views ▾</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>List</DropdownMenuItem>
                <DropdownMenuItem>Calendar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Channel dropdown populated from connected accounts, with icons */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-40 justify-between">
                  <span className="flex items-center">
                    {selectedAccountKey === "all"
                      ? platformIconComp("all")
                      : platformIconComp(accounts.find((a) => `${a.platform}:${a.late_account_id || a.id}` === selectedAccountKey)?.platform)}
                    {selectedAccountKey === "all"
                      ? "All Channels"
                      : (accounts.find((a) => `${a.platform}:${a.late_account_id || a.id}` === selectedAccountKey)?.display_name ||
                         accounts.find((a) => `${a.platform}:${a.late_account_id || a.id}` === selectedAccountKey)?.username ||
                         accounts.find((a) => `${a.platform}:${a.late_account_id || a.id}` === selectedAccountKey)?.platform ||
                         "Channel")}
                  </span>
                  <span className="ml-2">▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setSelectedAccountKey("all")}>
                  {platformIconComp("all")} All Channels
                </DropdownMenuItem>
                {accounts.map((acc) => (
                  <DropdownMenuItem key={`${acc.platform}:${acc.late_account_id || acc.id}`} onClick={() => setSelectedAccountKey(`${acc.platform}:${acc.late_account_id || acc.id}`)}>
                    {platformIconComp(acc.platform)} {acc.display_name || acc.username || acc.platform}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Replace New Post with Connect Channel */}
            <Button size="sm" onClick={() => setConnectOpen(true)}>
              Connect Channel
            </Button>
          </div>
        </div>

        {/* Tabs row */}
        <div className="flex items-center gap-6 border-b pb-2 text-sm">
          {(
            [
              { key: "queue", label: "Queue" },
              { key: "drafts", label: "Drafts" },
              { key: "approvals", label: "Approvals" },
              { key: "sent", label: "Sent" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              className={`pb-2 ${activeTab === key ? "relative text-foreground" : "text-muted-foreground"}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
              {activeTab === key && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />}
            </button>
          ))}
        </div>

        {/* Single-column main content per screenshot (remove left sidebar) */}
        <div>
          <section>
            {loading || postsLoading ? (
              <div className="flex items-center justify-center py-14">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => {
                  const thumb = (post.attachments && post.attachments[0]?.file_url) || "/placeholder.svg";
                  return (
                    <div key={String(post.id || post.post_id)} className="rounded-xl border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={thumb} alt="Post thumbnail" className="h-10 w-10 rounded object-cover" />
                          <div>
                            <p className="text-sm font-semibold text-foreground truncate max-w-[180px]">{post.post_name || post.description || "Untitled"}</p>
                            <p className="text-xs text-muted-foreground flex items-center">
                              {platformIconComp((Array.isArray(post.platforms) ? post.platforms[0] : post.platforms) || undefined)}
                              {(
                                Array.isArray(post.platforms)
                                  ? post.platforms.map(platformNameFromEntry).filter(Boolean).join(", ")
                                  : platformNameFromEntry(post.platforms)
                              ) || ""}
                            </p>
                          </div>
                        </div>
                        <Badge variant={post.status === "published" ? "default" : "secondary"}>
                          {post.status || "draft"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-8 text-center">
                <p className="text-lg font-semibold">No posts found</p>
                <p className="mt-1 text-sm text-muted-foreground">Connect a channel or change filters to see posts.</p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button onClick={() => setConnectOpen(true)}>
                    <LinkIcon className="h-4 w-4 mr-2" /> Connect a Channel
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Connect modal */}
        <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Connect Your Social Channels</DialogTitle>
              <DialogDescription>
                Click a platform to begin. Connected channels are highlighted.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid grid-cols-6 gap-3">
              {[
                { key: "linkedin", Icon: Linkedin },
                { key: "facebook", Icon: Facebook },
                { key: "instagram", Icon: Instagram },
                { key: "twitter", Icon: Twitter },
                { key: "pinterest", Icon: null },
                { key: "tiktok", Icon: null },
              ].map(({ key, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPlatform(key)}
                  className={`flex items-center justify-center rounded-lg border p-3 transition-colors ${
                    selectedPlatform === key
                      ? "border-blue-600 bg-blue-100 text-blue-700"
                      : isConnectedPlatform(key)
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-muted hover:bg-muted"
                  } ${connecting ? "pointer-events-none opacity-50" : ""}`}
                  aria-label={`Connect ${key}`}
                >
                  {Icon ? <Icon className="h-6 w-6" /> : <span className="text-sm font-semibold">{key[0].toUpperCase()}</span>}
                </button>
              ))}
            </div>
            <DialogFooter className="mt-6">
              <Button onClick={initiateConnect} disabled={connecting || !selectedPlatform}>
                {connecting ? "Connecting..." : "Done"}
              </Button>
              <Button variant="outline" onClick={() => setConnectOpen(false)} disabled={connecting}>
                Skip for now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Channels;