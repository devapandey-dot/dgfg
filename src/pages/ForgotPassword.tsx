import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/layouts/AuthLayout";
import { Mail, ArrowLeft, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const resetToken = searchParams.get("token");
  const isResetMode = !!resetToken;

  useEffect(() => {
    if (resetToken) {
      setIsSubmitted(true);
    }
  }, [resetToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isResetMode) {
      if (newPassword !== confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please make sure both passwords are the same.",
          variant: "destructive",
        });
        return;
      }

      if (newPassword.length < 8) {
        toast({
          title: "Password too short",
          description: "Password must be at least 8 characters long.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      
      try {
        const response = await authService.resetPassword(resetToken!, newPassword);
        
        if (!response.success) {
          toast({
            title: "Reset failed",
            description: response.error || "Failed to reset password. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Password reset successful!",
          description: "Your password has been reset. You can now log in.",
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
    } else {
      setIsLoading(true);
      
      try {
        const response = await authService.forgotPassword(email);
        
        if (!response.success) {
          toast({
            title: "Error",
            description: response.error || "Failed to send reset email. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
        setIsSubmitted(true);
        toast({
          title: "Email sent!",
          description: "Check your inbox for password reset instructions.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }
  };

  if (isSubmitted && !isResetMode) {
    return (
      <AuthLayout>
        <div className="space-y-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto">
            <Mail className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">Check your email</h1>
            <p className="text-xs text-muted-foreground">
              We've sent a password reset link to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          
          <p className="text-[11px] text-muted-foreground">
            Didn't receive the email?{" "}
            <button
              onClick={() => {
                setIsSubmitted(false);
                setEmail("");
              }}
              className="font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Resend email
            </button>
          </p>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (isResetMode) {
    return (
      <AuthLayout>
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-1 text-center lg:text-left">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">Reset your password</h1>
            <p className="text-xs text-muted-foreground">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="newPassword" className="text-[10px] font-bold text-foreground/80 ml-1 uppercase tracking-wider">New Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 8+ characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9 h-9 text-xs bg-accent/5 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all shadow-sm rounded-lg"
                  required
                  minLength={8}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-[10px] font-bold text-foreground/80 ml-1 uppercase tracking-wider">Confirm Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 h-9 text-xs bg-accent/5 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all shadow-sm rounded-lg"
                  required
                  minLength={8}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-9 text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 mt-1 rounded-lg bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-1 text-center lg:text-left">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Forgot password?</h1>
          <p className="text-xs text-muted-foreground">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-[10px] font-bold text-foreground/80 ml-1 uppercase tracking-wider">Email Address</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="jane.contractor@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-9 text-xs bg-accent/5 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all shadow-sm rounded-lg"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-9 text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 mt-1 rounded-lg bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
