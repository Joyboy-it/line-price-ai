import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { deleteFile } from '@/lib/storage';
import { PriceGroupImage } from '@/types';
import { logActionWithIp } from '@/lib/log-helper';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const image = await queryOne<PriceGroupImage>(
      `SELECT * FROM price_group_images WHERE id = $1`,
      [id]
    );

    if (!image) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await deleteFile(image.file_path);

    await query(`DELETE FROM price_group_images WHERE id = $1`, [id]);

    await logActionWithIp(request, session.user.id, 'delete_image', 'price_group_image', id, {
      price_group_id: image.price_group_id,
      file_name: image.file_name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
