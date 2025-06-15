import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div
      className={cn(
        "relative inline-block rounded-full border-2 border-transparent animate-spin",
        sizeClasses[size],
        className
      )}
      style={{
        background: "linear-gradient(white, white) padding-box, conic-gradient(from 0deg, #22c55e, #16a34a, #15803d, #22c55e) border-box",
        animation: "spin 1s linear infinite"
      }}
    >
      <div className="absolute inset-0.5 bg-white rounded-full" />
    </div>
  );
}

export default LoadingSpinner;