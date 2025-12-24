import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import AuthLayout from "@/components/layouts/AuthLayout";

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      // Check if we have tokens in URL params (if backend redirects with tokens)
      const token = searchParams.get("token");
      const refreshToken = searchParams.get("refreshToken");
      const error = searchParams.get("error");

      if (error) {
        toast({
          title: "Authentication failed",
          description: error,
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      if (token && refreshToken) {
        // Store tokens and redirect everyone to dashboard
        authService.setAccessToken(token);
        authService.setRefreshToken(refreshToken);
        
        const userData = searchParams.get("user");
        if (userData) {
          try {
            authService.setUser(JSON.parse(decodeURIComponent(userData)));
          } catch (e) {
            console.error("Failed to parse user data", e);
          }
        }

        toast({ title: "Welcome!", description: "Successfully signed in with Google." });
        navigate("/dashboard");
        return;
      }

      // If no tokens in URL, the backend might have returned JSON
      // In that case, we need to fetch from the callback endpoint
      // This is a fallback - ideally the backend should redirect with tokens
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/auth/google/callback`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            authService.setAccessToken(data.data.accessToken);
            authService.setRefreshToken(data.data.refreshToken);
            authService.setUser(data.data.user);
            toast({ title: "Welcome!", description: "Successfully signed in with Google." });
            navigate("/dashboard");
            return;
          }
        }
      } catch (error) {
        console.error("Failed to complete Google OAuth:", error);
      }

      // If we get here, something went wrong
      toast({
        title: "Authentication failed",
        description: "Failed to complete Google sign-in. Please try again.",
        variant: "destructive",
      });
      navigate("/login");
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <AuthLayout>
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Completing sign in...</h1>
          <p className="text-muted-foreground">Please wait while we complete your Google authentication.</p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default GoogleCallback;

