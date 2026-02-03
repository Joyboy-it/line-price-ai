import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Announcement } from '@/types';
import AnnouncementForm from '../AnnouncementForm';

async function getAnnouncement(id: string): Promise<Announcement | null> {
  return queryOne<Announcement>(
    `SELECT * FROM announcements WHERE id = $1`,
    [id]
  );
}

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
    redirect('/');
  }

  const { id } = await params;
  const announcement = await getAnnouncement(id);

  if (!announcement) {
    redirect('/admin/announcements');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/admin/announcements"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">แก้ไขประกาศ</h1>
        <AnnouncementForm announcement={announcement} />
      </div>
    </div>
  );
}
