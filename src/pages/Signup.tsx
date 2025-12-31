import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/layouts/AuthLayout";
import { Eye, EyeOff, Mail, Lock, User, ChevronsUpDown, Check } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { COUNTRIES, TIMEZONES, getTimezoneCode, formatTimezoneLabel } from "@/constants/geo";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [country, setCountry] = useState<string>("India");
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");
  const [timezoneCode, setTimezoneCode] = useState<string>(getTimezoneCode("Asia/Kolkata"));
  const [countryOpen, setCountryOpen] = useState(false);
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await authService.signup({
        email,
        password,
        name,
        organizationName: organizationName || undefined,
        country,
        timezone,
        timezoneCode
      });
      
      if (!response.success) {
        toast({
          title: "Signup failed",
          description: response.error || "Failed to create account. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Account created!",
        description: "Welcome to Ranblitz. Let's get you started.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    authService.googleAuth();
  };

  return (
    <AuthLayout>
      <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-0 text-center lg:text-left">
          <h1 className="text-lg font-extrabold tracking-tight text-foreground bg-clip-text">
            Create your account
          </h1>
          <p className="text-[9px] text-muted-foreground max-w-[320px] lg:max-w-none mx-auto lg:mx-0">
            Join Ranblitz and start automating your social presence today
          </p>
        </div>

        <div className="grid grid-cols-1 gap-1">
          <Button
            variant="outline"
            size="default"
            className="w-full h-7 text-[9px] font-medium border-border/60 hover:bg-accent/50 hover:border-primary/30 transition-all duration-300 shadow-sm group"
            onClick={handleGoogleSignup}
          >
            <svg className="w-2.5 h-2.5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/40" />
          </div>
          <div className="relative flex justify-center text-[6px] uppercase">
            <span className="bg-background px-4 text-muted-foreground/50 font-bold tracking-widest">or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-1.5">
          <div className="space-y-0.5">
            <Label htmlFor="name" className="text-[9px] font-bold text-foreground/80 ml-1 uppercase tracking-wider">Full Name</Label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                id="name"
                type="text"
                placeholder="Jonas Khanwald"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9 h-8 text-xs bg-accent/5 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all shadow-sm rounded-lg"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <Label htmlFor="email" className="text-[9px] font-bold text-foreground/80 ml-1 uppercase tracking-wider">Email Address</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="jonas.kahnwald@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-8 text-xs bg-accent/5 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all shadow-sm rounded-lg"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <Label htmlFor="organizationName" className="text-[9px] font-bold text-foreground/80 ml-1 uppercase tracking-wider">Organization name (Optional)</Label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                id="organizationName"
                type="text"
                placeholder="Ranblitz"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="pl-9 h-8 text-xs bg-accent/5 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all shadow-sm rounded-lg"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <Label className="text-[9px] font-bold text-foreground/80 ml-1 uppercase tracking-wider">Country</Label>
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className="w-full h-8 justify-between text-[11px] px-3 font-normal bg-accent/5 border-border/50 shadow-sm hover:bg-accent/10 transition-all rounded-lg"
                    disabled={isLoading}
                  >
                    <span className="truncate">{country}</span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0 shadow-2xl border-border/50 rounded-xl overflow-hidden" align="start">
                  <Command>
                    <CommandInput placeholder="Search country..." className="h-8 text-[11px]" />
                    <CommandList className="max-h-[150px]">
                      <CommandEmpty className="py-2 text-[9px] text-center text-muted-foreground">No country found.</CommandEmpty>
                      <CommandGroup>
                        {COUNTRIES.map((c) => (
                          <CommandItem
                            key={c}
                            value={c}
                            onSelect={(currentValue) => {
                              setCountry(currentValue);
                              setCountryOpen(false);
                            }}
                            className="text-[11px] py-1.5 px-3 cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3 text-primary",
                                country === c ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {c}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-0.5">
              <Label className="text-[9px] font-bold text-foreground/80 ml-1 uppercase tracking-wider">Timezone</Label>
              <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={timezoneOpen}
                    className="w-full h-8 justify-between text-[11px] px-3 font-normal bg-accent/5 border-border/50 shadow-sm hover:bg-accent/10 transition-all rounded-lg"
                    disabled={isLoading}
                  >
                    <span className="truncate">{timezoneCode}</span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0 shadow-2xl border-border/50 rounded-xl overflow-hidden" align="start">
                  <Command>
                    <CommandInput placeholder="Search timezone..." className="h-8 text-[11px]" />
                    <CommandList className="max-h-[150px]">
                      <CommandEmpty className="py-2 text-[9px] text-center text-muted-foreground">No timezone found.</CommandEmpty>
                      <CommandGroup>
                        {TIMEZONES.map((tz) => (
                          <CommandItem
                            key={tz}
                            value={tz}
                            onSelect={(currentValue) => {
                              setTimezone(currentValue);
                              setTimezoneCode(getTimezoneCode(currentValue));
                              setTimezoneOpen(false);
                            }}
                            className="text-[11px] py-1.5 px-3 cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3 text-primary",
                                timezone === tz ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {formatTimezoneLabel(tz)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-0.5">
            <Label htmlFor="password" title="Password" className="text-[9px] font-bold text-foreground/80 ml-1 uppercase tracking-wider">Password</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9 h-8 text-xs bg-accent/5 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all shadow-sm rounded-lg"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-8 text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 mt-0.5 rounded-lg bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader size="sm" />
                <span>Creating...</span>
              </div>
            ) : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground pt-0.5">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-bold underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Signup;
