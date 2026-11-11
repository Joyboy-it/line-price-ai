import { NextRequest, NextResponse } from 'next/server';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { parseOfferRows } from '@/lib/direct-to-factory/import-rows';
import { importOffers } from '@/lib/direct-to-factory/queries';
import { readSpreadsheet } from '@/lib/direct-to-factory/read-spreadsheet';

const MAX_IMPORT_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์ .xlsx หรือ .csv' }, { status: 400 });
    }
    if (file.size > MAX_IMPORT_SIZE) {
      return NextResponse.json({ error: 'ไฟล์ต้องมีขนาดไม่เกิน 5 MB' }, { status: 400 });
    }

    let rows: string[][];
    try {
      rows = await readSpreadsheet(Buffer.from(await file.arrayBuffer()), file.name);
    } catch (error) {
      const message = error instanceof Error && error.message.startsWith('รองรับ') ? error.message : 'อ่านไฟล์ไม่ได้';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const parsed = parseOfferRows(rows);
    if (parsed.errors.length > 0) {
      return NextResponse.json({ error: 'ไฟล์มีข้อผิดพลาด ยังไม่ได้บันทึกข้อมูล', errors: parsed.errors }, { status: 400 });
    }
    if (parsed.rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลในไฟล์' }, { status: 400 });
    }

    const result = await importOffers(parsed.rows);

    await logActionWithIp(request, guard.session.user.id, 'import_agent_offers', 'agent_offer', undefined, {
      file_name: file.name,
      rows: parsed.rows.length,
      ...result,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importing offers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
