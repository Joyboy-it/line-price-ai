import Link from 'next/link';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { formatThaiDate, formatThaiDateTime } from '@/lib/direct-to-factory/format';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/lib/direct-to-factory/order-rules';
import { listFactories, listStaffOrders, STAFF_PAGE_SIZE } from '@/lib/direct-to-factory/queries';
import { parseStaffOrderFilters } from '@/lib/direct-to-factory/validation';
import StatusBadge from '@/app/direct-to-factory/StatusBadge';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DirectToFactoryOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const filters = parseStaffOrderFilters((key) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  });

  const [{ orders, total }, factories] = await Promise.all([listStaffOrders(filters), listFactories()]);
  const totalPages = Math.max(1, Math.ceil(total / STAFF_PAGE_SIZE));

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.factoryId) params.set('factory_id', filters.factoryId);
    if (filters.q) params.set('q', filters.q);
    params.set('page', String(page));
    return `/admin/direct-to-factory?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <form method="get" className="card p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
        <label className="text-sm text-gray-700 lg:col-span-2">
          <span className="block mb-1">ค้นหาชื่อลูกค้า / ทะเบียนรถ</span>
          <input name="q" className="input" defaultValue={filters.q ?? ''} />
        </label>
        <label className="text-sm text-gray-700">
          <span className="block mb-1">สถานะ</span>
          <select name="status" className="input" defaultValue={filters.status ?? ''}>
            <option value="">ทั้งหมด</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          <span className="block mb-1">โรงงาน</span>
          <select name="factory_id" className="input" defaultValue={filters.factoryId ?? ''}>
            <option value="">ทั้งหมด</option>
            {factories.map((factory) => (
              <option key={factory.id} value={factory.id}>{factory.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          <span className="block mb-1">วันที่ส่งตั้งแต่</span>
          <input type="date" name="from" className="input" defaultValue={filters.from ?? ''} />
        </label>
        <label className="text-sm text-gray-700">
          <span className="block mb-1">ถึง</span>
          <input type="date" name="to" className="input" defaultValue={filters.to ?? ''} />
        </label>
        <div className="flex gap-2 lg:col-span-6">
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Search className="w-4 h-4" /> ค้นหา
          </button>
          <Link href="/admin/direct-to-factory" className="btn-secondary">ล้างตัวกรอง</Link>
        </div>
      </form>

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
                <td className="px-3 py-2"><StatusBadge status={order.status} /></td>
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
            <Link href={pageHref(filters.page - 1)} className="btn-secondary px-2" aria-label="หน้าก่อน">
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}
          <span>หน้า {filters.page} / {totalPages}</span>
          {filters.page < totalPages && (
            <Link href={pageHref(filters.page + 1)} className="btn-secondary px-2" aria-label="หน้าถัดไป">
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
