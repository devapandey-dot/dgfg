import { ReactNode } from "react";
import authGradientWave from "@/assets/auth-gradient-wave.png";
import Logo from "@/components/Logo";
import AuthCarousel from "@/components/auth/AuthCarousel";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Left side - Form */}
      <div className="w-full lg:w-[50%] flex flex-col p-3 lg:p-5 overflow-hidden relative">
        <div className="z-10 mb-1 shrink-0">
          <Logo />
        </div>
        
        <div className="flex-1 flex items-center justify-center py-0">
          <div className="w-full max-w-[350px] animate-slide-up">
            {children}
          </div>
        </div>
      </div>

      {/* Right side - Image Carousel container */}
      <div className="hidden lg:block lg:w-[50%] sticky top-0 h-screen p-2">
        <div className="h-full w-full rounded-2xl overflow-hidden relative">
          <AuthCarousel />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
