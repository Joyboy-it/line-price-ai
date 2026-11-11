import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, FileText, Pencil } from 'lucide-react';
import { formatThaiDate, formatThaiDateTime } from '@/lib/direct-to-factory/format';
import { toCustomerView } from '@/lib/direct-to-factory/order-rules';
import { getCustomerOrder, getOrderFiles } from '@/lib/direct-to-factory/queries';
import { isUuid } from '@/lib/direct-to-factory/validation';
import CancelOrderButton from '../CancelOrderButton';
import { getCustomerPageSession } from '../customer-page';
import NotApproved from '../NotApproved';
import StatusBadge from '../StatusBadge';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900 break-words">{value || '-'}</dd>
    </div>
  );
}

const FILE_KIND_LABELS = { delivery_note: 'ใบนำส่ง', attachment: 'ไฟล์แนบ' } as const;

export default async function FactoryOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, approved } = await getCustomerPageSession();
  if (!approved) return <NotApproved />;

  const { id } = await params;
  if (!isUuid(id)) notFound();

  const record = await getCustomerOrder(id, session.user.id);
  if (!record) notFound();
  const order = toCustomerView(record, await getOrderFiles(id));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <Link href="/direct-to-factory" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" />
        กลับไปรายการ
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-800">{order.product_name}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-sm text-gray-500">แจ้งเมื่อ {formatThaiDateTime(order.created_at)}</p>

      <section className="card p-4 sm:p-6">
        <h2 className="font-semibold text-gray-800 mb-2">เอกสารเข้าโรงงาน</h2>
        {order.has_form_file ? (
          <a href={`/api/direct-to-factory/orders/${order.id}/form`} className="btn-primary inline-flex items-center gap-2 min-h-[44px]">
            <Download className="w-4 h-4" />
            ดาวน์โหลดแบบฟอร์มเข้าโรงงาน
          </a>
        ) : (
          <p className="text-sm text-gray-600">เจ้าหน้าที่จะแนบเอกสารให้ภายหลัง</p>
        )}
      </section>

      <section className="card p-4 sm:p-6">
        <h2 className="font-semibold text-gray-800 mb-2">ข้อมูลที่แจ้ง</h2>
        <dl className="divide-y divide-gray-100">
          <Row label="วันที่ส่งสินค้า" value={formatThaiDate(order.delivery_date)} />
          <Row label="โรงงาน" value={order.factory_name} />
          <Row label="ประเภทสินค้า" value={order.product_name} />
          <Row label="ทะเบียนรถ" value={order.license_plate} />
          <Row label="หมายเหตุ" value={order.customer_note} />
        </dl>
        {order.can_edit && (
          <div className="flex flex-wrap gap-3 mt-4">
            <Link href={`/direct-to-factory/${order.id}/edit`} className="btn-secondary inline-flex items-center gap-2 min-h-[44px]">
              <Pencil className="w-4 h-4" />
              แก้ไข
            </Link>
            <CancelOrderButton orderId={order.id} />
          </div>
        )}
      </section>

      <section className="card p-4 sm:p-6">
        <h2 className="font-semibold text-gray-800 mb-2">ตอบกลับจาก ส.เจริญ</h2>
        <dl className="divide-y divide-gray-100">
          <Row label="วันที่ยืนยัน" value={order.confirmed_date ? formatThaiDate(order.confirmed_date) : 'รอยืนยัน'} />
          <Row label="เวลานำส่ง" value={order.delivery_time ? `${order.delivery_time} น.` : null} />
          <Row label="ยืนยันโรงงาน" value={order.confirmed_factory_name} />
          <Row label="ประเภทสินค้า" value={order.confirmed_product_name} />
          <Row label="หมายเหตุ" value={order.staff_note} />
        </dl>

        {order.files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {order.files.map((file) => (
              <li key={file.id}>
                <a
                  href={`/api/direct-to-factory/orders/${order.id}/files/${file.id}`}
                  className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 min-h-[44px]"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="text-gray-600">{FILE_KIND_LABELS[file.kind]}:</span>
                  <span className="truncate">{file.file_name}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
