'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, Settings2 } from 'lucide-react';

const tabs = [
  { href: '/admin/direct-to-factory', label: 'ตารางออเดอร์', icon: ClipboardList },
  { href: '/admin/direct-to-factory/settings', label: 'ตั้งค่าพื้นฐาน', icon: Settings2 },
];

export default function DirectToFactoryTabs() {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith('/admin/direct-to-factory/settings');

  return (
    <nav className="flex gap-2 border-b border-gray-200 mb-6" aria-label="เมนูส่งตรงเข้าโรงงาน">
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
  );
}
