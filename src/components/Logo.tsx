import { Link } from "react-router-dom";

const Logo = ({ variant = "default" }: { variant?: "default" | "light" }) => {
  const destination = localStorage.getItem('accessToken') ? "/dashboard" : "/login";
  
  return (
    <Link 
      to={destination} 
      className="flex items-center gap-2 font-bold text-xl"
    >
      <div className="flex items-center justify-center">
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="animate-spin-slow"
        >
          <circle cx="50" cy="50" r="18" fill="white" />
          {[...Array(12)].map((_, i) => (
            <rect
              key={i}
              x="45"
              y="5"
              width="10"
              height="30"
              rx="2"
              fill="#007AFF"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
        </svg>
      </div>
      <span className={variant === "light" ? "text-primary-foreground" : "text-foreground"}>
        Ranblitz
      </span>
    </Link>
  );
};

export default Logo;
