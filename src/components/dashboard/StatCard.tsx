import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  description?: string;
  color?: "blue" | "purple" | "pink" | "green";
}

const StatCard = ({ title, value, change, changeType = "neutral", icon, description, color = "blue" }: StatCardProps) => {
  const colorMap = {
    blue: "bg-blue-600 shadow-blue-200",
    purple: "bg-purple-600 shadow-purple-200",
    pink: "bg-[#d81b60] shadow-pink-200",
    green: "bg-emerald-600 shadow-emerald-200",
  };

  return (
    <motion.div
      className="bg-white rounded-[1.5rem] border border-gray-100 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 group relative overflow-hidden"
      role="group"
      tabIndex={0}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          "flex items-center justify-center h-10 w-10 rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110",
          colorMap[color]
        )}>
          {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
        </div>
        
        {change && (
          <div
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm",
              changeType === "positive" && "bg-emerald-50 text-emerald-600",
              changeType === "negative" && "bg-rose-50 text-rose-600",
              changeType === "neutral" && "bg-gray-50 text-gray-500"
            )}
          >
            {changeType === "positive" && "↑ "}{change}
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-extrabold text-[#1a1f36] tracking-tight">{value}</p>
        {description && (
          <p className="text-[10px] font-medium text-gray-400 mt-1">{description}</p>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
