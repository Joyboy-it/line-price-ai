'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Trash2, Upload } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import { fetchJson } from '@/lib/direct-to-factory/fetch-json';
import { ORDER_FILE_ACCEPT } from '@/lib/direct-to-factory/files-accept';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/lib/direct-to-factory/order-rules';
import type { FactoryOption, OfferForSelection } from '@/lib/direct-to-factory/queries';
import { selectBestOffer } from '@/lib/direct-to-factory/select-offer';
import type { FactoryOrderFileRecord, FactoryOrderRecord, OrderFileKind } from '@/lib/direct-to-factory/types';
import { sanitizePriceInput } from '@/lib/direct-to-factory/validation';

interface Props {
  order: FactoryOrderRecord;
  files: FactoryOrderFileRecord[];
  initialOffers: OfferForSelection[];
  factories: (FactoryOption & { is_active: boolean })[];
  canCancel: boolean;
}

const FILE_KIND_LABELS: Record<OrderFileKind, string> = { delivery_note: 'ใบนำส่ง', attachment: 'ไฟล์แนบอื่นๆ' };

function Field({ id, label, children, hint }: { id: string; label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
    </div>
  );
}

export default function StaffOrderForm({ order, files, initialOffers, factories, canCancel }: Props) {
  const router = useRouter();
  const readOnly = order.status === 'cancelled';

  const [offers, setOffers] = useState(initialOffers);
  const [values, setValues] = useState({
    confirmed_date: order.confirmed_date ?? '',
    delivery_time: order.delivery_time ?? '',
    confirmed_factory_id: order.confirmed_factory_id ?? order.factory_id,
    confirmed_product_id: order.confirmed_product_id ?? order.product_id,
    offer_id: order.offer_id ?? '',
    price: order.price ?? '',
    po_number: order.po_number ?? '',
    delivery_note_number: order.delivery_note_number ?? '',
    staff_note: order.staff_note ?? '',
    status: order.status,
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadKind, setUploadKind] = useState<OrderFileKind>('delivery_note');
  const [uploading, setUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FactoryOrderFileRecord | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const best = selectBestOffer(offers);
  const products = factories.find((f) => f.id === values.confirmed_factory_id)?.products ?? [];

  const applyOffer = (offer: OfferForSelection | null | undefined) => ({
    offer_id: offer?.offerId ?? '',
    price: offer?.priceText ?? '',
    po_number: offer?.poNumber ?? '',
    delivery_note_number: offer?.deliveryNoteNumber ?? '',
  });

  const changeProduct = async (productId: string) => {
    setValues((prev) => ({ ...prev, confirmed_product_id: productId, ...applyOffer(null) }));
    if (!productId) {
      setOffers([]);
      return;
    }
    try {
      const next = await fetchJson<OfferForSelection[]>(`/api/admin/direct-to-factory/offers?product_id=${productId}`);
      setOffers(next);
      setValues((prev) => ({ ...prev, ...applyOffer(selectBestOffer(next)) }));
    } catch (error) {
      setNotice({ type: 'error', text: (error as Error).message });
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await fetchJson(`/api/admin/direct-to-factory/orders/${order.id}`, { method: 'PATCH', body: JSON.stringify(values) });
      setNotice({ type: 'success', text: 'บันทึกแล้ว' });
      router.refresh();
    } catch (error) {
      setNotice({ type: 'error', text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    setNotice(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', uploadKind);
    try {
      await fetchJson(`/api/admin/direct-to-factory/orders/${order.id}/files`, { method: 'POST', body: formData });
      setNotice({ type: 'success', text: 'แนบไฟล์แล้ว' });
      router.refresh();
    } catch (error) {
      setNotice({ type: 'error', text: (error as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const cancelOrder = async () => {
    try {
      await fetchJson(`/api/admin/direct-to-factory/orders/${order.id}`, { method: 'DELETE' });
      router.refresh();
    } catch (error) {
      setNotice({ type: 'error', text: (error as Error).message });
    }
  };

  const removeFile = async () => {
    if (!fileToDelete) return;
    try {
      await fetchJson(`/api/admin/direct-to-factory/orders/${order.id}/files/${fileToDelete.id}`, { method: 'DELETE' });
      router.refresh();
    } catch (error) {
      setNotice({ type: 'error', text: (error as Error).message });
    }
  };

  return (
    <div className="space-y-4">
      {notice && (
        <div
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`border rounded-lg px-4 py-3 text-sm ${notice.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
        >
          {notice.text}
        </div>
      )}
      {readOnly && (
        <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700">
          ลูกค้ายกเลิกรายการนี้แล้ว เปิดดูได้อย่างเดียว
        </div>
      )}

      <form onSubmit={save} className="card p-4 sm:p-6">
        <h2 className="font-semibold text-gray-800 mb-1">ส่วนของ ส.เจริญ</h2>
        <p className="text-sm text-gray-600 mb-4">
          เมื่อใส่วันที่ยืนยันแล้ว ลูกค้าจะแก้ไขหรือยกเลิกรายการไม่ได้ ตัวแทน ราคา เลข PO และเลขใบนำส่งลูกค้าไม่เห็น
        </p>
        <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
          <Field id="confirmed_date" label="วันที่ยืนยัน">
            <input id="confirmed_date" type="date" className="input" value={values.confirmed_date} onChange={(e) => setValues({ ...values, confirmed_date: e.target.value })} />
          </Field>
          <Field id="delivery_time" label="เวลานำส่ง">
            <input id="delivery_time" type="time" className="input" value={values.delivery_time} onChange={(e) => setValues({ ...values, delivery_time: e.target.value })} />
          </Field>
          <Field id="confirmed_factory_id" label="ยืนยันโรงงาน">
            <select
              id="confirmed_factory_id"
              className="input"
              value={values.confirmed_factory_id}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, confirmed_factory_id: e.target.value }));
                changeProduct('');
              }}
            >
              <option value="">เลือกโรงงาน</option>
              {factories.map((factory) => (
                <option key={factory.id} value={factory.id}>
                  {factory.name}{factory.is_active ? '' : ' (ปิดใช้)'}
                </option>
              ))}
            </select>
          </Field>
          <Field id="confirmed_product_id" label="ประเภทสินค้า">
            <select id="confirmed_product_id" className="input" value={values.confirmed_product_id} onChange={(e) => changeProduct(e.target.value)}>
              <option value="">เลือกสินค้า</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </Field>
          <Field id="offer_id" label="ตัวแทน" hint={best ? `ราคาดีที่สุด: ตัวแทน ${best.agentName} (${best.priceText})` : 'สินค้านี้ยังไม่มีข้อเสนอที่เปิดใช้'}>
            <select
              id="offer_id"
              className="input"
              value={values.offer_id}
              onChange={(e) => setValues({ ...values, ...applyOffer(offers.find((o) => o.offerId === e.target.value)) })}
            >
              <option value="">ไม่ระบุ</option>
              {offers.map((offer) => (
                <option key={offer.offerId} value={offer.offerId}>
                  {offer.agentName} — {offer.priceText}
                  {offer.offerId === best?.offerId ? ' (ราคาดีที่สุด)' : ''}
                  {offer.isActive ? '' : ' (ปิดใช้)'}
                  {offer.formFileName ? '' : ' (ไม่มีไฟล์ฟอร์ม)'}
                </option>
              ))}
            </select>
          </Field>
          <Field id="price" label="ราคา">
            <input id="price" className="input tabular-nums" inputMode="decimal" value={values.price} onChange={(e) => setValues({ ...values, price: sanitizePriceInput(e.target.value) })} />
          </Field>
          <Field id="po_number" label="เลข PO">
            <input id="po_number" className="input" value={values.po_number} onChange={(e) => setValues({ ...values, po_number: e.target.value })} />
          </Field>
          <Field id="delivery_note_number" label="เลขใบนำส่ง">
            <input id="delivery_note_number" className="input" value={values.delivery_note_number} onChange={(e) => setValues({ ...values, delivery_note_number: e.target.value })} />
          </Field>
          <Field id="status" label="สถานะ">
            <select id="status" className="input" value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value as typeof values.status })}>
              {ORDER_STATUSES.filter((status) => status !== 'cancelled').map((status) => (
                <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field id="staff_note" label="หมายเหตุ (ลูกค้าเห็น)">
              <textarea id="staff_note" className="input" rows={3} maxLength={1000} value={values.staff_note} onChange={(e) => setValues({ ...values, staff_note: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed" disabled={saving || readOnly}>
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            {canCancel && (
              <button type="button" className="btn-danger min-h-[44px]" onClick={() => setCancelOpen(true)}>
                ยกเลิกรายการ
              </button>
            )}
            {!canCancel && !readOnly && (
              <p className="text-sm text-gray-600">หลังมีการดำเนินการแล้ว ยกเลิกได้เฉพาะผู้ดูแลระบบ</p>
            )}
          </div>
        </fieldset>
      </form>

      <section className="card p-4 sm:p-6">
        <h2 className="font-semibold text-gray-800 mb-3">ไฟล์ใบนำส่งและไฟล์แนบ (ลูกค้าเห็น)</h2>
        {files.length === 0 ? (
          <p className="text-sm text-gray-600 mb-4">ยังไม่มีไฟล์</p>
        ) : (
          <ul className="divide-y divide-gray-100 mb-4">
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-3 py-2">
                <a href={`/api/direct-to-factory/orders/${order.id}/files/${file.id}`} className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 min-w-0">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="text-gray-600 shrink-0">{FILE_KIND_LABELS[file.kind]}:</span>
                  <span className="truncate">{file.file_name}</span>
                </a>
                {!readOnly && (
                  <button type="button" className="text-red-600 hover:text-red-700 p-2" aria-label={`ลบไฟล์ ${file.file_name}`} onClick={() => setFileToDelete(file)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {!readOnly && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm text-gray-700">
              <span className="block mb-1">ประเภทไฟล์</span>
              <select className="input" value={uploadKind} onChange={(e) => setUploadKind(e.target.value as OrderFileKind)}>
                <option value="delivery_note">ใบนำส่ง</option>
                <option value="attachment">ไฟล์แนบอื่นๆ</option>
              </select>
            </label>
            <label className={`btn-secondary flex items-center gap-2 cursor-pointer min-h-[44px] ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload className="w-4 h-4" />
              {uploading ? 'กำลังอัปโหลด...' : 'เลือกไฟล์และอัปโหลด'}
              <input
                type="file"
                className="sr-only"
                accept={ORDER_FILE_ACCEPT}
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) upload(file);
                }}
              />
            </label>
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={fileToDelete !== null}
        onClose={() => setFileToDelete(null)}
        onConfirm={removeFile}
        title="ลบไฟล์"
        message={`ลบไฟล์ ${fileToDelete?.file_name ?? ''} ลูกค้าจะไม่เห็นไฟล์นี้อีก`}
      />
      <ConfirmModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelOrder}
        title="ยกเลิกรายการส่งตรงเข้าโรงงาน"
        message="เมื่อยกเลิกแล้วจะแก้ไขรายการนี้ไม่ได้อีก"
        confirmText="ยกเลิก"
      />
    </div>
  );
}
