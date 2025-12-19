import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, ArrowRight, User, Users, Share2, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, title: "Profile details", icon: User },
  { id: 2, title: "Invite Teams", icon: Users },
  { id: 3, title: "Connect Channels", icon: Share2 },
];

const socialPlatforms = [
  { id: "linkedin", name: "LinkedIn", icon: "in", color: "bg-[#0A66C2]" },
  { id: "facebook", name: "Facebook", icon: "f", color: "bg-[#1877F2]" },
  { id: "instagram", name: "Instagram", icon: "📷", color: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]" },
  { id: "twitter", name: "Twitter/X", icon: "𝕏", color: "bg-foreground" },
  { id: "threads", name: "Threads", icon: "@", color: "bg-foreground" },
  { id: "pinterest", name: "Pinterest", icon: "P", color: "bg-[#E60023]" },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileName, setProfileName] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamEmails, setTeamEmails] = useState("");
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    toast({
      title: "Welcome to Ranblitz!",
      description: "Your account is all set up. Let's get started!",
    });
    navigate("/dashboard");
  };

  const togglePlatform = (platformId: string) => {
    setConnectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left sidebar - Steps */}
      <div className="hidden lg:flex w-80 bg-sidebar flex-col p-8">
        <div className="mb-12">
          <Logo variant="light" />
        </div>

        <div className="flex-1">
          <div className="space-y-8">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                      isCompleted
                        ? "bg-sidebar-foreground border-sidebar-foreground text-sidebar"
                        : isActive
                        ? "border-sidebar-foreground text-sidebar-foreground"
                        : "border-sidebar-foreground/30 text-sidebar-foreground/30"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isActive || isCompleted
                          ? "text-sidebar-foreground"
                          : "text-sidebar-foreground/50"
                      )}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-[2.35rem] mt-20 w-0.5 h-8",
                        isCompleted ? "bg-sidebar-foreground" : "bg-sidebar-foreground/20"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-lg animate-slide-up">
          {/* Step 1: Profile details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Welcome to Ranblitz</h1>
                <p className="text-muted-foreground">You're in! Let's set you up 🎉</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profileName">Profile name</Label>
                  <Input
                    id="profileName"
                    placeholder="My Company"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="e.g. Technology, Marketing"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Invite team */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Welcome to Ranblitz</h1>
                <p className="text-muted-foreground">👥 Invite Teams</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emails">Email addresses</Label>
                  <Input
                    id="emails"
                    placeholder="team@example.com"
                    value={teamEmails}
                    onChange={(e) => setTeamEmails(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple emails with commas
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" size="lg" onClick={handleSkip}>
                  Skip for now
                </Button>
                <Button className="flex-1" size="lg" onClick={handleNext}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Connect channels */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Welcome to Ranblitz</h1>
                <p className="text-muted-foreground">📢 Connect Your Social Channels</p>
                <p className="text-sm text-muted-foreground">
                  Link your social media accounts to start publishing posts.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {socialPlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                      connectedPlatforms.includes(platform.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-primary-foreground text-lg font-bold",
                        platform.color
                      )}
                    >
                      {platform.icon}
                    </div>
                    <span className="text-xs font-medium text-foreground">
                      {platform.name}
                    </span>
                    {connectedPlatforms.includes(platform.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" size="lg" onClick={handleSkip}>
                  Skip for now
                </Button>
                <Button className="flex-1" size="lg" onClick={handleComplete}>
                  Done
                  <PartyPopper className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
