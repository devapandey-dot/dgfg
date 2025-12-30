import { ReactNode, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { notificationsService, NotificationItem } from "@/services/notifications.service";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Globe,
  Layers,
  Send,
  Share2,
  Image,
  Users,
  Settings,
  BarChart3,
  CreditCard,
  LogOut,
  ChevronDown,
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Channels", href: "/channels", icon: Globe },
  { name: "Content", href: "/content", icon: Layers },
  { name: "Posts", href: "/posts", icon: Send },
  { name: "Social Media", href: "/social", icon: Share2 },
  { name: "Media Library", href: "/media", icon: Image },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Team", href: "/team", icon: Users },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; description?: string; time: number; unread?: boolean; type?: string; postId?: number | string; userId?: number | null }>>(() => {
    try {
      const raw = localStorage.getItem("rb:notifications");
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  });

  // Load notifications from backend (user-id scoped)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await notificationsService.list({ limit: 50 });
        const items: Array<{ id: string; title: string; description?: string; time: number; unread?: boolean; type?: string; postId?: number | string; userId?: number | null }> = [];
        const data = Array.isArray(res.data) ? res.data : [];
        for (const n of data as NotificationItem[]) {
          items.push({
            id: String(n.notification_id),
            title: n.type?.replace(/[:_]/g, ' ') || 'Notification',
            description: n.message || undefined,
            time: new Date(n.created_at).getTime(),
            unread: !n.is_read,
            type: n.type,
            postId: n.post_id ?? undefined,
            userId: n.user_id ?? null,
          });
        }
        if (items.length) {
          setNotifications((prev) => {
            // Merge: backend first, then keep existing local items
            const merged = [...items, ...prev].slice(0, 50);
            localStorage.setItem("rb:notifications", JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        // Non-blocking; keep local notifications
        console.warn('Failed to load notifications', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ title: string; description?: string; type?: string; postId?: number | string }>).detail;
      if (!detail) return;
      setNotifications((prev) => {
        const next = [
          { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: detail.title, description: detail.description, time: Date.now(), unread: true, type: detail.type, postId: detail.postId },
          ...prev,
        ].slice(0, 50);
        localStorage.setItem("rb:notifications", JSON.stringify(next));
        return next;
      });
    };
    window.addEventListener("rb:notify", handler as any);
    // Real-time notifications via Socket.IO
    let socket: Socket | null = null;
    try {
      const user = authService.getUser();
      const apiBase: string = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const wsBase = apiBase.replace(/\/api\/v1$/, "");
      socket = io(wsBase, { transports: ["websocket"], autoConnect: true });

      socket.on("connect", () => {
        // Join tenant and user rooms for targeted delivery
        const tenantId = user?.tenant_id;
        const userId = user?.id;
        socket?.emit("join", { tenantId, userId });
      });

      // Approval requested notifications to approvers/admins
      socket.on("post:approval_requested", (payload: any) => {
        const title = "Approval requested";
        const description = payload?.postId ? `Post #${payload.postId}` : "A post needs your review";
        setNotifications((prev) => {
          const next = [
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, description, time: Date.now(), unread: true, type: "approval", postId: payload?.postId, userId: authService.getUser()?.id ?? null },
            ...prev,
          ].slice(0, 50);
          localStorage.setItem("rb:notifications", JSON.stringify(next));
          return next;
        });
      });

      // New comment notifications
      socket.on("comment:created", (payload: any) => {
        const postId = payload?.postId;
        const title = "New comment";
        const description = postId ? `On post #${postId}` : undefined;
        setNotifications((prev) => {
          const next = [
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, description, time: Date.now(), unread: true, type: "comment", postId, userId: authService.getUser()?.id ?? null },
            ...prev,
          ].slice(0, 50);
          localStorage.setItem("rb:notifications", JSON.stringify(next));
          return next;
        });
      });

      // Optional: status change notifications
      socket.on("post:status_changed", (payload: any) => {
        const title = "Post status updated";
        const description = payload?.postId ? `Post #${payload.postId}: ${payload?.previousStatus} → ${payload?.nextStatus}` : undefined;
        setNotifications((prev) => {
          const next = [
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, description, time: Date.now(), unread: true, type: "status", postId: payload?.postId, userId: authService.getUser()?.id ?? null },
            ...prev,
          ].slice(0, 50);
          localStorage.setItem("rb:notifications", JSON.stringify(next));
          return next;
        });
      });
    } catch (err) {
      console.warn("Socket.IO init failed:", err);
    }

    return () => {
      window.removeEventListener("rb:notify", handler as any);
      try {
        socket?.disconnect();
      } catch {}
    };
  }, []);

  const currentUserId: number | undefined = authService.getUser()?.id;
  const visibleNotifications = notifications.filter((n) => n.userId === currentUserId);
  const unreadCount = visibleNotifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
            <Logo variant="light" />
            <button
              className="lg:hidden text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 no-scrollbar">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User section at bottom */}
          <div className="p-3 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                      {(() => {
                        const user = authService.getUser();
                        const name: string = user?.name || "";
                        const parts = name.trim().split(/\s+/);
                        const initials = parts.length >= 2
                          ? `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`
                          : (parts[0]?.[0] ?? 'U');
                        return initials.toUpperCase();
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {authService.getUser()?.name || "User"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                      {authService.getUser()?.email || "user@example.com"}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/billing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive cursor-pointer" 
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 bg-background border-b border-border">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -ml-2 text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-lg font-semibold text-muted-foreground">Welcome back,</span>
              <span className="text-lg font-black text-primary capitalize tracking-tight">
                {authService.getUser()?.role || "User"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {visibleNotifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No notifications</div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto rb-scroll">
                    {visibleNotifications.map((n) => {
                      const href = n.type === "comment" && n.postId
                        ? `/content?postId=${n.postId}&action=viewComments#post-${n.postId}`
                        : n.type === "approval" && n.postId
                        ? `/content?tab=review#post-${n.postId}`
                        : "/content";
                      return (
                        <DropdownMenuItem
                          key={n.id}
                          className={cn(
                            "px-3 py-2 text-xs border-b border-border last:border-b-0 cursor-pointer",
                            n.unread ? "bg-primary/5 font-semibold" : "bg-transparent font-normal",
                          )}
                          onSelect={() => {
                            // Mark as read
                            setNotifications((prev) => {
                              const next = prev.map((x) => x.id === n.id ? { ...x, unread: false } : x);
                              localStorage.setItem("rb:notifications", JSON.stringify(next));
                              return next;
                            });
                            // Attempt server mark-as-read when backed by an id
                            const numericId = /^\d+$/.test(n.id) ? Number(n.id) : null;
                            if (numericId) {
                              notificationsService.markRead(numericId).catch(() => {});
                            }
                            // Navigate to deep link
                            navigate(href);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {n.unread && <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />}
                              <p className={cn("truncate text-foreground", n.unread ? "text-sm" : "text-sm")}>{n.title}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                              {new Date(n.time).toLocaleTimeString()}
                            </span>
                          </div>
                          {n.description && (
                            <p className="mt-0.5 text-muted-foreground text-xs truncate">{n.description}</p>
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                )}
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between px-2 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotifications((prev) => {
                        const next = prev.map((n) => ({ ...n, unread: false }));
                        localStorage.setItem("rb:notifications", JSON.stringify(next));
                        return next;
                      });
                    }}
                  >
                    Mark all as read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      localStorage.removeItem("rb:notifications");
                      setNotifications([]);
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
