'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, History, X } from 'lucide-react';
import { fetchJson } from '@/lib/direct-to-factory/fetch-json';
import { formatThaiDate } from '@/lib/direct-to-factory/format';
import type { CustomerOrderView } from '@/lib/direct-to-factory/types';
import StatusStepper from './StatusStepper';

const PAGE_SIZE = 20;
type HistoryStatus = 'completed' | 'cancelled';

function HistoryList({ orders }: { orders: CustomerOrderView[] }) {
  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/direct-to-factory/${order.id}`}
            className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="font-medium text-gray-900">{order.product_name}</p>
                <StatusStepper status={order.status} compact />
              </div>
              <p className="text-sm text-gray-600">
                {order.factory_name} · ส่ง {formatThaiDate(order.delivery_date)} · ทะเบียน {order.license_plate}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 shrink-0" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function OrderHistoryButton({
  completedCount,
  cancelledCount,
}: {
  completedCount: number;
  cancelledCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<HistoryStatus>('completed');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<CustomerOrderView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const historyTotal = completedCount + cancelledCount;
  const counts: Record<HistoryStatus, number> = { completed: completedCount, cancelled: cancelledCount };
  const pageCount = Math.max(1, Math.ceil((tab === 'completed' ? completedCount : cancelledCount) / PAGE_SIZE));

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setOrders([]);
    setError('');
    fetchJson<{ orders: CustomerOrderView[]; total: number }>(
      `/api/direct-to-factory/orders?status=${tab}&page=${page}`
    )
      .then((result) => {
        if (cancelled) return;
        setOrders(result.orders);
        setTotal(result.total);
      })
      .catch((fetchError: Error) => {
        if (!cancelled) setError(fetchError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tab, page]);

  if (historyTotal === 0) return null;

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center justify-center h-11 w-11 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        aria-label={`ดูประวัติ ${historyTotal} รายการ`}
        title="ดูประวัติ"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <History className="w-7 h-7" strokeWidth={2.25} aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-history-title"
            className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[85vh] overflow-y-auto p-4 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 id="order-history-title" className="text-lg font-semibold text-gray-800">ประวัติรายการ</h2>
              <button
                type="button"
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                aria-label="ปิด"
                onClick={() => setOpen(false)}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex gap-2 border-b border-gray-200 mb-4" role="tablist" aria-label="ประเภทประวัติ">
              {([
                ['completed', 'จบรายการ'],
                ['cancelled', 'ยกเลิก'],
              ] as const).map(([id, label]) => {
                const selected = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={`min-h-11 px-3 -mb-px border-b-2 text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${selected ? 'border-green-500 text-green-700' : 'border-transparent text-gray-600 hover:text-green-600'}`}
                    onClick={() => {
                      setTab(id);
                      setPage(1);
                    }}
                  >
                    {label} <span className="tabular-nums">{counts[id]}</span>
                  </button>
                );
              })}
            </div>
            {error && <p role="alert" className="text-sm text-red-700 mb-3">{error}</p>}
            {loading ? (
              <p className="text-sm text-gray-600" role="status">กำลังโหลด...</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-gray-600">ไม่มีรายการ</p>
            ) : (
              <HistoryList orders={orders} />
            )}
            <div className="flex items-center justify-between gap-3 mt-4 text-sm text-gray-600">
              <span className="tabular-nums">แสดง {orders.length} จาก {total} รายการ</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary min-h-11 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                >
                  ก่อนหน้า
                </button>
                <span className="tabular-nums">{page}/{pageCount}</span>
                <button
                  type="button"
                  className="btn-secondary min-h-11 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page >= pageCount || loading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
