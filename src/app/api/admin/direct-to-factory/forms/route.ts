import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { uploadOrderFile } from '@/lib/direct-to-factory/files';
import { listFactoryForms } from '@/lib/direct-to-factory/queries';
import { cleanText, isUniqueViolation } from '@/lib/direct-to-factory/validation';

export async function GET() {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    return NextResponse.json(await listFactoryForms());
  } catch (error) {
    console.error('Error listing factory forms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    const formData = await request.formData();
    const name = cleanText(formData.get('name'), 200);
    const file = formData.get('file');
    if (!name) return NextResponse.json({ error: 'ต้องระบุชื่อแบบฟอร์ม' }, { status: 400 });
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์' }, { status: 400 });
    }

    const upload = await uploadOrderFile(file);
    if (!upload.success || !upload.filePath) {
      return NextResponse.json({ error: upload.error }, { status: 400 });
    }

    const [form] = await query<{ id: string }>(
      `INSERT INTO factory_forms (name, file_path, file_name, mime_type)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, upload.filePath, upload.fileName, upload.mimeType]
    );

    await logActionWithIp(request, guard.session.user.id, 'update_factory_settings', 'factory_form', form.id, {
      action: 'create',
      name,
      file_name: upload.fileName,
    });

    return NextResponse.json({ id: form.id }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: 'มีแบบฟอร์มชื่อนี้แล้ว' }, { status: 409 });
    }
    console.error('Error creating factory form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
