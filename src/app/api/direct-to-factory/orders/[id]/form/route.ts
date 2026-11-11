import { NextRequest, NextResponse } from 'next/server';
import { getOrderForViewer } from '@/lib/direct-to-factory/customer-access';
import { orderFileResponse } from '@/lib/direct-to-factory/files';
import { isUuid } from '@/lib/direct-to-factory/validation';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
  }

  try {
    const order = await getOrderForViewer(id);
    if (!order?.form_file_path || !order.form_file_name) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
    }
    return orderFileResponse(order.form_file_path, order.form_file_name, order.form_mime_type);
  } catch (error) {
    console.error('Error downloading order form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
