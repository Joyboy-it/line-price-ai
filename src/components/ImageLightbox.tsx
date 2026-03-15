'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageLightboxProps {
  images: { id: string; url: string; title?: string }[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.5;

export default function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const lastTranslateRef = useRef({ x: 0, y: 0 });
  const lastScaleRef = useRef(1);
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null);
  const singleTouchRef = useRef<{ x: number; y: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const touchMovedRef = useRef(false);
  const lastTapRef = useRef<number>(0);

  useEffect(() => { setCurrentIndex(initialIndex); }, [initialIndex]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    lastTranslateRef.current = { x: 0, y: 0 };
    lastScaleRef.current = 1;
  }, []);

  useEffect(() => { resetZoom(); }, [currentIndex, resetZoom]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(p => (p === 0 ? images.length - 1 : p - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(p => (p === images.length - 1 ? 0 : p + 1));
  }, [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === '=' || e.key === '+') setScale(s => { const n = Math.min(s + ZOOM_STEP, MAX_SCALE); lastScaleRef.current = n; return n; });
      if (e.key === '-') setScale(s => { const n = Math.max(s - ZOOM_STEP, MIN_SCALE); lastScaleRef.current = n; if (n <= MIN_SCALE) { setTranslate({ x: 0, y: 0 }); lastTranslateRef.current = { x: 0, y: 0 }; } return n; });
      if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handlePrev, handleNext, onClose, resetZoom]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const applyZoom = (newScale: number) => {
    const clamped = clamp(newScale, MIN_SCALE, MAX_SCALE);
    if (clamped <= MIN_SCALE) {
      setTranslate({ x: 0, y: 0 });
      lastTranslateRef.current = { x: 0, y: 0 };
    }
    lastScaleRef.current = clamped;
    setScale(clamped);
  };

  const handleZoomIn = () => applyZoom(lastScaleRef.current + ZOOM_STEP);
  const handleZoomOut = () => applyZoom(lastScaleRef.current - ZOOM_STEP);

  // ── Mouse Wheel ──
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    applyZoom(lastScaleRef.current + (e.deltaY > 0 ? -ZOOM_STEP * 0.6 : ZOOM_STEP * 0.6));
  };

  // ── Double Click ──
  const handleDoubleClick = () => {
    if (scale > 1) { resetZoom(); } else { applyZoom(2.5); }
  };

  // ── Mouse Drag (pan when zoomed) ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    mouseStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseStartRef.current) return;
    setTranslate({
      x: lastTranslateRef.current.x + (e.clientX - mouseStartRef.current.x),
      y: lastTranslateRef.current.y + (e.clientY - mouseStartRef.current.y),
    });
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartRef.current) {
      lastTranslateRef.current = {
        x: lastTranslateRef.current.x + (e.clientX - mouseStartRef.current.x),
        y: lastTranslateRef.current.y + (e.clientY - mouseStartRef.current.y),
      };
    }
    mouseStartRef.current = null;
    setIsDragging(false);
  };

  // ── Touch ──
  const getTouchDist = (t: React.TouchList) => {
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchMovedRef.current = false;
    if (e.touches.length === 1) {
      singleTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      pinchRef.current = null;
    } else if (e.touches.length === 2) {
      singleTouchRef.current = null;
      pinchRef.current = { dist: getTouchDist(e.touches), scale: lastScaleRef.current };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    touchMovedRef.current = true;
    if (e.touches.length === 2 && pinchRef.current) {
      const ratio = getTouchDist(e.touches) / pinchRef.current.dist;
      const newScale = clamp(pinchRef.current.scale * ratio, MIN_SCALE, MAX_SCALE);
      lastScaleRef.current = newScale;
      setScale(newScale);
    } else if (e.touches.length === 1 && singleTouchRef.current && scale > 1) {
      setTranslate({
        x: lastTranslateRef.current.x + (e.touches[0].clientX - singleTouchRef.current.x),
        y: lastTranslateRef.current.y + (e.touches[0].clientY - singleTouchRef.current.y),
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      if (singleTouchRef.current && !touchMovedRef.current) {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          if (scale > 1) { resetZoom(); } else { applyZoom(2.5); }
        }
        lastTapRef.current = now;
      }
      if (singleTouchRef.current && touchMovedRef.current && scale <= 1) {
        const diff = singleTouchRef.current.x - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) { if (diff > 0) handleNext(); else handlePrev(); }
      }
      if (scale > 1) {
        lastTranslateRef.current = { ...translate };
      }
      singleTouchRef.current = null;
      pinchRef.current = null;
    } else if (e.touches.length === 1) {
      lastTranslateRef.current = { ...translate };
      lastScaleRef.current = scale;
      pinchRef.current = null;
      singleTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ touchAction: 'none' }}>

      {/* ── Top Bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-black/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-300">{currentIndex + 1} / {images.length}</span>
          {currentImage.title && (
            <span className="text-white font-medium truncate max-w-[160px] sm:max-w-xs hidden sm:inline">
              {currentImage.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs tabular-nums w-9 text-right">{Math.round(scale * 100)}%</span>
          <a
            href={`${currentImage.url}${currentImage.url.includes('?') ? '&' : '?'}download=1`}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
            aria-label="ดาวน์โหลด"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-1.5 text-white hover:text-gray-300 transition-colors"
            aria-label="ปิด"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* ── Image Area — CLEAN, zero buttons inside ── */}
      <div
        className={`relative flex-1 min-h-0 overflow-hidden select-none ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        style={{ touchAction: 'none' }}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage.url}
          alt={currentImage.title || 'Image'}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            draggable: false,
          } as React.CSSProperties}
          draggable={false}
        />
      </div>

      {/* ── Bottom Control Bar — Navigation + Zoom ── */}
      <div className="flex-shrink-0 bg-black/60 backdrop-blur-sm px-4 pb-2 pt-2.5">
        <div className="flex items-center justify-between max-w-xs mx-auto gap-3">

          {/* ◄ Prev */}
          <button
            onClick={handlePrev}
            disabled={images.length <= 1}
            className="w-12 h-12 md:w-10 md:h-10 bg-white/20 hover:bg-white/35 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all flex-shrink-0"
            aria-label="ภาพก่อนหน้า"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={scale <= MIN_SCALE}
              className="w-10 h-10 bg-white/20 hover:bg-white/35 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all"
              aria-label="ซูมออก"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="min-w-[56px] h-10 px-2 bg-white/20 hover:bg-white/35 active:scale-95 text-white text-xs font-mono font-medium rounded-full flex items-center justify-center transition-all"
              aria-label="รีเซ็ตขนาด"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={scale >= MAX_SCALE}
              className="w-10 h-10 bg-white/20 hover:bg-white/35 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all"
              aria-label="ซูมเข้า"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* ► Next */}
          <button
            onClick={handleNext}
            disabled={images.length <= 1}
            className="w-12 h-12 md:w-10 md:h-10 bg-white/20 hover:bg-white/35 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all flex-shrink-0"
            aria-label="ภาพถัดไป"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Hint */}
        <p className="text-center text-gray-500 text-[11px] mt-1.5 hidden md:block">
          Scroll เพื่อซูม · ดับเบิลคลิกเพื่อซูม 2.5× · ลากเพื่อเลื่อนภาพ
        </p>
        <p className="text-center text-gray-500 text-[11px] mt-1 md:hidden">
          Pinch เพื่อซูม · แตะ 2 ครั้งเพื่อซูม · ปัดซ้าย/ขวาเพื่อเปลี่ยนภาพ
        </p>
      </div>

      {/* ── Thumbnails ── */}
      {images.length > 1 && (
        <div className="flex-shrink-0 flex justify-center gap-2 px-4 py-2 bg-black/40 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${
                idx === currentIndex
                  ? 'border-white scale-110'
                  : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.title || `ภาพ ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
