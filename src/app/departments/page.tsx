import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Map } from 'lucide-react';

export default async function DepartmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">กลับหน้าแรก</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Map className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แผนที่ร้าน</h1>
            <p className="text-sm text-gray-600">ข้อมูลตำแหน่งและแผนที่ตั้งของร้าน</p>
          </div>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            เนื้อหาแผนที่ร้าน
          </p>
          <p className="text-sm text-gray-500">
            ส่วนนี้พร้อมสำหรับเพิ่มข้อมูลแผนที่และตำแหน่งที่ตั้งของร้าน
          </p>
        </div>
      </div>
    </div>
  );
}
