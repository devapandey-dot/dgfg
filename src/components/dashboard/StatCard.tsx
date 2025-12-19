import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

const StatCard = ({ title, value, change, changeType = "neutral", icon }: StatCardProps) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p
              className={cn(
                "text-sm font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
