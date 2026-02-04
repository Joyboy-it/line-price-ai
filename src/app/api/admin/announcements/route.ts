import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { uploadFile } from '@/lib/storage';
import { Announcement } from '@/types';
import { logActionWithIp } from '@/lib/log-helper';
import { hasPermission } from '@/lib/permissions';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasPermission(session.user.role, 'manage_announcements')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const announcements = await query<Announcement>(
    `SELECT a.*, u.name as creator_name,
      (SELECT COUNT(*) FROM announcement_images ai WHERE ai.announcement_id = a.id) as image_count
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     ORDER BY a.created_at DESC`
  );

  return NextResponse.json(announcements);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasPermission(session.user.role, 'manage_announcements')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const body = formData.get('body') as string;
    const is_published = formData.get('is_published') === 'true';
    const imageFiles = formData.getAll('images') as File[];

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create announcement first
    const newAnnouncement = await queryOne<Announcement>(
      `INSERT INTO announcements (title, body, is_published, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, body || null, is_published, session.user.id]
    );

    if (!newAnnouncement) {
      throw new Error('Failed to create announcement');
    }

    // Upload images and save to announcement_images table
    if (imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const uploadResult = await uploadFile(file, 'announcements');
        
        if (uploadResult.success && uploadResult.filePath) {
          await query(
            `INSERT INTO announcement_images (announcement_id, image_path, sort_order)
             VALUES ($1, $2, $3)`,
            [newAnnouncement.id, uploadResult.filePath, i]
          );

          // Set first image as main image_path
          if (i === 0) {
            await query(
              `UPDATE announcements SET image_path = $1 WHERE id = $2`,
              [uploadResult.filePath, newAnnouncement.id]
            );
          }
        }
      }
    }

    await logActionWithIp(request, session.user.id, 'create_announcement', 'announcement', newAnnouncement.id, { title });

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
