import { query } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, Tag, Plus, Search } from 'lucide-react';
import { PriceGroup } from '@/types';
import GroupList from './GroupList';

async function getPriceGroups(): Promise<PriceGroup[]> {
  return query<PriceGroup>(
    `SELECT pg.*,
      (SELECT COUNT(*) FROM price_group_images pgi WHERE pgi.price_group_id = pg.id) as image_count,
      (SELECT COUNT(*) FROM user_group_access uga WHERE uga.price_group_id = pg.id) as user_count,
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
     ORDER BY pg.sort_order, pg.name`
  );
}

async function getAllBranches() {
  return query<{ id: string; name: string; code: string }>(
    `SELECT id, name, code FROM branches WHERE is_active = true ORDER BY sort_order, name`
  );
}

export default async function ManageGroupsPage() {
  const [priceGroups, branches] = await Promise.all([
    getPriceGroups(),
    getAllBranches(),
  ]);

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
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Tag className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">จัดการกลุ่มราคา</h1>
            <p className="text-gray-600">เพิ่ม แก้ไข ลบกลุ่มราคา</p>
          </div>
        </div>
        <Link
          href="/admin/manage-groups/new"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          เพิ่มกลุ่ม
        </Link>
      </div>

      <GroupList groups={priceGroups} branches={branches} />
    </div>
  );
}
