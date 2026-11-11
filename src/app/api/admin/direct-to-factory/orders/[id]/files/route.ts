import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { uploadOrderFile } from '@/lib/direct-to-factory/files';
import { getOrder } from '@/lib/direct-to-factory/queries';
import { isUuid } from '@/lib/direct-to-factory/validation';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
  }

  try {
    const order = await getOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
    }
    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'รายการนี้ถูกยกเลิกแล้ว' }, { status: 409 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const kind = formData.get('kind');
    if (kind !== 'delivery_note' && kind !== 'attachment') {
      return NextResponse.json({ error: 'ประเภทไฟล์ไม่ถูกต้อง' }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์' }, { status: 400 });
    }

    const upload = await uploadOrderFile(file);
    if (!upload.success || !upload.filePath) {
      return NextResponse.json({ error: upload.error }, { status: 400 });
    }

    const saved = await queryOne<{ id: string }>(
      `INSERT INTO factory_order_files (order_id, kind, file_path, file_name, mime_type, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [id, kind, upload.filePath, upload.fileName, upload.mimeType, upload.fileSize, guard.session.user.id]
    );

    await logActionWithIp(request, guard.session.user.id, 'update_factory_order', 'factory_order', id, {
      by: 'staff',
      action: 'upload_file',
      kind,
      file_name: upload.fileName,
    });

    return NextResponse.json({ id: saved!.id }, { status: 201 });
  } catch (error) {
    console.error('Error uploading order file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
