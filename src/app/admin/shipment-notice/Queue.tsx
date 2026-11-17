'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchJson } from '@/lib/direct-to-factory/fetch-json';
import { formatThaiDate } from '@/lib/direct-to-factory/format';
import AddQueue from './AddQueue';
import {
  RECEIVE_STATUSES,
  RECEIVE_STATUS_LABELS,
  RECEIVE_STATUS_ROW_CLASS,
  formatReceiveNoticeItems,
  type ReceiveItem,
  type ReceiveStatus,
} from '@/lib/receive-goods';

export interface QueueNotice {
  id: string;
  queue_no: number;
  shop_name: string | null;
  destination_name: string | null;
  notified_date: string;
  planned_date: string | null;
  actual_date: string | null;
  product_type: string | null;
  detail: string | null;
  note: string | null;
  staff_note: string | null;
  status: ReceiveStatus;
  items: ReceiveItem[];
}

export default function ReceiveGoodsQueue({ notices, shops }: { notices: QueueNotice[]; shops: { id: string; shop_name: string }[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<ReceiveStatus | ''>('');
  const visible = status ? notices.filter((notice) => notice.status === status) : notices;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">สถานะ</span>
        {RECEIVE_STATUSES.map((item) => (
          <FilterChip
            key={item}
            label={RECEIVE_STATUS_LABELS[item]}
            count={notices.filter((notice) => notice.status === item).length}
            selected={status === item}
            onClick={() => setStatus(item)}
          />
        ))}
        <FilterChip label="ทั้งหมด" count={notices.length} selected={status === ''} onClick={() => setStatus('')} />
        <div className="ml-auto">
          <AddQueue shops={shops} />
        </div>
      </div>
      <div className="card w-full max-w-full min-w-0 overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-12" />
            <col className="w-32" />
            <col className="w-[16%]" />
            <col />
            <col className="w-36" />
            <col className="w-36" />
            <col className="w-36" />
            <col className="w-[16%]" />
            <col className="w-20" />
          </colgroup>
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-2 py-2 text-left font-medium">คิว</th>
              <th className="px-2 py-2 text-left font-medium">สถานะ</th>
              <th className="px-2 py-2 text-left font-medium">ชื่อร้าน</th>
              <th className="px-2 py-2 text-left font-medium">รายการ</th>
              <th className="px-2 py-2 text-left font-medium whitespace-nowrap">วันที่แจ้ง</th>
              <th className="px-2 py-2 text-left font-medium">แผนวันรับ</th>
              <th className="px-2 py-2 text-left font-medium">วันที่รับจริง</th>
              <th className="px-2 py-2 text-left font-medium">ข้อความถึงลูกค้า</th>
              <th className="px-2 py-2 text-left font-medium"><span className="sr-only">บันทึก</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.map((notice) => (
              <QueueRow key={notice.id} notice={notice} onSaved={() => router.refresh()} />
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-500">ไม่มีรายการ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({ label, count, selected, onClick }: { label: string; count: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 px-3 rounded-full border text-sm font-medium cursor-pointer ${selected ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 bg-white text-gray-700'}`}
    >
      {label} <span className="tabular-nums">{count}</span>
    </button>
  );
}

function QueueRow({ notice, onSaved }: { notice: QueueNotice; onSaved: () => void }) {
  const [status, setStatus] = useState(notice.status);
  const [plannedDate, setPlannedDate] = useState(notice.planned_date ?? '');
  const [actualDate, setActualDate] = useState(notice.actual_date ?? '');
  const [staffNote, setStaffNote] = useState(notice.staff_note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await fetchJson(`/api/admin/receive-goods/${notice.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          staff_note: staffNote,
          planned_date: plannedDate,
          actual_date: actualDate,
        }),
      });
      onSaved();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const field = 'input !w-full !min-w-0 !max-w-full !px-2 !py-1 text-sm';

  return (
    <tr className={`${RECEIVE_STATUS_ROW_CLASS[status]} align-top`}>
      <td className="px-2 py-2 tabular-nums font-medium text-gray-900">{notice.queue_no}</td>
      <td className="px-2 py-2">
        <select aria-label={`สถานะ คิว ${notice.queue_no}`} className={field} value={status} onChange={(e) => setStatus(e.target.value as ReceiveStatus)}>
          {RECEIVE_STATUSES.map((item) => (
            <option key={item} value={item}>{RECEIVE_STATUS_LABELS[item]}</option>
          ))}
        </select>
        {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
      </td>
      <td className="px-2 py-2 break-words">
        <p className="text-gray-900">{notice.shop_name || 'ไม่ระบุร้าน'}</p>
        {notice.note && <p className="text-xs text-gray-500">{notice.note}</p>}
      </td>
      <td className="px-2 py-2 break-words text-gray-800">{formatReceiveNoticeItems(notice)}</td>
      <td className="px-2 py-2 whitespace-nowrap text-gray-700">{formatThaiDate(notice.notified_date)}</td>
      <td className="px-2 py-2">
        <input type="date" aria-label={`แผนวันรับ คิว ${notice.queue_no}`} className={field} value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
      </td>
      <td className="px-2 py-2">
        <input type="date" aria-label={`วันที่รับจริง คิว ${notice.queue_no}`} className={field} value={actualDate} onChange={(e) => setActualDate(e.target.value)} />
      </td>
      <td className="px-2 py-2">
        <input aria-label={`ข้อความถึงลูกค้า คิว ${notice.queue_no}`} className={field} maxLength={1000} value={staffNote} onChange={(e) => setStaffNote(e.target.value)} />
      </td>
      <td className="px-2 py-2">
        <button type="button" className="btn-primary w-full px-2 py-1 text-sm disabled:opacity-50" disabled={saving} onClick={save}>
          {saving ? '...' : 'บันทึก'}
        </button>
      </td>
    </tr>
  );
}
