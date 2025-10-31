import * as React from "react"

export interface ChatInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const ChatInput = React.forwardRef<HTMLInputElement, ChatInputProps>(
  ({ style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        style={{
          backgroundColor: '#ffffff',
          color: '#000000',
          borderColor: '#9ca3af',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid #9ca3af',
          width: '100%',
          fontSize: '0.875rem',
          outline: 'none',
          ...style
        }}
        {...props}
      />
    )
  }
)

ChatInput.displayName = "ChatInput"
