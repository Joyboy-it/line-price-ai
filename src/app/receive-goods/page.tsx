import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { canReceiveGoods } from '@/lib/direct-to-factory/customer-access';
import { formatThaiDate } from '@/lib/direct-to-factory/format';
import {
  RECEIVE_NOTICE_FIELDS,
  RECEIVE_STATUS_LABELS,
  RECEIVE_STATUS_ROW_CLASS,
  formatReceiveNoticeItems,
  type ReceiveItem,
  type ReceiveStatus,
} from '@/lib/receive-goods';
import ReceiveGoodsForm from './ReceiveGoodsForm';
import ReceiveHistoryButton from './ReceiveHistoryButton';

interface Notice {
  id: string;
  queue_no: number;
  open_rank: number | null;
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
}

export default async function ReceiveGoodsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  if (!(await canReceiveGoods(session.user.id))) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">บัญชีนี้ยังไม่ได้รับอนุญาตให้แจ้งรับสินค้า</p>
      </div>
    );
  }

  const customer = await queryOne<{ name: string | null; shop_name: string | null }>(
    `SELECT name, shop_name FROM users WHERE id = $1`,
    [session.user.id]
  );

  const notices = await query<Notice>(
    `SELECT ${RECEIVE_NOTICE_FIELDS}
     FROM receive_goods_notices n
     LEFT JOIN receive_goods_items i ON i.notice_id = n.id
     WHERE n.user_id = $1
     GROUP BY n.id
     ORDER BY n.created_at DESC
     LIMIT 100`,
    [session.user.id]
  );
  const openNotices = notices.filter((notice) => notice.status === 'waiting' || notice.status === 'queued');
  const history = notices.filter((notice) => notice.status === 'completed' || notice.status === 'cancelled');

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1040px] overflow-x-hidden px-3 pt-5 pb-32 sm:px-4 min-[860px]:pb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-0.5">แจ้งรับสินค้า</h1>
      <p className="text-gray-600 mb-5">แจ้งให้ไปรับสินค้า และติดตามสถานะคิว</p>
      <div className="grid w-full min-w-0 items-start gap-5 min-[860px]:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <ReceiveGoodsForm customerName={customer?.name?.trim() || '-'} shopName={customer?.shop_name?.trim() || '-'} />
        <section id="receive-queue" className="min-w-0" aria-labelledby="receive-queue-title">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="receive-queue-title" className="text-lg font-semibold text-gray-900">คิวของฉัน</h2>
            <ReceiveHistoryButton notices={history} />
          </div>
          <div className="card p-4">
            {openNotices.length === 0 ? (
              <p className="py-7 text-center text-gray-600">ยังไม่มีรายการ<br />เมื่อส่งคำขอ คิวจะแสดงที่นี่</p>
            ) : (
              openNotices.map((notice) => (
                <article key={notice.id} className="mb-2.5 rounded-[10px] border border-gray-200 p-3 last:mb-0">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <strong className="min-w-0">คิวที่ {notice.open_rank ?? notice.queue_no}</strong>
                    <span className={`whitespace-nowrap rounded-full border border-current/10 px-2.5 py-0.5 text-[13px] font-semibold ${RECEIVE_STATUS_ROW_CLASS[notice.status]}`}>
                      {RECEIVE_STATUS_LABELS[notice.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 break-words">{formatReceiveNoticeItems(notice)}</p>
                  {notice.note && <p className="text-sm text-gray-600 break-words">หมายเหตุ: {notice.note}</p>}
                  <p className="text-sm text-gray-600 break-words">
                    แจ้ง {formatThaiDate(notice.notified_date)}
                    <span className="mx-1">·</span>
                    แผนรับ {formatThaiDate(notice.planned_date)}
                    <span className="mx-1">·</span>
                    รับจริง {formatThaiDate(notice.actual_date)}
                  </p>
                  {notice.staff_note && <p className="text-sm text-gray-800">จากเจ้าหน้าที่: {notice.staff_note}</p>}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
