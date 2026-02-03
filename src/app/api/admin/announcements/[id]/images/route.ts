import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { AnnouncementImage } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const images = await query<AnnouncementImage>(
      `SELECT * FROM announcement_images 
       WHERE announcement_id = $1 
       ORDER BY sort_order ASC`,
      [id]
    );

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching announcement images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
