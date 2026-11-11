import Link from 'next/link';
import { ChevronRight, Factory, Plus } from 'lucide-react';
import { formatThaiDate } from '@/lib/direct-to-factory/format';
import { listCustomerOrders } from '@/lib/direct-to-factory/queries';
import { toCustomerView } from '@/lib/direct-to-factory/order-rules';
import { getCustomerPageSession } from './customer-page';
import NotApproved from './NotApproved';
import StatusBadge from './StatusBadge';

export default async function DirectToFactoryCustomerPage() {
  const { session, approved } = await getCustomerPageSession();
  if (!approved) return <NotApproved />;

  const orders = (await listCustomerOrders(session.user.id)).map((order) => toCustomerView(order, []));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Factory className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ส่งตรงเข้าโรงงาน</h1>
            <p className="text-gray-600">รายการที่คุณแจ้งไว้</p>
          </div>
        </div>
        <Link href="/direct-to-factory/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          แจ้งส่งสินค้าใหม่
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="card p-8 text-center text-gray-600">ยังไม่มีรายการ กด &ldquo;แจ้งส่งสินค้าใหม่&rdquo; เพื่อเริ่ม</div>
      ) : (
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
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    {order.factory_name} · ส่ง {formatThaiDate(order.delivery_date)} · ทะเบียน {order.license_plate}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
