import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { orderFileResponse } from '@/lib/direct-to-factory/files';
import { cleanText, isUniqueViolation, isUuid } from '@/lib/direct-to-factory/validation';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });

  const form = await queryOne<{ file_path: string; file_name: string; mime_type: string | null }>(
    'SELECT file_path, file_name, mime_type FROM factory_forms WHERE id = $1',
    [id]
  );
  if (!form) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
  return orderFileResponse(form.file_path, form.file_name, form.mime_type);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'ไม่พบแบบฟอร์ม' }, { status: 404 });

  try {
    const body = await request.json();
    const sets: string[] = [];
    const values: unknown[] = [];
    if (body?.name !== undefined) {
      const name = cleanText(body.name, 200);
      if (!name) return NextResponse.json({ error: 'ต้องระบุชื่อแบบฟอร์ม' }, { status: 400 });
      values.push(name);
      sets.push(`name = $${values.length}`);
    }
    if (body?.is_active !== undefined) {
      if (typeof body.is_active !== 'boolean') {
        return NextResponse.json({ error: 'ค่า is_active ไม่ถูกต้อง' }, { status: 400 });
      }
      values.push(body.is_active);
      sets.push(`is_active = $${values.length}`);
    }
    if (sets.length === 0) return NextResponse.json({ error: 'ไม่มีข้อมูลที่จะแก้ไข' }, { status: 400 });

    values.push(id);
    const form = await queryOne<{ id: string }>(
      `UPDATE factory_forms SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING id`,
      values
    );
    if (!form) return NextResponse.json({ error: 'ไม่พบแบบฟอร์ม' }, { status: 404 });

    await logActionWithIp(request, guard.session.user.id, 'update_factory_settings', 'factory_form', id, {
      action: 'update',
      name: body.name,
      is_active: body.is_active,
    });
    return NextResponse.json(form);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: 'มีแบบฟอร์มชื่อนี้แล้ว' }, { status: 409 });
    }
    console.error('Error updating factory form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
