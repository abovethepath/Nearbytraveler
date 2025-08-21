import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function useIsSmall() {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = () => setSmall(mq.matches);
    onChange(); mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return small;
}

export function MobileSafeContainer({
  open, onOpenChange, title, children, width = 720
}: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; children: React.ReactNode; width?: number;
}) {
  const small = useIsSmall();
  const body = (
    <div className="flex flex-col h-full">
      {/* Only this area scrolls; prevents nested scrollbars */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );

  if (small) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] w-full max-w-full p-0 overflow-hidden">
          <SheetHeader className="px-4 pt-4 pb-0">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`w-[min(92vw,${width}px)] max-h-[90vh] p-0 overflow-hidden`}>
        <DialogHeader className="px-6 pt-4 pb-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

/* Chips row that never creates scrollbars */
export function PillRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2 items-center overflow-visible max-w-full">{children}</div>;
}

/* Autosizing textarea with no horizontal scroll */
export function AutosizeTextarea(
  { value, onChange, rows = 3, ...rest }:
  { value: string; onChange: (v: string)=>void; rows?: number } & React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const [h, setH] = useState<number|undefined>(undefined);
  useEffect(() => {
    const el = document.getElementById(rest.id || "bio-area") as HTMLTextAreaElement | null;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
    setH(el.scrollHeight);
  }, [value]);
  return (
    <textarea
      id={rest.id || "bio-area"}
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      rows={rows}
      style={h ? { height: h } : undefined}
      className="w-full leading-6 resize-y overflow-x-hidden rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
      {...rest}
    />
  );
}