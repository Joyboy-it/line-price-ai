import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { listFactoryOptions } from '@/lib/direct-to-factory/queries';
import { getCustomerPageSession } from '../customer-page';
import NotApproved from '../NotApproved';
import OrderForm from '../OrderForm';

export default async function NewFactoryOrderPage() {
  const { session, approved } = await getCustomerPageSession('view');
  if (!approved) return <NotApproved />;

  const options = await listFactoryOptions();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/direct-to-factory" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-4">
        <ArrowLeft className="w-4 h-4" />
        กลับไปรายการ
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">แบบฟอร์มส่งตรงเข้าโรงงาน</h1>
      <OrderForm
        customerName={session.user.name?.trim() || '-'}
        shopName={session.user.shop_name?.trim() || '-'}
        options={options}
      />
    </div>
  );
}
