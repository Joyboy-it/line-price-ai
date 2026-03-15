'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Maximize2 } from 'lucide-react';
import ImageLightbox from '@/components/ImageLightbox';

interface AnnouncementImage {
  id: string;
  announcement_id: string;
  image_path: string;
  sort_order: number;
}

interface ImageGalleryProps {
  images: AnnouncementImage[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const lightboxImages = images.map((img) => ({
    id: img.id,
    url: `/api/files${img.image_path}`,
    title: `${title} - รูปที่ ${images.indexOf(img) + 1}`,
  }));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-video rounded-lg overflow-hidden bg-white group cursor-zoom-in"
            onClick={() => openLightbox(index)}
          >
            <Image
              src={`/api/files${image.image_path}`}
              alt={`${title} - รูปที่ ${index + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all" />
            
            {/* Zoom Button */}
            <button
              onClick={(e) => { e.stopPropagation(); openLightbox(index); }}
              className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
              aria-label="ขยายภาพ"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden md:inline text-xs">ขยาย</span>
            </button>
          </div>
        ))}
      </div>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={selectedIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
