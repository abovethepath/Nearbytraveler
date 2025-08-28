import React from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  position?: "fixed" | "relative";
}

export default function ThemeToggle({ className = "", position = "fixed" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    // Force the DOM class changes immediately
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  };

  const baseClasses = position === "fixed" 
    ? "fixed top-6 right-6 z-50" 
    : "relative";

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm"
      className={`${baseClasses} ${className} bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200`}
      data-testid="theme-toggle"
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 mr-2" />
          Light
        </>
      )}
    </Button>
  );
}