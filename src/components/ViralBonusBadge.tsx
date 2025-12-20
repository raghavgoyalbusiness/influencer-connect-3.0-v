import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViralBonusBadgeProps {
  isViral: boolean;
  viewCount: number;
  threshold: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
}

export function ViralBonusBadge({ 
  isViral, 
  viewCount, 
  threshold, 
  size = "md",
  showProgress = false 
}: ViralBonusBadgeProps) {
  const progress = Math.min((viewCount / threshold) * 100, 100);
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (!isViral && !showProgress) {
    return null;
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <div
        className={cn(
          "inline-flex items-center rounded-full font-medium transition-all duration-300",
          sizeClasses[size],
          isViral
            ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg shadow-amber-500/30 animate-pulse"
            : "bg-muted/50 text-muted-foreground border border-border"
        )}
      >
        <Sparkles 
          className={cn(
            iconSizes[size],
            isViral && "animate-spin"
          )} 
          style={{ animationDuration: isViral ? "3s" : "0s" }}
        />
        <span>{isViral ? "VIRAL 🔥" : `${progress.toFixed(0)}%`}</span>
      </div>
      
      {showProgress && !isViral && (
        <div className="mt-1 w-full max-w-[80px]">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-0.5">
            {(threshold - viewCount).toLocaleString()} to viral
          </p>
        </div>
      )}

      {/* Glow effect for viral */}
      {isViral && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 blur-xl animate-pulse" />
      )}
    </div>
  );
}
