import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const CHECKBOX_SIZE = 16;

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    style={{
      width: CHECKBOX_SIZE,
      height: CHECKBOX_SIZE,
      minWidth: CHECKBOX_SIZE,
      minHeight: CHECKBOX_SIZE,
      maxWidth: CHECKBOX_SIZE,
      maxHeight: CHECKBOX_SIZE,
      flexShrink: 0,
      padding: 0,
      boxSizing: 'border-box',
    }}
    className={cn(
      "peer shrink-0 rounded-[4px] border border-primary bg-white dark:bg-gray-700 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary flex items-center justify-center",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check
        style={{ width: 10, height: 10, minWidth: 10, minHeight: 10, flexShrink: 0 }}
        className="stroke-[3]"
      />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
