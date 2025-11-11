import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface RateLimitErrorProps {
  onRefresh?: () => void;
}

export const RateLimitError = ({ onRefresh }: RateLimitErrorProps) => {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-fade-in">
      <Alert variant="destructive" className="bg-destructive/90 backdrop-blur-sm border-destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="ml-2 text-xs">
          API rate limit reached. Using cached data. Will retry automatically.
        </AlertDescription>
      </Alert>
    </div>
  );
};
