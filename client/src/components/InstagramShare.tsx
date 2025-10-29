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
      canvas.height = 1920; // Instagram story dimensions
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        throw new Error("Canvas not supported");
      }

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#FF6B35"); // Orange
      gradient.addColorStop(1, "#004E89"); // Blue
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add semi-transparent overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Event title
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 72px Arial";
      ctx.textAlign = "center";
      
      // Word wrap for title
      const words = event.title.split(" ");
      let line = "";
      let y = 300;
      const maxWidth = 900;
      
      for (const word of words) {
        const testLine = line + word + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== "") {
          ctx.fillText(line, canvas.width / 2, y);
          line = word + " ";
          y += 85;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);

      // Date and time
      const eventDate = format(new Date(event.date), "EEEE, MMMM d, yyyy");
      const time = event.startTime || "";
      
      y += 150;
      ctx.font = "48px Arial";
      ctx.fillText(`📅 ${eventDate}`, canvas.width / 2, y);
      
      if (time) {
        y += 70;
        ctx.fillText(`🕐 ${time}`, canvas.width / 2, y);
      }

      // Location
      const location = [event.venueName, event.city, event.state].filter(Boolean).join(", ");
      if (location) {
        y += 70;
        ctx.font = "42px Arial";
        ctx.fillText(`📍 ${location}`, canvas.width / 2, y);
      }

      // Description
      if (event.description) {
        y += 150;
        ctx.font = "36px Arial";
        const desc = event.description.slice(0, 150) + (event.description.length > 150 ? "..." : "");
        const descWords = desc.split(" ");
        line = "";
        
        for (const word of descWords) {
          const testLine = line + word + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== "") {
            ctx.fillText(line, canvas.width / 2, y);
            line = word + " ";
            y += 50;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, y);
      }

      // Branding
      ctx.font = "bold 64px Arial";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("Nearby Traveler", canvas.width / 2, canvas.height - 200);
      
      ctx.font = "36px Arial";
      ctx.fillText("Connect • Explore • Experience", canvas.width / 2, canvas.height - 130);

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
          >
            <Instagram className="h-4 w-4" />
            Share on Instagram
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
