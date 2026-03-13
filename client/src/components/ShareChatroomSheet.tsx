import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getApiBaseUrl } from "@/lib/queryClient";
import { Copy, Check, Share2, Loader2 } from "lucide-react";

interface ShareChatroomSheetProps {
  open: boolean;
  onClose: () => void;
  chatroomType: string;
  chatroomId: number;
  chatroomName: string;
  currentUserId: number;
}

export default function ShareChatroomSheet({
  open,
  onClose,
  chatroomType,
  chatroomId,
  chatroomName,
  currentUserId,
}: ShareChatroomSheetProps) {
  const { toast } = useToast();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    if (inviteUrl) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/chatrooms/${chatroomType}/${chatroomId}/invite-link`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "x-user-id": String(currentUserId) },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate link");
      setInviteUrl(data.inviteUrl);
    } catch (err: any) {
      toast({ title: "Couldn't generate link", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) generateLink();
    else onClose();
  };

  const shareText = `Join "${chatroomName}" on Nearby Traveler`;

  const shareWhatsApp = () => {
    if (!inviteUrl) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n" + inviteUrl)}`, "_blank", "noopener");
  };

  const shareTelegram = () => {
    if (!inviteUrl) return;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!", description: "Share it with anyone." });
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Share2 className="w-5 h-5 text-orange-500" />
            Share Chat
          </DialogTitle>
        </DialogHeader>

        <div className="mt-1 space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            Invite people to <span className="font-semibold text-gray-700 dark:text-gray-200">{chatroomName}</span>
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <>
              <button
                onClick={shareWhatsApp}
                disabled={!inviteUrl}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe59] text-white font-semibold transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Share via WhatsApp
              </button>

              <button
                onClick={shareTelegram}
                disabled={!inviteUrl}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0088cc] hover:bg-[#006faa] text-white font-semibold transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Share via Telegram
              </button>

              <button
                onClick={copyLink}
                disabled={!inviteUrl}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold transition-colors disabled:opacity-50"
              >
                {copied ? (
                  <Check className="w-5 h-5 shrink-0 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 shrink-0" />
                )}
                {copied ? "Copied!" : "Copy invite link"}
              </button>

              {inviteUrl && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center truncate px-2">
                  {inviteUrl}
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
