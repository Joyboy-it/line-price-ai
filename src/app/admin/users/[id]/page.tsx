import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { User } from '@/types';
// Import user detail form component
import UserDetailForm from './UserDetailForm';

async function getUser(id: string): Promise<User | null> {
  return queryOne<User>(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
    redirect('/');
  }

  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    redirect('/admin/users');
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">รายละเอียดผู้ใช้</h1>
          <p className="text-gray-600 mt-1">ดูและแก้ไขข้อมูลผู้ใช้</p>
        </div>

        <UserDetailForm user={user} />
      </div>
    </div>
  );
}
