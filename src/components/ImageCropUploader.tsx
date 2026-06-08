import { useRef, useState, useCallback } from "react";
import { ImageIcon, Upload, Check, X, ZoomIn, ZoomOut } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  ratio?: number; // width/height, e.g. 4/3, 16/9, 1
  label?: string;
  className?: string;
}

export function ImageCropUploader({ value, onChange, ratio = 4 / 3, label = "Şəkil yüklə", className }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [stage, setStage] = useState<"idle" | "crop" | "uploading">("idle");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const PREVIEW_W = 360;
  const PREVIEW_H = Math.round(PREVIEW_W / ratio);

  const drawCanvas = useCallback((img: HTMLImageElement, sc: number, off: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    ctx.drawImage(img, off.x, off.y, img.naturalWidth * sc, img.naturalHeight * sc);
  }, [PREVIEW_W, PREVIEW_H]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        const fitScale = Math.max(PREVIEW_W / img.naturalWidth, PREVIEW_H / img.naturalHeight);
        const initOffset = {
          x: (PREVIEW_W - img.naturalWidth * fitScale) / 2,
          y: (PREVIEW_H - img.naturalHeight * fitScale) / 2,
        };
        setScale(fitScale);
        setOffset(initOffset);
        setStage("crop");
        setTimeout(() => drawCanvas(img, fitScale, initOffset), 20);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = Math.max(0.1, scale * (e.deltaY > 0 ? 0.9 : 1.1));
    setScale(newScale);
    if (imgRef.current) drawCanvas(imgRef.current, newScale, offset);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !imgRef.current) return;
    const newOff = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
    setOffset(newOff);
    drawCanvas(imgRef.current, scale, newOff);
  };
  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || !imgRef.current) return;
    const t = e.touches[0];
    const newOff = { x: t.clientX - dragStart.x, y: t.clientY - dragStart.y };
    setOffset(newOff);
    drawCanvas(imgRef.current, scale, newOff);
  };

  const zoom = (factor: number) => {
    const newScale = Math.max(0.1, scale * factor);
    setScale(newScale);
    if (imgRef.current) drawCanvas(imgRef.current, newScale, offset);
  };

  const handleConfirm = async () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    setStage("uploading");

    // High-res export canvas (1200px wide for banners)
    const OUT_W = Math.min(1200, img.naturalWidth);
    const OUT_H = Math.round(OUT_W / ratio);
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = OUT_W;
    exportCanvas.height = OUT_H;
    const ctx = exportCanvas.getContext("2d")!;
    const scaleUp = OUT_W / PREVIEW_W;
    ctx.drawImage(img, offset.x * scaleUp, offset.y * scaleUp, img.naturalWidth * scale * scaleUp, img.naturalHeight * scale * scaleUp);

    exportCanvas.toBlob(async (blob) => {
      if (!blob) { setStage("crop"); return; }
      try {
        const url = await api.uploadFile(new File([blob], "image.jpg", { type: "image/jpeg" }));
        onChange(url);
        setStage("idle");
        imgRef.current = null;
      } catch {
        setStage("crop");
      }
    }, "image/jpeg", 0.92);
  };

  const handleCancel = () => {
    setStage("idle");
    imgRef.current = null;
  };

  return (
    <div className={className}>
      {stage === "idle" && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-border px-4 py-3 hover:border-[var(--brand)] transition-colors">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{label}</span>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          {value && (
            <div className="relative w-full overflow-hidden rounded-xl border border-border" style={{ aspectRatio: ratio }}>
              <img src={value} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => onChange("")}
                className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-red-500 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {(stage === "crop" || stage === "uploading") && (
        <div className="rounded-xl border border-border overflow-hidden bg-secondary/20">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background text-xs text-muted-foreground">
            <span>Sürüşdür • zoom üçün sıx</span>
            <div className="flex gap-1">
              <button onClick={() => zoom(1.15)} className="p-1 rounded hover:bg-secondary"><ZoomIn className="h-4 w-4" /></button>
              <button onClick={() => zoom(0.87)} className="p-1 rounded hover:bg-secondary"><ZoomOut className="h-4 w-4" /></button>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={PREVIEW_W}
            height={PREVIEW_H}
            className="w-full cursor-grab active:cursor-grabbing select-none touch-none"
            style={{ display: "block" }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          />
          <div className="flex gap-2 p-3">
            <button
              onClick={handleConfirm}
              disabled={stage === "uploading"}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {stage === "uploading" ? <Upload className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {stage === "uploading" ? "Yüklənir..." : "Təsdiqlə"}
            </button>
            <button
              onClick={handleCancel}
              disabled={stage === "uploading"}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary"
            >
              <X className="h-4 w-4" /> Ləğv et
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
