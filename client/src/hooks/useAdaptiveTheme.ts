import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

export function useAdaptiveTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [timeBasedSuggestion, setTimeBasedSuggestion] = useState<"light" | "dark" | null>(null);

  // Time-based theme suggestions
  useEffect(() => {
    const updateTimeBasedSuggestion = () => {
      const hour = new Date().getHours();
      
      // Suggest dark mode between 7 PM and 7 AM
      if (hour >= 19 || hour < 7) {
        setTimeBasedSuggestion("dark");
      } else {
        setTimeBasedSuggestion("light");
      }
    };

    updateTimeBasedSuggestion();
    
    // Update every hour
    const interval = setInterval(updateTimeBasedSuggestion, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // System theme detection
  const [systemPreference, setSystemPreference] = useState<"light" | "dark">("light");
  
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const updateSystemPreference = (e: MediaQueryList | MediaQueryListEvent) => {
      setSystemPreference(e.matches ? "dark" : "light");
    };
    
    updateSystemPreference(mediaQuery);
    mediaQuery.addEventListener('change', updateSystemPreference);
    
    return () => mediaQuery.removeEventListener('change', updateSystemPreference);
  }, []);

  // Ambient light detection (if supported)
  const [ambientLightLevel, setAmbientLightLevel] = useState<number | null>(null);
  
  useEffect(() => {
    if ('AmbientLightSensor' in window) {
      try {
        // @ts-ignore - AmbientLightSensor is experimental
        const sensor = new AmbientLightSensor();
        sensor.addEventListener('reading', () => {
          setAmbientLightLevel(sensor.illuminance);
        });
        sensor.start();
        
        return () => {
          try {
            sensor.stop();
          } catch (e) {
            // Sensor may already be stopped
          }
        };
      } catch (error) {
        console.log('Ambient light sensor not available');
      }
    }
  }, []);

  // Auto-suggest theme based on conditions
  const getAdaptiveSuggestion = (): "light" | "dark" | null => {
    // If already using system, no suggestion needed
    if (theme === "system") return null;
    
    // Ambient light takes priority (if available)
    if (ambientLightLevel !== null) {
      // Suggest dark mode in low light (< 10 lux)
      if (ambientLightLevel < 10 && resolvedTheme === "light") {
        return "dark";
      }
      // Suggest light mode in bright light (> 100 lux)
      if (ambientLightLevel > 100 && resolvedTheme === "dark") {
        return "light";
      }
    }
    
    // Fall back to time-based suggestion
    if (timeBasedSuggestion && timeBasedSuggestion !== resolvedTheme) {
      return timeBasedSuggestion;
    }
    
    return null;
  };

  const adaptiveSuggestion = getAdaptiveSuggestion();

  // Auto-apply adaptive suggestion (optional)
  const enableAutoAdapt = (enable: boolean) => {
    if (enable && adaptiveSuggestion) {
      setTheme(adaptiveSuggestion);
    }
  };

  return {
    timeBasedSuggestion,
    systemPreference,
    ambientLightLevel,
    adaptiveSuggestion,
    enableAutoAdapt,
    hasAmbientLightSensor: 'AmbientLightSensor' in window,
  };
}