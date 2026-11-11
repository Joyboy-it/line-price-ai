import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { deleteFile } from '@/lib/storage';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { isUuid } from '@/lib/direct-to-factory/validation';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id, fileId } = await params;
  if (!isUuid(id) || !isUuid(fileId)) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
  }

  try {
    const removed = await queryOne<{ file_path: string; file_name: string }>(
      'DELETE FROM factory_order_files WHERE id = $1 AND order_id = $2 RETURNING file_path, file_name',
      [fileId, id]
    );
    if (!removed) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
    }
    await deleteFile(removed.file_path);

    await logActionWithIp(request, guard.session.user.id, 'update_factory_order', 'factory_order', id, {
      by: 'staff',
      action: 'delete_file',
      file_name: removed.file_name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
