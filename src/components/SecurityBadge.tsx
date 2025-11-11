import { Shield, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface SecurityBadgeProps {
  riskLevel: 'GOOD' | 'MEDIUM' | 'HIGH';
  score: number;
  className?: string;
  showIcon?: boolean;
}

export const SecurityBadge = ({ 
  riskLevel, 
  score, 
  className,
  showIcon = true 
}: SecurityBadgeProps) => {
  const config = {
    GOOD: {
      icon: Shield,
      label: 'SAFE',
      color: 'bg-success/20 text-success border-success/30',
    },
    MEDIUM: {
      icon: AlertTriangle,
      label: 'WARNING',
      color: 'bg-warning/20 text-warning border-warning/30',
    },
    HIGH: {
      icon: XCircle,
      label: 'RISKY',
      color: 'bg-destructive/20 text-destructive border-destructive/30',
    },
  };

  const { icon: Icon, label, color } = config[riskLevel];

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[9px] px-1.5 py-0.5 font-bold flex items-center gap-0.5",
        color,
        className
      )}
    >
      {showIcon && <Icon className="w-2.5 h-2.5" />}
      {label} {score.toFixed(1)}
    </Badge>
  );
};
