import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon, Search } from 'lucide-react';
import { PriceGroup } from '@/types';
import { formatDateTime } from '@/lib/utils';

async function getPriceGroupsWithImages(): Promise<(PriceGroup & { last_image_at: Date | null })[]> {
  return query<PriceGroup & { last_image_at: Date | null }>(
    `SELECT pg.*, 
      (SELECT MAX(pgi.created_at) FROM price_group_images pgi WHERE pgi.price_group_id = pg.id) as last_image_at,
      (SELECT COUNT(*) FROM price_group_images pgi WHERE pgi.price_group_id = pg.id) as image_count
     FROM price_groups pg
     WHERE pg.is_active = true
     ORDER BY pg.sort_order, pg.name`
  );
}

export default async function PriceImagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
    redirect('/');
  }

  const priceGroups = await getPriceGroupsWithImages();

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
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">จัดการรูปภาพราคา</h1>
          <p className="text-gray-600">อัปโหลดรูปภาพราคาสำหรับแต่ละกลุ่ม</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="ค้นหากลุ่มราคา..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <select className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 border border-gray-300 rounded-lg text-sm">
          <option>ทั้งหมด</option>
        </select>
      </div>

      {/* Price Groups List */}
      <div className="space-y-3">
        {priceGroups.map((group) => (
          <Link
            key={group.id}
            href={`/admin/price-groups/${group.id}`}
            className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-600">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-gray-500">{group.description}</p>
                )}
                {group.last_image_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    อัปเดตล่าสุด: {formatDateTime(group.last_image_at)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">
                  {group.image_count || 0} รูป
                </span>
              </div>
            </div>
          </Link>
        ))}

        {priceGroups.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ไม่มีกลุ่มราคา
          </div>
        )}
      </div>
    </div>
  );
}
