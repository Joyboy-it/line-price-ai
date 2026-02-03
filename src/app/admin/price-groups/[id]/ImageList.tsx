'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2, ZoomIn } from 'lucide-react';
import { PriceGroupImage } from '@/types';
import { formatDateTime } from '@/lib/utils';
import ImageLightbox from '@/components/ImageLightbox';

interface ImageListProps {
  images: PriceGroupImage[];
}

export default function ImageList({ images }: ImageListProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleDelete = async (imageId: string) => {
    if (!confirm('คุณต้องการลบรูปภาพนี้หรือไม่?')) return;

    try {
      const response = await fetch(`/api/admin/images/${imageId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const lightboxImages = images.map((img) => ({
    id: img.id,
    url: `/api/files${img.file_path}`,
    title: img.title || img.file_name || undefined,
  }));

  if (images.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ZoomIn className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">ยังไม่มีรูปภาพในกลุ่มนี้</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              className="aspect-square relative cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              <Image
                src={`/api/files${image.file_path}`}
                alt={image.title || 'Price Image'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="p-2">
              <p className="text-xs text-gray-500 truncate">
                {formatDateTime(image.created_at)}
              </p>
            </div>
            <button
              onClick={() => handleDelete(image.id)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
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
