import * as React from "react"

export interface ChatInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const ChatInput = React.forwardRef<HTMLInputElement, ChatInputProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        style={{
          backgroundColor: '#374151',
          color: '#ffffff',
          borderColor: '#4b5563',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid',
          width: '100%',
          fontSize: '0.875rem',
          outline: 'none',
          ...style
        }}
        className={className}
        {...props}
      />
    )
  }
)

ChatInput.displayName = "ChatInput"
