import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Layout
          "flex h-10 w-full rounded-md border px-3 py-2 text-base md:text-sm",
          // Colors: explicit readable text so password/inputs are never same as background (e.g. yellow on yellow)
          "bg-background border-input",
          "text-gray-900 dark:text-gray-100",
          "dark:bg-gray-800 dark:border-border",
          // Placeholder: visible on both light and dark
          "placeholder:text-gray-500 dark:placeholder:text-gray-400",
          // Focus states
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "ring-offset-background",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-900 dark:file:text-gray-100",
          // Calendar picker dark mode fix
          "dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:brightness-100 dark:[&::-webkit-calendar-picker-indicator]:!opacity-100",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
