import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import RoleManager from './RoleManager';

export default async function RolesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">จัดการสิทธิ์การใช้งาน</h1>
          <p className="text-gray-600">กำหนดสิทธิ์และการเข้าถึงของแต่ละบทบาท</p>
        </div>
      </div>

      <RoleManager />
    </div>
  );
}
