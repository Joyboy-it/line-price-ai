import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { Announcement } from '@/types';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user has access (approved users only)
    const accessCount = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM user_group_access WHERE user_id = $1',
      [session.user.id]
    );

    const hasAccess = parseInt(accessCount[0]?.count || '0') > 0;
    if (!hasAccess) {
      return NextResponse.json({ announcements: [] });
    }

    // Get unread announcements for approved users
    const announcements = await query<Announcement>(
      `SELECT a.*, u.name as creator_name,
        (SELECT COUNT(*) FROM announcement_images ai WHERE ai.announcement_id = a.id) as image_count
       FROM announcements a
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.is_published = true
         AND (a.publish_at IS NULL OR a.publish_at <= NOW())
         AND (a.expire_at IS NULL OR a.expire_at > NOW())
         AND NOT EXISTS (
           SELECT 1 FROM announcement_reads ar 
           WHERE ar.announcement_id = a.id AND ar.user_id = $1
         )
       ORDER BY a.created_at DESC
       LIMIT 1`,
      [session.user.id]
    );

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Get unread announcements error:', error);
    return NextResponse.json({ error: 'Failed to get unread announcements' }, { status: 500 });
  }
}
