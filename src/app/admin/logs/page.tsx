import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { UserLog } from '@/types';
import RefreshButton from './RefreshButton';
import LogsClient from './LogsClient';

interface LogWithUser extends UserLog {
  user_name: string | null;
  user_image: string | null;
}

async function getLogs(limit: number = 100): Promise<LogWithUser[]> {
  return query<LogWithUser>(
    `SELECT ul.*, u.name as user_name, u.image as user_image
     FROM user_logs ul
     LEFT JOIN users u ON u.id = ul.user_id
     ORDER BY ul.created_at DESC
     LIMIT $1`,
    [limit]
  );
}

const actionLabels: Record<string, { label: string; color: string }> = {
  login: { label: 'เข้าสู่ระบบ', color: 'bg-green-100 text-green-700' },
  logout: { label: 'ออกจากระบบ', color: 'bg-gray-100 text-gray-700' },
  register: { label: 'ลงทะเบียน', color: 'bg-blue-100 text-blue-700' },
  upload_image: { label: 'อัปโหลดรูป', color: 'bg-purple-100 text-purple-700' },
  delete_image: { label: 'ลบรูป', color: 'bg-red-100 text-red-700' },
  create_group: { label: 'สร้างกลุ่มราคา', color: 'bg-green-100 text-green-700' },
  update_group: { label: 'แก้ไขกลุ่มราคา', color: 'bg-yellow-100 text-yellow-700' },
  delete_group: { label: 'ลบกลุ่มราคา', color: 'bg-red-100 text-red-700' },
  create_branch: { label: 'สร้างสาขา', color: 'bg-green-100 text-green-700' },
  update_branch: { label: 'แก้ไขสาขา', color: 'bg-yellow-100 text-yellow-700' },
  delete_branch: { label: 'ลบสาขา', color: 'bg-red-100 text-red-700' },
  create_announcement: { label: 'สร้างประกาศ', color: 'bg-blue-100 text-blue-700' },
  update_announcement: { label: 'แก้ไขประกาศ', color: 'bg-yellow-100 text-yellow-700' },
  delete_announcement: { label: 'ลบประกาศ', color: 'bg-red-100 text-red-700' },
  approve_request: { label: 'อนุมัติคำขอ', color: 'bg-green-100 text-green-700' },
  reject_request: { label: 'ปฏิเสธคำขอ', color: 'bg-red-100 text-red-700' },
  update_user: { label: 'แก้ไขผู้ใช้', color: 'bg-yellow-100 text-yellow-700' },
  delete_user: { label: 'ลบผู้ใช้', color: 'bg-red-100 text-red-700' },
};

export default async function LogsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
    redirect('/');
  }

  const logs = await getLogs();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ประวัติการใช้งาน</h1>
            <p className="text-gray-600">ดู log การใช้งานของผู้ใช้</p>
          </div>
        </div>
        <RefreshButton />
      </div>

      <LogsClient logs={logs} actionLabels={actionLabels} />
    </div>
  );
}
