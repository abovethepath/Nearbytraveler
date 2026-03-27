import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface IcebreakerPromptProps {
  type: "community" | "event";
  id: number;
  name: string;
  chatId?: number; // event chatroom ID for posting to chat
  onClose: () => void;
}

function getStorageKey(type: string, id: number) {
  return `icebreaker_shown_${type}_${id}`;
}

export function hasShownIcebreaker(type: string, id: number): boolean {
  try {
    return localStorage.getItem(getStorageKey(type, id)) === "1";
  } catch {
    return false;
  }
}

export function markIcebreakerShown(type: string, id: number) {
  try {
    localStorage.setItem(getStorageKey(type, id), "1");
  } catch {}
}

export function IcebreakerPrompt({ type, id, name, chatId, onClose }: IcebreakerPromptProps) {
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!message.trim()) return;
    setPosting(true);
    try {
      if (type === "community") {
        await apiRequest("POST", `/api/community-tags/${id}/posts`, {
          content: `\u{1F44B} New member intro: ${message.trim()}`,
          postType: "text",
        });
      } else if (type === "event" && chatId) {
        await apiRequest("POST", `/api/event-chatrooms/${chatId}/messages`, {
          message: `\u{1F44B} Just joined: ${message.trim()}`,
          messageType: "text",
        });
      }
      markIcebreakerShown(type, id);
      onClose();
    } catch (err) {
      console.error("Icebreaker post failed:", err);
      markIcebreakerShown(type, id);
      onClose();
    } finally {
      setPosting(false);
    }
  };

  const handleSkip = () => {
    markIcebreakerShown(type, id);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {type === "community"
              ? `Welcome to ${name}! \u{1F44B}`
              : `You're going to ${name}! \u{1F389}`}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {type === "community"
            ? "Introduce yourself to the community"
            : "Say hi to other attendees"}
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          placeholder={
            type === "community"
              ? `Tell us one thing about yourself or why you joined ${name}...`
              : "Tell the group something about yourself or what you're looking forward to..."
          }
          className="w-full mt-2 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          rows={3}
          maxLength={200}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-400">{message.length}/200</span>
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            onClick={handlePost}
            disabled={posting || !message.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {posting
              ? "Posting..."
              : type === "community"
              ? "Post Introduction"
              : "Post to Event Chat"}
          </Button>
          <Button variant="outline" onClick={handleSkip} disabled={posting} className="flex-1">
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
