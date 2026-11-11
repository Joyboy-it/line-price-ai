import { NextRequest, NextResponse } from 'next/server';
import { queryOne, transaction } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { cleanText, isUniqueViolation, isUuid } from '@/lib/direct-to-factory/validation';

/** Renumbers all agents 1..n and moves one agent up or down by one place. */
async function moveAgent(id: string, direction: 'up' | 'down'): Promise<boolean> {
  return transaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      'SELECT id FROM agents ORDER BY sort_order, name FOR UPDATE'
    );
    const ids = rows.map((row) => row.id);
    const from = ids.indexOf(id);
    if (from === -1) return false;

    const to = direction === 'up' ? from - 1 : from + 1;
    if (to >= 0 && to < ids.length) {
      [ids[from], ids[to]] = [ids[to], ids[from]];
    }
    for (let i = 0; i < ids.length; i++) {
      await client.query('UPDATE agents SET sort_order = $1 WHERE id = $2', [i + 1, ids[i]]);
    }
    return true;
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ไม่พบตัวแทน' }, { status: 404 });
  }

  try {
    const body = await request.json();

    if (body?.direction !== undefined) {
      if (body.direction !== 'up' && body.direction !== 'down') {
        return NextResponse.json({ error: 'ทิศทางไม่ถูกต้อง' }, { status: 400 });
      }
      if (!(await moveAgent(id, body.direction))) {
        return NextResponse.json({ error: 'ไม่พบตัวแทน' }, { status: 404 });
      }
      await logActionWithIp(request, guard.session.user.id, 'update_factory_settings', 'agent', id, {
        action: 'reorder',
        direction: body.direction,
      });
      return NextResponse.json({ success: true });
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    if (body?.name !== undefined) {
      const name = cleanText(body.name, 200);
      if (!name) return NextResponse.json({ error: 'ต้องระบุชื่อตัวแทน' }, { status: 400 });
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
    const agent = await queryOne(
      `UPDATE agents SET ${sets.join(', ')} WHERE id = $${values.length}
       RETURNING id, name, is_active, sort_order`,
      values
    );
    if (!agent) {
      return NextResponse.json({ error: 'ไม่พบตัวแทน' }, { status: 404 });
    }

    await logActionWithIp(request, guard.session.user.id, 'update_factory_settings', 'agent', id, {
      action: 'update',
      name: body.name,
      is_active: body.is_active,
    });

    return NextResponse.json(agent);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: 'มีตัวแทนชื่อนี้แล้ว' }, { status: 409 });
    }
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
