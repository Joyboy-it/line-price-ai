'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Download, FileSpreadsheet, Plus, Upload } from 'lucide-react';
import { fetchJson, type ApiError } from '@/lib/direct-to-factory/fetch-json';
import { ORDER_FILE_ACCEPT } from '@/lib/direct-to-factory/files-accept';
import type { AgentRow, FactoryRow, OfferRow } from '@/lib/direct-to-factory/queries';

type Notice = { type: 'success' | 'error'; text: string; details?: string[] } | null;

function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const styles = notice.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200';
  return (
    <div role={notice.type === 'error' ? 'alert' : 'status'} className={`border rounded-lg px-4 py-3 text-sm ${styles}`}>
      <p>{notice.text}</p>
      {notice.details && notice.details.length > 0 && (
        <ul className="mt-2 list-disc pl-5 space-y-1 max-h-48 overflow-y-auto">
          {notice.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
      {active ? 'เปิดใช้' : 'ปิดใช้'}
    </span>
  );
}

function NamedRow({
  row,
  onRename,
  onToggle,
  extra,
}: {
  row: { id: string; name: string; is_active: boolean };
  onRename: (name: string) => Promise<void>;
  onToggle: () => Promise<void>;
  extra?: React.ReactNode;
}) {
  const [name, setName] = useState(row.name);
  const dirty = name.trim() !== row.name;

  return (
    <li className="flex flex-wrap items-center gap-2 py-2">
      <input
        className="input flex-1 min-w-[10rem]"
        value={name}
        aria-label={`ชื่อ ${row.name}`}
        onChange={(e) => setName(e.target.value)}
      />
      <ActiveBadge active={row.is_active} />
      {dirty && (
        <button type="button" className="btn-primary text-sm" onClick={() => onRename(name)}>
          บันทึก
        </button>
      )}
      <button type="button" className="btn-secondary text-sm" onClick={onToggle}>
        {row.is_active ? 'ปิดใช้' : 'เปิดใช้'}
      </button>
      {extra}
    </li>
  );
}

function AddByName({ label, onAdd }: { label: string; onAdd: (name: string) => Promise<boolean> }) {
  const [name, setName] = useState('');
  return (
    <form
      className="flex gap-2 mt-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (name.trim() && (await onAdd(name))) setName('');
      }}
    >
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={label} aria-label={label} />
      <button type="submit" className="btn-primary flex items-center gap-1 whitespace-nowrap disabled:opacity-50" disabled={!name.trim()}>
        <Plus className="w-4 h-4" /> เพิ่ม
      </button>
    </form>
  );
}

function OfferRowEditor({ offer, onSaved, onError }: { offer: OfferRow; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const [price, setPrice] = useState(offer.price);
  const [poNumber, setPoNumber] = useState(offer.po_number ?? '');
  const [deliveryNote, setDeliveryNote] = useState(offer.delivery_note_number ?? '');
  const [busy, setBusy] = useState(false);
  const dirty = price !== offer.price || poNumber !== (offer.po_number ?? '') || deliveryNote !== (offer.delivery_note_number ?? '');

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await onSaved();
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(() =>
      fetchJson(`/api/admin/direct-to-factory/offers/${offer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ price, po_number: poNumber, delivery_note_number: deliveryNote }),
      })
    );

  const toggle = () =>
    run(() =>
      fetchJson(`/api/admin/direct-to-factory/offers/${offer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !offer.is_active }),
      })
    );

  const uploadForm = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return run(() => fetchJson(`/api/admin/direct-to-factory/offers/${offer.id}/form`, { method: 'POST', body: formData }));
  };

  const label = `${offer.product_name} ตัวแทน ${offer.agent_name}`;

  return (
    <tr className={offer.is_active ? '' : 'bg-gray-50 text-gray-500'}>
      <td className="px-3 py-2 whitespace-nowrap">{offer.factory_name}</td>
      <td className="px-3 py-2 whitespace-nowrap">{offer.product_name}</td>
      <td className="px-3 py-2 whitespace-nowrap">{offer.agent_name}</td>
      <td className="px-3 py-2">
        <input className="input w-28 tabular-nums text-right" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} aria-label={`ราคา ${label}`} />
      </td>
      <td className="px-3 py-2">
        <input className="input w-32" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} aria-label={`เลข PO ${label}`} />
      </td>
      <td className="px-3 py-2">
        <input className="input w-32" value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} aria-label={`เลขใบนำส่ง ${label}`} />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {offer.form_file_name ? (
            <a
              href={`/api/admin/direct-to-factory/offers/${offer.id}/form`}
              className="flex items-center gap-1 text-green-700 hover:text-green-800 text-sm max-w-[10rem] truncate"
              title={offer.form_file_name}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">{offer.form_file_name}</span>
            </a>
          ) : (
            <span className="text-sm text-gray-500">ยังไม่มีไฟล์</span>
          )}
          <label className="btn-secondary text-sm cursor-pointer flex items-center gap-1 whitespace-nowrap">
            <Upload className="w-4 h-4" />
            {offer.form_file_name ? 'แทนที่' : 'อัปโหลด'}
            <input
              type="file"
              className="sr-only"
              accept={ORDER_FILE_ACCEPT}
              disabled={busy}
              aria-label={`ไฟล์แบบฟอร์ม ${label}`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) uploadForm(file);
              }}
            />
          </label>
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <ActiveBadge active={offer.is_active} />
          {dirty && (
            <button type="button" className="btn-primary text-sm disabled:opacity-50" disabled={busy} onClick={save}>
              บันทึก
            </button>
          )}
          <button type="button" className="btn-secondary text-sm disabled:opacity-50" disabled={busy} onClick={toggle}>
            {offer.is_active ? 'ปิดใช้' : 'เปิดใช้'}
          </button>
        </div>
      </td>
    </tr>
  );
}

const EMPTY_NEW_OFFER = { factory_name: '', product_name: '', agent_name: '', price: '', po_number: '', delivery_note_number: '' };

export default function SettingsClient() {
  const [factories, setFactories] = useState<FactoryRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [factoryFilter, setFactoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [newOffer, setNewOffer] = useState(EMPTY_NEW_OFFER);

  const reload = useCallback(async () => {
    try {
      const query = factoryFilter ? `?factory_id=${factoryFilter}` : '';
      const [f, a, o] = await Promise.all([
        fetchJson<FactoryRow[]>('/api/admin/direct-to-factory/factories'),
        fetchJson<AgentRow[]>('/api/admin/direct-to-factory/agents'),
        fetchJson<OfferRow[]>(`/api/admin/direct-to-factory/offers${query}`),
      ]);
      setFactories(f);
      setAgents(a);
      setOffers(o);
    } catch (error) {
      setNotice({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [factoryFilter]);

  useEffect(() => {
    reload();
  }, [reload]);

  const showError = (message: string) => setNotice({ type: 'error', text: message });

  const mutate = async (url: string, init: RequestInit, success: string): Promise<boolean> => {
    try {
      await fetchJson(url, init);
      setNotice({ type: 'success', text: success });
      await reload();
      return true;
    } catch (error) {
      showError((error as Error).message);
      return false;
    }
  };

  const runImport = async () => {
    if (!importFile) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const result = await fetchJson<{ created: number; updated: number }>('/api/admin/direct-to-factory/import', {
        method: 'POST',
        body: formData,
      });
      setNotice({ type: 'success', text: `นำเข้าสำเร็จ: เพิ่มใหม่ ${result.created} รายการ, อัปเดต ${result.updated} รายการ` });
      setImportFile(null);
      await reload();
    } catch (error) {
      const failure = error as Error & ApiError;
      setNotice({
        type: 'error',
        text: failure.message,
        details: failure.errors?.map((e) => `แถวที่ ${e.line}: ${e.message}`),
      });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="กำลังโหลด">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NoticeBox notice={notice} />

      <section className="card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-800">นำเข้าราคาจาก Excel / CSV</h2>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          คอลัมน์ที่ต้องมี: โรงงานปลายทาง, สินค้า, ชื่อตัวแทน, ราคาล่าสุด (เลข PO และเลขใบนำส่งใส่หรือไม่ก็ได้ ช่องว่างจะไม่ลบค่าเดิม)
          ถ้ามีแถวผิดแม้แถวเดียว ระบบจะไม่บันทึกทั้งไฟล์ ไฟล์ CSV ให้บันทึกเป็น &ldquo;CSV UTF-8&rdquo;
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.csv"
            aria-label="ไฟล์ราคา"
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-gray-700 hover:file:bg-gray-200"
            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
          />
          <button type="button" className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!importFile || importing} onClick={runImport}>
            <Upload className="w-4 h-4" />
            {importing ? 'กำลังนำเข้า...' : 'นำเข้า'}
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800">โรงงาน</h2>
          <ul className="divide-y divide-gray-100">
            {factories.map((factory) => (
              <NamedRow
                key={`${factory.id}-${factory.name}`}
                row={factory}
                onRename={async (name) => {
                  await mutate(`/api/admin/direct-to-factory/factories/${factory.id}`, { method: 'PATCH', body: JSON.stringify({ name }) }, 'บันทึกชื่อโรงงานแล้ว');
                }}
                onToggle={async () => {
                  await mutate(`/api/admin/direct-to-factory/factories/${factory.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !factory.is_active }) }, 'บันทึกแล้ว');
                }}
              />
            ))}
            {factories.length === 0 && <li className="py-3 text-sm text-gray-500">ยังไม่มีโรงงาน</li>}
          </ul>
          <AddByName
            label="ชื่อโรงงานใหม่"
            onAdd={(name) => mutate('/api/admin/direct-to-factory/factories', { method: 'POST', body: JSON.stringify({ name }) }, 'เพิ่มโรงงานแล้ว')}
          />
        </section>

        <section className="card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800">ตัวแทน</h2>
          <p className="text-sm text-gray-600">ถ้าราคาเท่ากัน ระบบเลือกตัวแทนที่อยู่ด้านบนก่อน</p>
          <ul className="divide-y divide-gray-100">
            {agents.map((agent, index) => (
              <NamedRow
                key={`${agent.id}-${agent.name}`}
                row={agent}
                onRename={async (name) => {
                  await mutate(`/api/admin/direct-to-factory/agents/${agent.id}`, { method: 'PATCH', body: JSON.stringify({ name }) }, 'บันทึกชื่อตัวแทนแล้ว');
                }}
                onToggle={async () => {
                  await mutate(`/api/admin/direct-to-factory/agents/${agent.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !agent.is_active }) }, 'บันทึกแล้ว');
                }}
                extra={
                  <span className="flex gap-1">
                    <button
                      type="button"
                      className="btn-secondary px-2 disabled:opacity-50"
                      disabled={index === 0}
                      aria-label={`เลื่อน ${agent.name} ขึ้น`}
                      onClick={() => mutate(`/api/admin/direct-to-factory/agents/${agent.id}`, { method: 'PATCH', body: JSON.stringify({ direction: 'up' }) }, 'จัดลำดับแล้ว')}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-secondary px-2 disabled:opacity-50"
                      disabled={index === agents.length - 1}
                      aria-label={`เลื่อน ${agent.name} ลง`}
                      onClick={() => mutate(`/api/admin/direct-to-factory/agents/${agent.id}`, { method: 'PATCH', body: JSON.stringify({ direction: 'down' }) }, 'จัดลำดับแล้ว')}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </span>
                }
              />
            ))}
            {agents.length === 0 && <li className="py-3 text-sm text-gray-500">ยังไม่มีตัวแทน</li>}
          </ul>
          <AddByName
            label="ชื่อตัวแทนใหม่"
            onAdd={(name) => mutate('/api/admin/direct-to-factory/agents', { method: 'POST', body: JSON.stringify({ name }) }, 'เพิ่มตัวแทนแล้ว')}
          />
        </section>
      </div>

      <section className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">สินค้าและราคาของตัวแทน</h2>
          <label className="text-sm text-gray-700">
            <span className="block mb-1">กรองตามโรงงาน</span>
            <select className="input" value={factoryFilter} onChange={(e) => setFactoryFilter(e.target.value)}>
              <option value="">ทุกโรงงาน</option>
              {factories.map((factory) => (
                <option key={factory.id} value={factory.id}>
                  {factory.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-medium">โรงงาน</th>
                <th className="px-3 py-2 text-left font-medium">สินค้า</th>
                <th className="px-3 py-2 text-left font-medium">ตัวแทน</th>
                <th className="px-3 py-2 text-right font-medium">ราคาล่าสุด</th>
                <th className="px-3 py-2 text-left font-medium">เลข PO</th>
                <th className="px-3 py-2 text-left font-medium">เลขใบนำส่ง</th>
                <th className="px-3 py-2 text-left font-medium">ไฟล์แบบฟอร์ม</th>
                <th className="px-3 py-2 text-left font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {offers.map((offer) => (
                <OfferRowEditor key={`${offer.id}-${offer.updated_at}`} offer={offer} onSaved={reload} onError={showError} />
              ))}
              {offers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                    ยังไม่มีข้อมูล นำเข้าจากไฟล์หรือเพิ่มด้านล่าง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form
          className="mt-6 border-t border-gray-100 pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await mutate('/api/admin/direct-to-factory/offers', { method: 'POST', body: JSON.stringify(newOffer) }, 'บันทึกข้อเสนอแล้ว');
            if (ok) setNewOffer(EMPTY_NEW_OFFER);
          }}
        >
          <h3 className="font-medium text-gray-800 mb-3">เพิ่มข้อเสนอทีละรายการ</h3>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(
              [
                ['factory_name', 'โรงงาน', 'factory-options'],
                ['product_name', 'สินค้า', undefined],
                ['agent_name', 'ตัวแทน', 'agent-options'],
                ['price', 'ราคาล่าสุด', undefined],
                ['po_number', 'เลข PO', undefined],
                ['delivery_note_number', 'เลขใบนำส่ง', undefined],
              ] as const
            ).map(([field, label, list]) => (
              <label key={field} className="text-sm text-gray-700">
                <span className="block mb-1">{label}</span>
                <input
                  className="input"
                  list={list}
                  inputMode={field === 'price' ? 'decimal' : undefined}
                  required={field !== 'po_number' && field !== 'delivery_note_number'}
                  value={newOffer[field]}
                  onChange={(e) => setNewOffer({ ...newOffer, [field]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <datalist id="factory-options">
            {factories.map((factory) => (
              <option key={factory.id} value={factory.name} />
            ))}
          </datalist>
          <datalist id="agent-options">
            {agents.map((agent) => (
              <option key={agent.id} value={agent.name} />
            ))}
          </datalist>
          <button type="submit" className="btn-primary mt-3 flex items-center gap-1">
            <Plus className="w-4 h-4" /> บันทึกข้อเสนอ
          </button>
        </form>
      </section>
    </div>
  );
}
