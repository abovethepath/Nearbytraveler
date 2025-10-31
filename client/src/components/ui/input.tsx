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
          // Light mode colors
          "bg-white border-gray-300 text-gray-900",
          // Dark mode colors with !important to force override
          "dark:!bg-gray-700 dark:!border-gray-600 dark:!text-white",
          // Focus states - light mode
          "focus:bg-white focus:text-gray-900",
          // Focus states - dark mode with !important
          "dark:focus:!bg-gray-700 dark:focus:!text-white",
          // Placeholder
          "placeholder:text-gray-500 dark:placeholder:!text-gray-400",
          // Focus ring
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Calendar picker dark mode fix
          "dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:brightness-100 dark:[&::-webkit-calendar-picker-indicator]:!opacity-100",
          "ring-offset-background",
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
