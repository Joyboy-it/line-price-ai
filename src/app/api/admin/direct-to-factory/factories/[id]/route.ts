import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { cleanText, isUniqueViolation, isUuid } from '@/lib/direct-to-factory/validation';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ไม่พบโรงงาน' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const sets: string[] = [];
    const values: unknown[] = [];

    if (body?.name !== undefined) {
      const name = cleanText(body.name, 200);
      if (!name) return NextResponse.json({ error: 'ต้องระบุชื่อโรงงาน' }, { status: 400 });
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
    if (sets.length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลที่จะแก้ไข' }, { status: 400 });
    }

    values.push(id);
    const factory = await queryOne(
      `UPDATE factories SET ${sets.join(', ')} WHERE id = $${values.length}
       RETURNING id, name, is_active, sort_order`,
      values
    );
    if (!factory) {
      return NextResponse.json({ error: 'ไม่พบโรงงาน' }, { status: 404 });
    }

    await logActionWithIp(request, guard.session.user.id, 'update_factory_settings', 'factory', id, {
      action: 'update',
      name: body.name,
      is_active: body.is_active,
    });

    return NextResponse.json(factory);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: 'มีโรงงานชื่อนี้แล้ว' }, { status: 409 });
    }
    console.error('Error updating factory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
