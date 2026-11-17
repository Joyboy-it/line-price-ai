import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { uploadOrderFile } from '@/lib/direct-to-factory/files';
import { isUuid } from '@/lib/direct-to-factory/validation';

/** Replaces the shared file. The previous file stays, because orders may still point at it. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'ไม่พบแบบฟอร์ม' }, { status: 404 });

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์' }, { status: 400 });
    }
    const exists = await queryOne<{ id: string }>('SELECT id FROM factory_forms WHERE id = $1', [id]);
    if (!exists) return NextResponse.json({ error: 'ไม่พบแบบฟอร์ม' }, { status: 404 });

    const upload = await uploadOrderFile(file);
    if (!upload.success || !upload.filePath) {
      return NextResponse.json({ error: upload.error }, { status: 400 });
    }

    await queryOne(
      `UPDATE factory_forms SET file_path = $1, file_name = $2, mime_type = $3, updated_at = NOW() WHERE id = $4`,
      [upload.filePath, upload.fileName, upload.mimeType, id]
    );
    await logActionWithIp(request, guard.session.user.id, 'update_factory_settings', 'factory_form', id, {
      action: 'replace_file',
      file_name: upload.fileName,
    });
    return NextResponse.json({ file_name: upload.fileName });
  } catch (error) {
    console.error('Error replacing factory form file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
