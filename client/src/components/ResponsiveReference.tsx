
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// re-use your QUICK_TAGS_OPTIONS
const TAGS = ["Reliable","Friendly","Knowledgeable","Fun","Safe","Organized","Flexible","Communicative","Respectful","Adventurous","Helpful","Clean","Punctual"];

function useIsSmall() {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => setSmall(mq.matches);
    onChange(); 
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return small;
}

export function LeaveReferenceButton({ revieweeId }: { revieweeId: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>Leave a Reference</Button>
      <ResponsiveReference open={open} onOpenChange={setOpen} revieweeId={revieweeId} />
    </>
  );
}

export function ResponsiveReference({
  open, onOpenChange, revieweeId
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  revieweeId: number;
}) {
  const isSmall = useIsSmall();
  const qc = useQueryClient();

  const [experience, setExperience] = useState<"positive"|"neutral"|"negative">("positive");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (open) { 
      setExperience("positive"); 
      setContent(""); 
      setTags([]); 
    }
  }, [open]);

  const toggleTag = (t: string) =>
    setTags((prev) => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/references", {
        revieweeId,
        experience,
        content,
        quickTags: tags,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["references", revieweeId] });
      onOpenChange(false);
    },
  });

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await mutateAsync();
  };

  const Body = (
    <div className="flex flex-col h-full">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        <div>
          <Label className="mb-2 block">How was your experience?</Label>
          <RadioGroup
            className="flex gap-4"
            value={experience}
            onValueChange={(v) => setExperience(v as any)}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="pos" value="positive" /> 
              <Label htmlFor="pos">Positive</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="neu" value="neutral" /> 
              <Label htmlFor="neu">Neutral</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="neg" value="negative" /> 
              <Label htmlFor="neg">Negative</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="mb-2 block">Quick tags</Label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`rounded-full text-xs px-3 py-1 border transition-colors ${
                  tags.includes(t) 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-transparent border-border hover:bg-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Your reference</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your experience with this person..."
            className="min-h-24"
          />
        </div>
      </div>

      {/* Fixed footer */}
      <div className="border-t p-4 sm:p-6 flex gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!content.trim() || isPending}
          className="flex-1"
        >
          {isPending ? "Submitting..." : "Submit Reference"}
        </Button>
      </div>
    </div>
  );

  if (isSmall) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[80vh] p-0">
          <SheetHeader className="p-4 sm:p-6 border-b">
            <SheetTitle>Leave a Reference</SheetTitle>
          </SheetHeader>
          {Body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[80vh] p-0">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <DialogTitle>Leave a Reference</DialogTitle>
        </DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  );
}
