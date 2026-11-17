import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OrderSearchButton from './OrderSearchButton';
import { bangkokDate, formatThaiDate, formatThaiDateTime } from '@/lib/direct-to-factory/format';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/lib/direct-to-factory/order-rules';
import { countStaffOrdersByStatus, listFactories, listStaffOrders, STAFF_PAGE_SIZE } from '@/lib/direct-to-factory/queries';
import { parseStaffOrderFilters } from '@/lib/direct-to-factory/validation';
import StatusStepper from '@/app/direct-to-factory/StatusStepper';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DirectToFactoryOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const parsed = parseStaffOrderFilters((key) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  });
  const today = bangkokDate();
  const filters = { ...parsed, from: parsed.from ?? today, to: parsed.to ?? today };

  const [{ orders, total }, factories, statusCounts] = await Promise.all([
    listStaffOrders(filters),
    listFactories(),
    countStaffOrdersByStatus(filters),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / STAFF_PAGE_SIZE));
  const trackedTotal = ORDER_STATUSES.reduce((sum, status) => sum + (statusCounts[status] ?? 0), 0);

  const filterParams = (status?: string, page?: number) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.factoryId) params.set('factory_id', filters.factoryId);
    if (filters.q) params.set('q', filters.q);
    if (page && page > 1) params.set('page', String(page));
    const query = params.toString();
    return query ? `/admin/direct-to-factory?${query}` : '/admin/direct-to-factory';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <nav aria-label="กรองตามสถานะ" className="flex flex-1 min-w-0 gap-2 overflow-x-auto p-1">
        <Link
          href={filterParams()}
          aria-current={filters.status ? undefined : 'page'}
          className={`shrink-0 inline-flex items-center gap-2 min-h-11 px-3 rounded-full border text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${filters.status ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' : 'border-green-600 bg-green-50 text-green-700'}`}
        >
          ทั้งหมด
          <span className="tabular-nums">{trackedTotal}</span>
        </Link>
        {ORDER_STATUSES.map((status) => {
          const selected = filters.status === status;
          return (
            <Link
              key={status}
              href={filterParams(status)}
              aria-current={selected ? 'page' : undefined}
              className={`shrink-0 inline-flex items-center gap-2 min-h-11 px-3 rounded-full border text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${selected ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              {ORDER_STATUS_LABELS[status]}
              <span className="tabular-nums">{statusCounts[status] ?? 0}</span>
            </Link>
          );
        })}
        </nav>
        <OrderSearchButton
          status={filters.status}
          q={filters.q}
          factoryId={filters.factoryId}
        from={filters.from}
        to={filters.to}
        dateIsDefault={filters.from === today && filters.to === today}
          factories={factories.map((factory) => ({ id: factory.id, name: factory.name }))}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium whitespace-nowrap">วันที่แจ้ง</th>
              <th className="px-3 py-2 text-left font-medium">ลูกค้า</th>
              <th className="px-3 py-2 text-left font-medium whitespace-nowrap">วันที่ส่ง</th>
              <th className="px-3 py-2 text-left font-medium">โรงงาน</th>
              <th className="px-3 py-2 text-left font-medium">สินค้า</th>
              <th className="px-3 py-2 text-left font-medium">ทะเบียน</th>
              <th className="px-3 py-2 text-left font-medium">ตัวแทน</th>
              <th className="px-3 py-2 text-right font-medium">ราคา</th>
              <th className="px-3 py-2 text-left font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  <Link href={`/admin/direct-to-factory/orders/${order.id}`} className="text-green-700 hover:text-green-800 font-medium">
                    {formatThaiDateTime(order.created_at)}
                  </Link>
                </td>
                <td className="px-3 py-2">{order.customer_name || '-'}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatThaiDate(order.delivery_date)}</td>
                <td className="px-3 py-2">{order.confirmed_factory_name || order.factory_name}</td>
                <td className="px-3 py-2">{order.confirmed_product_name || order.product_name}</td>
                <td className="px-3 py-2 whitespace-nowrap">{order.license_plate}</td>
                <td className="px-3 py-2">{order.agent_name || '-'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{order.price ?? '-'}</td>
                <td className="px-3 py-2"><StatusStepper status={order.status} compact /></td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-500">ไม่พบรายการ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>ทั้งหมด {total} รายการ</span>
        <div className="flex items-center gap-2">
          {filters.page > 1 && (
            <Link href={filterParams(filters.status, filters.page - 1)} className="btn-secondary px-2" aria-label="หน้าก่อน">
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}
          <span>หน้า {filters.page} / {totalPages}</span>
          {filters.page < totalPages && (
            <Link href={filterParams(filters.status, filters.page + 1)} className="btn-secondary px-2" aria-label="หน้าถัดไป">
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
