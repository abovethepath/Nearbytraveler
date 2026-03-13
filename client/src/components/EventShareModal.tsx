import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Check, Share2, Send, Facebook, Twitter, Mail, MessageCircle, Download, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  ShareEventLike,
  getEmailShareUrl,
  getEventShareMessage,
  getEventUrl,
  getFacebookShareUrl,
  getInstagramCaption,
  getTelegramShareUrl,
  getWhatsAppShareUrl,
  getXShareUrl,
} from "@/lib/eventShare";

type Props = {
  event: ShareEventLike;
  trigger?: React.ReactNode;
};

interface ShareButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  bgClass: string;
  disabled?: boolean;
}

function ShareButton({ onClick, icon, label, sublabel, bgClass, disabled }: ShareButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed ${bgClass}`}
    >
      <div className="text-white">{icon}</div>
      <span className="text-white text-[11px] font-semibold leading-tight text-center">{label}</span>
      {sublabel && <span className="text-white/70 text-[9px] leading-tight text-center">{sublabel}</span>}
    </button>
  );
}

export function EventShareModal({ event, trigger }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://nearbytraveler.org";
  const eventUrl = typeof window !== "undefined" ? getEventUrl(event.id, origin) : `https://nearbytraveler.org/events/${event.id}`;
  const shareText = typeof window !== "undefined" ? getEventShareMessage(event, origin) : `Check out this event: ${event.title}`;
  const igCaption = typeof window !== "undefined" ? getInstagramCaption(event, origin) : shareText;

  const openUrl = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({ title: "Link copied!", description: "Paste it anywhere to invite people." });
    } catch {
      toast({ title: "Failed to copy", description: "Copy from the address bar instead.", variant: "destructive" });
    }
  };

  const copyInstagramCaption = async () => {
    try {
      await navigator.clipboard.writeText(igCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
      toast({ title: "Caption copied!", description: "Paste it when posting to Instagram." });
    } catch {
      toast({ title: "Failed to copy", description: "Please copy the caption manually.", variant: "destructive" });
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) { await copyLink(); return; }
    try {
      await navigator.share({ title: event.title, text: shareText, url: eventUrl });
    } catch {
      await copyLink();
    }
  };

  const downloadInstagramStoryImage = async () => {
    setGeneratingImage(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#FF6B35");
      gradient.addColorStop(1, "#004E89");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";

      ctx.font = "bold 72px Arial";
      const words = String(event.title || "").split(" ");
      let line = "";
      let y = 300;
      const maxWidth = 900;
      for (const word of words) {
        const testLine = `${line}${word} `;
        if (ctx.measureText(testLine).width > maxWidth && line !== "") {
          ctx.fillText(line.trim(), canvas.width / 2, y);
          line = `${word} `;
          y += 85;
        } else {
          line = testLine;
        }
      }
      if (line.trim()) ctx.fillText(line.trim(), canvas.width / 2, y);

      const dateObj = new Date(event.date);
      const dateStr = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const timeStr = event.startTime || dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      y += 150;
      ctx.font = "48px Arial";
      ctx.fillText(`📅 ${dateStr}`, canvas.width / 2, y);
      if (timeStr) { y += 70; ctx.fillText(`🕐 ${timeStr}`, canvas.width / 2, y); }

      const venue = event.venueName || event.venue || "";
      const loc = [venue, event.city, event.state].filter(Boolean).join(", ");
      if (loc) { y += 70; ctx.font = "42px Arial"; ctx.fillText(`📍 ${loc}`, canvas.width / 2, y); }

      ctx.font = "bold 64px Arial";
      ctx.fillText("Nearby Traveler", canvas.width / 2, canvas.height - 200);
      ctx.font = "36px Arial";
      ctx.fillText("Connect • Explore • Experience", canvas.width / 2, canvas.height - 130);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nearby-traveler-event-${event.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Image downloaded!", description: "Ready to post as a story." });
      }, "image/png");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to generate image.", variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };

  const telegramUrl = getTelegramShareUrl(shareText, eventUrl);
  const whatsappUrl = getWhatsAppShareUrl(shareText);
  const xUrl = getXShareUrl(shareText, eventUrl);
  const facebookUrl = getFacebookShareUrl(eventUrl);
  const emailUrl = getEmailShareUrl(`You're invited: ${event.title}`, `${shareText}\n\nRSVP: ${eventUrl}`);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2" data-testid="button-open-share-event">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm bg-white dark:bg-gray-900 p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 px-5 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <div className="bg-white/25 rounded-lg p-1.5 flex-shrink-0">
                <Share2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-base leading-tight">Share event</p>
                <p className="text-white/75 text-[11px] font-normal leading-tight truncate max-w-[220px]">
                  {event.title}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-4">
          {/* Primary actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={nativeShare}
              className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 active:scale-95 transition-all"
            >
              <Send className="h-4 w-4 text-white flex-shrink-0" />
              <span className="text-white text-sm font-semibold">Share…</span>
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 hover:opacity-90 active:scale-95 transition-all"
            >
              {copiedLink
                ? <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                : <Copy className="h-4 w-4 text-white flex-shrink-0" />}
              <span className="text-white text-sm font-semibold">{copiedLink ? "Copied!" : "Copy link"}</span>
            </button>
          </div>

          {/* Social grid — 3 columns */}
          <div className="grid grid-cols-3 gap-2.5">
            <ShareButton
              onClick={() => openUrl(whatsappUrl)}
              icon={<MessageCircle className="w-6 h-6" />}
              label="WhatsApp"
              bgClass="bg-[#25D366]"
            />
            <ShareButton
              onClick={() => openUrl(telegramUrl)}
              icon={<Send className="w-6 h-6" />}
              label="Telegram"
              bgClass="bg-[#0088cc]"
            />
            <ShareButton
              onClick={() => openUrl(facebookUrl)}
              icon={<Facebook className="w-6 h-6" />}
              label="Facebook"
              bgClass="bg-[#1877F2]"
            />
            <ShareButton
              onClick={() => openUrl(xUrl)}
              icon={<Twitter className="w-6 h-6" />}
              label="X (Twitter)"
              bgClass="bg-black dark:bg-gray-800"
            />
            <ShareButton
              onClick={() => { window.location.href = emailUrl; }}
              icon={<Mail className="w-6 h-6" />}
              label="Email"
              bgClass="bg-purple-600"
            />
            <ShareButton
              onClick={copyInstagramCaption}
              icon={copiedCaption ? <Check className="w-6 h-6" /> : <Instagram className="w-6 h-6" />}
              label={copiedCaption ? "Copied!" : "Caption"}
              sublabel={copiedCaption ? "" : "for Instagram"}
              bgClass="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400"
            />
          </div>

          {/* Download story */}
          <button
            onClick={downloadInstagramStoryImage}
            disabled={generatingImage}
            data-testid="button-download-story-image"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 text-white flex-shrink-0" />
            <span className="text-white text-sm font-semibold">
              {generatingImage ? "Generating image…" : "Download story image"}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
