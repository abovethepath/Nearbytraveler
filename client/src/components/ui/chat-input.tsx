import * as React from "react"

export interface ChatInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const ChatInput = React.forwardRef<HTMLInputElement, ChatInputProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        style={{
          backgroundColor: '#f3f4f6',
          color: '#111827',
          WebkitTextFillColor: '#111827',
          borderColor: '#9ca3af',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid',
          width: '100%',
          fontSize: '0.875rem',
          outline: 'none',
          ...style
        } as React.CSSProperties}
        className={`text-gray-900 ${className || ''}`}
        {...props}
      />
    )
  }
)

ChatInput.displayName = "ChatInput"
