import DashboardLayout from "@/components/layouts/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import RecentPostsTable from "@/components/dashboard/RecentPostsTable";
import { FileText, Users, Share2, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const mockPosts = [
  {
    id: "1",
    title: "Your June Email Campaign",
    status: "published" as const,
    scheduledAt: "Dec 15, 2024",
    author: "John Doe",
    platforms: ["twitter", "facebook", "linkedin"],
    comments: 5,
  },
  {
    id: "2",
    title: "Product Launch Announcement",
    status: "scheduled" as const,
    scheduledAt: "Dec 20, 2024",
    author: "Jane Smith",
    platforms: ["instagram", "twitter"],
    comments: 2,
  },
  {
    id: "3",
    title: "Holiday Special Promotion",
    status: "pending" as const,
    scheduledAt: "Dec 23, 2024",
    author: "Mike Johnson",
    platforms: ["facebook", "instagram"],
    comments: 8,
  },
  {
    id: "4",
    title: "Year in Review Post",
    status: "draft" as const,
    author: "Sarah Wilson",
    platforms: ["linkedin"],
    comments: 0,
  },
  {
    id: "5",
    title: "New Feature Announcement",
    status: "approved" as const,
    scheduledAt: "Dec 28, 2024",
    author: "John Doe",
    platforms: ["twitter", "linkedin"],
    comments: 3,
  },
];

const upcomingPosts = [
  { title: "Product Launch Announcement", date: "Dec 20, 2024", time: "10:00 AM" },
  { title: "Holiday Special Promotion", date: "Dec 23, 2024", time: "2:00 PM" },
  { title: "New Feature Announcement", date: "Dec 28, 2024", time: "9:00 AM" },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
          </div>
          <Button asChild>
            <Link to="/posts/create">
              <FileText className="h-4 w-4 mr-2" />
              Create Post
            </Link>
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Posts"
            value="156"
            change="+12% from last month"
            changeType="positive"
            icon={<FileText className="h-6 w-6" />}
          />
          <StatCard
            title="Connected Accounts"
            value="8"
            change="2 pending connection"
            changeType="neutral"
            icon={<Share2 className="h-6 w-6" />}
          />
          <StatCard
            title="Team Members"
            value="12"
            change="+3 this month"
            changeType="positive"
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="Engagement Rate"
            value="4.8%"
            change="+0.3% from last week"
            changeType="positive"
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent posts - spans 2 columns */}
          <div className="xl:col-span-2">
            <RecentPostsTable posts={mockPosts} />
          </div>

          {/* Upcoming posts sidebar */}
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Upcoming</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/posts?status=scheduled">
                  View all
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              {upcomingPosts.map((post, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {post.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {post.date} at {post.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
