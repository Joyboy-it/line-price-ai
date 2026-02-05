import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { PriceGroup } from '@/types';
import PriceImagesList from './PriceImagesList';

async function getPriceGroupsWithImages(): Promise<(PriceGroup & { last_image_at: Date | null, branch_name: string | null })[]> {
  return query<PriceGroup & { last_image_at: Date | null, branch_name: string | null }>(
    `SELECT pg.*, 
      (SELECT MAX(pgi.created_at) FROM price_group_images pgi WHERE pgi.price_group_id = pg.id) as last_image_at,
      (SELECT COUNT(*) FROM price_group_images pgi WHERE pgi.price_group_id = pg.id) as image_count,
      CASE 
        WHEN pg.branch_id IS NULL THEN NULL
        WHEN pg.branch_id LIKE '%,%' THEN (
          SELECT STRING_AGG(b.name, ', ' ORDER BY b.name)
          FROM branches b
          WHERE b.id::TEXT = ANY(STRING_TO_ARRAY(pg.branch_id, ','))
        )
        ELSE (SELECT name FROM branches WHERE id::TEXT = pg.branch_id LIMIT 1)
      END as branch_name
     FROM price_groups pg
     WHERE pg.is_active = true
     ORDER BY pg.sort_order, pg.name`
  );
}

async function getAllBranches() {
  return query<{ id: string; name: string; code: string }>(
    `SELECT id, name, code FROM branches WHERE is_active = true ORDER BY sort_order, name`
  );
}

export default async function PriceImagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
    redirect('/');
  }

  const [priceGroups, branches] = await Promise.all([
    getPriceGroupsWithImages(),
    getAllBranches(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6"
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

      <PriceImagesList priceGroups={priceGroups} branches={branches} />
    </div>
  );
}
