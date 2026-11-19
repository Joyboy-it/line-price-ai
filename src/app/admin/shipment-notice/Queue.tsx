'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchJson } from '@/lib/direct-to-factory/fetch-json';
import { bangkokDate, formatThaiDate } from '@/lib/direct-to-factory/format';
import { Search, X } from 'lucide-react';
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
  open_rank: number | null;
  shop_name: string | null;
  destination_name: string | null;
  notified_date: string;
  planned_date: string | null;
  actual_date: string | null;
  completed_on: string | null;
  cancelled_on: string | null;
  product_type: string | null;
  detail: string | null;
  note: string | null;
  staff_note: string | null;
  status: ReceiveStatus;
  items: ReceiveItem[];
}

export default function ReceiveGoodsQueue({ notices }: { notices: QueueNotice[] }) {
  const router = useRouter();
  const today = bangkokDate();
  const [status, setStatus] = useState<ReceiveStatus>('waiting');
  const [ranges, setRanges] = useState({ completed: { from: today, to: today, shop: '' }, cancelled: { from: today, to: today, shop: '' } });
  const [searchOpen, setSearchOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(today);
  const [draftTo, setDraftTo] = useState(today);
  const [draftShop, setDraftShop] = useState('');
  const [shopOpen, setShopOpen] = useState(false);
  const searchable = status === 'completed' || status === 'cancelled';
  const activeRange = searchable ? ranges[status] : null;
  const shopNames = [...new Set(
    notices
      .filter((notice) => notice.status === status)
      .map((notice) => (notice.shop_name || notice.destination_name || '').trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'th'));
  const shopMatches = shopNames.filter((name) => name.toLowerCase().includes(draftShop.trim().toLowerCase())).slice(0, 8);
  const matchesClosed = (notice: QueueNotice, item: 'completed' | 'cancelled') => {
    const day = item === 'completed' ? notice.completed_on : notice.cancelled_on;
    const range = ranges[item];
    if (!day || day < range.from || day > range.to) return false;
    const shop = (notice.shop_name || notice.destination_name || '').toLowerCase();
    return shop.includes(range.shop.trim().toLowerCase());
  };
  const visible = notices.filter((notice) => {
    if (notice.status !== status) return false;
    if (status === 'completed' || status === 'cancelled') return matchesClosed(notice, status);
    return true;
  });
  const countFor = (item: ReceiveStatus) => notices.filter((notice) => {
    if (notice.status !== item) return false;
    if (item === 'completed' || item === 'cancelled') return matchesClosed(notice, item);
    return true;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">สถานะ</span>
        {RECEIVE_STATUSES.map((item) => (
          <FilterChip
            key={item}
            status={item}
            label={RECEIVE_STATUS_LABELS[item]}
            count={countFor(item)}
            selected={status === item}
            onClick={() => setStatus(item)}
          />
        ))}
        {searchable && activeRange && (
          <button
            type="button"
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 cursor-pointer"
            onClick={() => { setDraftFrom(activeRange.from); setDraftTo(activeRange.to); setDraftShop(activeRange.shop); setShopOpen(false); setSearchOpen(true); }}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            ค้นหา
          </button>
        )}
      </div>
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 pt-24" onClick={() => setSearchOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="completed-search-title" className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="completed-search-title" className="text-lg font-semibold text-gray-900">{status === 'cancelled' ? 'ค้นหารายการที่ยกเลิก' : 'ค้นหางานที่จบ'}</h2>
              <button type="button" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 cursor-pointer" aria-label="ปิด" onClick={() => setSearchOpen(false)}>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label htmlFor="completed-from" className="text-sm font-medium text-gray-700">
                <span className="mb-1 block">วันเริ่มต้น</span>
                <input id="completed-from" type="date" className="input" value={draftFrom} onChange={(event) => setDraftFrom(event.target.value)} />
              </label>
              <label htmlFor="completed-to" className="text-sm font-medium text-gray-700">
                <span className="mb-1 block">วันสิ้นสุด</span>
                <input id="completed-to" type="date" className="input" value={draftTo} onChange={(event) => setDraftTo(event.target.value)} />
              </label>
            </div>
            <div className="relative mt-3 text-sm font-medium text-gray-700">
              <label htmlFor="completed-shop" className="mb-1 block">ชื่อร้าน</label>
              <input
                id="completed-shop"
                className="input"
                autoComplete="off"
                value={draftShop}
                placeholder="ค้นหาชื่อร้าน"
                onChange={(event) => { setDraftShop(event.target.value); setShopOpen(true); }}
                onFocus={() => setShopOpen(true)}
              />
              {shopOpen && draftShop.trim() !== '' && (
                <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white font-normal shadow-lg">
                  {shopMatches.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-green-50 cursor-pointer"
                        onClick={() => { setDraftShop(name); setShopOpen(false); }}
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                  {shopMatches.length === 0 && <li className="px-3 py-2 text-gray-500">ไม่พบร้าน</li>}
                </ul>
              )}
            </div>
            <button
              type="button"
              className="btn-primary mt-4 min-h-11 w-full"
              onClick={() => {
                if (!draftFrom || !draftTo) return;
                const [from, to] = draftFrom <= draftTo ? [draftFrom, draftTo] : [draftTo, draftFrom];
                if (status === 'completed' || status === 'cancelled') {
                  setRanges((current) => ({ ...current, [status]: { from, to, shop: draftShop } }));
                }
                setSearchOpen(false);
              }}
            >
              ค้นหา
            </button>
          </div>
        </div>
      )}
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

const FILTER_TONE: Record<ReceiveStatus, string> = {
  waiting: 'border-amber-600 bg-amber-50 text-amber-950',
  queued: 'border-sky-600 bg-sky-50 text-sky-950',
  completed: 'border-green-600 bg-green-50 text-green-800',
  cancelled: 'border-gray-500 bg-gray-100 text-gray-900',
};

function FilterChip({ status, label, count, selected, onClick }: { status: ReceiveStatus; label: string; count: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 min-w-28 rounded-lg border px-3 text-sm font-medium cursor-pointer ${selected ? FILTER_TONE[status] : 'border-gray-300 bg-white text-gray-800'}`}
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
      <td className="px-2 py-2 tabular-nums font-medium text-gray-900">{notice.open_rank ?? notice.queue_no}</td>
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
        <input type="date" aria-label={`วันที่รับจริง คิว ${notice.queue_no}`} className={field} value={actualDate} onChange={(e) => { setActualDate(e.target.value); if (e.target.value) setStatus('queued'); }} />
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
