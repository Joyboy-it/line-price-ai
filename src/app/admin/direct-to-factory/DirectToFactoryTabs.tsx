'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, Download, Settings2, Upload, X } from 'lucide-react';
import { fetchJson, type ApiError } from '@/lib/direct-to-factory/fetch-json';

const tabs = [
  { href: '/admin/direct-to-factory', label: 'ตารางออเดอร์', icon: ClipboardList },
  { href: '/admin/direct-to-factory/settings', label: 'ตั้งค่าพื้นฐาน', icon: Settings2 },
];

type Notice = { type: 'success' | 'error'; text: string; details?: string[] } | null;

export const OFFERS_CHANGED_EVENT = 'direct-to-factory-offers-changed';

export default function DirectToFactoryTabs() {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith('/admin/direct-to-factory/settings');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importKey, setImportKey] = useState(0);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    if (!notice || notice.type !== 'success') return;
    const timer = window.setTimeout(dismissNotice, 2500);
    return () => window.clearTimeout(timer);
  }, [notice, dismissNotice]);

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
      setImportKey((key) => key + 1);
      window.dispatchEvent(new Event(OFFERS_CHANGED_EVENT));
    } catch (error) {
      const failure = error as Error & ApiError;
      setNotice({
        type: 'error',
        text: failure.message,
        details: failure.errors?.map((item) => `แถวที่ ${item.line}: ${item.message}`),
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gray-200">
        <nav className="flex gap-2" aria-label="เมนูส่งตรงเข้าโรงงาน">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = href.endsWith('/settings') ? settingsActive : !settingsActive;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 px-4 py-3 -mb-px border-b-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-green-500 text-green-700'
                    : 'border-transparent text-gray-600 hover:text-green-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {settingsActive && (
          <div className="flex flex-wrap items-center gap-2 py-2 ml-auto">
            <label className="btn-secondary flex items-center gap-2 cursor-pointer max-w-full">
              <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">{importFile ? importFile.name : 'เลือกไฟล์'}</span>
              <input
                key={importKey}
                type="file"
                accept=".xlsx,.csv"
                className="sr-only"
                aria-label="ไฟล์ราคา"
                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!importFile || importing}
              onClick={runImport}
            >
              {importing ? 'กำลังนำเข้า...' : 'นำเข้า'}
            </button>
            <a href="/api/admin/direct-to-factory/export" className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" aria-hidden="true" />
              นำออก
            </a>
          </div>
        )}
      </div>

      {notice && (
        <div className="fixed top-4 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none">
          <div
            role={notice.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto w-full max-w-md border rounded-xl shadow-lg px-4 py-3 text-sm ${
              notice.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="pt-2">{notice.text}</p>
              <button
                type="button"
                className="shrink-0 min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg hover:bg-white/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                aria-label="ปิด"
                onClick={dismissNotice}
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
      )}
    </div>
  );
}
