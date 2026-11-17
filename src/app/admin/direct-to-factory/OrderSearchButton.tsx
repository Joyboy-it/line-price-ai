'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

interface FactoryOption {
  id: string;
  name: string;
}

interface Props {
  status?: string;
  q?: string;
  factoryId?: string;
  from?: string;
  to?: string;
  dateIsDefault?: boolean;
  factories: FactoryOption[];
}

export default function OrderSearchButton({ status, q, factoryId, from, to, dateIsDefault, factories }: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = [q, factoryId, dateIsDefault ? '' : 'dates'].filter(Boolean).length;
  const clearHref = status ? `/admin/direct-to-factory?status=${encodeURIComponent(status)}` : '/admin/direct-to-factory';

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`shrink-0 inline-flex items-center gap-2 min-h-11 px-3 rounded-full border text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${activeCount > 0 ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Search className="w-4 h-4" aria-hidden="true" />
        ค้นหา
        {activeCount > 0 && <span className="tabular-nums">{activeCount}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-search-title"
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-4 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 id="order-search-title" className="text-lg font-semibold text-gray-800">ค้นหาและตัวกรอง</h2>
              <button
                type="button"
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                aria-label="ปิด"
                onClick={() => setOpen(false)}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form method="get" action="/admin/direct-to-factory" className="space-y-3">
              {status && <input type="hidden" name="status" value={status} />}
              <label className="block text-sm text-gray-700">
                <span className="block mb-1">ชื่อลูกค้า / ทะเบียนรถ</span>
                <input name="q" className="input" defaultValue={q ?? ''} autoFocus />
              </label>
              <label className="block text-sm text-gray-700">
                <span className="block mb-1">โรงงาน</span>
                <select name="factory_id" className="input" defaultValue={factoryId ?? ''}>
                  <option value="">ทั้งหมด</option>
                  {factories.map((factory) => (
                    <option key={factory.id} value={factory.id}>{factory.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  <span className="block mb-1">วันที่ส่งตั้งแต่</span>
                  <input type="date" name="from" className="input" defaultValue={from ?? ''} />
                </label>
                <label className="block text-sm text-gray-700">
                  <span className="block mb-1">ถึง</span>
                  <input type="date" name="to" className="input" defaultValue={to ?? ''} />
                </label>
              </div>
              <p className="text-sm text-gray-600">ช่วงวันที่นี้ใช้กับรายการที่จบหรือยกเลิกแล้ว รายการที่ยังติดตามแสดงทั้งหมด</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="submit" className="btn-primary min-h-11 inline-flex items-center gap-2">
                  <Search className="w-4 h-4" aria-hidden="true" />
                  ค้นหา
                </button>
                <Link href={clearHref} className="btn-secondary min-h-11 inline-flex items-center">
                  ล้างตัวกรอง
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
