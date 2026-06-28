import React, { useRef, useState } from "react";

// Focal-point picker for an event photo. NON-DESTRUCTIVE: it stores a single
// focal point as two integer percentages (x%, y%, 0-100) — no canvas, no upload,
// no base64.
//
// Why a marker over the full image (not a drag-to-pan crop window):
// a fixed-aspect (1.91:1) object-cover preview can only ever pan ONE axis — the
// image fits the box exactly on the other axis, so there is no vertical (or
// horizontal) travel. To let the user position BOTH axes for ANY image shape, we
// show the whole image (object-contain) and let them drag a focal marker. The
// marker's position as a fraction of the image maps directly to object-position
// (the point to keep when cropping) and to Cloudinary g_xy_center (x_<fx>,y_<fy>).
// A live share-card preview below shows the resulting 1200x630 crop.

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
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  // Map a pointer position to focal percentages relative to the image box.
  const setFromPointer = (clientX: number, clientY: number) => {
    const rect = imgWrapRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    setFx(clamp(((clientX - rect.left) / rect.width) * 100));
    setFy(clamp(((clientY - rect.top) / rect.height) * 100));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setFromPointer(e.clientX, e.clientY); // tap-to-set, then drag to refine
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setFromPointer(e.clientX, e.clientY);
  };

  const endDrag = () => { dragging.current = false; };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-center mb-1 text-gray-900 dark:text-white">Position Your Photo</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
          Drag the dot to the most important part of your photo
        </p>

        {/* Full image with a draggable focal marker — both axes always work */}
        <div className="flex justify-center">
          <div
            ref={imgWrapRef}
            className="relative inline-block max-w-full select-none cursor-crosshair"
            style={{ touchAction: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <img
              src={imageUrl}
              alt="Position preview"
              draggable={false}
              className="block max-w-full w-auto h-auto max-h-[50vh] rounded-xl pointer-events-none select-none"
            />
            {/* Focal marker */}
            <div
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${fx}%`, top: `${fy}%` }}
            >
              <div className="w-7 h-7 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.5)] bg-blue-500/30" />
            </div>
          </div>
        </div>

        {/* Live share-card preview (1200x630) using the chosen focal point */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Share card preview</p>
          <div className="w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700" style={{ aspectRatio: "1200 / 630" }}>
            <img
              src={imageUrl}
              alt="Share card preview"
              draggable={false}
              className="w-full h-full object-cover pointer-events-none"
              style={{ objectPosition: `${fx}% ${fy}%` }}
            />
          </div>
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
