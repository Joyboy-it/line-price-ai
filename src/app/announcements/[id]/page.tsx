import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Announcement, AnnouncementImage } from '@/types';
import { formatDateTime } from '@/lib/utils';
import ImageGallery from './ImageGallery';

async function getAnnouncement(id: string): Promise<Announcement | null> {
  return queryOne<Announcement>(
    `SELECT a.*, u.name as creator_name
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     WHERE a.id = $1 AND a.is_published = true`,
    [id]
  );
}

async function getAnnouncementImages(id: string): Promise<AnnouncementImage[]> {
  return query<AnnouncementImage>(
    `SELECT * FROM announcement_images 
     WHERE announcement_id = $1 
     ORDER BY sort_order ASC`,
    [id]
  );
}

async function checkUserAccess(userId: string): Promise<boolean> {
  const accessCount = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM user_group_access WHERE user_id = $1',
    [userId]
  );
  return parseInt(accessCount[0]?.count || '0') > 0;
}

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
  }

  const { id } = await params;

  // Check if user has access
  const hasAccess = await checkUserAccess(session.user.id);
  if (!hasAccess) {
    redirect('/');
  }

  const [announcement, images] = await Promise.all([
    getAnnouncement(id),
    getAnnouncementImages(id),
  ]);

  if (!announcement) {
    redirect('/');
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าแรก
      </Link>

      <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {announcement.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {announcement.creator_name && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{announcement.creator_name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDateTime(announcement.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Images Gallery */}
        {images.length > 0 && (
          <div className="p-6 bg-gray-50">
            <ImageGallery images={images} title={announcement.title} />
          </div>
        )}

        {/* Body Content */}
        {announcement.body && (
          <div className="p-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {announcement.body}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          {/* Footer content can be added here if needed */}
        </div>
      </article>
    </div>
  );
}
