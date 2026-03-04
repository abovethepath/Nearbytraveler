import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Instagram, Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface InstagramShareProps {
  event: {
    id: number;
    title: string;
    description?: string | null;
    date: string | Date;
    startTime?: string | null;
    endTime?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    venueName?: string | null;
    imageUrl?: string | null;
  };
  trigger?: React.ReactNode;
}

export function InstagramShare({ event, trigger }: InstagramShareProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Generate Instagram caption with hashtags
  const generateCaption = () => {
    const eventDate = format(new Date(event.date), "EEEE, MMMM d, yyyy");
    const time = event.startTime ? ` at ${event.startTime}` : "";
    const location = [event.venueName, event.city, event.state].filter(Boolean).join(", ");
    
    let caption = `📅 ${event.title}\n\n`;
    caption += `🗓️ ${eventDate}${time}\n`;
    if (location) caption += `📍 ${location}\n`;
    caption += `\n${event.description?.slice(0, 200) || "Join us for this amazing event!"}${event.description && event.description.length > 200 ? "..." : ""}\n\n`;
    
    // Add hashtags
    const hashtags = [
      "#NearbyTraveler",
      "#LocalEvents",
      "#CommunityEvents",
      "#MeetUp",
      event.city ? `#${event.city.replace(/\s+/g, "")}` : "",
      event.state ? `#${event.state.replace(/\s+/g, "")}Events` : "",
      "#TravelCommunity",
      "#SocialEvents"
    ].filter(Boolean);
    
    caption += hashtags.join(" ");
    caption += `\n\n🔗 Join via Nearby Traveler`;
    
    return caption;
  };

  // Generate shareable image using Canvas
  const generateImage = async () => {
    setGenerating(true);
    
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080; // Instagram square dimensions
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        throw new Error("Canvas not supported");
      }

      const W = canvas.width;
      const H = canvas.height;

      const drawWrappedText = (opts: {
        text: string;
        x: number;
        y: number;
        maxWidth: number;
        lineHeight: number;
        maxLines: number;
      }) => {
        const words = (opts.text || "").trim().split(/\s+/).filter(Boolean);
        const lines: string[] = [];
        let line = "";

        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (ctx.measureText(test).width <= opts.maxWidth) {
            line = test;
          } else {
            if (line) lines.push(line);
            line = w;
            if (lines.length >= opts.maxLines) break;
          }
        }
        if (lines.length < opts.maxLines && line) lines.push(line);

        // Ellipsize last line if we had to truncate
        if (lines.length > opts.maxLines) lines.length = opts.maxLines;
        if (lines.length === opts.maxLines && words.length > 0) {
          let last = lines[lines.length - 1] || "";
          while (ctx.measureText(last + "…").width > opts.maxWidth && last.length > 0) {
            last = last.slice(0, -1);
          }
          if (last !== lines[lines.length - 1]) {
            lines[lines.length - 1] = last.trimEnd() + "…";
          }
        }

        lines.forEach((ln, i) => ctx.fillText(ln, opts.x, opts.y + i * opts.lineHeight));
        return opts.y + lines.length * opts.lineHeight;
      };

      const drawCoverImage = (img: HTMLImageElement) => {
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        const scale = Math.max(W / iw, H / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (W - dw) / 2;
        const dy = (H - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
      };

      // Background: event photo (preferred) or brand gradient fallback
      let blobUrl: string | null = null;
      try {
        if (event.imageUrl) {
          // Prefer fetching as blob to avoid canvas CORS tainting on many CDNs.
          const res = await fetch(event.imageUrl, { mode: "cors" });
          if (res.ok) {
            const blob = await res.blob();
            blobUrl = URL.createObjectURL(blob);
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const im = new Image();
              im.onload = () => resolve(im);
              im.onerror = reject;
              im.src = blobUrl as string;
            });
            drawCoverImage(img);
          } else {
            throw new Error("Image fetch failed");
          }
        } else {
          throw new Error("No image URL");
        }
      } catch {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#004E89"); // Blue
        bg.addColorStop(1, "#FF6B35"); // Orange
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
      } finally {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      }

      // Bottom overlay gradient for readability
      const overlay = ctx.createLinearGradient(0, H * 0.35, 0, H);
      overlay.addColorStop(0, "rgba(0,0,0,0)");
      overlay.addColorStop(0.6, "rgba(0,0,0,0.55)");
      overlay.addColorStop(1, "rgba(0,0,0,0.80)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, W, H);

      // Text styles
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const pad = 72;
      const textMaxWidth = W - pad * 2;
      let y = H - 360;

      // Event title (2 lines max)
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "800 64px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      y = drawWrappedText({
        text: event.title,
        x: pad,
        y,
        maxWidth: textMaxWidth,
        lineHeight: 74,
        maxLines: 2,
      });

      // Date + time (single line)
      const eventDate = format(new Date(event.date), "MMM d, yyyy");
      const timeText =
        event.startTime && event.endTime
          ? `${event.startTime} - ${event.endTime}`
          : event.startTime
            ? event.startTime
            : "";
      const dateLine = timeText ? `${eventDate} · ${timeText}` : eventDate;

      ctx.font = "600 34px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillText(dateLine, pad, y + 10);

      // Location (single line)
      const location = [event.venueName, event.city, event.state].filter(Boolean).join(", ");
      if (location) {
        ctx.font = "600 34px system-ui, -apple-system, Segoe UI, Roboto, Arial";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        // Truncate location manually to fit
        let loc = location;
        while (ctx.measureText(loc).width > textMaxWidth && loc.length > 0) {
          loc = loc.slice(0, -1);
        }
        if (loc !== location) loc = loc.trimEnd() + "…";
        ctx.fillText(loc, pad, y + 56);
      }

      // Branding
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "700 28px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("NearbyTraveler.org", W - pad, H - 56);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `nearby-traveler-event-${event.id}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Image Downloaded!",
            description: "Your event image is ready to share on Instagram"
          });
        }
      }, "image/png");
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyCaption = async () => {
    const caption = generateCaption();
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Caption Copied!",
        description: "Paste it when you post to Instagram"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy caption. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            data-testid="button-share-instagram"
            title="Share on Instagram"
          >
            <Instagram className="h-4 w-4" />
            <span className="hidden sm:inline">Share on Instagram</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-600" />
            Share to Instagram
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Generate a beautiful event image and caption to share on Instagram
          </div>

          {/* Download Image Button */}
          <Button
            onClick={generateImage}
            disabled={generating}
            className="w-full gap-2"
            data-testid="button-download-instagram-image"
          >
            <Download className="h-4 w-4" />
            {generating ? "Generating..." : "Download Event Image"}
          </Button>

          {/* Caption Preview */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Instagram Caption:</div>
            <div className="bg-muted p-3 rounded-md text-sm max-h-60 overflow-y-auto whitespace-pre-wrap">
              {generateCaption()}
            </div>
            <Button
              onClick={copyCaption}
              variant="outline"
              className="w-full gap-2"
              data-testid="button-copy-instagram-caption"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Caption Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Caption
                </>
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm space-y-2">
            <div className="font-medium">How to share:</div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Download the event image</li>
              <li>Copy the caption</li>
              <li>Open Instagram app</li>
              <li>Create a new post or story</li>
              <li>Upload the downloaded image</li>
              <li>Paste the caption</li>
              <li>Share!</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
