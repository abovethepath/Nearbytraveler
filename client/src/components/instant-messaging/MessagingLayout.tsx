import React, { useRef, useEffect } from 'react';

interface MessagingLayoutProps {
  header: React.ReactNode;
  messages: React.ReactNode;
  input: React.ReactNode;
  sidebar?: React.ReactNode; // For responsive sidebar on desktop
}

export function MessagingLayout({ header, messages, input, sidebar }: MessagingLayoutProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive (optional behavior)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Optional sidebar (desktop) */}
      {sidebar && (
        <div className="hidden md:flex md:w-80 border-r border-gray-200 dark:border-gray-700">
          {sidebar}
        </div>
      )}

      {/* Main messaging area */}
      <div className="flex-1 flex flex-col bg-[hsl(var(--msg-bg))]">
        {/* Header (sticky) */}
        {header}

        {/* Messages area (scrollable) */}
        <div 
          className="flex-1 overflow-y-auto px-4 py-4"
          data-testid="messages-container"
        >
          {messages}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area (sticky) */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {input}
        </div>
      </div>
    </div>
  );
}
