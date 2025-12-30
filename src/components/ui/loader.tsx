import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  text?: string;
}

const Loader = ({ 
  className, 
  size = "md", 
  showText = false, 
  text = "Loading..." 
}: LoaderProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn("relative animate-spin", sizeClasses[size])}>
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <circle cx="50" cy="50" r="18" fill="currentColor" className="text-primary/20" />
          {[...Array(12)].map((_, i) => (
            <rect
              key={i}
              x="45"
              y="5"
              width="10"
              height="30"
              rx="5"
              fill="currentColor"
              className="text-primary"
              style={{ opacity: 1 - (i * 0.05) }}
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
        </svg>
      </div>
      {showText && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;
