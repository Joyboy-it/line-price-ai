'use client';

import { useEffect, useRef, useState } from 'react';
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

interface BasketLine {
  productType: ReceiveProduct;
  unit: ReceiveUnit;
  quantity: number;
}

function parseQty(value: string): number {
  const numeric = Number(value.trim().replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : 0;
}

function mergeLine(basket: BasketLine[], productType: ReceiveProduct, unit: ReceiveUnit, quantity: number): BasketLine[] {
  const existing = basket.find((line) => line.productType === productType && line.unit === unit);
  if (!existing) return [...basket, { productType, unit, quantity }];
  return basket.map((line) => line === existing
    ? { ...line, quantity: Math.round((line.quantity + quantity) * 100) / 100 }
    : line);
}

export default function ReceiveGoodsForm({ customerName, shopName }: { customerName: string; shopName: string }) {
  const router = useRouter();
  const qtyRef = useRef<HTMLInputElement>(null);
  const [dialogProduct, setDialogProduct] = useState<ReceiveProduct | null>(null);
  const [unit, setUnit] = useState<ReceiveUnit>('piece');
  const [qty, setQty] = useState('');
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [note, setNote] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!dialogProduct) return;
    qtyRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDialogProduct(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialogProduct]);

  const openProduct = (product: ReceiveProduct) => {
    setDialogProduct(product);
    setQty('');
    setUnit('piece');
    setDialogError('');
  };

  const step = (delta: number) => {
    const next = Math.max(0, Math.round((parseQty(qty) + delta) * 100) / 100);
    setQty(next ? String(next) : '');
    setDialogError('');
  };

  const confirmAdd = () => {
    if (!dialogProduct) return;
    const amount = parseQty(qty);
    if (amount <= 0) {
      setDialogError('กรุณากรอกจำนวนมากกว่า 0');
      qtyRef.current?.focus();
      return;
    }
    setBasket((current) => mergeLine(current, dialogProduct, unit, amount));
    setToast(`เพิ่ม ${RECEIVE_PRODUCT_LABELS[dialogProduct]} แล้ว`);
    setDialogProduct(null);
  };

  const clear = () => {
    if (!basket.length && !note) return;
    if (!window.confirm('ล้างข้อมูลที่กรอกทั้งหมด?')) return;
    setBasket([]);
    setNote('');
    setError('');
    setToast('ล้างข้อมูลแล้ว');
  };

  const submit = async () => {
    if (!basket.length) return;
    setSubmitting(true);
    setError('');
    try {
      const saved = await fetchJson<{ open_rank?: number }>('/api/receive-goods', {
        method: 'POST',
        body: JSON.stringify({
          note,
          items: basket.map((line) => ({
            product_type: line.productType,
            quantity: line.quantity,
            unit: line.unit,
          })),
        }),
      });
      setBasket([]);
      setNote('');
      setToast(saved.open_rank ? `ส่งคำขอแล้ว คิวที่ ${saved.open_rank}` : 'ส่งคำขอแล้ว');
      router.refresh();
      if (window.innerWidth < 860) document.getElementById('receive-queue')?.scrollIntoView({ behavior: 'smooth' });
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="card min-w-0 w-full p-3 sm:p-5 space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <label htmlFor="receive-customer-name" className="mb-1 block text-sm font-medium text-gray-700">ชื่อลูกค้า</label>
          <input id="receive-customer-name" className="input bg-gray-100 py-1 text-sm" value={customerName} readOnly />
        </div>
        <div className="min-w-0">
          <label htmlFor="receive-shop-name" className="mb-1 block text-sm font-medium text-gray-700">ชื่อร้าน</label>
          <input id="receive-shop-name" className="input bg-gray-100 py-1 text-sm" value={shopName} readOnly />
        </div>
      </div>

      <div>
        <span id="receive-item-label" className="block font-semibold mb-2">เลือกรายการสินค้า</span>
        <div role="group" aria-labelledby="receive-item-label" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {RECEIVE_PRODUCTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => openProduct(value)}
              className="min-h-12 w-full rounded-[10px] border border-gray-200 bg-white px-3.5 py-2 text-left text-sm font-medium leading-snug cursor-pointer touch-manipulation hover:border-green-600 sm:min-h-[52px] sm:px-1.5 sm:text-center"
            >
              {RECEIVE_PRODUCT_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block font-semibold mb-2">
          รายการที่จะแจ้ง {basket.length > 0 && <span className="font-normal text-gray-600">({basket.length} รายการ)</span>}
        </span>
        {basket.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-gray-200 px-3 py-3.5 text-center text-gray-600">
            ยังไม่มีรายการ กดเลือกสินค้า แล้วใส่จำนวน
          </div>
        ) : (
          <ul aria-live="polite" className="overflow-hidden rounded-[10px] border border-gray-200 bg-gray-50">
            {basket.map((line, index) => (
              <li key={`${line.productType}-${line.unit}`} className="flex items-center gap-2.5 border-t border-gray-200 px-3 py-2.5 first:border-t-0">
                <span className="min-w-0 flex-1 break-words">{RECEIVE_PRODUCT_LABELS[line.productType]}</span>
                <span className="shrink-0 text-gray-600">{formatReceiveQuantity(line.quantity)} {RECEIVE_UNIT_LABELS[line.unit]}</span>
                <button
                  type="button"
                  aria-label="ลบรายการ"
                  onClick={() => setBasket((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="h-11 w-11 rounded-lg text-xl text-red-600 cursor-pointer hover:bg-gray-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="receive-note" className="block font-semibold mb-2">หมายเหตุ <span className="font-normal text-gray-600">(ไม่บังคับ)</span></label>
        <textarea id="receive-note" className="input min-h-[76px]" maxLength={1000} placeholder="เช่น เวลาที่สะดวก จุดนัดรับ" value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <div className="flex w-full gap-2 max-[859px]:fixed max-[859px]:inset-x-0 max-[859px]:bottom-0 max-[859px]:z-20 max-[859px]:border-t max-[859px]:border-gray-200 max-[859px]:bg-white max-[859px]:px-3 max-[859px]:pt-2.5 max-[859px]:pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={clear} className="min-h-12 shrink-0 rounded-[10px] bg-gray-100 px-4 font-semibold cursor-pointer">ล้างข้อมูล</button>
        <button type="submit" disabled={submitting || basket.length === 0} className="btn-primary min-h-12 flex-1 rounded-[10px] disabled:opacity-45 disabled:cursor-not-allowed">
          {submitting ? 'กำลังบันทึก...' : 'ส่งคำขอ'}
        </button>
      </div>

      {dialogProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={() => setDialogProduct(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="receive-qty-title"
            className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="receive-qty-title" className="text-lg font-bold text-gray-900">{RECEIVE_PRODUCT_LABELS[dialogProduct]}</h2>
              <button type="button" aria-label="ปิด" onClick={() => setDialogProduct(null)} className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 cursor-pointer hover:bg-gray-100">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <label htmlFor="receive-popup-qty" className="mb-2 block font-semibold">จำนวน</label>
            <div className="mb-4 flex min-w-0 overflow-hidden rounded-[10px] border border-gray-200 bg-white">
              <button type="button" aria-label="ลดจำนวน" onClick={() => step(-1)} className="w-[52px] bg-gray-100 text-2xl cursor-pointer">−</button>
              <input
                id="receive-popup-qty"
                ref={qtyRef}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={qty}
                onChange={(event) => {
                  setQty(event.target.value.replace(/[^0-9.,]/g, ''));
                  setDialogError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    confirmAdd();
                  }
                }}
                className="min-w-0 flex-1 border-0 bg-transparent text-center text-lg font-semibold outline-none"
              />
              <button type="button" aria-label="เพิ่มจำนวน" onClick={() => step(1)} className="w-[52px] bg-gray-100 text-2xl cursor-pointer">+</button>
            </div>
            <span id="receive-popup-unit" className="mb-2 block font-semibold">หน่วย</span>
            <div role="group" aria-labelledby="receive-popup-unit" className="mb-4 grid grid-cols-2 gap-2">
              {RECEIVE_UNITS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={unit === value}
                  onClick={() => setUnit(value)}
                  className={`min-h-12 rounded-[10px] border cursor-pointer touch-manipulation ${unit === value ? 'border-green-600 bg-green-50 font-semibold text-green-700' : 'border-gray-200 bg-white text-gray-900'}`}
                >
                  {RECEIVE_UNIT_LABELS[value]}
                </button>
              ))}
            </div>
            {dialogError && <p role="alert" className="mb-3 text-sm text-red-600">{dialogError}</p>}
            <button type="button" onClick={confirmAdd} className="btn-primary min-h-12 w-full rounded-[10px]">
              เพิ่มลงรายการ
            </button>
          </div>
        </div>
      )}

      <div role="status" className={`pointer-events-none fixed left-1/2 z-30 max-w-[90%] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2.5 font-medium text-gray-50 transition-opacity bottom-24 ${toast ? 'opacity-100' : 'opacity-0'}`}>
        {toast}
      </div>
    </form>
  );
}
