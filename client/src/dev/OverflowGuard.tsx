import { useEffect, useState } from "react";

export default function OverflowGuard() {
  const [on, setOn] = useState<boolean>(() => localStorage.getItem("overflow-debug") === "1");

  useEffect(() => {
    if (!on) return;
    const highlight = () => {
      document.querySelectorAll<HTMLElement>(".__overflow-mark").forEach(n => n.remove());
      const docWidth = document.documentElement.clientWidth;
      const all = document.body.getElementsByTagName("*");
      for (const el of Array.from(all)) {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.right - 1 > docWidth) {
          (el as HTMLElement).style.outline = "2px solid red";
        }
      }
    };
    highlight();
    window.addEventListener("resize", highlight);
    const id = setInterval(highlight, 1000);
    return () => { clearInterval(id); window.removeEventListener("resize", highlight); };
  }, [on]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "o") {
        const next = !on; setOn(next);
        localStorage.setItem("overflow-debug", next ? "1" : "0");
        if (!next) {
          document.querySelectorAll<HTMLElement>("[style*='outline: 2px solid red']").forEach(n => (n.style.outline = ""));
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [on]);

  return null;
}