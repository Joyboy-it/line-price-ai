'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Download, Pencil, Plus, Upload, X } from 'lucide-react';
import { OFFERS_CHANGED_EVENT } from '@/app/admin/direct-to-factory/DirectToFactoryTabs';
import { fetchJson } from '@/lib/direct-to-factory/fetch-json';
import { formatThaiDateTime } from '@/lib/direct-to-factory/format';
import { ORDER_FILE_ACCEPT } from '@/lib/direct-to-factory/files-accept';
import type { AgentRow, FactoryFormRow, FactoryRow, OfferRow } from '@/lib/direct-to-factory/queries';
import { isPrice, offerPriceFromParts, sanitizePriceInput } from '@/lib/direct-to-factory/validation';

type Notice = { type: 'success' | 'error'; text: string; details?: string[] } | null;

const iconButton =
  'inline-flex items-center justify-center h-11 w-11 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const textButton =
  'inline-flex items-center justify-center h-11 px-3 rounded-lg text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer';

function formatMoney(value: string | number): string {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '—';
}

function latestPrice(factoryPrice: string, markup: string, deduction: string): number | null {
  if (![factoryPrice, markup, deduction].every((value) => isPrice(value))) return null;
  return offerPriceFromParts(Number(factoryPrice), Number(markup), Number(deduction));
}

function NoticeBox({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  useEffect(() => {
    if (!notice || notice.type !== 'success') return;
    const timer = window.setTimeout(onClose, 2500);
    return () => window.clearTimeout(timer);
  }, [notice, onClose]);

  if (!notice) return null;
  const styles = notice.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200';
  return (
    <div className="fixed top-4 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none">
      <div role={notice.type === 'error' ? 'alert' : 'status'} className={`pointer-events-auto w-full max-w-md border rounded-xl shadow-lg px-4 py-3 text-sm ${styles}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="pt-2">{notice.text}</p>
          <button
            type="button"
            className="shrink-0 min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg hover:bg-white/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            aria-label="ปิด"
            onClick={onClose}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {notice.details && notice.details.length > 0 && (
          <ul className="mt-2 list-disc pl-5 space-y-1 max-h-48 overflow-y-auto">
            {notice.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NamedRow({
  row,
  onRename,
  onToggle,
  extra,
}: {
  row: { id: string; name: string; is_active: boolean; updated_at: string };
  onRename: (name: string) => Promise<void>;
  onToggle: () => Promise<void>;
  extra?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);

  if (editing) {
    return (
      <li>
        <form
          className="flex items-center gap-2 py-1"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim() || name.trim() === row.name) {
              setEditing(false);
              return;
            }
            await onRename(name);
            setEditing(false);
          }}
        >
          <input className="input min-w-0" value={name} aria-label={`ชื่อ ${row.name}`} autoFocus onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="btn-primary text-sm shrink-0 disabled:opacity-50" disabled={!name.trim()}>
            บันทึก
          </button>
          <button
            type="button"
            className="btn-secondary text-sm shrink-0"
            onClick={() => {
              setName(row.name);
              setEditing(false);
            }}
          >
            ยกเลิก
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-1 py-0.5 min-w-0">
      <span className={`flex-1 min-w-0 truncate text-sm ${row.is_active ? 'text-gray-900' : 'text-gray-500'}`}>{row.name}</span>
      <time dateTime={row.updated_at} className="shrink-0 text-xs text-gray-500 whitespace-nowrap">
        {formatThaiDateTime(row.updated_at)}
      </time>
      {!row.is_active && <span className="text-xs text-gray-500 shrink-0">ปิดใช้</span>}
      <button type="button" className={iconButton} aria-label={`แก้ชื่อ ${row.name}`} onClick={() => setEditing(true)}>
        <Pencil className="w-4 h-4" />
      </button>
      <button type="button" className={textButton} aria-label={row.is_active ? `ปิดใช้ ${row.name}` : `เปิดใช้ ${row.name}`} onClick={onToggle}>
        {row.is_active ? 'ปิดใช้' : 'เปิดใช้'}
      </button>
      {extra}
    </li>
  );
}

function FormRow({
  form,
  onRename,
  onToggle,
  onReplaceFile,
}: {
  form: FactoryFormRow;
  onRename: (name: string) => Promise<boolean>;
  onToggle: () => Promise<void>;
  onReplaceFile: (file: File) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(form.name);

  if (editing) {
    return (
      <li className="py-2">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (name.trim() && (await onRename(name.trim()))) setEditing(false);
          }}
        >
          <input className="input min-w-0 flex-1" value={name} aria-label={`ชื่อ ${form.name}`} autoFocus onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="btn-primary text-sm shrink-0 disabled:opacity-50" disabled={!name.trim()}>บันทึก</button>
          <button type="button" className="btn-secondary text-sm shrink-0" onClick={() => { setName(form.name); setEditing(false); }}>ยกเลิก</button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-2 py-2">
      <span className={`flex-1 min-w-0 text-sm ${form.is_active ? 'text-gray-900' : 'text-gray-500'}`}>{form.name}</span>
      <a href={`/api/admin/direct-to-factory/forms/${form.id}`} className="text-sm text-green-700 hover:text-green-800 truncate max-w-48">
        {form.file_name}
      </a>
      <button type="button" className={iconButton} aria-label={`แก้ชื่อ ${form.name}`} onClick={() => setEditing(true)}>
        <Pencil className="w-4 h-4" />
      </button>
      <label className="btn-secondary text-sm cursor-pointer min-h-11 inline-flex items-center">
        เปลี่ยนไฟล์
        <input
          type="file"
          className="sr-only"
          accept={ORDER_FILE_ACCEPT}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) await onReplaceFile(file);
          }}
        />
      </label>
      <button type="button" className={textButton} onClick={() => { void onToggle(); }}>
        {form.is_active ? 'ปิดใช้' : 'เปิดใช้'}
      </button>
    </li>
  );
}

function AddByName({ label, onAdd }: { label: string; onAdd: (name: string) => Promise<boolean> }) {
  const [name, setName] = useState('');
  return (
    <form
      className="flex gap-2 mt-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (name.trim() && (await onAdd(name))) setName('');
      }}
    >
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={label} aria-label={label} />
      <button type="submit" className="btn-primary flex items-center gap-1 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed" disabled={!name.trim()}>
        <Plus className="w-4 h-4" /> เพิ่ม
      </button>
    </form>
  );
}

function OfferRowEditor({
  offer,
  forms,
  expandAll,
  onSaved,
  onError,
}: {
  offer: OfferRow;
  forms: FactoryFormRow[];
  expandAll: { open: boolean; tick: number };
  onSaved: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [factoryPrice, setFactoryPrice] = useState(offer.factory_price);
  const [markup, setMarkup] = useState(offer.price_markup);
  const [deduction, setDeduction] = useState(offer.profit_deduction);
  const [oldPrice, setOldPrice] = useState(offer.old_price ?? '');
  const [poNumber, setPoNumber] = useState(offer.po_number ?? '');
  const [deliveryNote, setDeliveryNote] = useState(offer.delivery_note_number ?? '');
  const [active, setActive] = useState(offer.is_active);
  const [selectedFormId, setSelectedFormId] = useState(offer.form_id ?? '');
  const [detailsOpen, setDetailsOpen] = useState(expandAll.open);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDetailsOpen(expandAll.open);
  }, [expandAll]);

  const label = `${offer.product_name} ตัวแทน ${offer.agent_name}`;
  const computed = latestPrice(factoryPrice, markup, deduction);
  const dirty =
    factoryPrice !== offer.factory_price ||
    markup !== offer.price_markup ||
    deduction !== offer.profit_deduction ||
    oldPrice !== (offer.old_price ?? '') ||
    poNumber !== (offer.po_number ?? '') ||
    deliveryNote !== (offer.delivery_note_number ?? '') ||
    active !== offer.is_active ||
    selectedFormId !== (offer.form_id ?? '');
  const oldPriceValid = oldPrice === '' || isPrice(oldPrice);

  const cancel = () => {
    setFactoryPrice(offer.factory_price);
    setMarkup(offer.price_markup);
    setDeduction(offer.profit_deduction);
    setOldPrice(offer.old_price ?? '');
    setPoNumber(offer.po_number ?? '');
    setDeliveryNote(offer.delivery_note_number ?? '');
    setActive(offer.is_active);
    setSelectedFormId(offer.form_id ?? '');
    setEditing(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      const fieldsChanged =
        factoryPrice !== offer.factory_price ||
        markup !== offer.price_markup ||
        deduction !== offer.profit_deduction ||
        oldPrice !== (offer.old_price ?? '') ||
        poNumber !== (offer.po_number ?? '') ||
        deliveryNote !== (offer.delivery_note_number ?? '') ||
        active !== offer.is_active ||
        selectedFormId !== (offer.form_id ?? '');
      if (fieldsChanged) {
        await fetchJson(`/api/admin/direct-to-factory/offers/${offer.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            factory_price: factoryPrice,
            price_markup: markup,
            profit_deduction: deduction,
            old_price: oldPrice,
            po_number: poNumber,
            delivery_note_number: deliveryNote,
            is_active: active,
            form_id: selectedFormId || null,
          }),
        });
      }
      setEditing(false);
      await onSaved();
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const formId = `offer-edit-${offer.id}`;
  const cell = 'px-3 py-2 align-middle';
  const field = 'input py-1 px-2';

  if (editing) {
    return (
      <>
      <tr className="bg-gray-50">
        <td className={cell} />
        <td className={cell}>
          {offer.factory_name}
          <form
            id={formId}
            onSubmit={(e) => {
              e.preventDefault();
              if (dirty && computed !== null && oldPriceValid) save();
            }}
          />
        </td>
        <td className={cell}>{offer.product_name}</td>
        <td className={`${cell} whitespace-nowrap`}>{offer.agent_name}</td>
        <td className={cell}>
          <input form={formId} className={`${field} tabular-nums text-right`} inputMode="decimal" value={factoryPrice} aria-label={`ราคาโรงงาน ${label}`} onChange={(e) => setFactoryPrice(sanitizePriceInput(e.target.value))} />
        </td>
        <td className={cell}>
          <input form={formId} className={`${field} tabular-nums text-right`} inputMode="decimal" value={markup} aria-label={`ราคาบวกเพิ่ม ${label}`} onChange={(e) => setMarkup(sanitizePriceInput(e.target.value))} />
        </td>
        <td className={cell}>
          <input form={formId} className={`${field} tabular-nums text-right`} inputMode="decimal" value={deduction} aria-label={`หักส่วนต่างกำไร ${label}`} onChange={(e) => setDeduction(sanitizePriceInput(e.target.value))} />
        </td>
        <td className={`${cell} text-right tabular-nums whitespace-nowrap`}>
          {!isPrice(factoryPrice) || !isPrice(markup) || !isPrice(deduction) ? '—' : computed === null ? (
            <span className="text-xs text-red-700">หักส่วนต่างมากกว่าราคาโรงงานบวกเพิ่ม</span>
          ) : formatMoney(computed)}
        </td>
        <td className={cell}>
          <input form={formId} className={`${field} tabular-nums text-right`} inputMode="decimal" value={oldPrice} aria-label={`ราคาเก่า ${label}`} onChange={(e) => setOldPrice(sanitizePriceInput(e.target.value))} />
        </td>
        <td className={cell}>
          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-gray-700 min-h-11">
            <input form={formId} type="checkbox" className="h-4 w-4 accent-green-600" checked={active} onChange={(e) => setActive(e.target.checked)} />
            เปิดใช้
          </label>
        </td>
        <td className={`${cell} whitespace-nowrap text-gray-600`}>
          <time dateTime={offer.updated_at}>{formatThaiDateTime(offer.updated_at)}</time>
        </td>
        <td className={`${cell} whitespace-nowrap`}>
          <button type="submit" form={formId} className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled={busy || !dirty || computed === null || !oldPriceValid}>
            {busy ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <button type="button" className="btn-secondary text-sm ml-2" disabled={busy} onClick={cancel}>
            ยกเลิก
          </button>
        </td>
      </tr>
      <tr className="bg-gray-50">
        <td colSpan={12} className="px-3 py-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="text-sm text-gray-700">
              <span className="mb-1 block">เลข PO</span>
              <input form={formId} className={field} value={poNumber} aria-label={`เลข PO ${label}`} onChange={(e) => setPoNumber(e.target.value)} />
            </label>
            <label className="text-sm text-gray-700">
              <span className="mb-1 block">เลขใบนำส่ง</span>
              <input form={formId} className={field} value={deliveryNote} aria-label={`เลขใบนำส่ง ${label}`} onChange={(e) => setDeliveryNote(e.target.value)} />
            </label>
            <label className="text-sm text-gray-700">
              <span className="mb-1 block">แบบฟอร์ม</span>
              <select form={formId} className={field} aria-label={`แบบฟอร์ม ${label}`} value={selectedFormId} onChange={(e) => setSelectedFormId(e.target.value)}>
                <option value="">ไม่ระบุ</option>
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>{form.name}{form.is_active ? '' : ' (ปิดใช้)'}</option>
                ))}
              </select>
            </label>
          </div>
        </td>
      </tr>
    </>
    );
  }

  return (
    <>
    <tr className={`hover:bg-gray-50 ${offer.is_active ? '' : 'text-gray-500'}`}>
      <td className={`${cell} whitespace-nowrap`}>
        <button
          type="button"
          className={iconButton}
          aria-expanded={detailsOpen}
          aria-label={detailsOpen ? `หุบรายละเอียด ${label}` : `ขยายรายละเอียด ${label}`}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          {detailsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </td>
      <td className={cell}>{offer.factory_name}</td>
      <td className={cell}>{offer.product_name}</td>
      <td className={`${cell} whitespace-nowrap`}>{offer.agent_name}</td>
      <td className={`${cell} text-right tabular-nums whitespace-nowrap`}>{formatMoney(offer.factory_price)}</td>
      <td className={`${cell} text-right tabular-nums whitespace-nowrap`}>{formatMoney(offer.price_markup)}</td>
      <td className={`${cell} text-right tabular-nums whitespace-nowrap`}>{formatMoney(offer.profit_deduction)}</td>
      <td className={`${cell} text-right tabular-nums whitespace-nowrap`}>{formatMoney(offer.price)}</td>
      <td className={`${cell} text-right tabular-nums whitespace-nowrap`}>{offer.old_price ? formatMoney(offer.old_price) : '—'}</td>
      <td className={`${cell} whitespace-nowrap`}>{offer.is_active ? 'เปิดใช้' : 'ปิดใช้'}</td>
      <td className={`${cell} whitespace-nowrap text-gray-600`}>
        <time dateTime={offer.updated_at}>{formatThaiDateTime(offer.updated_at)}</time>
      </td>
      <td className={`${cell} whitespace-nowrap`}>
        <button type="button" className={iconButton} aria-label={`แก้ไข ${label}`} onClick={() => { setDetailsOpen(true); setEditing(true); }}>
          <Pencil className="w-4 h-4" />
        </button>
      </td>
    </tr>
    {detailsOpen && (
      <tr className={offer.is_active ? 'bg-gray-50' : 'bg-gray-50 text-gray-500'}>
        <td colSpan={12} className="px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span>เลข PO <span className="text-gray-900">{offer.po_number || '—'}</span></span>
            <span>เลขใบนำส่ง <span className="text-gray-900">{offer.delivery_note_number || '—'}</span></span>
            <span className="inline-flex items-center gap-1">
              แบบฟอร์ม
              {offer.form_id && offer.form_name ? (
                <a
                  href={`/api/admin/direct-to-factory/forms/${offer.form_id}`}
                  className="inline-flex items-center gap-1 text-green-700 hover:text-green-800"
                  aria-label={`ดาวน์โหลด ${offer.form_name}`}
                >
                  <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{offer.form_name}</span>
                </a>
              ) : (
                '—'
              )}
            </span>
          </div>
        </td>
      </tr>
    )}
    </>
  );
}

const EMPTY_NEW_OFFER = { factory_name: '', product_name: '', agent_name: '', factory_price: '', price_markup: '', profit_deduction: '', old_price: '', po_number: '', delivery_note_number: '' };

const SETTINGS_TABS = [
  { id: 'factories', label: 'โรงงาน' },
  { id: 'agents', label: 'ตัวแทน' },
  { id: 'forms', label: 'แบบฟอร์ม' },
  { id: 'offers', label: 'สินค้าและราคา' },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]['id'];

export default function SettingsClient() {
  const [factories, setFactories] = useState<FactoryRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [forms, setForms] = useState<FactoryFormRow[]>([]);
  const [newFormName, setNewFormName] = useState('');
  const [newFormFile, setNewFormFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [factoryFilter, setFactoryFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [newOffer, setNewOffer] = useState(EMPTY_NEW_OFFER);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('offers');
  const [expandAll, setExpandAll] = useState({ open: false, tick: 0 });

  const reload = useCallback(async () => {
    try {
      const [f, a, o, formRows] = await Promise.all([
        fetchJson<FactoryRow[]>('/api/admin/direct-to-factory/factories'),
        fetchJson<AgentRow[]>('/api/admin/direct-to-factory/agents'),
        fetchJson<OfferRow[]>('/api/admin/direct-to-factory/offers'),
        fetchJson<FactoryFormRow[]>('/api/admin/direct-to-factory/forms'),
      ]);
      setFactories(f);
      setAgents(a);
      setOffers(o);
      setForms(formRows);
    } catch (error) {
      setNotice({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const onOffersChanged = () => {
      void reload();
    };
    window.addEventListener(OFFERS_CHANGED_EVENT, onOffersChanged);
    return () => window.removeEventListener(OFFERS_CHANGED_EVENT, onOffersChanged);
  }, [reload]);

  const showError = (message: string) => setNotice({ type: 'error', text: message });
  const dismissNotice = useCallback(() => setNotice(null), []);

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

  if (loading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="กำลังโหลด">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
      </div>
    );
  }

  const needle = search.trim().toLowerCase();
  const factoryOrder = new Map(factories.map((factory, index) => [factory.id, index]));
  const productOptions = [...offers.reduce((names, offer) => {
    if (factoryFilter && offer.factory_id !== factoryFilter) return names;
    names.add(offer.product_name);
    return names;
  }, new Set<string>())].sort((a, b) => a.localeCompare(b, 'th'));
  const filteredOffers = offers.filter((offer) => {
    if (factoryFilter && offer.factory_id !== factoryFilter) return false;
    if (productFilter && offer.product_name !== productFilter) return false;
    if (agentFilter && offer.agent_id !== agentFilter) return false;
    if (statusFilter === 'active' && !offer.is_active) return false;
    if (statusFilter === 'inactive' && offer.is_active) return false;
    if (!needle) return true;
    return [offer.factory_name, offer.product_name, offer.agent_name, offer.price, offer.po_number, offer.delivery_note_number]
      .join(' ')
      .toLowerCase()
      .includes(needle);
  }).sort((a, b) => {
    const byFactory = (factoryOrder.get(a.factory_id) ?? Number.MAX_SAFE_INTEGER) - (factoryOrder.get(b.factory_id) ?? Number.MAX_SAFE_INTEGER);
    if (byFactory !== 0) return byFactory;
    const byProduct = a.product_name.localeCompare(b.product_name, 'th');
    if (byProduct !== 0) return byProduct;
    const byPrice = Number(b.price) - Number(a.price);
    if (byPrice !== 0) return byPrice;
    return a.sheet_order - b.sheet_order;
  });
  const filtersActive = Boolean(needle || factoryFilter || productFilter || agentFilter || statusFilter);
  const clearFilters = () => {
    setSearch('');
    setFactoryFilter('');
    setProductFilter('');
    setAgentFilter('');
    setStatusFilter('');
  };
  const selectFactory = (factoryId: string) => {
    setFactoryFilter(factoryId);
    setProductFilter((current) => (
      current && offers.some((offer) => offer.product_name === current && (!factoryId || offer.factory_id === factoryId))
        ? current
        : ''
    ));
  };

  return (
    <div className="space-y-4">
      <NoticeBox notice={notice} onClose={dismissNotice} />

      <nav aria-label="ตั้งค่าพื้นฐาน" className="flex flex-wrap gap-2 border-b border-gray-200">
        {SETTINGS_TABS.map((item) => {
          const selected = settingsTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={selected ? 'page' : undefined}
              className={`shrink-0 min-h-11 px-4 py-2 -mb-px border-b-2 text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${selected ? 'border-green-500 text-green-700' : 'border-transparent text-gray-600 hover:text-green-600'}`}
              onClick={() => setSettingsTab(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {settingsTab === 'factories' && (
        <section className="card p-4">
          <h2 className="text-base font-semibold text-gray-800">โรงงาน</h2>
          <ul>
            {factories.map((factory) => (
              <NamedRow
                key={`${factory.id}-${factory.name}`}
                row={factory}
                onRename={async (name) => {
                  await mutate(`/api/admin/direct-to-factory/factories/${factory.id}`, { method: 'PATCH', body: JSON.stringify({ name }) }, 'บันทึกชื่อโรงงานแล้ว');
                }}
                onToggle={async () => {
                  await mutate(
                    `/api/admin/direct-to-factory/factories/${factory.id}`,
                    { method: 'PATCH', body: JSON.stringify({ is_active: !factory.is_active }) },
                    'บันทึกแล้ว'
                  );
                }}
              />
            ))}
            {factories.length === 0 && <li className="py-2 text-sm text-gray-500">ยังไม่มีโรงงาน</li>}
          </ul>
          <AddByName
            label="ชื่อโรงงานใหม่"
            onAdd={(name) => mutate('/api/admin/direct-to-factory/factories', { method: 'POST', body: JSON.stringify({ name }) }, 'เพิ่มโรงงานแล้ว')}
          />
        </section>
      )}

      {settingsTab === 'agents' && (
        <section className="card p-4">
          <h2 className="text-base font-semibold text-gray-800">ตัวแทน</h2>
          <ul>
            {agents.map((agent) => (
              <NamedRow
                key={`${agent.id}-${agent.name}`}
                row={agent}
                onRename={async (name) => {
                  await mutate(`/api/admin/direct-to-factory/agents/${agent.id}`, { method: 'PATCH', body: JSON.stringify({ name }) }, 'บันทึกชื่อตัวแทนแล้ว');
                }}
                onToggle={async () => {
                  await mutate(
                    `/api/admin/direct-to-factory/agents/${agent.id}`,
                    { method: 'PATCH', body: JSON.stringify({ is_active: !agent.is_active }) },
                    'บันทึกแล้ว'
                  );
                }}
              />
            ))}
            {agents.length === 0 && <li className="py-2 text-sm text-gray-500">ยังไม่มีตัวแทน</li>}
          </ul>
          <AddByName
            label="ชื่อตัวแทนใหม่"
            onAdd={(name) => mutate('/api/admin/direct-to-factory/agents', { method: 'POST', body: JSON.stringify({ name }) }, 'เพิ่มตัวแทนแล้ว')}
          />
        </section>
      )}

      {settingsTab === 'forms' && (
        <section className="card p-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">แบบฟอร์ม</h2>
          <p className="text-sm text-gray-600">อัปโหลดครั้งเดียว แล้วเลือกชื่อนี้ในหลายแถวราคา</p>
          <ul className="divide-y divide-gray-100">
            {forms.map((form) => (
              <FormRow
                key={`${form.id}-${form.name}`}
                form={form}
                onRename={(name) => mutate(`/api/admin/direct-to-factory/forms/${form.id}`, { method: 'PATCH', body: JSON.stringify({ name }) }, 'บันทึกชื่อแบบฟอร์มแล้ว')}
                onToggle={async () => {
                  await mutate(`/api/admin/direct-to-factory/forms/${form.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !form.is_active }) }, 'บันทึกแล้ว');
                }}
                onReplaceFile={async (file) => {
                  const body = new FormData();
                  body.append('file', file);
                  const ok = await mutate(`/api/admin/direct-to-factory/forms/${form.id}/file`, { method: 'POST', body }, 'เปลี่ยนไฟล์แล้ว');
                  if (ok) await reload();
                }}
              />
            ))}
            {forms.length === 0 && <li className="py-2 text-sm text-gray-500">ยังไม่มีแบบฟอร์ม</li>}
          </ul>
          <form
            className="border-t border-gray-100 pt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newFormName.trim() || !newFormFile) return;
              const body = new FormData();
              body.append('name', newFormName.trim());
              body.append('file', newFormFile);
              const ok = await mutate('/api/admin/direct-to-factory/forms', { method: 'POST', body }, 'เพิ่มแบบฟอร์มแล้ว');
              if (ok) {
                setNewFormName('');
                setNewFormFile(null);
              }
            }}
          >
            <label className="text-sm text-gray-700 min-w-0">
              <span className="block mb-1">ชื่อเรียก</span>
              <input className="input" value={newFormName} onChange={(e) => setNewFormName(e.target.value)} placeholder="เช่น ฟอร์มโรงงาน A" aria-label="ชื่อแบบฟอร์ม" />
            </label>
            <label className="btn-secondary min-h-11 inline-flex items-center gap-2 cursor-pointer max-w-full">
              <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{newFormFile ? newFormFile.name : 'เลือกไฟล์'}</span>
              <input
                key={newFormFile ? newFormFile.name : 'empty'}
                type="file"
                className="sr-only"
                accept={ORDER_FILE_ACCEPT}
                aria-label="ไฟล์แบบฟอร์ม"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setNewFormFile(file);
                  if (file && !newFormName.trim()) {
                    setNewFormName(file.name.replace(/\.[^.]+$/, ''));
                  }
                }}
              />
            </label>
            <button type="submit" className="btn-primary min-h-11 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!newFormName.trim() || !newFormFile}>
              เพิ่มแบบฟอร์ม
            </button>
          </form>
        </section>
      )}

      {settingsTab === 'offers' && (
      <section className="card overflow-hidden">
        <div className="space-y-3 border-b border-gray-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-800">
              สินค้าและราคา{' '}
              <span className="font-normal text-sm text-gray-600">
                {filteredOffers.length === offers.length ? `${offers.length} รายการ` : `${filteredOffers.length} จาก ${offers.length} รายการ`}
              </span>
            </h2>
            {filtersActive && (
              <button type="button" className="btn-secondary text-sm" onClick={clearFilters}>
                ล้างตัวกรอง
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <label className="text-sm text-gray-700 sm:col-span-2">
              <span className="mb-1 block">ค้นหา</span>
              <input
                className="input"
                type="search"
                value={search}
                placeholder="โรงงาน สินค้า ตัวแทน ราคา เลข PO ใบนำส่ง"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="text-sm text-gray-700">
              <span className="mb-1 block">โรงงาน</span>
              <select className="input" value={factoryFilter} onChange={(event) => selectFactory(event.target.value)}>
                <option value="">ทั้งหมด</option>
                {factories.map((factory) => (
                  <option key={factory.id} value={factory.id}>
                    {factory.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-700">
              <span className="mb-1 block">สินค้า</span>
              <select className="input" value={productFilter} onChange={(event) => setProductFilter(event.target.value)}>
                <option value="">ทั้งหมด</option>
                {productOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-700">
              <span className="mb-1 block">ตัวแทน</span>
              <select className="input" value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)}>
                <option value="">ทั้งหมด</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-700">
              <span className="mb-1 block">สถานะ</span>
              <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">ทั้งหมด</option>
                <option value="active">เปิดใช้</option>
                <option value="inactive">ปิดใช้</option>
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                  <button
                    type="button"
                    className={iconButton}
                    aria-expanded={expandAll.open}
                    aria-label={expandAll.open ? 'หุบทั้งหมด' : 'เปิดทั้งหมด'}
                    onClick={() => setExpandAll((current) => ({ open: !current.open, tick: current.tick + 1 }))}
                  >
                    {expandAll.open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">โรงงาน</th>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">สินค้า</th>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">ตัวแทน</th>
                <th className="px-3 py-2 text-right font-medium whitespace-nowrap">ราคาโรงงาน</th>
                <th className="px-3 py-2 text-right font-medium whitespace-nowrap">ราคาบวกเพิ่ม</th>
                <th className="px-3 py-2 text-right font-medium whitespace-nowrap">หักส่วนต่างกำไร</th>
                <th className="px-3 py-2 text-right font-medium whitespace-nowrap">ราคาล่าสุด</th>
                <th className="px-3 py-2 text-right font-medium whitespace-nowrap">ราคาเก่า</th>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">สถานะ</th>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">อัปเดตล่าสุด</th>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                  <span className="sr-only">จัดการ</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOffers.map((offer) => (
                <OfferRowEditor key={`${offer.id}-${offer.updated_at}`} offer={offer} forms={forms} expandAll={expandAll} onSaved={reload} onError={showError} />
              ))}
              {filteredOffers.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center text-gray-500">
                    {offers.length === 0 ? 'ยังไม่มีข้อมูล นำเข้าจากไฟล์หรือเพิ่มด้านล่าง' : 'ไม่พบรายการที่ตรงกับตัวกรอง'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <details className="border-t border-gray-100 p-4" {...(offers.length === 0 ? { open: true } : {})}>
          <summary className="cursor-pointer text-sm font-medium text-gray-800 w-fit">เพิ่มข้อเสนอทีละรายการ</summary>
          <form
            className="mt-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await mutate('/api/admin/direct-to-factory/offers', { method: 'POST', body: JSON.stringify(newOffer) }, 'บันทึกข้อเสนอแล้ว');
              if (ok) setNewOffer(EMPTY_NEW_OFFER);
            }}
          >
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  ['factory_name', 'โรงงาน', 'factory-options'],
                  ['product_name', 'สินค้า', undefined],
                  ['agent_name', 'ตัวแทน', 'agent-options'],
                  ['factory_price', 'ราคาโรงงาน', undefined],
                  ['price_markup', 'ราคาบวกเพิ่ม', undefined],
                  ['profit_deduction', 'หักส่วนต่างกำไร', undefined],
                  ['po_number', 'เลข PO', undefined],
                  ['delivery_note_number', 'เลขใบนำส่ง', undefined],
                ] as const
              ).map(([field, label, list]) => (
                <label key={field} className="text-sm text-gray-700">
                  <span className="block mb-1">{label}</span>
                  <input
                    className="input"
                    list={list}
                    inputMode={field === 'factory_price' || field === 'price_markup' || field === 'profit_deduction' ? 'decimal' : undefined}
                    required={field !== 'po_number' && field !== 'delivery_note_number'}
                    value={newOffer[field]}
                    onChange={(e) =>
                      setNewOffer({
                        ...newOffer,
                        [field]: field === 'factory_price' || field === 'price_markup' || field === 'profit_deduction' ? sanitizePriceInput(e.target.value) : e.target.value,
                      })
                    }
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
            <p className="mt-3 text-sm tabular-nums text-gray-700">
              {(() => {
                const ready = [newOffer.factory_price, newOffer.price_markup, newOffer.profit_deduction].every((value) => isPrice(value));
                const latest = latestPrice(newOffer.factory_price, newOffer.price_markup, newOffer.profit_deduction);
                if (!ready) return 'ราคาล่าสุด —';
                if (latest === null) return <span className="text-red-700">หักส่วนต่างมากกว่าราคาโรงงานบวกเพิ่ม</span>;
                return `ราคาล่าสุด ${formatMoney(latest)}`;
              })()}
            </p>
            <label className="mt-3 block max-w-xs text-sm text-gray-700">
              <span className="mb-1 block">ราคาเก่า</span>
              <input
                className="input tabular-nums text-right"
                inputMode="decimal"
                value={newOffer.old_price}
                onChange={(e) => setNewOffer({ ...newOffer, old_price: sanitizePriceInput(e.target.value) })}
              />
            </label>
            <button type="submit" className="btn-primary mt-3 flex items-center gap-1">
              <Plus className="w-4 h-4" /> บันทึกข้อเสนอ
            </button>
          </form>
        </details>
      </section>
      )}
    </div>
  );
}
