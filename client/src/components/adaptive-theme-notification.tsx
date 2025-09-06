import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Moon, Sun, Monitor, X, Lightbulb } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAdaptiveTheme } from "@/hooks/useAdaptiveTheme";
import { cn } from "@/lib/utils";

export function AdaptiveThemeNotification() {
  const { setTheme, resolvedTheme } = useTheme();
  const { adaptiveSuggestion, timeBasedSuggestion, ambientLightLevel } = useAdaptiveTheme();
  const [dismissed, setDismissed] = useState(false);
  const [lastSuggestion, setLastSuggestion] = useState<string | null>(null);

  // Reset dismissed state when suggestion changes
  useEffect(() => {
    const currentSuggestion = `${adaptiveSuggestion}-${timeBasedSuggestion}-${Date.now()}`;
    if (currentSuggestion !== lastSuggestion) {
      setDismissed(false);
      setLastSuggestion(currentSuggestion);
    }
  }, [adaptiveSuggestion, timeBasedSuggestion, lastSuggestion]);

  // Don't show if no suggestion or dismissed
  if (!adaptiveSuggestion || dismissed) return null;

  const getSuggestionReason = () => {
    if (ambientLightLevel !== null) {
      if (ambientLightLevel < 10) {
        return "Low ambient light detected";
      }
      if (ambientLightLevel > 100) {
        return "Bright environment detected";
      }
    }
    
    const hour = new Date().getHours();
    if (hour >= 19 || hour < 7) {
      return "Evening time - easier on your eyes";
    }
    return "Daytime - better visibility";
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "light":
        return <Sun className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn(
      "fixed bottom-4 left-4 z-[9998] w-80 max-w-[calc(100vw-2rem)]",
      "bg-background/95 backdrop-blur-sm border shadow-lg",
      "animate-in slide-in-from-bottom-2 duration-300"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Switch to {adaptiveSuggestion} mode?
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissed(true)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {getSuggestionReason()}
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setTheme(adaptiveSuggestion);
                  setDismissed(true);
                }}
                className="h-7 text-xs"
              >
                <div className="flex items-center gap-1">
                  {getThemeIcon(adaptiveSuggestion)}
                  Switch
                </div>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme("system")}
                className="h-7 text-xs"
              >
                <div className="flex items-center gap-1">
                  <Monitor className="h-3 w-3" />
                  Auto
                </div>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}