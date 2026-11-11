import { Factory } from 'lucide-react';
import DirectToFactoryTabs from './DirectToFactoryTabs';

export default function DirectToFactoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <Factory className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ส่งตรงเข้าโรงงาน</h1>
          <p className="text-gray-600">รายการที่ลูกค้าแจ้ง และข้อมูลโรงงาน ตัวแทน ราคา</p>
        </div>
      </div>
      <DirectToFactoryTabs />
      {children}
    </div>
  );
}
