import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import { PriceGroup, PriceGroupImage } from '@/types';
import ImageUploader from './ImageUploader';
import ImageList from './ImageList';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPriceGroup(id: string): Promise<PriceGroup | null> {
  return queryOne<PriceGroup>(
    `SELECT pg.*,
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
     WHERE pg.id = $1`,
    [id]
  );
}

async function getPriceGroupImages(groupId: string): Promise<PriceGroupImage[]> {
  return query<PriceGroupImage>(
    `SELECT * FROM price_group_images
     WHERE price_group_id = $1
     ORDER BY sort_order DESC, created_at DESC`,
    [groupId]
  );
}

export default async function AdminPriceGroupPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
    redirect('/');
  }

  const priceGroup = await getPriceGroup(id);
  if (!priceGroup) {
    notFound();
  }

  const images = await getPriceGroupImages(id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/admin/price-images"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">{priceGroup.name}</h1>
        {priceGroup.description && (
          <p className="text-gray-600">{priceGroup.description}</p>
        )}
      </div>

      {/* Upload Section */}
      <ImageUploader groupId={id} telegramChatId={priceGroup.telegram_chat_id} lineGroupId={priceGroup.line_group_id} />

      {/* Images List */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          รูปภาพทั้งหมด ({images.length} รูป)
        </h2>
        <ImageList images={images} />
      </div>
    </div>
  );
}
