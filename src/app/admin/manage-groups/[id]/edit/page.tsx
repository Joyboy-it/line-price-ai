import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PriceGroup } from '@/types';
import GroupForm from '../../GroupForm';

async function getBranches() {
  return query<{ id: string; name: string; code: string }>(
    `SELECT id, name, code FROM branches ORDER BY name`
  );
}

async function getPriceGroup(id: string): Promise<PriceGroup | null> {
  return queryOne<PriceGroup>(
    `SELECT * FROM price_groups WHERE id = $1`,
    [id]
  );
}

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const { id } = await params;
  const [group, branches] = await Promise.all([
    getPriceGroup(id),
    getBranches(),
  ]);

  if (!group) {
    redirect('/admin/manage-groups');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/admin/manage-groups"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">แก้ไขกลุ่มราคา</h1>
          <p className="text-gray-600 mt-1">แก้ไขข้อมูลกลุ่มราคา: {group.name}</p>
        </div>

        <GroupForm group={group} branches={branches} />
      </div>
    </div>
  );
}
