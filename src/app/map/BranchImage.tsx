'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';

interface BranchImageProps {
  src: string;
  alt: string;
}

export default function BranchImage({ src, alt }: BranchImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full h-44 bg-gray-100 flex flex-col items-center justify-center gap-2">
        <MapPin className="w-8 h-8 text-gray-300" />
        <p className="text-xs text-gray-400">ไม่พบรูปภาพสาขา</p>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-contain"
      onError={() => setError(true)}
    />
  );
}
