import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { formatThaiDate } from '@/lib/direct-to-factory/format';
import { countCustomerHistory, listOpenCustomerOrders } from '@/lib/direct-to-factory/queries';
import { toCustomerView } from '@/lib/direct-to-factory/order-rules';
import type { CustomerOrderView } from '@/lib/direct-to-factory/types';
import { getCustomerPageSession } from './customer-page';
import NotApproved from './NotApproved';
import OrderHistoryButton from './OrderHistoryButton';
import StatusStepper from './StatusStepper';

function OrderList({ orders }: { orders: CustomerOrderView[] }) {
  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/direct-to-factory/${order.id}`}
            className="card p-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="font-medium text-gray-900">{order.product_name}</p>
                <StatusStepper status={order.status} compact />
              </div>
              <p className="text-sm text-gray-600">
                {order.factory_name} · ส่ง {formatThaiDate(order.delivery_date)} · ทะเบียน {order.license_plate}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 shrink-0" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function DirectToFactoryCustomerPage() {
  const { session, approved } = await getCustomerPageSession('view');
  if (!approved) return <NotApproved />;

  const [orders, completedCount, cancelledCount] = await Promise.all([
    listOpenCustomerOrders(session.user.id),
    countCustomerHistory(session.user.id, 'completed'),
    countCustomerHistory(session.user.id, 'cancelled'),
  ]);
  const openOrders = orders.map((order) => toCustomerView(order, []));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ส่งตรงเข้าโรงงาน</h1>
            <p className="text-gray-600">รายการที่คุณแจ้งไว้</p>
          </div>
          <OrderHistoryButton completedCount={completedCount} cancelledCount={cancelledCount} />
        </div>
        <Link href="/direct-to-factory/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          ส่งรายการใหม่
        </Link>
      </div>

      {openOrders.length === 0 ? (
        <div className="card p-8 text-center text-gray-600">
          {completedCount + cancelledCount === 0
            ? 'ยังไม่มีรายการ กด “ส่งรายการใหม่” เพื่อเริ่ม'
            : 'ไม่มีรายการที่กำลังดำเนินการ'}
        </div>
      ) : (
        <OrderList orders={openOrders} />
      )}
    </div>
  );
}
