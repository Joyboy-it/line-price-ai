'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PriceGroupImage } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Search, ZoomIn } from 'lucide-react';
import ImageLightbox from '@/components/ImageLightbox';

interface ImageGalleryProps {
  images: PriceGroupImage[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const lightboxImages = images.map((img) => ({
    id: img.id,
    url: `/api/files${img.file_path}`,
    title: img.title || img.file_name || undefined,
  }));

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Main Image */}
        <div className="relative aspect-[4/3] bg-gray-100">
          <Image
            src={`/api/files${images[0].file_path}`}
            alt={images[0].title || 'Price Image'}
            fill
            className="object-contain cursor-pointer"
            onClick={() => openLightbox(0)}
            sizes="(max-width: 768px) 100vw, 800px"
          />
          <button
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
            ดูเต็มจอ
          </button>
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>

        {/* Date */}
        {images[0].created_at && (
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {formatDateTime(images[0].created_at)}
            </p>
          </div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => openLightbox(idx)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === selectedIndex
                      ? 'border-green-500'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={`/api/files${img.file_path}`}
                    alt={img.title || `Image ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
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
