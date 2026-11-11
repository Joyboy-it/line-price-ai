import { NextRequest, NextResponse } from 'next/server';
import { getOrderForViewer } from '@/lib/direct-to-factory/customer-access';
import { orderFileResponse } from '@/lib/direct-to-factory/files';
import { getOrderFiles } from '@/lib/direct-to-factory/queries';
import { isUuid } from '@/lib/direct-to-factory/validation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id, fileId } = await params;
  if (!isUuid(id) || !isUuid(fileId)) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
  }

  try {
    const order = await getOrderForViewer(id);
    const file = order ? (await getOrderFiles(order.id)).find((f) => f.id === fileId) : undefined;
    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
    }
    return orderFileResponse(file.file_path, file.file_name, file.mime_type);
  } catch (error) {
    console.error('Error downloading order file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
