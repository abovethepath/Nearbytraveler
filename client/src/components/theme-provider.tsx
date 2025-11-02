import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
  isSystemTheme: boolean
  toggleTheme: () => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  resolvedTheme: "light",
  isSystemTheme: false,
  toggleTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    const saved = localStorage.getItem(storageKey) as Theme;
    if (saved && ["dark", "light", "system"].includes(saved)) {
      return saved;
    }
    // Default to dark for new visitors
    return "dark";
  })

  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light")
  const [isSystemTheme, setIsSystemTheme] = useState(theme === "system")

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const newTheme = e.matches ? "dark" : "light"
        setResolvedTheme(newTheme)
        applyTheme(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const applyTheme = (themeToApply: "dark" | "light") => {
    const root = window.document.documentElement
    
    // Add transition class for smooth animation
    root.classList.add('theme-transitioning')
    
    // Remove existing theme classes
    root.classList.remove("light", "dark")
    
    // Add new theme class
    root.classList.add(themeToApply)
    
    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 300)
  }

  useEffect(() => {
    const root = window.document.documentElement
    let actualTheme: "dark" | "light"

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      actualTheme = systemTheme
      setIsSystemTheme(true)
    } else {
      actualTheme = theme
      setIsSystemTheme(false)
    }

    setResolvedTheme(actualTheme)
    applyTheme(actualTheme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    if (theme === "system") {
      // If on system, switch to opposite of current resolved theme
      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    } else {
      // Toggle between light and dark
      setTheme(theme === "dark" ? "light" : "dark")
    }
  }

  const value = {
    theme,
    setTheme,
    resolvedTheme,
    isSystemTheme,
    toggleTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}