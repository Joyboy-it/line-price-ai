import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { listEligibleFactoryCustomers, listFactoryOptions } from '@/lib/direct-to-factory/queries';
import StaffCreateOrderForm from './StaffCreateOrderForm';

export const dynamic = 'force-dynamic';

export default async function NewStaffFactoryOrderPage() {
  const [customers, options] = await Promise.all([
    listEligibleFactoryCustomers(),
    listFactoryOptions(),
  ]);

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/admin/direct-to-factory" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" />
        กลับไปตารางออเดอร์
      </Link>
      <h2 className="text-2xl font-bold text-gray-800">เพิ่มรายการแทนลูกค้า</h2>
      {customers.length === 0 ? (
        <div className="card p-6 text-center text-gray-600">ยังไม่มีลูกค้าที่มีสิทธิ์ส่งตรงเข้าโรงงาน</div>
      ) : options.length === 0 ? (
        <div className="card p-6 text-center text-gray-600">ขณะนี้ยังไม่มีโรงงานที่เปิดรับ กรุณาติดต่อเจ้าหน้าที่</div>
      ) : (
        <StaffCreateOrderForm customers={customers} options={options} />
      )}
    </div>
  );
}
