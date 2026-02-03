import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, ZoomIn } from 'lucide-react';
import { PriceGroup, PriceGroupImage } from '@/types';
import ImageGallery from './ImageGallery';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPriceGroup(id: string): Promise<PriceGroup | null> {
  return queryOne<PriceGroup>(
    `SELECT pg.*, b.name as branch_name
     FROM price_groups pg
     LEFT JOIN branches b ON b.id = pg.branch_id
     WHERE pg.id = $1 AND pg.is_active = true`,
    [id]
  );
}

async function getPriceGroupImages(groupId: string): Promise<PriceGroupImage[]> {
  return query<PriceGroupImage>(
    `SELECT * FROM price_group_images
     WHERE price_group_id = $1
     ORDER BY sort_order, created_at DESC`,
    [groupId]
  );
}

async function checkUserAccess(userId: string, groupId: string): Promise<boolean> {
  const access = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM user_group_access
     WHERE user_id = $1 AND price_group_id = $2
       AND (expires_at IS NULL OR expires_at > NOW())`,
    [userId, groupId]
  );
  return !!access;
}

export default async function PriceGroupPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const isAdmin = session.user.role === 'admin' || session.user.role === 'operator';
  const hasAccess = isAdmin || await checkUserAccess(session.user.id, id);

  if (!hasAccess) {
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
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">{priceGroup.name}</h1>
        {priceGroup.description && (
          <p className="text-gray-600">{priceGroup.description}</p>
        )}
      </div>

      {images.length > 0 ? (
        <ImageGallery images={images} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ZoomIn className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">ยังไม่มีรูปภาพในกลุ่มนี้</p>
        </div>
      )}
    </div>
  );
}
