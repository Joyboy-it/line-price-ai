'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchJson, type ApiError } from '@/lib/direct-to-factory/fetch-json';
import type { FactoryOption } from '@/lib/direct-to-factory/queries';
import type { CustomerOrderView } from '@/lib/direct-to-factory/types';

interface OrderFormProps {
  customerName: string;
  shopName: string;
  options: FactoryOption[];
  order?: Pick<CustomerOrderView, 'id' | 'delivery_date' | 'factory_id' | 'product_id' | 'license_plate' | 'customer_note'>;
}

type Field = 'delivery_date' | 'factory_id' | 'product_id' | 'license_plate' | 'customer_note';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

export default function OrderForm({ customerName, shopName, options, order }: OrderFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<Field, string>>({
    delivery_date: order?.delivery_date ?? '',
    factory_id: order?.factory_id ?? '',
    product_id: order?.product_id ?? '',
    license_plate: order?.license_plate ?? '',
    customer_note: order?.customer_note ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const products = options.find((factory) => factory.id === values.factory_id)?.products ?? [];

  const set = (field: Field, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value, ...(field === 'factory_id' ? { product_id: '' } : {}) }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const describedBy = (field: Field) => (fieldErrors[field] ? `${field}-error` : undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const saved = await fetchJson<CustomerOrderView>(
        order ? `/api/direct-to-factory/orders/${order.id}` : '/api/direct-to-factory/orders',
        { method: order ? 'PATCH' : 'POST', body: JSON.stringify(values) }
      );
      router.push(`/direct-to-factory/${saved.id}`);
      router.refresh();
    } catch (error) {
      const failure = error as Error & ApiError;
      setFieldErrors((failure.fields ?? {}) as Partial<Record<Field, string>>);
      setFormError(failure.message);
      setSubmitting(false);
    }
  };

  if (options.length === 0 && !order) {
    return <div className="card p-6 text-center text-gray-600">ขณะนี้ยังไม่มีโรงงานที่เปิดรับ กรุณาติดต่อเจ้าหน้าที่</div>;
  }

  return (
    <form onSubmit={submit} className="card p-4 sm:p-6 space-y-4" noValidate>
      {formError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อลูกค้า</label>
          <input id="customer_name" className="input bg-gray-100 py-1 text-sm" value={customerName} readOnly />
        </div>
        <div className="min-w-0">
          <label htmlFor="shop_name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อร้าน</label>
          <input id="shop_name" className="input bg-gray-100 py-1 text-sm" value={shopName} readOnly />
        </div>
      </div>

      <div>
        <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-700 mb-1">วันที่ส่งสินค้า</label>
        <input
          id="delivery_date"
          type="date"
          className="input"
          required
          value={values.delivery_date}
          aria-invalid={!!fieldErrors.delivery_date}
          aria-describedby={describedBy('delivery_date')}
          onChange={(e) => set('delivery_date', e.target.value)}
        />
        <FieldError id="delivery_date-error" message={fieldErrors.delivery_date} />
      </div>

      <div>
        <label htmlFor="factory_id" className="block text-sm font-medium text-gray-700 mb-1">ส่งตรงเข้าโรงงาน</label>
        <select
          id="factory_id"
          className="input"
          required
          value={values.factory_id}
          aria-invalid={!!fieldErrors.factory_id}
          aria-describedby={describedBy('factory_id')}
          onChange={(e) => set('factory_id', e.target.value)}
        >
          <option value="">เลือกโรงงานปลายทาง</option>
          {options.map((factory) => (
            <option key={factory.id} value={factory.id}>{factory.name}</option>
          ))}
        </select>
        <FieldError id="factory_id-error" message={fieldErrors.factory_id} />
      </div>

      <div>
        <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 mb-1">ประเภทสินค้า</label>
        <select
          id="product_id"
          className="input disabled:bg-gray-100"
          required
          disabled={!values.factory_id}
          value={values.product_id}
          aria-invalid={!!fieldErrors.product_id}
          aria-describedby={describedBy('product_id')}
          onChange={(e) => set('product_id', e.target.value)}
        >
          <option value="">{values.factory_id ? 'เลือกสินค้า' : 'เลือกโรงงานก่อน'}</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>
        <FieldError id="product_id-error" message={fieldErrors.product_id} />
      </div>

      <div>
        <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700 mb-1">ทะเบียนรถ</label>
        <input
          id="license_plate"
          className="input"
          required
          maxLength={50}
          placeholder="เช่น 1กข 1234 กรุงเทพ"
          value={values.license_plate}
          aria-invalid={!!fieldErrors.license_plate}
          aria-describedby={describedBy('license_plate')}
          onChange={(e) => set('license_plate', e.target.value)}
        />
        <FieldError id="license_plate-error" message={fieldErrors.license_plate} />
      </div>

      <div>
        <label htmlFor="customer_note" className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
        <textarea
          id="customer_note"
          className="input"
          rows={3}
          maxLength={1000}
          value={values.customer_note}
          aria-invalid={!!fieldErrors.customer_note}
          aria-describedby={describedBy('customer_note')}
          onChange={(e) => set('customer_note', e.target.value)}
        />
        <FieldError id="customer_note-error" message={fieldErrors.customer_note} />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" className="btn-primary min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed" disabled={submitting}>
          {submitting ? 'กำลังบันทึก...' : order ? 'บันทึกการแก้ไข' : 'ส่งรายการ'}
        </button>
        <button type="button" className="btn-secondary min-h-[44px]" onClick={() => router.back()}>
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
