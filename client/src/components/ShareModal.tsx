import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Share2, MessageCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  title: string;
  url: string;
  shareText: string;
  redditText: string;
  trigger: React.ReactNode;
}

export function ShareModal({ title, url, shareText, redditText, trigger }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editableText, setEditableText] = useState(shareText);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedReddit, setCopiedReddit] = useState(false);

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) setEditableText(shareText);
  };

  const copy = async (text: string, which: "link" | "text" | "reddit") => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        toast({ title: "Link copied", description: "Paste it anywhere to share." });
      } else if (which === "text") {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
        toast({ title: "Message copied", description: "Paste into WhatsApp, iMessage, or wherever." });
      } else {
        setCopiedReddit(true);
        setTimeout(() => setCopiedReddit(false), 2000);
        toast({ title: "Reddit post copied", description: "Paste into r/solotravel or your destination's subreddit." });
      }
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually.", variant: "destructive" });
    }
  };

  const nativeShare = async () => {
    const combined = editableText.endsWith(url) ? editableText : `${editableText}\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: combined, url });
        return;
      } catch {
        // fall through
      }
    }
    await copy(combined, "text");
  };

  const combined = editableText.endsWith(url) ? editableText : `${editableText}\n${url}`;
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(combined)}`;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2 text-base">
            <Share2 className="w-4 h-4 text-orange-500 shrink-0" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Editable message preview */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
              Customize your message
            </p>
            <Textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              rows={4}
              className="text-sm resize-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 leading-relaxed"
            />
          </div>

          {/* Copy buttons row */}
          <div className="flex gap-2">
            <Button
              onClick={() => copy(url, "link")}
              variant="outline"
              className="flex-1 gap-2 text-xs h-9"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedLink ? "Copied!" : "Copy Link"}
            </Button>
            <Button
              onClick={() => copy(combined, "text")}
              variant="outline"
              className="flex-1 gap-2 text-xs h-9"
            >
              {copiedText ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedText ? "Copied!" : "Copy Text + Link"}
            </Button>
          </div>

          {/* Platform shortcuts */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={nativeShare}
              className="col-span-1 gap-1.5 text-xs h-9 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white border-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
            <Button
              onClick={() => window.open(whatsAppUrl, "_blank", "noopener,noreferrer")}
              variant="outline"
              className="col-span-1 gap-1.5 text-xs h-9"
            >
              <MessageCircle className="w-3.5 h-3.5 text-green-500" />
              WhatsApp
            </Button>
            <Button
              onClick={() => copy(redditText, "reddit")}
              variant="outline"
              className="col-span-1 gap-1.5 text-xs h-9"
            >
              {copiedReddit ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-orange-500" />
              )}
              {copiedReddit ? "Copied!" : "Reddit"}
            </Button>
          </div>

          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-snug">
            <span className="font-medium text-gray-500 dark:text-gray-400">Reddit tip:</span>{" "}
            Post in r/solotravel, r/travel, or your destination city's subreddit.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
