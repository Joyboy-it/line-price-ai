import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify announcement exists and is published
    const announcement = await query(
      `SELECT id FROM announcements 
       WHERE id = $1 AND is_published = true`,
      [id]
    );

    if (announcement.length === 0) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Mark as read (INSERT ON CONFLICT DO NOTHING to avoid duplicates)
    await query(
      `INSERT INTO announcement_reads (announcement_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (announcement_id, user_id) DO NOTHING`,
      [id, session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark announcement as read error:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
