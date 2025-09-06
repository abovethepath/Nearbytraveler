import { Moon, Sun, Monitor, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export function AdaptiveThemeToggle() {
  const { theme, setTheme, resolvedTheme, isSystemTheme, toggleTheme } = useTheme()

  const getThemeIcon = () => {
    if (isSystemTheme) {
      return <Monitor className="h-4 w-4" />
    }
    return resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
  }

  const getThemeLabel = () => {
    if (isSystemTheme) {
      return `Auto (${resolvedTheme === "dark" ? "Dark" : "Light"})`
    }
    return resolvedTheme === "dark" ? "Dark" : "Light"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={cn(
            "relative h-9 w-9 rounded-md transition-all duration-200",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <div className="relative flex items-center justify-center">
            {getThemeIcon()}
            {isSystemTheme && (
              <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
            )}
          </div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "cursor-pointer",
            theme === "light" && "bg-accent text-accent-foreground"
          )}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {theme === "light" && (
            <div className="ml-auto h-2 w-2 rounded-full bg-current" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "cursor-pointer",
            theme === "dark" && "bg-accent text-accent-foreground"
          )}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {theme === "dark" && (
            <div className="ml-auto h-2 w-2 rounded-full bg-current" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "cursor-pointer",
            theme === "system" && "bg-accent text-accent-foreground"
          )}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {theme === "system" && (
            <div className="ml-auto h-2 w-2 rounded-full bg-current" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={toggleTheme}
          className="cursor-pointer text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <span>Quick Toggle</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>T
            </kbd>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Simple theme toggle button for mobile/compact spaces
export function SimpleThemeToggle() {
  const { toggleTheme, resolvedTheme, isSystemTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative h-9 w-9 rounded-md transition-all duration-200",
        "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <div className="relative flex items-center justify-center">
        {resolvedTheme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
        {isSystemTheme && (
          <div className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}