import { useEffect, useState } from "react";
import { Shield, AlertTriangle, XCircle, Lock, Users, Droplet, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { fetchRugCheckReport, RugCheckReport, calculateRiskLevel, getRiskColor } from "@/services/rugcheck";
import { SecurityBadge } from "./SecurityBadge";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface SecurityInfoOverlayProps {
  contractAddress: string;
  className?: string;
}

export const SecurityInfoOverlay = ({ contractAddress, className }: SecurityInfoOverlayProps) => {
  const [report, setReport] = useState<RugCheckReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError(false);
      const data = await fetchRugCheckReport(contractAddress);
      
      if (data) {
        setReport(data);
      } else {
        setError(true);
      }
      setLoading(false);
    };

    loadReport();
  }, [contractAddress]);

  if (loading) {
    return (
      <div className={cn("absolute top-2 left-2 z-10 w-12 h-12 bg-secondary/95 backdrop-blur-sm border border-border rounded-lg flex items-center justify-center", className)}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return null;
  }

  const riskLevel = calculateRiskLevel(report.score);
  const topRisks = report.risks?.filter(r => r.level.toLowerCase() === 'danger' || r.level.toLowerCase() === 'warn').slice(0, 3) || [];
  const topHolderPct = report.topHolders?.[0]?.pct || 0;
  const lpLocked = report.markets?.[0]?.lp?.lpLockedPct || 0;

  return (
    <div className={cn("absolute top-2 left-2 z-10 transition-all duration-300", className)}>
      <div className={cn(
        "bg-secondary/95 backdrop-blur-sm border border-border rounded-lg shadow-lg overflow-hidden transition-all duration-300",
        expanded ? "w-64" : "w-12"
      )}>
        {/* Collapsed View - Icon Only */}
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full h-12 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            {riskLevel === 'GOOD' ? (
              <Shield className="w-5 h-5 text-success" />
            ) : riskLevel === 'MEDIUM' ? (
              <AlertTriangle className="w-5 h-5 text-warning" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
          </button>
        )}

        {/* Expanded View */}
        {expanded && (
          <div className="p-3 space-y-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-foreground mb-1">Security Check</div>
                <SecurityBadge 
                  riskLevel={riskLevel} 
                  score={report.score || 0}
                  showIcon={false}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1 -mr-1 flex-shrink-0"
                onClick={() => setExpanded(false)}
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="space-y-1.5">
              {/* Authorities */}
              {report.tokenMeta && (
                <div className="flex items-center gap-1.5 text-[9px]">
                  <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {report.tokenMeta.mintAuthority === null && report.tokenMeta.freezeAuthority === null ? (
                      <span className="text-success">Authorities Revoked ✓</span>
                    ) : (
                      <span className="text-warning">Authorities Active</span>
                    )}
                  </span>
                </div>
              )}

              {/* Top Holder */}
              {topHolderPct > 0 && (
                <div className="flex items-center gap-1.5 text-[9px]">
                  <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Top Holder: <span className={topHolderPct > 50 ? "text-warning" : "text-foreground"}>{topHolderPct.toFixed(1)}%</span>
                  </span>
                </div>
              )}

              {/* LP Locked */}
              {lpLocked > 0 && (
                <div className="flex items-center gap-1.5 text-[9px]">
                  <Droplet className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    LP Locked: <span className={lpLocked < 80 ? "text-warning" : "text-success"}>{lpLocked.toFixed(0)}%</span>
                  </span>
                </div>
              )}
            </div>

            {/* Top Risks */}
            {topRisks.length > 0 && (
              <div className="pt-1 border-t border-border space-y-1">
                <div className="text-[9px] font-medium text-muted-foreground">Risks Detected:</div>
                <div className="space-y-0.5">
                  {topRisks.map((risk, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[8px] px-1 py-0 h-4 flex-shrink-0",
                          risk.level.toLowerCase() === 'danger' && "bg-destructive/20 text-destructive border-destructive/30",
                          risk.level.toLowerCase() === 'warn' && "bg-warning/20 text-warning border-warning/30"
                        )}
                      >
                        {risk.level.toUpperCase()}
                      </Badge>
                      <span className="text-[8px] text-foreground leading-tight">{risk.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rugged Warning */}
            {report.rugged && (
              <div className="pt-1 border-t border-destructive/50">
                <Badge variant="outline" className="w-full bg-destructive/20 text-destructive border-destructive text-[9px] justify-center">
                  ⚠️ RUGGED
                </Badge>
              </div>
            )}

            {/* Footer Link */}
            <div className="pt-1 border-t border-border">
              <a
                href={`https://rugcheck.xyz/tokens/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[8px] text-primary hover:underline block text-center"
              >
                View Full Report →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
