'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2 } from 'lucide-react';

interface ImageLightboxProps {
  images: { id: string; url: string; title?: string }[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

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

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentImage = images[currentIndex];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/40">
        <p className="text-gray-300 text-sm">
          {currentIndex + 1} / {images.length}
          {currentImage.title && (
            <span className="ml-2 text-white font-medium">{currentImage.title}</span>
          )}
        </p>
        <div className="flex items-center gap-3">
          <a
            href={`${currentImage.url}${currentImage.url.includes('?') ? '&' : '?'}download=1`}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 text-white"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300"
          >
            <X className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="relative flex-1 min-h-0">
        <Image
          src={currentImage.url}
          alt={currentImage.title || 'Image'}
          fill
          className={`object-contain transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-move' : 'cursor-default'}`}
          sizes="100vw"
        />

        {/* Zoom Button */}
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute top-4 right-16 md:right-20 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg transition-all z-10 flex items-center gap-2"
          aria-label={isZoomed ? 'ซูมออก' : 'ซูมเข้า'}
        >
          {isZoomed ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          <span className="hidden md:inline text-sm">{isZoomed ? 'ซูมออก' : 'ซูมเข้า'}</span>
        </button>

        {/* Navigation Arrows - Moved to Bottom */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 bottom-20 md:bottom-24 bg-black/30 hover:bg-black/60 backdrop-blur-sm text-white transition-all opacity-70 hover:opacity-100 z-10 p-3 md:p-2.5 rounded-full"
              aria-label="ภาพก่อนหน้า"
            >
              <ChevronLeft className="w-7 h-7 md:w-6 md:h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 bottom-20 md:bottom-24 bg-black/30 hover:bg-black/60 backdrop-blur-sm text-white transition-all opacity-70 hover:opacity-100 z-10 p-3 md:p-2.5 rounded-full"
              aria-label="ภาพถัดไป"
            >
              <ChevronRight className="w-7 h-7 md:w-6 md:h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex-shrink-0 flex justify-center gap-2 px-4 py-3 bg-black/40 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${
                idx === currentIndex ? 'border-white' : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <Image
                src={img.url}
                alt={img.title || `Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="56px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
