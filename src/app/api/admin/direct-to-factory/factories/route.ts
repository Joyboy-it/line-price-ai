import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { listFactories } from '@/lib/direct-to-factory/queries';
import { cleanText, isUniqueViolation } from '@/lib/direct-to-factory/validation';

export async function GET() {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    return NextResponse.json(await listFactories());
  } catch (error) {
    console.error('Error listing factories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    const name = cleanText(body?.name, 200);
    if (!name) {
      return NextResponse.json({ error: 'ต้องระบุชื่อโรงงาน' }, { status: 400 });
    }

    const [factory] = await query<{ id: string }>(
      `INSERT INTO factories (name, sort_order)
       VALUES ($1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM factories))
       RETURNING id, name, is_active, sort_order`,
      [name]
    );

    await logActionWithIp(request, guard.session.user.id, 'update_factory_settings', 'factory', factory.id, {
      action: 'create',
      name,
    });

    return NextResponse.json(factory, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: 'มีโรงงานชื่อนี้แล้ว' }, { status: 409 });
    }
    console.error('Error creating factory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
