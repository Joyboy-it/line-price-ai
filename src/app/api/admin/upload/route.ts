import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { PriceGroup } from '@/types';
import { sendPhotoFile, sendMessage } from '@/lib/telegram';
import { sendLineMessage, createPriceUpdateMessage } from '@/lib/line';
import { hasPermission } from '@/lib/permissions';
import { readFile } from 'fs/promises';
import path from 'path';
import { logActionWithIp } from '@/lib/log-helper';
import { uploadFile } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasPermission(session.user.role, 'upload_images')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const priceGroupId = formData.get('price_group_id') as string;
    const sendToTelegram = formData.get('send_to_telegram') === 'true';
    const sendToLine = formData.get('send_to_line') === 'true';
    const isFirstImage = formData.get('is_first_image') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!priceGroupId) {
      return NextResponse.json({ error: 'Price group ID is required' }, { status: 400 });
    }

    const priceGroup = await queryOne<PriceGroup>(
      `SELECT * FROM price_groups WHERE id = $1`,
      [priceGroupId]
    );

    if (!priceGroup) {
      return NextResponse.json({ error: 'Price group not found' }, { status: 404 });
    }

    const uploadResult = await uploadFile(file, `price-groups/${priceGroupId}`);

    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error }, { status: 400 });
    }

    const image = await queryOne(
      `INSERT INTO price_group_images (price_group_id, file_path, file_name, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        priceGroupId,
        uploadResult.filePath,
        uploadResult.fileName,
        uploadResult.fileSize,
        uploadResult.mimeType,
        session.user.id,
      ]
    );

    // ส่งข้อความไป LINE Group (เฉพาะรูปแรก + ต้องเปิด toggle)
    if (sendToLine && isFirstImage && priceGroup.line_group_id) {
      try {
        const lineMessage = createPriceUpdateMessage(priceGroup.name);
        const lineResult = await sendLineMessage(priceGroup.line_group_id, lineMessage);
        
        if (!lineResult.success) {
          console.error('Failed to send message to LINE:', lineResult.error);
        }
      } catch (lineError) {
        console.error('LINE send error:', lineError);
      }
    }

    if (sendToTelegram && priceGroup.telegram_chat_id && uploadResult.filePath) {
      try {
        // ส่งข้อความหัวเฉพาะรูปแรก
        if (isFirstImage) {
          const now = new Date();
          const dateStr = now.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Bangkok',
          });
          const timeStr = now.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Bangkok',
          });
          
          const headerMessage = `📢 อัพเดทราคาวันที่ ${dateStr} ${timeStr}\n\n📸 ${priceGroup.name}`;
          
          const headerResult = await sendMessage(
            priceGroup.telegram_chat_id,
            headerMessage
          );
          
          if (!headerResult.success) {
            console.error('Failed to send header message to Telegram:', headerResult.error);
          }
        }
        
        // ส่งรูปภาพโดยไม่มี caption
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const fullPath = path.join(uploadDir, uploadResult.filePath.replace(/^\//, ''));
        const fileBuffer = await readFile(fullPath);
        
        const telegramResult = await sendPhotoFile(
          priceGroup.telegram_chat_id,
          fileBuffer,
          uploadResult.fileName || 'image.jpg'
        );
        
        if (!telegramResult.success) {
          console.error('Failed to send to Telegram:', telegramResult.error);
        }
      } catch (telegramError) {
        console.error('Telegram send error:', telegramError);
      }
    }

    await logActionWithIp(request, session.user.id, 'upload_image', 'price_group_image', priceGroupId, {
      file_name: uploadResult.fileName,
      file_size: uploadResult.fileSize,
    });

    revalidatePath('/admin/price-images');
    revalidatePath(`/price-groups/${priceGroupId}`);

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
