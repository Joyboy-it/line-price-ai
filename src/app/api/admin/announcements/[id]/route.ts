import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { uploadFile, deleteFile } from '@/lib/storage';
import { Announcement } from '@/types';
import { logActionWithIp } from '@/lib/log-helper';
import { hasPermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !hasPermission(session.user.role, 'manage_announcements')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const announcement = await queryOne<Announcement>(
    `SELECT * FROM announcements WHERE id = $1`,
    [id]
  );

  if (!announcement) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(announcement);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !hasPermission(session.user.role, 'manage_announcements')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const body = formData.get('body') as string;
    const is_published = formData.get('is_published') === 'true';
    const imageFiles = formData.getAll('images') as File[];
    const existingImagesStr = formData.get('existing_images') as string;
    const existingImages = existingImagesStr ? JSON.parse(existingImagesStr) : [];

    const existing = await queryOne<Announcement>(
      `SELECT * FROM announcements WHERE id = $1`,
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Get all current images from database
    const currentImages = await query<{ id: string; image_path: string }>(
      `SELECT id, image_path FROM announcement_images WHERE announcement_id = $1`,
      [id]
    );

    // Delete images that are not in existingImages list
    for (const img of currentImages) {
      if (!existingImages.includes(img.image_path)) {
        await deleteFile(img.image_path);
        await query(`DELETE FROM announcement_images WHERE id = $1`, [img.id]);
      }
    }

    // Upload new images
    let firstImagePath = existing.image_path;
    if (imageFiles.length > 0) {
      const startOrder = existingImages.length;
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const uploadResult = await uploadFile(file, 'announcements');
        
        if (uploadResult.success && uploadResult.filePath) {
          await query(
            `INSERT INTO announcement_images (announcement_id, image_path, sort_order)
             VALUES ($1, $2, $3)`,
            [id, uploadResult.filePath, startOrder + i]
          );

          // Set first image as main image_path if no existing images
          if (existingImages.length === 0 && i === 0) {
            firstImagePath = uploadResult.filePath;
          }
        }
      }
    }

    // If no images left, clear main image_path
    if (existingImages.length === 0 && imageFiles.length === 0) {
      firstImagePath = null;
    } else if (existingImages.length > 0) {
      firstImagePath = existingImages[0];
    }

    const updated = await queryOne<Announcement>(
      `UPDATE announcements 
       SET title = $1,
           body = $2,
           image_path = $3,
           is_published = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, body || null, firstImagePath, is_published, id]
    );

    await logActionWithIp(request, session.user.id, 'update_announcement', 'announcement', id, { title });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !hasPermission(session.user.role, 'manage_announcements')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const announcement = await queryOne<Announcement>(
      `SELECT * FROM announcements WHERE id = $1`,
      [id]
    );

    if (!announcement) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Delete image if exists
    if (announcement.image_path) {
      await deleteFile(announcement.image_path);
    }

    await query(`DELETE FROM announcements WHERE id = $1`, [id]);

    await logActionWithIp(request, session.user.id, 'delete_announcement', 'announcement', id, { title: announcement.title });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
