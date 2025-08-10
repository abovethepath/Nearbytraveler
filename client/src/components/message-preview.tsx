import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Message, User } from "@shared/schema";

interface MessagePreviewProps {
  message: Message;
}

export default function MessagePreview({ message }: MessagePreviewProps) {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const sender = users.find(user => user.id === message.senderId);
  
  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffTime = now.getTime() - messageDate.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes}m ago` : "Just now";
    }
  };

  if (!sender) {
    return null;
  }

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
      <Avatar className="w-10 h-10">
        <AvatarImage src={sender.profileImage} />
        <AvatarFallback>{sender.username?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {sender.username}
          </h4>
          <span className="text-xs text-gray-500">
            {message.createdAt ? formatTime(message.createdAt) : ""}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">
          {message.content}
        </p>
      </div>
      {!message.isRead && (
        <div className="w-2 h-2 bg-travel-blue rounded-full notification-pulse"></div>
      )}
    </div>
  );
}
