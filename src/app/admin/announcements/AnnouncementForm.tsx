'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Upload, X } from 'lucide-react';
import { Announcement } from '@/types';
import Image from 'next/image';

interface AnnouncementFormProps {
  announcement?: Announcement;
}

export default function AnnouncementForm({ announcement }: AnnouncementFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    body: announcement?.body || '',
    is_published: announcement?.is_published ?? true,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(!!announcement);

  // Load existing images if editing
  useEffect(() => {
    if (announcement) {
      fetch(`/api/admin/announcements/${announcement.id}/images`)
        .then(res => res.json())
        .then(images => {
          const paths = images.map((img: any) => img.image_path);
          const previews = paths.map((path: string) => `/api/files${path}`);
          setExistingImages(paths);
          setImagePreviews(previews);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading images:', err);
          setLoading(false);
        });
    }
  }, [announcement]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setImageFiles(prev => [...prev, ...newFiles]);
      
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (index < existingImages.length) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const fileIndex = index - existingImages.length;
      setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('body', formData.body);
      submitData.append('is_published', formData.is_published.toString());
      submitData.append('existing_images', JSON.stringify(existingImages));
      
      imageFiles.forEach((file, index) => {
        submitData.append(`images`, file);
      });

      const url = announcement 
        ? `/api/admin/announcements/${announcement.id}`
        : '/api/admin/announcements';
      
      const method = announcement ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        body: submitData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save announcement');
      }

      setSuccess(true);
      setIsSubmitting(false);
      
      setTimeout(() => {
        router.push('/admin/announcements');
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
          ✓ บันทึกข้อมูลสำเร็จ
        </div>
      )}

      {/* หัวข้อประกาศ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          หัวข้อประกาศ <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="เช่น ประกาศปรับราคา"
        />
      </div>

      {/* เนื้อหาประกาศ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          เนื้อหาประกาศ
        </label>
        <textarea
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="รายละเอียดประกาศ..."
        />
      </div>

      {/* รูปภาพ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          รูปภาพประกาศ
        </label>
        
        {imagePreviews.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    width={200}
                    height={200}
                    className="rounded-lg object-cover w-full h-40"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <label className="cursor-pointer text-blue-600 hover:text-blue-700">
                <Upload className="w-6 h-6 mx-auto mb-2" />
                <span>เพิ่มรูปภาพ</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <label className="cursor-pointer text-blue-600 hover:text-blue-700">
              <span>เลือกรูปภาพ (หลายรูป)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (สูงสุด 5MB ต่อรูป)</p>
          </div>
        )}
      </div>

      {/* สถานะ */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_published"
          checked={formData.is_published}
          onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
          className="w-4 h-4 text-green-500 rounded"
        />
        <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
          เผยแพร่ประกาศ
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              บันทึก
            </>
          )}
        </button>
      </div>
    </form>
  );
}
