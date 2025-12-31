import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/layouts/AuthLayout";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await authService.login(email, password);
      
      if (!response.success) {
        toast({
          title: "Login failed",
          description: response.error || "Invalid credentials",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (response.data?.requires_2fa) {
        setRequires2FA(true);
        toast({
          title: "2FA Required",
          description: "Please enter the OTP sent to your email",
        });
        setIsLoading(false);
        return;
      }

      if (response.data) {
        authLogin(response.data);
        toast({ title: "Welcome back!", description: "Redirecting to your dashboard." });
        navigate(from, { replace: true });
        return;
      }
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

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.verifyOTP(email, otp);
      
      if (!response.success) {
        toast({
          title: "Verification failed",
          description: response.error || "Invalid or expired OTP",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (response.data) {
        authLogin(response.data);
        toast({ title: "Login successful!", description: "Redirecting to your dashboard." });
        navigate(from, { replace: true });
        return;
      }
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

  const handleGoogleLogin = () => {
    authService.googleAuth();
  };

  if (requires2FA) {
    return (
      <AuthLayout>
        <div className="space-y-3">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold text-foreground">Verify your identity</h1>
            <p className="text-[11px] text-muted-foreground">
              We've sent a 6-digit verification code to <span className="font-medium">{email}</span>
            </p>
          </div>

          <form onSubmit={handleOTPVerification} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="otp" className="text-[10px]">Enter verification code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="h-8 w-8 text-xs" />
                    <InputOTPSlot index={1} className="h-8 w-8 text-xs" />
                    <InputOTPSlot index={2} className="h-8 w-8 text-xs" />
                    <InputOTPSlot index={3} className="h-8 w-8 text-xs" />
                    <InputOTPSlot index={4} className="h-8 w-8 text-xs" />
                    <InputOTPSlot index={5} className="h-8 w-8 text-xs" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button type="submit" className="w-full h-8 text-xs" disabled={isLoading || otp.length !== 6}>
              {isLoading ? <Loader size="sm" className="mr-2" /> : null}
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full h-8 text-xs"
              onClick={() => {
                setRequires2FA(false);
                setOtp("");
              }}
            >
              Back to login
            </Button>
          </form>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-0 text-center lg:text-left">
          <h1 className="text-lg font-extrabold tracking-tight text-foreground bg-clip-text">
            Welcome back
          </h1>
          <p className="text-[9px] text-muted-foreground max-w-[320px] lg:max-w-none mx-auto lg:mx-0">
            Log in to manage your automated social presence
          </p>
        </div>

        <div className="grid grid-cols-1 gap-1">
          <Button
            variant="outline"
            size="default"
            className="w-full h-7 text-[9px] font-medium border-border/60 hover:bg-accent/50 hover:border-primary/30 transition-all duration-300 shadow-sm group"
            onClick={() => authService.googleAuth()}
          >
            <svg className="w-2.5 h-2.5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
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

        <form onSubmit={handleLogin} className="space-y-1.5">
          <div className="space-y-0.5">
            <Label htmlFor="email" className="text-[9px] font-bold text-foreground/80 ml-1 uppercase tracking-wider">Email Address</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="jane.contractor@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-8 text-xs bg-accent/5 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all shadow-sm rounded-lg"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-[9px] font-bold text-foreground/80 uppercase tracking-wider">Password</Label>
              <Link
                to="/forgot-password"
                className="text-[8px] text-primary hover:text-primary/80 transition-colors font-bold uppercase tracking-wide underline-offset-4 hover:underline"
              >
                Forgot?
              </Link>
            </div>
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

          <div className="flex items-center space-x-2 px-1">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="h-3.5 w-3.5 border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor="remember"
              className="text-[9px] font-medium text-muted-foreground cursor-pointer select-none"
            >
              Remember me for 30 days
            </label>
          </div>

          <Button type="submit" className="w-full h-8 text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 mt-0.5 rounded-lg bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader size="sm" />
                <span>Logging in...</span>
              </div>
            ) : "Login to Account"}
          </Button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground pt-0.5">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:text-primary/80 transition-colors font-bold underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
