import { Link } from "react-router-dom";

const Logo = ({ variant = "default" }: { variant?: "default" | "light" }) => {
  return (
    <Link 
      to="/" 
      className="flex items-center gap-2 font-bold text-xl"
    >
      <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-primary">
        <span className="text-primary-foreground font-bold text-lg">R</span>
      </div>
      <span className={variant === "light" ? "text-primary-foreground" : "text-foreground"}>
        Ranblitz
      </span>
    </Link>
  );
};

export default Logo;
