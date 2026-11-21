'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchJson, type ApiError } from '@/lib/direct-to-factory/fetch-json';
import type { EligibleFactoryCustomer, FactoryOption } from '@/lib/direct-to-factory/queries';

interface StaffCreateOrderFormProps {
  customers: EligibleFactoryCustomer[];
  options: FactoryOption[];
}

type Field = 'user_id' | 'delivery_date' | 'factory_id' | 'product_id' | 'license_plate' | 'customer_note';

function customerLabel(customer: EligibleFactoryCustomer): string {
  if (customer.shop_name === '-') return customer.customer_name;
  return `${customer.shop_name} · ${customer.customer_name}`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

export default function StaffCreateOrderForm({ customers, options }: StaffCreateOrderFormProps) {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [factoryId, setFactoryId] = useState('');
  const [productId, setProductId] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const products = options.find((factory) => factory.id === factoryId)?.products ?? [];
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? customers
        .filter((customer) =>
          customer.shop_name.toLowerCase().includes(needle) || customer.customer_name.toLowerCase().includes(needle)
        )
        .slice(0, 12)
    : [];

  const describedBy = (field: Field) => (fieldErrors[field] ? `${field}-error` : undefined);

  const selectCustomer = (customer: EligibleFactoryCustomer) => {
    setUserId(customer.id);
    setQuery(customerLabel(customer));
    setOpen(false);
    setFieldErrors((prev) => ({ ...prev, user_id: undefined }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const saved = await fetchJson<{ id: string }>('/api/admin/direct-to-factory/orders', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          delivery_date: deliveryDate,
          factory_id: factoryId,
          product_id: productId,
          license_plate: licensePlate,
          customer_note: customerNote,
        }),
      });
      router.push(`/admin/direct-to-factory/orders/${saved.id}`);
      router.refresh();
    } catch (error) {
      const failure = error as Error & ApiError;
      setFieldErrors((failure.fields ?? {}) as Partial<Record<Field, string>>);
      setFormError(failure.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-4 sm:p-6 space-y-4" noValidate>
      {formError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {formError}
        </div>
      )}

      <div className="relative">
        <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า</label>
        <input
          id="user_id"
          className="input"
          autoComplete="off"
          placeholder="ค้นหาชื่อร้านหรือชื่อลูกค้า"
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-invalid={!!fieldErrors.user_id}
          aria-describedby={describedBy('user_id')}
          aria-expanded={open && needle !== ''}
          aria-controls="customer-results"
          onChange={(event) => {
            setQuery(event.target.value);
            setUserId('');
            setOpen(true);
            setFieldErrors((prev) => ({ ...prev, user_id: undefined }));
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
        {open && needle !== '' && (
          <ul id="customer-results" className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {matches.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  className={`w-full min-h-11 px-3 py-2 text-left cursor-pointer ${userId === customer.id ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'}`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectCustomer(customer);
                  }}
                >
                  {customerLabel(customer)}
                </button>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">
                ไม่พบลูกค้า ตรวจชื่อร้านหรือชื่อลูกค้า หรือตรวจว่าบัญชีได้รับสิทธิ์ส่งตรงเข้าโรงงานแล้ว
              </li>
            )}
          </ul>
        )}
        <FieldError id="user_id-error" message={fieldErrors.user_id} />
      </div>

      <div>
        <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-700 mb-1">วันที่ส่งสินค้า</label>
        <input
          id="delivery_date"
          type="date"
          className="input"
          required
          value={deliveryDate}
          aria-invalid={!!fieldErrors.delivery_date}
          aria-describedby={describedBy('delivery_date')}
          onChange={(event) => {
            setDeliveryDate(event.target.value);
            setFieldErrors((prev) => ({ ...prev, delivery_date: undefined }));
          }}
        />
        <FieldError id="delivery_date-error" message={fieldErrors.delivery_date} />
      </div>

      <div>
        <label htmlFor="factory_id" className="block text-sm font-medium text-gray-700 mb-1">ส่งตรงเข้าโรงงาน</label>
        <select
          id="factory_id"
          className="input"
          required
          value={factoryId}
          aria-invalid={!!fieldErrors.factory_id}
          aria-describedby={describedBy('factory_id')}
          onChange={(event) => {
            setFactoryId(event.target.value);
            setProductId('');
            setFieldErrors((prev) => ({ ...prev, factory_id: undefined, product_id: undefined }));
          }}
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
          disabled={!factoryId}
          value={productId}
          aria-invalid={!!fieldErrors.product_id}
          aria-describedby={describedBy('product_id')}
          onChange={(event) => {
            setProductId(event.target.value);
            setFieldErrors((prev) => ({ ...prev, product_id: undefined }));
          }}
        >
          <option value="">{factoryId ? 'เลือกสินค้า' : 'เลือกโรงงานก่อน'}</option>
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
          value={licensePlate}
          aria-invalid={!!fieldErrors.license_plate}
          aria-describedby={describedBy('license_plate')}
          onChange={(event) => {
            setLicensePlate(event.target.value);
            setFieldErrors((prev) => ({ ...prev, license_plate: undefined }));
          }}
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
          value={customerNote}
          aria-invalid={!!fieldErrors.customer_note}
          aria-describedby={describedBy('customer_note')}
          onChange={(event) => {
            setCustomerNote(event.target.value);
            setFieldErrors((prev) => ({ ...prev, customer_note: undefined }));
          }}
        />
        <FieldError id="customer_note-error" message={fieldErrors.customer_note} />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" className="btn-primary min-h-11 disabled:opacity-50 disabled:cursor-not-allowed" disabled={submitting}>
          {submitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
        </button>
        <Link href="/admin/direct-to-factory" className="btn-secondary min-h-11 inline-flex items-center">
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
