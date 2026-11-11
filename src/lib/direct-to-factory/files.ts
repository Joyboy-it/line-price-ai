import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { uploadFile, type UploadResult } from '@/lib/storage';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export const ORDER_FILES_SUBDIR = 'direct-to-factory';

export const ORDER_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const UPLOAD_ERRORS: Record<string, string> = {
  'File too large': 'ไฟล์มีขนาดใหญ่เกินกำหนด',
  'Invalid file type': 'รองรับเฉพาะไฟล์ PDF, Excel, Word หรือรูปภาพ',
};

export async function uploadOrderFile(file: File): Promise<UploadResult> {
  const result = await uploadFile(file, ORDER_FILES_SUBDIR, ORDER_FILE_TYPES);
  if (!result.success) {
    return { ...result, error: UPLOAD_ERRORS[result.error ?? ''] ?? 'อัปโหลดไฟล์ไม่สำเร็จ' };
  }
  return result;
}

/**
 * Streams a stored direct-to-factory file. `storedPath` must come from the database,
 * never from the request, and must stay inside the direct-to-factory folder.
 */
export async function orderFileResponse(
  storedPath: string,
  fileName: string,
  mimeType: string | null
): Promise<NextResponse> {
  const baseDir = path.resolve(UPLOAD_DIR, ORDER_FILES_SUBDIR);
  const fullPath = path.resolve(UPLOAD_DIR, storedPath.replace(/^\//, ''));

  if (!fullPath.startsWith(baseDir + path.sep) || !existsSync(fullPath)) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
  }

  const buffer = await readFile(fullPath);
  const asciiFallback = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
