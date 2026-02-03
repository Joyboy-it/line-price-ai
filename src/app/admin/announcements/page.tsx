'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Megaphone, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Announcement } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function AnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      if (session.user.role !== 'admin' && session.user.role !== 'operator') {
        router.push('/');
        return;
      }

      fetchAnnouncements();
    }
  }, [status, session, router]);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`คุณต้องการลบประกาศ "${title}" หรือไม่?`)) return;

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAnnouncements();
      } else {
        alert('ไม่สามารถลบประกาศได้');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('เกิดข้อผิดพลาดในการลบประกาศ');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">กำลังโหลด...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">จัดการประกาศ</h1>
            <p className="text-gray-600">สร้างและจัดการประกาศข่าวสาร</p>
          </div>
        </div>
        <Link
          href="/admin/announcements/new"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          สร้างประกาศ
        </Link>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4"
          >
            {announcement.image_path ? (
              <Image
                src={`/api/files${announcement.image_path}`}
                alt={announcement.title}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <Megaphone className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-medium text-blue-600">{announcement.title}</h3>
              {announcement.body && (
                <p className="text-sm text-gray-500 line-clamp-1">{announcement.body}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {formatDateTime(announcement.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/announcements/${announcement.id}`}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Edit className="w-5 h-5" />
              </Link>
              <button
                onClick={() => handleDelete(announcement.id, announcement.title)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ยังไม่มีประกาศ
          </div>
        )}
      </div>
    </div>
  );
}
