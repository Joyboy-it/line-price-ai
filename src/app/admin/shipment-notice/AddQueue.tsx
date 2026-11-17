'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { fetchJson } from '@/lib/direct-to-factory/fetch-json';
import {
  RECEIVE_PRODUCTS,
  RECEIVE_PRODUCT_LABELS,
  RECEIVE_UNITS,
  RECEIVE_UNIT_LABELS,
  formatReceiveQuantity,
  type ReceiveProduct,
  type ReceiveUnit,
} from '@/lib/receive-goods';

interface Shop {
  id: string;
  shop_name: string;
}

interface Line {
  productType: ReceiveProduct;
  quantity: string;
  unit: ReceiveUnit;
}

export default function AddQueue({ shops }: { shops: Shop[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [shopQuery, setShopQuery] = useState('');
  const [shopOpen, setShopOpen] = useState(false);
  const [productType, setProductType] = useState<ReceiveProduct | ''>('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<ReceiveUnit>('piece');
  const [lines, setLines] = useState<Line[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const addLine = () => {
    if (!productType) {
      setError('กรุณาเลือกประเภทสินค้า');
      return;
    }
    if (!/^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/.test(quantity.trim()) || Number(quantity) <= 0) {
      setError('กรุณากรอกจำนวนสินค้า');
      return;
    }
    setLines((current) => [...current, { productType, quantity: quantity.trim(), unit }]);
    setProductType('');
    setQuantity('');
    setUnit('piece');
    setError('');
  };

  const save = async () => {
    if (!userId) {
      setError('กรุณาเลือกร้าน');
      return;
    }
    if (lines.length === 0) {
      setError('กรุณาเพิ่มรายการสินค้า');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await fetchJson('/api/admin/receive-goods', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          note,
          items: lines.map((line) => ({
            product_type: line.productType,
            quantity: line.quantity,
            unit: line.unit,
          })),
        }),
      });
      setUserId('');
      setShopQuery('');
      setShopOpen(false);
      setLines([]);
      setNote('');
      setOpen(false);
      router.refresh();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className="btn-primary min-h-11" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        เพิ่มคิว
      </button>
      {open && (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center overflow-y-auto p-4 pt-16 sm:pt-24" onClick={() => { if (!saving) setOpen(false); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="add-queue-title" className="bg-white rounded-xl shadow-lg max-w-lg w-full p-4 sm:p-6 space-y-3" onClick={(event) => { event.stopPropagation(); setShopOpen(false); }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="add-queue-title" className="text-lg font-semibold text-gray-900">เพิ่มคิว</h2>
          <p className="text-sm text-gray-600">คีย์แทนลูกค้าที่แจ้งทางโทรศัพท์หรือช่องทางอื่น</p>
        </div>
        <button type="button" className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer" aria-label="ปิด" onClick={() => { if (!saving) setOpen(false); }}>
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <div className="relative text-sm text-gray-700" onClick={(event) => event.stopPropagation()}>
        <label htmlFor="add-queue-shop" className="mb-1 block font-medium">ชื่อร้าน</label>
        <input
          id="add-queue-shop"
          className="input"
          autoComplete="off"
          placeholder="ค้นหาชื่อร้าน"
          value={shopQuery}
          onChange={(event) => {
            setShopQuery(event.target.value);
            setUserId('');
            setShopOpen(true);
          }}
          onFocus={() => setShopOpen(true)}
        />
        {shopOpen && shopQuery.trim() !== '' && (
          <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {shops.filter((shop) => shop.shop_name.toLowerCase().includes(shopQuery.trim().toLowerCase())).slice(0, 12).map((shop) => (
              <li key={shop.id}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left cursor-pointer ${userId === shop.id ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    setUserId(shop.id);
                    setShopQuery(shop.shop_name);
                    setShopOpen(false);
                  }}
                >
                  {shop.shop_name}
                </button>
              </li>
            ))}
            {shops.every((shop) => !shop.shop_name.toLowerCase().includes(shopQuery.trim().toLowerCase())) && (
              <li className="px-3 py-2 text-gray-500">ไม่พบร้าน</li>
            )}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm text-gray-700 min-w-40 flex-1">
          <span className="mb-1 block font-medium">สินค้า</span>
          <select className="input" value={productType} onChange={(event) => setProductType(event.target.value as ReceiveProduct | '')}>
            <option value="">เลือกสินค้า</option>
            {RECEIVE_PRODUCTS.map((product) => (
              <option key={product} value={product}>{RECEIVE_PRODUCT_LABELS[product]}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-700 w-28">
          <span className="mb-1 block font-medium">จำนวน</span>
          <input className="input" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </label>
        <label className="text-sm text-gray-700 w-32">
          <span className="mb-1 block font-medium">หน่วย</span>
          <select className="input" value={unit} onChange={(event) => setUnit(event.target.value as ReceiveUnit)}>
            {RECEIVE_UNITS.map((item) => (
              <option key={item} value={item}>{RECEIVE_UNIT_LABELS[item]}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-secondary min-h-11" onClick={addLine}>เพิ่มรายการ</button>
      </div>
      {lines.length > 0 && (
        <ul className="space-y-1 text-sm text-gray-800">
          {lines.map((line, index) => (
            <li key={`${line.productType}-${line.unit}-${index}`} className="flex items-center justify-between gap-2">
              <span>{RECEIVE_PRODUCT_LABELS[line.productType]} {formatReceiveQuantity(line.quantity)} {RECEIVE_UNIT_LABELS[line.unit]}</span>
              <button type="button" className="text-red-700 cursor-pointer" onClick={() => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}>ลบ</button>
            </li>
          ))}
        </ul>
      )}
      <label className="block text-sm text-gray-700">
        <span className="mb-1 block font-medium">หมายเหตุ</span>
        <input className="input" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="button" className="btn-primary min-h-11 disabled:opacity-50" disabled={saving} onClick={save}>
        {saving ? 'กำลังบันทึก...' : 'บันทึกคิว'}
      </button>
      </div>
    </div>
      )}
    </>
  );
}
