import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { canCustomerEdit } from '@/lib/direct-to-factory/order-rules';
import { getCustomerOrder, listFactoryOptions, type FactoryOption } from '@/lib/direct-to-factory/queries';
import { isUuid } from '@/lib/direct-to-factory/validation';
import { getCustomerPageSession } from '../../customer-page';
import NotApproved from '../../NotApproved';
import OrderForm from '../../OrderForm';

export default async function EditFactoryOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, approved } = await getCustomerPageSession('view');
  if (!approved) return <NotApproved />;

  const { id } = await params;
  if (!isUuid(id)) notFound();

  const order = await getCustomerOrder(id, session.user.id);
  if (!order) notFound();
  if (!canCustomerEdit(order)) redirect(`/direct-to-factory/${id}`);

  // Keep the current choice selectable even if it was closed after the order was made.
  const options: FactoryOption[] = await listFactoryOptions();
  let factory = options.find((f) => f.id === order.factory_id);
  if (!factory) {
    factory = { id: order.factory_id, name: order.factory_name, products: [] };
    options.push(factory);
  }
  if (!factory.products.some((p) => p.id === order.product_id)) {
    factory.products.push({ id: order.product_id, name: order.product_name });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/direct-to-factory/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-4">
        <ArrowLeft className="w-4 h-4" />
        กลับไปรายละเอียด
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">แก้ไขรายการส่งตรงเข้าโรงงาน</h1>
      <OrderForm
        customerName={session.user.name || session.user.shop_name || '-'}
        options={options}
        order={{
          id: order.id,
          delivery_date: order.delivery_date,
          factory_id: order.factory_id,
          product_id: order.product_id,
          license_plate: order.license_plate,
          customer_note: order.customer_note,
        }}
      />
    </div>
  );
}
