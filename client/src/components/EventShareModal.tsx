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

  const openUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({ title: "Link copied", description: "Paste it anywhere to invite people." });
    } catch {
      toast({ title: "Failed to copy", description: "Please copy the link from the address bar.", variant: "destructive" });
    }
  };

  const copyInstagramCaption = async () => {
    try {
      await navigator.clipboard.writeText(igCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
      toast({ title: "Caption copied", description: "Paste it when you post to Instagram/Facebook/X." });
    } catch {
      toast({ title: "Failed to copy", description: "Please copy the caption manually.", variant: "destructive" });
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }
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

      // Title (wrapped)
      ctx.font = "bold 72px Arial";
      const words = String(event.title || "").split(" ");
      let line = "";
      let y = 300;
      const maxWidth = 900;
      for (const word of words) {
        const testLine = `${line}${word} `;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== "") {
          ctx.fillText(line.trim(), canvas.width / 2, y);
          line = `${word} `;
          y += 85;
        } else {
          line = testLine;
        }
      }
      if (line.trim()) ctx.fillText(line.trim(), canvas.width / 2, y);

      // Date/time
      const dateObj = new Date(event.date);
      const dateStr = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const timeStr = event.startTime || dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      y += 150;
      ctx.font = "48px Arial";
      ctx.fillText(`📅 ${dateStr}`, canvas.width / 2, y);
      if (timeStr) {
        y += 70;
        ctx.fillText(`🕐 ${timeStr}`, canvas.width / 2, y);
      }

      // Location
      const venue = event.venueName || event.venue || "";
      const loc = [venue, event.city, event.state].filter(Boolean).join(", ");
      if (loc) {
        y += 70;
        ctx.font = "42px Arial";
        ctx.fillText(`📍 ${loc}`, canvas.width / 2, y);
      }

      // Branding
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
        toast({ title: "Image downloaded", description: "Ready to post as an Instagram/Facebook story." });
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
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share event
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={nativeShare} className="justify-start gap-2" variant="secondary">
              <Send className="h-4 w-4" />
              Share…
            </Button>
            <Button onClick={copyLink} className="justify-start gap-2" variant="secondary">
              {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedLink ? "Copied" : "Copy link"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => openUrl(whatsappUrl)} className="justify-start gap-2" variant="secondary">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button onClick={() => openUrl(telegramUrl)} className="justify-start gap-2" variant="secondary">
              <MessageCircle className="h-4 w-4" />
              Telegram
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => openUrl(xUrl)} className="justify-start gap-2" variant="secondary">
              <Twitter className="h-4 w-4" />
              X
            </Button>
            <Button onClick={() => openUrl(facebookUrl)} className="justify-start gap-2" variant="secondary">
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => (window.location.href = emailUrl)} className="justify-start gap-2" variant="secondary">
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button onClick={copyInstagramCaption} className="justify-start gap-2" variant="secondary">
              {copiedCaption ? <Check className="h-4 w-4" /> : <Instagram className="h-4 w-4" />}
              {copiedCaption ? "Copied" : "Copy caption"}
            </Button>
          </div>

          <Button
            onClick={downloadInstagramStoryImage}
            disabled={generatingImage}
            className="w-full justify-start gap-2"
            variant="secondary"
            data-testid="button-download-story-image"
          >
            <Download className="h-4 w-4" />
            {generatingImage ? "Generating image…" : "Download story image"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

