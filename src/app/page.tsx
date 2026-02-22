import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Megaphone, Tag, Clock, ChevronRight, CheckCircle, Map } from 'lucide-react';
import { PriceGroup, Announcement, AccessRequest } from '@/types';
import { formatRelativeTime, formatDateTime } from '@/lib/utils';
import PriceGroupList from '@/components/PriceGroupList';
import RequestAccessForm from '@/components/RequestAccessForm';

async function getUserPriceGroups(userId: string): Promise<PriceGroup[]> {
  const groups = await query<PriceGroup>(
    `SELECT pg.*, 
      (SELECT MAX(pgi.created_at) FROM price_group_images pgi WHERE pgi.price_group_id = pg.id) as last_image_at
     FROM price_groups pg
     INNER JOIN user_group_access uga ON uga.price_group_id = pg.id
     WHERE uga.user_id = $1 AND pg.is_active = true
       AND (uga.expires_at IS NULL OR uga.expires_at > NOW())
     ORDER BY pg.sort_order, pg.name`,
    [userId]
  );
  return groups;
}

async function getActiveAnnouncements(): Promise<Announcement[]> {
  const announcements = await query<Announcement>(
    `SELECT a.*, u.name as creator_name,
      (SELECT COUNT(*) FROM announcement_images ai WHERE ai.announcement_id = a.id) as image_count
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     WHERE a.is_published = true
       AND (a.publish_at IS NULL OR a.publish_at <= NOW())
       AND (a.expire_at IS NULL OR a.expire_at > NOW())
     ORDER BY a.created_at DESC
     LIMIT 5`
  );
  return announcements;
}

async function getUserAccessStatus(userId: string): Promise<{ hasAccess: boolean; pendingRequest: AccessRequest | null }> {
  const accessCount = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM user_group_access WHERE user_id = $1',
    [userId]
  );
  
  const pendingRequest = await query<AccessRequest>(
    `SELECT * FROM access_requests WHERE user_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  return {
    hasAccess: parseInt(accessCount[0]?.count || '0') > 0,
    pendingRequest: pendingRequest[0] || null,
  };
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-4xl">W</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            วงษ์พาณิชย์ ส.เจริญชัย รีไซเคิล
          </h1>
          <p className="text-gray-600 mb-8">
            ระบบเช็คราคาสินค้าผ่าน LINE Login
          </p>
          <Link
            href="/api/auth/signin"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            เข้าสู่ระบบด้วย LINE
          </Link>
        </div>
      </div>
    );
  }

  const [priceGroups, announcements, accessStatus] = await Promise.all([
    getUserPriceGroups(session.user.id),
    getActiveAnnouncements(),
    getUserAccessStatus(session.user.id),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Announcements Section - Only for approved users */}
      {accessStatus.hasAccess && announcements.length > 0 && (
        <section className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl shadow-sm p-6 border border-purple-100 mb-8" style={{ minHeight: '140px' }}>
          {/* Header with icon */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">ประกาศ</h2>
          </div>

          {/* Announcements List */}
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <Link
                key={announcement.id}
                href={`/announcements/${announcement.id}`}
                className="flex items-center justify-between p-4 bg-white rounded-lg hover:bg-gray-50 transition cursor-pointer border border-purple-100"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Icon or Image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {announcement.image_path ? (
                      <Image
                        src={`/api/files${announcement.image_path}`}
                        alt={announcement.title}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
                        <Megaphone className="w-6 h-6 text-purple-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {announcement.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(announcement.created_at)}
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </Link>
            ))}
          </div>

          {/* Map Button */}
          <Link
            href="/map"
            className="mt-4 flex items-center justify-between p-4 bg-white rounded-lg hover:bg-blue-50 transition cursor-pointer border border-blue-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Map className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">แผนที่ร้าน</p>
                <p className="text-sm text-gray-500">ข้อมูลตำแหน่งและแผนที่</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </section>
      )}

      {/* Price Groups Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-800">กลุ่มราคาที่เข้าถึงได้</h2>
        </div>

        {priceGroups.length > 0 ? (
          <PriceGroupList groups={priceGroups} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {accessStatus.pendingRequest ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  รอการอนุมัติ
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  คำขอของคุณอยู่ระหว่างการพิจารณา
                </p>
                <p className="text-gray-500 text-xs">
                  ส่งเมื่อ {formatRelativeTime(accessStatus.pendingRequest.created_at)}
                </p>
              </div>
            ) : !accessStatus.hasAccess ? (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">
                  ขอสิทธิ์เข้าถึงกลุ่มราคา
                </h3>
                <RequestAccessForm key={session?.user?.id} />
              </div>
            ) : (
              <div className="text-center text-gray-500">
                ไม่มีกลุ่มราคาที่เข้าถึงได้
              </div>
            )}
          </div>
        )}
      </section>

      {/* Access Status */}
      {accessStatus.hasAccess && (
        <section className="mt-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800">ได้รับอนุมัติแล้ว</h3>
                <p className="text-sm text-green-600">
                  คุณสามารถดูกลุ่มราคาที่ได้รับสิทธิ์ด้านบน
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
