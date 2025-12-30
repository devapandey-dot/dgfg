import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { socialService, SocialAccount, SocialProfile } from "@/services/social.service";
import { authService } from "@/services/auth.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link as LinkIcon, Instagram, Facebook, Linkedin, Twitter, Share2, Pin, Music2, Youtube, Send, Calendar as CalendarIcon, Download, ChevronDown, Network, FileText, Search } from "lucide-react";
import Loader from "@/components/ui/loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { postsService, PostItem } from "@/services/posts.service";
import { cn } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = useState("");

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
      <div className="space-y-5 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Channels</h1>
            <p className="text-xs text-muted-foreground">Manage your connected social media accounts</p>
          </div>
          <Button 
            onClick={() => setConnectOpen(true)}
            className="rounded-xl shadow-md hover:shadow-lg transition-all h-9 text-xs font-bold"
          >
            <LinkIcon className="h-3.5 w-3.5 mr-2" />
            Connect Channel
          </Button>
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

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex gap-2.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-9 px-3 rounded-xl border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-400 hover:ring-4 hover:ring-blue-50 transition-all group min-w-[120px] justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500 group-hover:text-blue-500" />
                      <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Calendar</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-40 rounded-xl shadow-lg border-gray-100 p-1">
                  <DropdownMenuItem className="rounded-lg text-sm">List View</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg text-sm">Calendar View</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-9 px-3 rounded-xl border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-400 hover:ring-4 hover:ring-blue-50 transition-all group min-w-[140px] justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-gray-500 group-hover:text-blue-500" />
                      <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 truncate max-w-[80px]">
                        {selectedAccountKey === "all"
                          ? "Channels"
                          : (accounts.find((a) => `${a.platform}:${a.late_account_id || a.id}` === selectedAccountKey)?.display_name ||
                             accounts.find((a) => `${a.platform}:${a.late_account_id || a.id}` === selectedAccountKey)?.username ||
                             "Channel")}
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-52 rounded-xl shadow-lg border-gray-100 p-1">
                  <DropdownMenuItem className="rounded-lg flex items-center gap-2 py-2 text-sm" onClick={() => setSelectedAccountKey("all")}>
                    <Network className="h-3.5 w-3.5 text-blue-500" /> 
                    <span className="font-medium">All Channels</span>
                  </DropdownMenuItem>
                  <div className="h-px bg-gray-100 my-1 mx-1" />
                  {accounts.map((acc) => (
                    <DropdownMenuItem 
                      key={`${acc.platform}:${acc.late_account_id || acc.id}`} 
                      className="rounded-lg flex items-center gap-2 py-2 text-sm"
                      onClick={() => setSelectedAccountKey(`${acc.platform}:${acc.late_account_id || acc.id}`)}
                    >
                      <div className="flex items-center justify-center w-3.5 h-3.5">
                        {platformIconComp(acc.platform)}
                      </div>
                      <span className="text-gray-600 truncate">{acc.display_name || acc.username || acc.platform}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-9 px-3 rounded-xl border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-400 hover:ring-4 hover:ring-blue-50 transition-all group min-w-[110px] justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-gray-500 group-hover:text-blue-500" />
                      <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Export</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-44 rounded-xl shadow-lg border-gray-100 p-1">
                  <DropdownMenuItem className="rounded-lg py-2 px-3 flex items-center gap-2 cursor-pointer text-sm">
                    <FileText className="h-3.5 w-3.5 text-rose-500" />
                    <span className="font-medium text-gray-600">Export as PDF</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg py-2 px-3 flex items-center gap-2 cursor-pointer text-sm">
                    <Download className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-medium text-gray-600">Export as CSV</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <section>
            {loading || postsLoading ? (
              <div className="flex items-center justify-center py-14">
                <Loader showText text="Loading posts..." size="lg" />
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
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[
                { 
                  key: "facebook", 
                  Icon: Facebook, 
                  bgColor: "bg-[#1877F2]",
                },
                { 
                  key: "twitter", 
                  Icon: Twitter, 
                  bgColor: "bg-black",
                },
                { 
                  key: "instagram", 
                  Icon: Instagram, 
                  bgColor: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
                },
                { 
                  key: "linkedin", 
                  Icon: Linkedin, 
                  bgColor: "bg-[#0A66C2]",
                },
                { 
                  key: "pinterest", 
                  Icon: Pin, 
                  bgColor: "bg-[#E60023]",
                },
              ].map(({ key, Icon, bgColor }) => {
                const isSelected = selectedPlatform === key;
                const isConnected = isConnectedPlatform(key);
                
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPlatform(key)}
                    className={cn(
                      "flex items-center justify-center rounded-lg border-2 p-2 transition-all duration-200 aspect-square shadow-sm",
                      bgColor,
                      isSelected
                        ? "ring-2 ring-primary/30 scale-105 border-white"
                        : "border-transparent hover:scale-105",
                      isConnected && "opacity-80",
                      connecting && "pointer-events-none opacity-50"
                    )}
                    aria-label={`Connect ${key}`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </button>
                );
              })}
            </div>
            <DialogFooter className="mt-6">
              <Button onClick={initiateConnect} disabled={connecting || !selectedPlatform}>
                {connecting ? <Loader size="sm" className="mr-2" /> : null}
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