import { Truck } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { isStaff } from '@/lib/direct-to-factory/customer-access';
import { RECEIVE_NOTICE_FIELDS, type ReceiveItem, type ReceiveStatus } from '@/lib/receive-goods';
import ReceiveGoodsQueue from './Queue';

export default async function ShipmentNoticePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  if (!isStaff(session)) redirect('/admin');

  const shops = await query<{ id: string; shop_name: string }>(
    `SELECT id, btrim(shop_name) AS shop_name
     FROM users
     WHERE is_active = true AND NULLIF(btrim(shop_name), '') IS NOT NULL
     ORDER BY shop_name`
  );

  const notices = await query<{
    id: string;
    queue_no: number;
    shop_name: string | null;
    destination_name: string | null;
    notified_date: string;
    planned_date: string | null;
    actual_date: string | null;
    product_type: string | null;
    detail: string | null;
    note: string | null;
    staff_note: string | null;
    status: ReceiveStatus;
    items: ReceiveItem[];
  }>(
    `SELECT ${RECEIVE_NOTICE_FIELDS}, NULLIF(btrim(u.shop_name), '') AS shop_name
     FROM receive_goods_notices n
     JOIN users u ON u.id = n.user_id
     LEFT JOIN receive_goods_items i ON i.notice_id = n.id
     GROUP BY n.id, u.shop_name
     ORDER BY n.created_at DESC
     LIMIT 200`
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <Truck className="w-6 h-6 text-green-600" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">แจ้งรับสินค้า</h1>
          <p className="text-gray-600">ติดตามคิวที่ลูกค้าแจ้งให้ไปรับ ไม่มีตัวแทนและไม่ส่งออกไฟล์</p>
        </div>
      </div>
      <ReceiveGoodsQueue notices={notices} shops={shops} />
    </div>
  );
}
