import { Button } from "@/components/ui/button";
import { TrendingUp, Zap, Shield, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
              <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Discover Trending
            <span className="block text-primary">Crypto Tokens</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto">
            Stay ahead with real-time token insights, track trending projects, and make informed trading decisions.
          </p>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              onClick={() => navigate("/discover")}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base md:text-lg h-12 md:h-14 px-8 md:px-12"
            >
              Start Exploring
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
          <div className="flex flex-col items-center gap-3 p-6 bg-secondary/50 rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Real-Time Data</h3>
            <p className="text-sm text-muted-foreground text-center">
              Live price updates and trending tokens from DexScreener
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 p-6 bg-secondary/50 rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Trending Analysis</h3>
            <p className="text-sm text-muted-foreground text-center">
              Track market movements and 24h performance metrics
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 p-6 bg-secondary/50 rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Quick Trading</h3>
            <p className="text-sm text-muted-foreground text-center">
              Seamless buy and sell actions right from the feed
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
