import { useState } from "react";
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

const platforms = [
  { id: "twitter", name: "Twitter/X", icon: "𝕏" },
  { id: "facebook", name: "Facebook", icon: "f" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "linkedin", name: "LinkedIn", icon: "in" },
  { id: "bluesky", name: "Bluesky", icon: "🦋" },
];

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSaveDraft = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Draft saved",
        description: "Your post has been saved as a draft.",
      });
      navigate("/posts");
    }, 1000);
  };

  const handleSchedule = () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "No platforms selected",
        description: "Please select at least one platform to schedule your post.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Post scheduled",
        description: scheduledDate
          ? `Your post will be published on ${format(scheduledDate, "PPP")} at ${scheduledTime}`
          : "Your post has been submitted for review.",
      });
      navigate("/posts");
    }, 1000);
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
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Drop files here or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: JPG, PNG, GIF, MP4 (max 25MB)
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Platform selection */}
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Publish to</h3>
              <div className="space-y-3">
                {platforms.map((platform) => (
                  <label
                    key={platform.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedPlatforms.includes(platform.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/30"
                    )}
                  >
                    <Checkbox
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                    />
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-sm font-medium">
                      {platform.icon}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {platform.name}
                    </span>
                  </label>
                ))}
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
