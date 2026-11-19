import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { cleanText, isUuid } from '@/lib/direct-to-factory/validation';
import { isReceiveStatus, parseOptionalDate } from '@/lib/receive-goods';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });

  try {
    const body = await request.json();
    if (!isReceiveStatus(body?.status)) {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
    }
    const staffNote = cleanText(body?.staff_note, 1000);
    if (staffNote === undefined) return NextResponse.json({ error: 'หมายเหตุยาวเกินไป' }, { status: 400 });
    const plannedDate = parseOptionalDate(body?.planned_date);
    if (plannedDate === undefined) return NextResponse.json({ error: 'แผนวันรับไม่ถูกต้อง' }, { status: 400 });
    const actualDate = parseOptionalDate(body?.actual_date);
    if (actualDate === undefined) return NextResponse.json({ error: 'วันที่รับจริงไม่ถูกต้อง' }, { status: 400 });
    const status = actualDate && body.status === 'waiting' ? 'queued' : body.status;

    const saved = await queryOne(
      `UPDATE receive_goods_notices
       SET status = $1,
           staff_note = $2,
           receive_date = $3,
           actual_receive_date = $4,
           completed_on = CASE
             WHEN $1 = 'completed' THEN COALESCE(completed_on, (NOW() AT TIME ZONE 'Asia/Bangkok')::date)
             ELSE NULL
           END,
           cancelled_on = CASE
             WHEN $1 = 'cancelled' THEN COALESCE(cancelled_on, (NOW() AT TIME ZONE 'Asia/Bangkok')::date)
             ELSE NULL
           END,
           updated_at = NOW()
       WHERE id = $5 RETURNING id`,
      [status, staffNote, plannedDate, actualDate, id]
    );
    if (!saved) return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error updating receive-goods notice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
