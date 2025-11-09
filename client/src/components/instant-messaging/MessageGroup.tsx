interface MessageGroupProps {
  timestampLabel: string;
  children: React.ReactNode;
}

export function MessageGroup({ timestampLabel, children }: MessageGroupProps) {
  return (
    <div className="mb-6">
      {/* Centered timestamp separator */}
      <div className="flex justify-center mb-4">
        <div 
          className="bg-[hsl(var(--msg-header-bg))] border border-[hsl(var(--msg-input-border))] px-3 py-1 rounded-full"
          data-testid={`text-timestamp-group-${timestampLabel}`}
        >
          <p className="text-xs text-[hsl(var(--msg-timestamp))] font-medium">
            {timestampLabel}
          </p>
        </div>
      </div>

      {/* Messages in this group */}
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}
