import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '10485760');
const ALLOWED_TYPES = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(',');

export interface UploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

export async function uploadFile(
  file: File,
  subDir: string = 'images'
): Promise<UploadResult> {
  try {
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File too large' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: 'Invalid file type' };
    }

    const uploadPath = path.join(UPLOAD_DIR, subDir);
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true });
    }

    const ext = path.extname(file.name);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadPath, fileName);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return {
      success: true,
      filePath: `/${subDir}/${fileName}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Upload failed' };
  }
}

export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(UPLOAD_DIR, filePath.replace(/^\//, ''));
    if (existsSync(fullPath)) {
      await unlink(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

export function getPublicUrl(filePath: string): string {
  return `/api/files${filePath}`;
}
