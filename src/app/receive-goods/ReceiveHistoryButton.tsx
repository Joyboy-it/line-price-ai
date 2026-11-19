'use client';

import { useEffect, useState } from 'react';
import { History, X } from 'lucide-react';
import { formatThaiDate } from '@/lib/direct-to-factory/format';
import {
  RECEIVE_STATUS_LABELS,
  RECEIVE_STATUS_ROW_CLASS,
  formatReceiveNoticeItems,
  type ReceiveItem,
  type ReceiveStatus,
} from '@/lib/receive-goods';

export interface HistoryNotice {
  id: string;
  queue_no: number;
  notified_date: string;
  planned_date: string | null;
  actual_date: string | null;
  note: string | null;
  staff_note: string | null;
  status: ReceiveStatus;
  product_type: string | null;
  detail: string | null;
  items: ReceiveItem[];
}

const TABS = ['completed', 'cancelled'] as const;

export default function ReceiveHistoryButton({ notices }: { notices: HistoryNotice[] }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>('completed');
  const counts = {
    completed: notices.filter((notice) => notice.status === 'completed').length,
    cancelled: notices.filter((notice) => notice.status === 'cancelled').length,
  };
  const visible = notices.filter((notice) => notice.status === tab);

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
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 cursor-pointer"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <History className="h-4 w-4" aria-hidden="true" />
        ดูประวัติ
        <span className="tabular-nums">{notices.length}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 pt-16" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="receive-history-title" className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-lg" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="receive-history-title" className="text-lg font-semibold text-gray-900">ประวัติ</h2>
              <button type="button" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 cursor-pointer" aria-label="ปิด" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mb-4 flex gap-2 border-b border-gray-200" role="tablist">
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className={`min-h-11 cursor-pointer border-b-2 px-3 text-sm font-medium ${tab === id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-600'}`}
                  onClick={() => setTab(id)}
                >
                  {RECEIVE_STATUS_LABELS[id]} <span className="tabular-nums">{counts[id]}</span>
                </button>
              ))}
            </div>
            {visible.length === 0 ? (
              <p className="text-sm text-gray-600">ไม่มีรายการ</p>
            ) : (
              <ul className="space-y-2">
                {visible.map((notice) => (
                  <li key={notice.id} className="rounded-[10px] border border-gray-200 p-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <strong>คิวที่ {notice.queue_no}</strong>
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${RECEIVE_STATUS_ROW_CLASS[notice.status]}`}>
                        {RECEIVE_STATUS_LABELS[notice.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 break-words">{formatReceiveNoticeItems(notice)}</p>
                    {notice.note && <p className="text-sm text-gray-600 break-words">หมายเหตุ: {notice.note}</p>}
                    <p className="text-sm text-gray-600 break-words">
                      แจ้ง {formatThaiDate(notice.notified_date)} · แผนรับ {formatThaiDate(notice.planned_date)} · รับจริง {formatThaiDate(notice.actual_date)}
                    </p>
                    {notice.staff_note && <p className="text-sm text-gray-800">จากเจ้าหน้าที่: {notice.staff_note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
