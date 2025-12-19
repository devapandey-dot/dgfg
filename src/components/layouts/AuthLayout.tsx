import { ReactNode } from "react";
import authGradientWave from "@/assets/auth-gradient-wave.png";
import Logo from "@/components/Logo";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col p-8 lg:p-12">
        <div className="mb-8">
          <Logo />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md animate-slide-up">
            {children}
          </div>
        </div>
      </div>

      {/* Right side - Gradient wave image */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative overflow-hidden">
        <img
          src={authGradientWave}
          alt="Decorative gradient"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
      </div>
    </div>
  );
};

export default AuthLayout;
