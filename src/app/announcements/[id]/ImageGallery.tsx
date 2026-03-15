'use client';

import { useState } from 'react';
import Image from 'next/image';
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
