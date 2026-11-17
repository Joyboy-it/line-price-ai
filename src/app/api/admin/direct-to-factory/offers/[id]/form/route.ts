import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { orderFileResponse, uploadOrderFile } from '@/lib/direct-to-factory/files';
import { isUuid } from '@/lib/direct-to-factory/validation';

interface OfferForm {
  form_file_path: string | null;
  form_file_name: string | null;
  form_mime_type: string | null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
  }

  const offer = await queryOne<OfferForm>(
    `SELECT COALESCE(ff.file_path, ao.form_file_path) AS form_file_path,
            COALESCE(ff.file_name, ao.form_file_name) AS form_file_name,
            COALESCE(ff.mime_type, ao.form_mime_type) AS form_mime_type
     FROM agent_offers ao
     LEFT JOIN factory_forms ff ON ff.id = ao.form_id
     WHERE ao.id = $1`,
    [id]
  );
  if (!offer?.form_file_path || !offer.form_file_name) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });
  }
  return orderFileResponse(offer.form_file_path, offer.form_file_name, offer.form_mime_type);
}

/** Replaces the form file. The old file is kept because existing orders may still point to it. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ไม่พบข้อเสนอ' }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์' }, { status: 400 });
    }

    const exists = await queryOne<{ id: string }>('SELECT id FROM agent_offers WHERE id = $1', [id]);
    if (!exists) {
      return NextResponse.json({ error: 'ไม่พบข้อเสนอ' }, { status: 404 });
    }

    const upload = await uploadOrderFile(file);
    if (!upload.success || !upload.filePath) {
      return NextResponse.json({ error: upload.error }, { status: 400 });
    }

    await queryOne(
      `UPDATE agent_offers SET form_file_path = $1, form_file_name = $2, form_mime_type = $3 WHERE id = $4`,
      [upload.filePath, upload.fileName, upload.mimeType, id]
    );

    await logActionWithIp(request, guard.session.user.id, 'update_factory_settings', 'agent_offer', id, {
      action: 'upload_form',
      file_name: upload.fileName,
    });

    return NextResponse.json({ form_file_name: upload.fileName });
  } catch (error) {
    console.error('Error uploading offer form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
