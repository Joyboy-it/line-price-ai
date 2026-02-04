'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, X, Send } from 'lucide-react';

interface ImageUploaderProps {
  groupId: string;
  telegramChatId: string | null;
}

export default function ImageUploader({ groupId, telegramChatId }: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sendToTelegram, setSendToTelegram] = useState(!!telegramChatId);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      
      const validFiles: File[] = [];
      const errors: string[] = [];
      
      newFiles.forEach((file) => {
        if (file.size > maxSize) {
          errors.push(`${file.name}: ไฟล์ใหญ่เกิน 5MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        } else if (!allowedTypes.includes(file.type)) {
          errors.push(`${file.name}: ประเภทไฟล์ไม่รองรับ (${file.type})`);
        } else {
          validFiles.push(file);
        }
      });
      
      if (errors.length > 0) {
        alert('ไม่สามารถเพิ่มไฟล์บางไฟล์:\n\n' + errors.join('\n'));
      }
      
      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    if (!confirm('การอัปโหลดรูปใหม่จะลบรูปเก่าทั้งหมดในกลุ่มนี้ คุณต้องการดำเนินการต่อหรือไม่?')) {
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Get all existing images for this group
      setStatusMessage('กำลังตรวจสอบรูปภาพเก่า...');
      const imagesResponse = await fetch(`/api/admin/price-groups/${groupId}/images`);
      if (imagesResponse.ok) {
        const existingImages = await imagesResponse.json();
        
        // Step 2: Delete all existing images
        if (existingImages.length > 0) {
          setStatusMessage(`กำลังลบรูปเก่า ${existingImages.length} รูป...`);
          for (const image of existingImages) {
            await fetch(`/api/admin/images/${image.id}`, {
              method: 'DELETE',
            });
          }
        }
      }

      // Step 3: Upload new images
      setStatusMessage('กำลังอัปโหลดรูปใหม่...');
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('price_group_id', groupId);
        formData.append('send_to_telegram', sendToTelegram.toString());
        formData.append('is_first_image', (i === 0).toString());

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          let errorMessage = 'เกิดข้อผิดพลาดในการอัปโหลด';
          
          if (response.status === 400) {
            if (errorData.error?.includes('file size')) {
              errorMessage = `ไฟล์ "${files[i].name}" มีขนาดใหญ่เกินกำหนด (สูงสุด 5MB)`;
            } else if (errorData.error?.includes('file type') || errorData.error?.includes('mime')) {
              errorMessage = `ไฟล์ "${files[i].name}" เป็นประเภทที่ไม่รองรับ (รองรับเฉพาะ JPG, PNG, WebP)`;
            } else {
              errorMessage = `ไฟล์ "${files[i].name}": ${errorData.error || 'ข้อมูลไม่ถูกต้อง'}`;
            }
          } else if (response.status === 401) {
            errorMessage = 'คุณไม่มีสิทธิ์ในการอัปโหลดไฟล์';
          } else if (response.status === 404) {
            errorMessage = 'ไม่พบกลุ่มราคาที่ระบุ';
          } else if (response.status === 500) {
            errorMessage = `เกิดข้อผิดพลาดของเซิร์ฟเวอร์: ${errorData.error || 'กรุณาลองใหม่อีกครั้ง'}`;
          } else {
            errorMessage = `ไฟล์ "${files[i].name}": ${errorData.error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`;
          }
          
          throw new Error(errorMessage);
        }

        setProgress(((i + 1) / files.length) * 100);
      }

      setStatusMessage('เสร็จสิ้น!');
      setFiles([]);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลด';
      alert(`❌ ${errorMessage}\n\nกรุณาตรวจสอบ:\n• ขนาดไฟล์ไม่เกิน 5MB\n• ประเภทไฟล์: JPG, PNG, WebP\n• การเชื่อมต่ออินเทอร์เน็ต`);
      setStatusMessage('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-orange-500" />
        อัปโหลดรูปภาพ
      </h2>

      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
      >
        <Upload className="w-12 h-12 text-orange-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง</p>
        <p className="text-sm text-gray-400">รองรับ JPG, PNG, WebP (สูงสุด 5MB)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            เลือกแล้ว {files.length} ไฟล์
          </p>
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-sm"
              >
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Telegram Option */}
      {telegramChatId && (
        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendToTelegram}
              onChange={(e) => setSendToTelegram(e.target.checked)}
              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
            />
            <Send className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-700">ส่งไปยัง Telegram</span>
          </label>
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center font-medium">
            {statusMessage}
          </p>
          {progress > 0 && (
            <p className="text-xs text-gray-500 mt-1 text-center">
              {Math.round(progress)}%
            </p>
          )}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={files.length === 0 || uploading}
        className="mt-4 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            กำลังอัปโหลด...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            อัปโหลด {files.length > 0 && `(${files.length} ไฟล์)`}
          </>
        )}
      </button>
    </div>
  );
}
