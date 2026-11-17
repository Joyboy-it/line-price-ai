import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { ArrowLeft, Download } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { formatThaiDate, formatThaiDateTime } from '@/lib/direct-to-factory/format';
import { canStaffCancel } from '@/lib/direct-to-factory/order-rules';
import { getOffersForProduct, getOrder, getOrderFiles, listFactoryProductTree, listOrderActivity } from '@/lib/direct-to-factory/queries';
import { isUuid } from '@/lib/direct-to-factory/validation';
import StatusStepper from '@/app/direct-to-factory/StatusStepper';
import OrderHistory from './OrderHistory';
import StaffOrderForm from './StaffOrderForm';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900 break-words">{value || '-'}</dd>
    </div>
  );
}

export default async function StaffFactoryOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [order, session] = await Promise.all([getOrder(id), getServerSession(authOptions)]);
  if (!order) notFound();
  const canCancel = !!session?.user && canStaffCancel(session.user.role, order);

  const [files, offers, factories, activity] = await Promise.all([
    getOrderFiles(id),
    getOffersForProduct(order.confirmed_product_id ?? order.product_id),
    listFactoryProductTree(),
    listOrderActivity(id),
  ]);

  return (
    <div className="space-y-4">
      <Link href="/admin/direct-to-factory" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" />
        กลับไปตารางออเดอร์
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <section className="card p-4 sm:p-6 h-fit">
            <h2 className="font-semibold text-gray-800 mb-3">ข้อมูลจากลูกค้า</h2>
            <div className="mb-4">
              <StatusStepper status={order.status} />
            </div>
            <dl className="divide-y divide-gray-100">
              <Row label="ชื่อลูกค้า" value={order.customer_name} />
              <Row label="วันที่แจ้ง" value={formatThaiDateTime(order.created_at)} />
              <Row label="วันที่ส่งสินค้า" value={formatThaiDate(order.delivery_date)} />
              <Row label="โรงงาน" value={order.factory_name} />
              <Row label="ประเภทสินค้า" value={order.product_name} />
              <Row label="ทะเบียนรถ" value={order.license_plate} />
              <Row label="หมายเหตุ" value={order.customer_note} />
              <Row
                label="เอกสารเข้าโรงงาน"
                value={
                  order.form_file_name ? (
                    <a href={`/api/direct-to-factory/orders/${order.id}/form`} className="inline-flex items-center gap-1 text-green-700 hover:text-green-800">
                      <Download className="w-4 h-4" /> {order.form_file_name}
                    </a>
                  ) : (
                    <span className="text-yellow-800">ไม่มีไฟล์แบบฟอร์ม ต้องแนบให้ลูกค้า</span>
                  )
                }
              />
            </dl>
          </section>
          <OrderHistory logs={activity} />
        </div>

        <div className="lg:col-span-2">
          <StaffOrderForm order={order} files={files} initialOffers={offers} factories={factories} canCancel={canCancel} />
        </div>
      </div>
    </div>
  );
}
