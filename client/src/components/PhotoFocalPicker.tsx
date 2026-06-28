import React, { useRef, useState } from "react";

// Drag-to-reposition picker for an event photo's focal point.
//
// Reuses the pointer-drag mechanic from the avatar crop tool (profile-complete.tsx),
// but instead of rasterizing/re-uploading, it is NON-DESTRUCTIVE: it stores a single
// focal point as two integer percentages (x%, y%, 0-100). The preview viewport is the
// 1.91:1 share-card shape (1200x630) and uses the SAME object-fit: cover + object-position
// that every render site uses, so it is WYSIWYG — dragging shows exactly what the share
// card / cards / detail banner will frame. No canvas, no upload, no base64.

interface PhotoFocalPickerProps {
  imageUrl: string;
  initialX?: number | null;
  initialY?: number | null;
  onSave: (x: number, y: number) => void;
  onClose: () => void;
}

export function PhotoFocalPicker({ imageUrl, initialX, initialY, onSave, onClose }: PhotoFocalPickerProps) {
  const [fx, setFx] = useState<number>(initialX ?? 50);
  const [fy, setFy] = useState<number>(initialY ?? 50);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const start = useRef({ px: 0, py: 0, fx: 50, fy: 50 });

  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    start.current = { px: e.clientX, py: e.clientY, fx, fy };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - start.current.px;
    const dy = e.clientY - start.current.py;
    // Dragging the image right reveals more of its LEFT edge → focal X decreases
    // (object-position semantics). Same for vertical.
    setFx(clamp(start.current.fx - (dx / rect.width) * 100));
    setFy(clamp(start.current.fy - (dy / rect.height) * 100));
  };

  const endDrag = () => { dragging.current = false; };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-center mb-1 text-gray-900 dark:text-white">Position Your Photo</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
          Drag to choose what shows in the share preview
        </p>

        {/* 1.91:1 share-card viewport (1200x630) — WYSIWYG of the social card crop */}
        <div
          ref={boxRef}
          className="relative w-full overflow-hidden rounded-xl border-4 border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing select-none bg-gray-100 dark:bg-gray-800"
          style={{ aspectRatio: "1200 / 630", touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <img
            src={imageUrl}
            alt="Position preview"
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
            style={{ objectPosition: `${fx}% ${fy}%` }}
          />
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(Math.round(fx), Math.round(fy))}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
          >
            Save position
          </button>
        </div>
      </div>
    </div>
  );
}
